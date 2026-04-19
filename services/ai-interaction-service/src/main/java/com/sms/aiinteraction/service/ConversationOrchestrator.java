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
import org.springframework.web.server.ResponseStatusException;
import java.time.Duration;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import java.util.concurrent.CompletableFuture;
import java.util.function.Consumer;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;

@Service
public class ConversationOrchestrator {
    private static final String CACHE_VERSION = "v1";

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

    public ConversationOrchestrator(
            ToolRegistry toolRegistry,
            ToolPlanningService toolPlanningService,
            RbacPolicyService rbacPolicyService,
            ToolArgumentValidationService argumentValidationService,
            ResponseRenderer responseRenderer,
            CacheService cacheService,
            ConversationMemoryService conversationMemoryService,
            AuditEventService auditEventService,
            PendingActionService pendingActionService,
            ToolRateLimitService toolRateLimitService,
            RateLimitPolicyService rateLimitPolicyService,
            AiInteractionProperties properties,
            AdministrativeInferenceService inferenceService,
            ObjectMapper objectMapper
    ) {
        this.toolRegistry = toolRegistry;
        this.toolPlanningService = toolPlanningService;
        this.rbacPolicyService = rbacPolicyService;
        this.argumentValidationService = argumentValidationService;
        this.responseRenderer = responseRenderer;
        this.cacheService = cacheService;
        this.conversationMemoryService = conversationMemoryService;
        this.auditEventService = auditEventService;
        this.pendingActionService = pendingActionService;
        this.toolRateLimitService = toolRateLimitService;
        this.rateLimitPolicyService = rateLimitPolicyService;
        this.properties = properties;
        this.inferenceService = inferenceService;
        this.objectMapper = objectMapper;
    }

