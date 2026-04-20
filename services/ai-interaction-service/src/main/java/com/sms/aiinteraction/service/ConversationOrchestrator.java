package com.sms.aiinteraction.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ObjectNode;
import com.sms.aiinteraction.api.AiInteractionDtos;
import com.sms.aiinteraction.config.AiInteractionProperties;
import com.sms.aiinteraction.security.UserContext;
import com.sms.aiinteraction.tool.AiTool;
import com.sms.aiinteraction.tool.ToolCall;
import com.sms.aiinteraction.tool.ToolDescriptor;
import com.sms.aiinteraction.tool.ToolResult;
import com.sms.aiinteraction.util.CacheKeyFactory;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.time.Duration;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import java.util.concurrent.CompletableFuture;
import java.util.function.Consumer;

@Service
@Slf4j
@RequiredArgsConstructor
public class ConversationOrchestrator {
    private static final int CACHE_VERSION = 2;

    private final ToolPlanningService toolPlanningService;
    private final ToolRegistry toolRegistry;
    private final ConversationMemoryService conversationMemoryService;
    private final ResponseRenderer responseRenderer;
    private final ObjectMapper objectMapper;
    private final PendingActionService pendingActionService;
    private final ToolArgumentValidationService argumentValidationService;
    private final RbacPolicyService rbacPolicyService;
    private final RateLimitPolicyService rateLimitPolicyService;
    private final ToolRateLimitService toolRateLimitService;
    private final CacheService cacheService;
    private final AuditEventService auditEventService;
    private final AiInteractionProperties properties;
    private final AdministrativeInferenceService inferenceService;

    public AiInteractionDtos.ChatResponse chat(UserContext userContext, AiInteractionDtos.ChatRequest request) {
        return chatWithProgress(userContext, request, null);
    }

    private AiInteractionDtos.ChatResponse chatWithProgress(UserContext userContext, AiInteractionDtos.ChatRequest request, Consumer<String> thoughtConsumer) {
        UUID workspaceId = request.workspaceId() != null ? request.workspaceId() : conversationMemoryService.ensureDefaultWorkspace(userContext).workspaceId();
        ConversationMemoryService.ChatRecord chat = conversationMemoryService.ensureChat(userContext, request.conversationId(), workspaceId, request.message());
        UUID conversationId = chat.conversationId();

        conversationMemoryService.addUserMessage(userContext, conversationId, request.message());
        auditEventService.requestReceived(userContext, request.message(), conversationId.toString());

        AiInteractionDtos.RenderedResponse rendered = executeWithThoughts(userContext, request.message(), conversationId, thoughtConsumer);
        
        conversationMemoryService.addAssistantResponse(
                userContext,
                conversationId,
                summarizeAssistantResponse(rendered),
                toStoredPayload(rendered)
        );
        return new AiInteractionDtos.ChatResponse(chat.workspaceId(), conversationId, rendered);
    }

    public void streamChat(
            UserContext userContext,
            AiInteractionDtos.ChatRequest request,
            Consumer<AiInteractionDtos.StreamEvent> eventConsumer,
            Consumer<Throwable> errorConsumer,
            Runnable onComplete
    ) {
        CompletableFuture.runAsync(() -> {
            try {
                Consumer<String> thoughtEmitter = t -> eventConsumer.accept(new AiInteractionDtos.StreamEvent("thought", textPayload(t)));
                AiInteractionDtos.ChatResponse response = chatWithProgress(userContext, request, thoughtEmitter);
                eventConsumer.accept(new AiInteractionDtos.StreamEvent("final", objectMapper.valueToTree(response)));
                onComplete.run();
            } catch (Exception ex) {
                errorConsumer.accept(ex);
            }
        });
    }

