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
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import java.util.concurrent.CompletableFuture;
import java.util.function.Consumer;

@Service
@Slf4j
@RequiredArgsConstructor
public class ConversationOrchestrator {
    private static final String CACHE_VERSION = "v2";

    private final ToolRegistry toolRegistry;
    private final ToolPlanningService toolPlanningService;
    private final RbacPolicyService rbacPolicyService;
    private final ToolArgumentValidationService argumentValidationService;
    private final ResponseRenderer responseRenderer;
    private final CacheService cacheService;
    private final ConversationMemoryService conversationMemoryService;
    private final AuditEventService auditEventService;
    private final PendingActionService pendingActionService;
    private final ToolRateLimitService toolRateLimitService;
    private final RateLimitPolicyService rateLimitPolicyService;
    private final AiInteractionProperties properties;
    private final AdministrativeInferenceService inferenceService;
    private final ObjectMapper objectMapper;

    public AiInteractionDtos.ChatResponse chat(UserContext userContext, AiInteractionDtos.ChatRequest request) {
        UUID conversationId = request.conversationId() != null ? request.conversationId() : UUID.randomUUID();
        ConversationMemoryService.ChatRecord chat = conversationMemoryService.ensureChat(userContext, conversationId, request.workspaceId(), request.message());
        conversationId = chat.conversationId();

        conversationMemoryService.addUserMessage(userContext, conversationId, request.message());
        auditEventService.requestReceived(userContext, request.message(), conversationId.toString());

        AiInteractionDtos.RenderedResponse rendered = execute(userContext, request.message(), conversationId);
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
                eventConsumer.accept(new AiInteractionDtos.StreamEvent("status", textPayload("Coordinating intelligent toolchain...")));
                AiInteractionDtos.ChatResponse response = chat(userContext, request);
                eventConsumer.accept(new AiInteractionDtos.StreamEvent("final", objectMapper.valueToTree(response)));
                onComplete.run();
            } catch (Exception ex) {
                errorConsumer.accept(ex);
            }
        });
    }

    public AiInteractionDtos.ChatResponse confirmAction(UserContext userContext, String confirmationToken) {
        UUID conversationId = UUID.randomUUID();
        PendingActionService.PendingAction pending = pendingActionService.resolveAndConsume(confirmationToken, userContext);
        
        ToolCall call = new ToolCall(pending.toolName(), pending.args(), pending.reasoning());
        JsonNode toolResult = executeSingleTool(userContext, call, "[confirmation]", conversationId, true);
        
        ObjectNode results = objectMapper.createObjectNode();
        results.set(call.toolName(), toolResult);
        
        JsonNode smartUiData = inferenceService.infer("[confirmed action]", userContext, results);
        AiInteractionDtos.RenderedResponse rendered = responseRenderer.render("smart_ui", smartUiData, objectMapper.createObjectNode(), false, call.toolName(), "Action executed");
        
        return new AiInteractionDtos.ChatResponse(null, conversationId, rendered);
    }

    private AiInteractionDtos.RenderedResponse execute(UserContext userContext, String message, UUID conversationId) {
        List<ToolDescriptor> descriptors = toolRegistry.all().stream().map(AiTool::descriptor).toList();
        List<ConversationMemoryService.ChatMessageRecord> history = conversationMemoryService.listMessages(userContext, conversationId, 10);
        
        List<ToolCall> plan = toolPlanningService.plan(message, userContext, descriptors, history);
        
        if (plan.isEmpty()) {
            auditEventService.noPlan(userContext, conversationId.toString());
            return responseRenderer.clarificationResponse("I couldn't orchestrate a specific tool for that message. Could you clarify your request?");
        }

        ObjectNode allResults = objectMapper.createObjectNode();
        for (ToolCall tc : plan) {
            JsonNode stepResult = executeSingleTool(userContext, tc, message, conversationId, false);
            if (stepResult.has("__type") && "CONFIRMATION_REQUIRED".equals(stepResult.get("__type").asText())) {
                // If any tool in the chain needs confirmation, stop and ask
                return responseRenderer.render("action", stepResult, objectMapper.createObjectNode(), false, tc.toolName(), tc.reasoning());
            }
            allResults.set(tc.toolName(), stepResult);
        }

        // The "Brain": Synthesize all tool results into one professional dashboard/UI
        JsonNode smartUiData = inferenceService.infer(message, userContext, allResults);
        return responseRenderer.render("smart_ui", smartUiData, objectMapper.createObjectNode(), false, "multi_tool_orchestrator", "Synthesized Intelligence");
    }

    private JsonNode executeSingleTool(UserContext userContext, ToolCall toolCall, String message, UUID conversationId, boolean confirmed) {
        AiTool tool = toolRegistry.find(toolCall.toolName()).orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Tool not found"));
        argumentValidationService.validate(tool.name(), toolCall.arguments());
        
        try { rbacPolicyService.assertAllowed(tool, userContext, toolCall.arguments()); }
        catch (Exception ex) { throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Access denied: " + ex.getMessage()); }

        if (!toolRateLimitService.allow(userContext, tool.name(), rateLimitPolicyService.resolveLimit(userContext, tool.name(), tool.requiresConfirmation()))) {
            throw new ResponseStatusException(HttpStatus.TOO_MANY_REQUESTS, "Rate limit exceeded.");
        }

        if (tool.requiresConfirmation() && !confirmed) {
            String token = pendingActionService.create(userContext, tool.name(), toolCall.arguments(), toolCall.reasoning());
            ObjectNode confirm = objectMapper.createObjectNode();
            confirm.put("__type", "CONFIRMATION_REQUIRED");
            confirm.put("status", "CONFIRMATION_REQUIRED");
            confirm.put("confirmationToken", token);
            confirm.put("tool", tool.name());
            confirm.set("proposedArguments", toolCall.arguments());
            return confirm;
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