    public AiInteractionDtos.ChatResponse chat(UserContext userContext, AiInteractionDtos.ChatRequest request) {
        UUID requestedConversationId = request.conversationId() == null ? UUID.randomUUID() : request.conversationId();
        ConversationMemoryService.ChatRecord chat = conversationMemoryService.ensureChat(
                userContext,
                requestedConversationId,
                request.workspaceId(),
                request.message()
        );
        UUID conversationId = chat.conversationId();
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
                UUID requestedConversationId = request.conversationId() == null ? UUID.randomUUID() : request.conversationId();
                ConversationMemoryService.ChatRecord chat = conversationMemoryService.ensureChat(
                        userContext,
                        requestedConversationId,
                        request.workspaceId(),
                        request.message()
                );
                UUID conversationId = chat.conversationId();
                conversationMemoryService.addUserMessage(userContext, conversationId, request.message());
                auditEventService.requestReceived(userContext, request.message(), conversationId.toString());

                eventConsumer.accept(new AiInteractionDtos.StreamEvent("status", textPayload("Analyzing context...")));
                Thread.sleep(400);

                List<ToolDescriptor> descriptors = toolRegistry.all().stream()
                        .map(AiTool::descriptor)
                        .toList();

                List<String> history = conversationMemoryService.getRecentTextHistory(userContext, conversationId);
                
                eventConsumer.accept(new AiInteractionDtos.StreamEvent("status", textPayload("Planning agent actions...")));
                Optional<ToolCall> plan = toolPlanningService.plan(request.message(), userContext, descriptors, history);

                AiInteractionDtos.RenderedResponse rendered;
                if (plan.isEmpty()) {
                    auditEventService.noPlan(userContext, conversationId.toString());
                    String msg = "I'm not exactly sure how to help with that. Could you try asking about subscriptions, roadmap, or platform info? Or tell me if you'd like to reach support.";
                    eventConsumer.accept(new AiInteractionDtos.StreamEvent("status", textPayload("Thinking...")));
                    simulateTyping(msg, eventConsumer);
                    rendered = responseRenderer.clarificationResponse(msg);
                } else {
                    eventConsumer.accept(new AiInteractionDtos.StreamEvent("status", textPayload("Executing " + plan.get().toolName() + "...")));
                    rendered = executePlannedCall(userContext, plan.get(), request.message(), conversationId, false);
                }

                conversationMemoryService.addAssistantResponse(
                        userContext,
                        conversationId,
                        summarizeAssistantResponse(rendered),
                        toStoredPayload(rendered)
                );

                AiInteractionDtos.ChatResponse response = new AiInteractionDtos.ChatResponse(chat.workspaceId(), conversationId, rendered);
                eventConsumer.accept(new AiInteractionDtos.StreamEvent("final", objectMapper.valueToTree(response)));
                onComplete.run();
            } catch (Exception ex) {
                try {
                    String exType = ex.getClass().getSimpleName();
                    String msg = "I encountered an issue (" + exType + "): " + (ex.getMessage() != null ? ex.getMessage() : "Unknown error");
                    
                    AiInteractionDtos.RenderedResponse errorRendered = responseRenderer.clarificationResponse(msg);
                    AiInteractionDtos.ChatResponse errorResponse = new AiInteractionDtos.ChatResponse(null, null, errorRendered);
                    eventConsumer.accept(new AiInteractionDtos.StreamEvent("final", objectMapper.valueToTree(errorResponse)));
                } catch (Exception inner) {
                    errorConsumer.accept(ex);
                } finally {
                    onComplete.run();
                }
            }
        });
    }

    private void simulateTyping(String text, Consumer<AiInteractionDtos.StreamEvent> eventConsumer) {
        String[] words = text.split(" ");
        for (String word : words) {
            ObjectNode payload = objectMapper.createObjectNode();
            payload.put("text", word + " ");
            eventConsumer.accept(new AiInteractionDtos.StreamEvent("delta", payload));
            try { Thread.sleep(50); } catch (InterruptedException e) { Thread.currentThread().interrupt(); }
        }
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

        List<String> history = conversationMemoryService.getRecentTextHistory(userContext, conversationId);
        Optional<ToolCall> plan = toolPlanningService.plan(message, userContext, descriptors, history);

        if (plan.isEmpty()) {
            auditEventService.noPlan(userContext, conversationId.toString());
            return responseRenderer.clarificationResponse(
                    "Please rephrase with a clear request such as attendance report, dashboard, announcements, homework summary, exam results, transport overview, fee defaulters, student performance, library summary, forum leaderboard, leave requests, message threads, or notification/announcement actions."
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
            throw new ResponseStatusException(HttpStatus.TOO_MANY_REQUESTS, "AI tool rate limit exceeded. Please retry shortly.");
        }

        if (tool.requiresConfirmation() && !confirmedExecution) {
            String token = pendingActionService.create(userContext, tool.name(), toolCall.arguments(), toolCall.reasoning());
            ObjectNode data = objectMapper.createObjectNode();
            data.put("status", "CONFIRMATION_REQUIRED");
            data.put("tool", tool.name());
            data.put("message", "Please confirm this action before execution.");
            data.put("confirmationToken", token);
            data.set("proposedArguments", toolCall.arguments());

            ObjectNode meta = objectMapper.createObjectNode();
            meta.put("tool", tool.name());
            meta.put("requiresConfirmation", true);
            return responseRenderer.render("action", data, meta, false, tool.name(), toolCall.reasoning());
        }

        long startMs = System.currentTimeMillis();

        String cacheKey = CacheKeyFactory.forTool(
                userContext,
                tool.name(),
                toolCall.arguments().toString() + "|" + message,
                CACHE_VERSION
        );

        if (tool.cacheable()) {
            Optional<JsonNode> cached = cacheService.get(cacheKey);
            if (cached.isPresent()) {
                JsonNode wrapper = cached.get();
                auditEventService.cacheHit(userContext, tool.name(), conversationId.toString());
                auditEventService.toolExecuted(userContext, tool.name(), conversationId.toString(), System.currentTimeMillis() - startMs, true);
                return responseRenderer.render(
                        wrapper.path("type").asText("text"),
                        wrapper.path("data"),
                        wrapper.path("meta"),
                        true,
                        tool.name(),
                        toolCall.reasoning()
                );
            }
        }

        ToolResult result = tool.execute(toolCall.arguments(), userContext);
        auditEventService.toolExecuted(userContext, tool.name(), conversationId.toString(), System.currentTimeMillis() - startMs, false);

        // --- NEW: Administrative Inference Pass ---
        JsonNode smartUiData = inferenceService.infer(message, userContext, tool.name(), result.data());

        AiInteractionDtos.RenderedResponse rendered = responseRenderer.render(
                "smart_ui",
                smartUiData,
                result.meta(),
                false,
                tool.name(),
                toolCall.reasoning()
        );

        if (tool.cacheable()) {
            ObjectNode wrapper = objectMapper.createObjectNode();
            wrapper.put("type", rendered.type());
            wrapper.set("data", rendered.data());
            wrapper.set("meta", rendered.meta());

            Duration ttl = "getAttendanceReport".equals(tool.name()) || "getFeeDefaulters".equals(tool.name())
                    ? Duration.ofSeconds(properties.cache().reportTtlSeconds())
                    : Duration.ofSeconds(properties.cache().promptTtlSeconds());
            cacheService.put(cacheKey, wrapper, ttl);
        }

        return rendered;
    }

    private JsonNode textPayload(String text) {
        ObjectNode payload = objectMapper.createObjectNode();
        payload.put("text", text);
        return payload;
    }

    private ObjectNode toStoredPayload(AiInteractionDtos.RenderedResponse rendered) {
        if (rendered == null) {
            return null;
        }
        ObjectNode wrapper = objectMapper.createObjectNode();
        wrapper.put("type", rendered.type());
        wrapper.set("data", rendered.data() == null ? objectMapper.createObjectNode() : rendered.data());
        wrapper.set("meta", rendered.meta() == null ? objectMapper.createObjectNode() : rendered.meta());
        return wrapper;
    }

    private String summarizeAssistantResponse(AiInteractionDtos.RenderedResponse rendered) {
        if (rendered == null) {
            return "";
        }
        if ("text".equals(rendered.type()) && rendered.data() != null && rendered.data().hasNonNull("text")) {
            return rendered.data().get("text").asText();
        }
        String intent = rendered.meta() != null ? rendered.meta().path("intent").asText("") : "";
        return "Structured response: type=" + rendered.type() + ", intent=" + intent;
    }
}

