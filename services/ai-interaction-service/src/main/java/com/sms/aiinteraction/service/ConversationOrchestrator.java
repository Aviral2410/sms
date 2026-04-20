package com.sms.aiinteraction.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ObjectNode;
import com.sms.aiinteraction.config.AiInteractionProperties;
import com.sms.aiinteraction.dto.AiInteractionDtos;
import com.sms.aiinteraction.llm.GeminiPlanningEngine;
import com.sms.aiinteraction.llm.OllamaPlanningEngine;
import com.sms.aiinteraction.llm.OpenAiFunctionPlanningEngine;
import com.sms.aiinteraction.llm.RuleBasedPlanningEngine;
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
import java.time.Instant;
import java.util.Comparator;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import java.util.concurrent.CompletableFuture;
import java.util.function.Consumer;

@Service
@Slf4j
@RequiredArgsConstructor
public class ConversationOrchestrator {
    private static final int CACHE_VERSION = 1;

    private final ToolPlanningService toolPlanningService;
    private final ToolRegistry toolRegistry;
    private final ConversationMemoryService conversationMemoryService;
    private final ResponseRenderer responseRenderer;
    private final ObjectMapper objectMapper;
    private final PendingActionService pendingActionService;
    private final ArgumentValidationService argumentValidationService;
    private final RbacPolicyService rbacPolicyService;
    private final RateLimitPolicyService rateLimitPolicyService;
    private final ToolRateLimitService toolRateLimitService;
    private final CacheService cacheService;
    private final AuditEventService auditEventService;
    private final AiInteractionProperties properties;

    public AiInteractionDtos.ChatResponse chat(UserContext userContext, AiInteractionDtos.ChatRequest request) {
        UUID conversationId = request.conversationId() != null
                ? request.conversationId()
                : conversationMemoryService.ensureDefaultWorkspace(userContext).workspaceId(); // Note: Simplified for now
        
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
                eventConsumer.accept(new AiInteractionDtos.StreamEvent("status", textPayload("Planning tool call...")));
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
        AiInteractionDtos.RenderedResponse rendered = executePlannedCall(
                userContext,
                new ToolCall(pending.toolName(), pending.args(), pending.reasoning()),
                "[confirmation]",
                conversationId,
                true
        );
        return new AiInteractionDtos.ChatResponse(null, conversationId, rendered);
    }

    private AiInteractionDtos.RenderedResponse execute(UserContext userContext, String message, UUID conversationId) {
        List<ToolDescriptor> descriptors = toolRegistry.all().stream()
                .map(AiTool::descriptor)
                .toList();
        
        List<ConversationMemoryService.ChatMessageRecord> history = conversationMemoryService.listMessages(userContext, conversationId, 10);
        Optional<ToolCall> plan = toolPlanningService.plan(message, userContext, descriptors, history);
        
        if (plan.isEmpty()) {
            auditEventService.noPlan(userContext, conversationId.toString());
            return responseRenderer.clarificationResponse(
                    "I couldn't identify the right tool for your request. I can help with platform overview, schools growth, and status distribution. Regional filters are also supported."
            );
        }

        return executePlannedCall(userContext, plan.get(), message, conversationId, false);
    }

    private AiInteractionDtos.RenderedResponse executePlannedCall(
            UserContext userContext,
            ToolCall toolCall,
            String message,
            UUID conversationId,
            boolean confirmedExecution
    ) {
        AiTool tool = toolRegistry.find(toolCall.toolName())
                .orElseThrow(() -> new IllegalArgumentException("Requested tool is not available."));
        argumentValidationService.validate(tool.name(), toolCall.arguments());
        try {
            rbacPolicyService.assertAllowed(tool, userContext, toolCall.arguments());
        } catch (Exception ex) {
            auditEventService.accessDenied(userContext, tool.name(), ex.getMessage(), conversationId.toString());
            throw ex;
        }

        int limitPerMinute = rateLimitPolicyService.resolveLimit(userContext, tool.name(), tool.requiresConfirmation());
        if (!toolRateLimitService.allow(userContext, tool.name(), limitPerMinute)) {
            throw new ResponseStatusException(HttpStatus.TOO_MANY_REQUESTS, "AI tool rate limit exceeded.");
        }

        if (tool.requiresConfirmation() && !confirmedExecution) {
            String token = pendingActionService.create(userContext, tool.name(), toolCall.arguments(), toolCall.reasoning());
            ObjectNode data = objectMapper.createObjectNode();
            data.put("status", "CONFIRMATION_REQUIRED");
            data.put("tool", tool.name());
            data.put("message", "Please confirm this action.");
            data.put("confirmationToken", token);
            data.set("proposedArguments", toolCall.arguments());

            ObjectNode meta = objectMapper.createObjectNode();
            meta.put("tool", tool.name());
            return responseRenderer.render("action", data, meta, false, tool.name(), toolCall.reasoning());
        }

        long startMs = System.currentTimeMillis();
        String cacheKey = CacheKeyFactory.forTool(userContext, tool.name(), toolCall.arguments().toString() + "|" + message, CACHE_VERSION);

        if (tool.cacheable()) {
            Optional<JsonNode> cached = cacheService.get(cacheKey);
            if (cached.isPresent()) {
                JsonNode wrapper = cached.get();
                return responseRenderer.render(wrapper.path("type").asText("text"), wrapper.path("data"), wrapper.path("meta"), true, tool.name(), toolCall.reasoning());
            }
        }

        ToolResult result = tool.execute(toolCall.arguments(), userContext);
        auditEventService.toolExecuted(userContext, tool.name(), conversationId.toString(), System.currentTimeMillis() - startMs, false);
        AiInteractionDtos.RenderedResponse rendered = responseRenderer.render(result.outputType(), result.data(), result.meta(), false, tool.name(), toolCall.reasoning());

        if (tool.cacheable()) {
            ObjectNode wrapper = objectMapper.createObjectNode();
            wrapper.put("type", rendered.type());
            wrapper.set("data", rendered.data());
            wrapper.set("meta", rendered.meta());
            cacheService.put(cacheKey, wrapper, Duration.ofSeconds(properties.cache().promptTtlSeconds()));
        }

        return rendered;
    }

    private JsonNode textPayload(String text) {
        ObjectNode payload = objectMapper.createObjectNode();
        payload.put("text", text);
        return payload;
    }

    private ObjectNode toStoredPayload(AiInteractionDtos.RenderedResponse rendered) {
        if (rendered == null) return null;
        ObjectNode wrapper = objectMapper.createObjectNode();
        wrapper.put("type", rendered.type());
        wrapper.set("data", rendered.data());
        wrapper.set("meta", rendered.meta());
        return wrapper;
    }

    private String summarizeAssistantResponse(AiInteractionDtos.RenderedResponse rendered) {
        if (rendered == null) return "";
        if ("text".equals(rendered.type()) && rendered.data() != null && rendered.data().hasNonNull("text")) {
            return rendered.data().get("text").asText();
        }
        return "Structured response: " + rendered.type();
    }
}
