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
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
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
public class ConversationOrchestrator {
    private static final Logger log = LoggerFactory.getLogger(ConversationOrchestrator.class);
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
    private final ToolAccessPolicyService toolAccessPolicyService;

    public ConversationOrchestrator(
            ToolPlanningService toolPlanningService,
            ToolRegistry toolRegistry,
            ConversationMemoryService conversationMemoryService,
            ResponseRenderer responseRenderer,
            ObjectMapper objectMapper,
            PendingActionService pendingActionService,
            ToolArgumentValidationService argumentValidationService,
            RbacPolicyService rbacPolicyService,
            RateLimitPolicyService rateLimitPolicyService,
            ToolRateLimitService toolRateLimitService,
            CacheService cacheService,
            AuditEventService auditEventService,
            AiInteractionProperties properties,
            AdministrativeInferenceService inferenceService,
            ToolAccessPolicyService toolAccessPolicyService
    ) {
        this.toolPlanningService = toolPlanningService;
        this.toolRegistry = toolRegistry;
        this.conversationMemoryService = conversationMemoryService;
        this.responseRenderer = responseRenderer;
        this.objectMapper = objectMapper;
        this.pendingActionService = pendingActionService;
        this.argumentValidationService = argumentValidationService;
        this.rbacPolicyService = rbacPolicyService;
        this.rateLimitPolicyService = rateLimitPolicyService;
        this.toolRateLimitService = toolRateLimitService;
        this.cacheService = cacheService;
        this.auditEventService = auditEventService;
        this.properties = properties;
        this.inferenceService = inferenceService;
        this.toolAccessPolicyService = toolAccessPolicyService;
    }

    public AiInteractionDtos.ChatResponse chat(UserContext userContext, AiInteractionDtos.ChatRequest request) {
        return chatWithProgress(userContext, request, null);
    }

    private AiInteractionDtos.ChatResponse chatWithProgress(UserContext userContext, AiInteractionDtos.ChatRequest request, Consumer<String> thoughtConsumer) {
        UUID workspaceId = request.workspaceId() != null ? request.workspaceId() : conversationMemoryService.ensureDefaultWorkspace(userContext).workspaceId();
        ConversationMemoryService.ChatRecord chat = conversationMemoryService.ensureChat(userContext, request.conversationId(), workspaceId, request.message());
        UUID conversationId = chat.conversationId();

        conversationMemoryService.addUserMessage(userContext, conversationId, request.message());
        auditEventService.requestReceived(userContext, request.message(), conversationId.toString());

        AiInteractionDtos.RenderedResponse rendered = responseRenderer.composeForAssistant(
                executeWithThoughts(userContext, request.message(), conversationId, thoughtConsumer)
        );
        
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

    public AiInteractionDtos.ChatResponse confirmAction(UserContext userContext, String token) {
        PendingActionService.PendingAction action = pendingActionService.consume(token)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.GONE, "Action expired or invalid"));

        boolean sameGuestSession = userContext.guestId() != null
                && action.userId() != null
                && action.userId().equals(userContext.userId());
        boolean sameUserSession = userContext.guestId() == null
                && action.userId() != null
                && action.userId().equals(userContext.userId())
                && action.tenantId() != null
                && action.tenantId().equals(userContext.tenantId())
                && action.schoolId() != null
                && action.schoolId().equals(userContext.schoolId());