    private AiInteractionDtos.RenderedResponse executeWithThoughts(UserContext userContext, String message, UUID conversationId, Consumer<String> thoughtConsumer) {
        if (thoughtConsumer != null) thoughtConsumer.accept("Analyzing historical patterns and user intent...");
        
        List<ToolDescriptor> descriptors = toolRegistry.all().stream().map(AiTool::descriptor).toList();
        List<ConversationMemoryService.ChatMessageRecord> history = conversationMemoryService.listMessages(userContext, conversationId, 10);
        
        List<ToolCall> plan = toolPlanningService.plan(message, userContext, descriptors, history);
        
        if (plan.isEmpty()) {
            if (thoughtConsumer != null) thoughtConsumer.accept("No automated tools identified. Formulating clarification...");
            return responseRenderer.clarificationResponse("I'm here to help with your school management platform. Could you be more specific about whether you want analytics, growth reports, or status checks?");
        }

        StringBuilder thoughtBuilder = new StringBuilder();
        ObjectNode allResults = objectMapper.createObjectNode();
        
        for (ToolCall tc : plan) {
            String status = "Executing strategic capability: " + tc.tool() + "...";
            if (thoughtConsumer != null) thoughtConsumer.accept(status);
            thoughtBuilder.append(status).append("\n");

            JsonNode stepResult = executeSingleTool(userContext, tc, message, conversationId, false);
            if (stepResult.has("__type") && "CONFIRMATION_REQUIRED".equals(stepResult.get("__type").asText())) {
                return responseRenderer.render("action", stepResult, objectMapper.createObjectNode(), false, tc.toolName(), tc.reasoning());
            }
            allResults.set(tc.toolName(), stepResult);
        }

        if (thoughtConsumer != null) thoughtConsumer.accept("Synthesizing multi-dimensional intelligence...");
        JsonNode smartUiData = inferenceService.infer(message, userContext, allResults);
        
        String finalThought = "I have integrated data from " + plan.size() + " neural tools. The following high-fidelity dashboard represents my current strategic analysis.";
        return responseRenderer.renderWithThought("smart_ui", smartUiData, objectMapper.createObjectNode(), false, "multi_tool_orchestrator", "Neural Synthesis", finalThought);
    }

    private JsonNode executeSingleTool(UserContext userContext, ToolCall toolCall, String message, UUID conversationId, boolean confirmed) {
        AiTool tool = toolRegistry.find(toolCall.toolName()).orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Tool not found"));
        argumentValidationService.validate(tool.name(), toolCall.arguments());
        
        try { rbacPolicyService.assertAllowed(tool, userContext, toolCall.arguments()); }
        catch (Exception ex) { throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Access denied: " + ex.getMessage()); }

        if (!toolRateLimitService.allow(userContext, tool.name(), rateLimitPolicyService.resolveLimit(userContext, tool.name(), tool.requiresConfirmation()))) {
            throw new ResponseStatusException(HttpStatus.TOO_MANY_REQUESTS, "Rate limit exceeded.");
        }

        long start = System.currentTimeMillis();
        String cacheKey = CacheKeyFactory.forTool(userContext, tool.name(), toolCall.arguments().toString() + "|" + message, CACHE_VERSION);
        
        if (tool.cacheable()) {
            Optional<JsonNode> cached = cacheService.get(cacheKey);
            if (cached.isPresent()) return cached.get().path("data");
        }

        ToolResult result = tool.execute(toolCall.arguments(), userContext);
        auditEventService.toolExecuted(userContext, tool.name(), conversationId.toString(), System.currentTimeMillis() - start, false);

        if (tool.cacheable()) {
            ObjectNode wrapper = objectMapper.createObjectNode();
            wrapper.set("data", result.data());
            wrapper.set("meta", result.meta());
            cacheService.put(cacheKey, wrapper, Duration.ofSeconds(properties.cache().promptTtlSeconds()));
        }

        return result.data();
    }

    private JsonNode textPayload(String text) {
        ObjectNode n = objectMapper.createObjectNode();
        n.put("text", text);
        return n;
    }

    private ObjectNode toStoredPayload(AiInteractionDtos.RenderedResponse rendered) {
        if (rendered == null) return null;
        ObjectNode w = objectMapper.createObjectNode();
        w.put("type", rendered.type());
        w.set("data", rendered.data());
        w.set("meta", rendered.meta());
        return w;
    }

    private String summarizeAssistantResponse(AiInteractionDtos.RenderedResponse rendered) {
        if (rendered == null) return "";
        if ("text".equals(rendered.type()) && rendered.data().has("text")) return rendered.data().get("text").asText();
        return "Intelligence synthesized - Type: " + rendered.type();
    }
}