        if (!sameGuestSession && !sameUserSession) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Action confirmation does not belong to this session.");
        }
        
        JsonNode result = executeSingleTool(userContext, action.toolCall(), "Confirmed action", action.conversationId(), true);
        
        AiInteractionDtos.RenderedResponse rendered = responseRenderer.composeForAssistant(
                responseRenderer.renderWithThought(
                        "smart_ui",
                        inferenceService.infer("Confirmed: " + action.toolCall().toolName(), userContext, result),
                        objectMapper.createObjectNode(),
                        false,
                        "action_confirmation",
                        "Action executed successfully after user approval",
                        "As requested, I have executed the strategic action that required your authorization."
                )
        );

        conversationMemoryService.addAssistantResponse(
                userContext,
                action.conversationId(),
                "Confirmed action: " + action.toolCall().toolName(),
                toStoredPayload(rendered)
        );

        return new AiInteractionDtos.ChatResponse(null, action.conversationId(), rendered);
    }

    private AiInteractionDtos.RenderedResponse executeWithThoughts(UserContext userContext, String message, UUID conversationId, Consumer<String> thoughtConsumer) {
        if (thoughtConsumer != null) thoughtConsumer.accept("Analyzing historical patterns and user intent...");
        
        List<ToolDescriptor> descriptors = toolRegistry.all().stream()
                .filter(tool -> toolAccessPolicyService.canDiscover(tool, userContext))
                .map(AiTool::descriptor)
                .toList();
        List<ConversationMemoryService.ChatMessageRecord> history = conversationMemoryService.listMessages(userContext, conversationId, 10);
        
        List<ToolCall> plan = toolPlanningService.plan(message, userContext, descriptors, history);
        
        if (plan.isEmpty()) {
            if (thoughtConsumer != null) thoughtConsumer.accept("Applying neural reasoning to direct inquiry...");
            JsonNode directReasoning = inferenceService.infer(message, userContext, objectMapper.createObjectNode());
            
            logOrchestration(userContext, message, conversationId, "direct_inference", null, 0);
            
            if (isMeaningfulDirectReasoning(directReasoning)) {
                return responseRenderer.renderWithThought(
                        "mixed",
                        directReasoning,
                        objectMapper.createObjectNode(),
                        false,
                        "direct_reasoning",
                        "Autonomous Inference",
                        "I have analyzed your request using my foundational knowledge base as no specific platform tool was required."
                );
            }
            return responseRenderer.clarificationResponse("I am trained on school operations, analytics, and pedagogy. Please specify a report, concept, or administrative task.");
        }

        ObjectNode allResults = objectMapper.createObjectNode();
        long startTime = System.currentTimeMillis();
        
        for (ToolCall tc : plan) {
            if (thoughtConsumer != null) thoughtConsumer.accept("Activating platform capability: " + tc.toolName() + "...");
            JsonNode stepResult = executeSingleTool(userContext, tc, message, conversationId, false);
            
            if (stepResult.has("__type") && "CONFIRMATION_REQUIRED".equals(stepResult.get("__type").asText())) {
                String token = pendingActionService.register(userContext, tc, conversationId);
                ObjectNode meta = objectMapper.createObjectNode();
                meta.put("confirmationToken", token);
                return responseRenderer.render("action", stepResult, meta, false, tc.toolName(), tc.reasoning());
            }
            
            allResults.set(tc.toolName(), stepResult);
        }

        if (thoughtConsumer != null) thoughtConsumer.accept("Synthesizing multi-tool intelligence into strategic UI...");
        JsonNode smartUiData = inferenceService.infer(message, userContext, allResults);
        
        logOrchestration(userContext, message, conversationId, "tool_augmented", plan.stream().map(ToolCall::toolName).toList(), System.currentTimeMillis() - startTime);

        String finalThought = "I have successfully integrated insights from " + plan.size() + " platform tools to provide this comprehensive analysis.";
        return responseRenderer.renderWithThought("mixed", smartUiData, objectMapper.createObjectNode(), false, "autonomous_orchestrator", "Neural Synthesis", finalThought);
    }

    private void logOrchestration(UserContext user, String input, UUID conversationId, String mode, List<String> tools, long latency) {
        // Step 9: Observability & Telemetry
        log.info("[AURA-ORCHESTRATOR] REQUEST_ID: {} | USER: {} | MODE: {} | TOOLS: {} | LATENCY: {}ms",
                conversationId, user.userId(), mode, tools != null ? String.join(",", tools) : "NONE", latency);
        
        // This could also push to a persistent audit store or Prometheus/Grafana metrics
        auditEventService.requestReceived(user, "Aura Orchestration: " + mode + " (Tools: " + (tools != null ? tools.size() : 0) + ")", conversationId.toString());
    }

    private JsonNode executeSingleTool(UserContext userContext, ToolCall toolCall, String message, UUID conversationId, boolean confirmed) {
        AiTool tool = toolRegistry.find(toolCall.toolName()).orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Tool not found"));
        
        if (tool.requiresConfirmation() && !confirmed) {
            ObjectNode req = objectMapper.createObjectNode();
            req.put("__type", "CONFIRMATION_REQUIRED");
            req.put("tool", tool.name());
            req.set("arguments", toolCall.arguments());
            return req;
        }

        argumentValidationService.validate(tool.name(), toolCall.arguments());
        
        try { rbacPolicyService.assertAllowed(tool, userContext, toolCall.arguments()); }
        catch (Exception ex) { throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Access denied: " + ex.getMessage()); }

        if (!toolRateLimitService.allow(userContext, tool.name(), rateLimitPolicyService.resolveLimit(userContext, tool.name(), tool.requiresConfirmation()))) {
            throw new ResponseStatusException(HttpStatus.TOO_MANY_REQUESTS, "Rate limit exceeded.");
        }

        long start = System.currentTimeMillis();
        String cacheKey = CacheKeyFactory.forTool(userContext, tool.name(), toolCall.arguments().toString() + "|" + message, String.valueOf(CACHE_VERSION));
        
        if (tool.cacheable()) {
            Optional<JsonNode> cached = cacheService.get(cacheKey);
            if (cached.isPresent()) return cached.get().path("data");
        }

        try {
            ToolResult result = tool.execute(toolCall.arguments(), userContext);
            auditEventService.toolExecuted(userContext, tool.name(), conversationId.toString(), System.currentTimeMillis() - start, false);

            if (tool.cacheable()) {
                ObjectNode wrapper = objectMapper.createObjectNode();
                wrapper.set("data", result.data());
                wrapper.set("meta", result.meta());
                cacheService.put(cacheKey, wrapper, Duration.ofSeconds(properties.cache().promptTtlSeconds()));
            }
            return result.data();
        } catch (Exception ex) {
            log.error("Tool execution failed: " + tool.name(), ex);
            ObjectNode errorNode = objectMapper.createObjectNode();
            errorNode.put("__type", "TOOL_ERROR");
            errorNode.put("tool", tool.name());
            errorNode.put("message", ex.getMessage());
            return errorNode;
        }
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
        if (rendered.thought() != null && !rendered.thought().isBlank()) {
            w.put("thought", rendered.thought());
        }
        return w;
    }

    private String summarizeAssistantResponse(AiInteractionDtos.RenderedResponse rendered) {
        if (rendered == null) return "";
        if ("text".equals(rendered.type()) && rendered.data().has("text")) return rendered.data().get("text").asText();
        if (rendered.data() != null && rendered.data().hasNonNull("summary")) return rendered.data().get("summary").asText();
        if (rendered.data() != null && rendered.data().hasNonNull("title")) return rendered.data().get("title").asText();
        if (rendered.thought() != null && !rendered.thought().isBlank()) return rendered.thought();
        return "Intelligence synthesized - Type: " + rendered.type();
    }

    private boolean isMeaningfulDirectReasoning(JsonNode directReasoning) {
        if (directReasoning == null || directReasoning.isNull()) {
            return false;
        }
        if (directReasoning.isTextual()) {
            return !directReasoning.asText("").isBlank();
        }
        if (!directReasoning.isObject()) {
            return true;
        }
        if (directReasoning.hasNonNull("summary") || directReasoning.hasNonNull("title") || directReasoning.hasNonNull("text")) {
            return true;
        }
        if (directReasoning.has("components") && directReasoning.get("components").isArray() && directReasoning.get("components").size() > 0) {
            return true;
        }
        if (directReasoning.has("insights") && directReasoning.get("insights").isArray() && directReasoning.get("insights").size() > 0) {
            return true;
        }
        if (directReasoning.has("quiz") && directReasoning.get("quiz").isArray() && directReasoning.get("quiz").size() > 0) {
            return true;
        }
        return false;
    }
}
