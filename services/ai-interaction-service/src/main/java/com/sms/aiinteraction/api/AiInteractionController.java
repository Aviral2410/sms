package com.sms.aiinteraction.api;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.sms.aiinteraction.security.UserContext;
import com.sms.aiinteraction.security.UserContextResolver;
import com.sms.aiinteraction.service.ConversationOrchestrator;
import com.sms.aiinteraction.service.AuditTrailStore;
import com.sms.aiinteraction.service.ConversationMemoryService;
import com.sms.aiinteraction.service.RateLimitPolicyService;
import com.sms.aiinteraction.service.ToolCatalogService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import java.io.IOException;
import java.util.List;
import java.util.Map;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

@RestController
@RequestMapping("/api/v1/ai-interaction")
public class AiInteractionController {
    private final ConversationOrchestrator orchestrator;
    private final UserContextResolver userContextResolver;
    private final ToolCatalogService toolCatalogService;
    private final AuditTrailStore auditTrailStore;
    private final RateLimitPolicyService rateLimitPolicyService;
    private final ConversationMemoryService conversationMemoryService;
    private final ObjectMapper objectMapper;

    public AiInteractionController(
            ConversationOrchestrator orchestrator,
            UserContextResolver userContextResolver,
            ToolCatalogService toolCatalogService,
            AuditTrailStore auditTrailStore,
            RateLimitPolicyService rateLimitPolicyService,
            ConversationMemoryService conversationMemoryService,
            ObjectMapper objectMapper
    ) {
        this.orchestrator = orchestrator;
        this.userContextResolver = userContextResolver;
        this.toolCatalogService = toolCatalogService;
        this.auditTrailStore = auditTrailStore;
        this.rateLimitPolicyService = rateLimitPolicyService;
        this.conversationMemoryService = conversationMemoryService;
        this.objectMapper = objectMapper;
    }

    @PostMapping("/chat")
    public AiInteractionDtos.ChatResponse chat(
            @Valid @RequestBody AiInteractionDtos.ChatRequest request,
            HttpServletRequest servletRequest
    ) {
        UserContext user = userContextResolver.resolve(servletRequest);
        return orchestrator.chat(user, request);
    }

    @PostMapping(value = "/chat/stream", produces = MediaType.TEXT_EVENT_STREAM_VALUE)
    public SseEmitter stream(
            @Valid @RequestBody AiInteractionDtos.ChatRequest request,
            HttpServletRequest servletRequest
    ) {
        UserContext user = userContextResolver.resolve(servletRequest);
        SseEmitter emitter = new SseEmitter(120_000L);

        orchestrator.streamChat(user, request, event -> {
            try {
                emitter.send(SseEmitter.event()
                        .name(event.event())
                        .data(objectMapper.writeValueAsString(event.payload())));
            } catch (IOException e) {
                emitter.completeWithError(e);
            }
        }, emitter::completeWithError, emitter::complete);

        return emitter;
    }

    @PostMapping("/actions/confirm")
    public AiInteractionDtos.ChatResponse confirmAction(
            @Valid @RequestBody AiInteractionDtos.ConfirmActionRequest request,
            HttpServletRequest servletRequest
    ) {
        UserContext user = userContextResolver.resolve(servletRequest);
        return orchestrator.confirmAction(user, request.confirmationToken());
    }

    @GetMapping("/tools")
    public List<AiInteractionDtos.ToolCatalogItem> tools(HttpServletRequest servletRequest) {
        UserContext user = userContextResolver.resolve(servletRequest);
        return toolCatalogService.forUser(user);
    }

    @PostMapping("/workspaces")
    public AiInteractionDtos.WorkspaceResponse createWorkspace(
            @Valid @RequestBody AiInteractionDtos.WorkspaceCreateRequest request,
            HttpServletRequest servletRequest
    ) {
        UserContext user = userContextResolver.resolve(servletRequest);
        ConversationMemoryService.WorkspaceRecord workspace = conversationMemoryService.createWorkspace(user, request.name());
        return toWorkspaceResponse(workspace);
    }

    @GetMapping("/workspaces")
    public List<AiInteractionDtos.WorkspaceResponse> listWorkspaces(HttpServletRequest servletRequest) {
        UserContext user = userContextResolver.resolve(servletRequest);
        return conversationMemoryService.listWorkspaces(user).stream()
                .map(this::toWorkspaceResponse)
                .toList();
    }

    @PostMapping("/workspaces/{workspaceId}/chats")
    public AiInteractionDtos.ChatSummaryResponse createChat(
            @PathVariable java.util.UUID workspaceId,
            @RequestBody(required = false) AiInteractionDtos.ChatCreateRequest request,
            HttpServletRequest servletRequest
    ) {
        UserContext user = userContextResolver.resolve(servletRequest);
        String title = request == null ? null : request.title();
        ConversationMemoryService.ChatRecord chat = conversationMemoryService.createChat(user, workspaceId, title);
        return toChatSummary(chat);
    }

    @GetMapping("/workspaces/{workspaceId}/chats")
    public List<AiInteractionDtos.ChatSummaryResponse> listChats(
            @PathVariable java.util.UUID workspaceId,
            HttpServletRequest servletRequest
    ) {
        UserContext user = userContextResolver.resolve(servletRequest);
        return conversationMemoryService.listChats(user, workspaceId).stream()
                .map(this::toChatSummary)
                .toList();
    }

    @GetMapping("/chats/{conversationId}/messages")
    public List<AiInteractionDtos.ChatMessageResponse> listChatMessages(
            @PathVariable java.util.UUID conversationId,
            @RequestParam(defaultValue = "50") int limit,
            HttpServletRequest servletRequest
    ) {
        UserContext user = userContextResolver.resolve(servletRequest);
        return conversationMemoryService.listMessages(user, conversationId, limit).stream()
                .map(this::toChatMessage)
                .toList();
    }

    @GetMapping("/audit/events")
    public List<com.fasterxml.jackson.databind.JsonNode> auditEvents(
            @RequestParam(defaultValue = "100") int limit,
            HttpServletRequest servletRequest
    ) {
        UserContext user = userContextResolver.resolve(servletRequest);
        return auditTrailStore.list(user, limit);
    }

    @GetMapping("/admin/rate-limits")
    public AiInteractionDtos.RateLimitPolicyResponse getRateLimits(HttpServletRequest servletRequest) {
        UserContext user = userContextResolver.resolve(servletRequest);
        return rateLimitPolicyService.readPolicy(user);
    }

    @PostMapping("/admin/rate-limits")
    public AiInteractionDtos.RateLimitPolicyResponse updateRateLimits(
            @Valid @RequestBody AiInteractionDtos.PlanToolRateLimits request,
            HttpServletRequest servletRequest
    ) {
        UserContext user = userContextResolver.resolve(servletRequest);
        return rateLimitPolicyService.updatePolicy(user, request);
    }

    @PostMapping("/health-check")
    public Map<String, Object> healthCheck() {
        return Map.of(
                "service", "ai-interaction-service",
                "status", "UP",
                "capabilities", new String[]{"chat", "stream", "tool-calling", "rbac", "cache", "confirm-actions", "tools-catalog", "audit-export", "workspace-chat-persistence"}
        );
    }

    private AiInteractionDtos.WorkspaceResponse toWorkspaceResponse(ConversationMemoryService.WorkspaceRecord workspace) {
        return new AiInteractionDtos.WorkspaceResponse(
                workspace.workspaceId(),
                workspace.name(),
                workspace.createdAt().toString(),
                workspace.updatedAt().toString()
        );
    }

    private AiInteractionDtos.ChatSummaryResponse toChatSummary(ConversationMemoryService.ChatRecord chat) {
        return new AiInteractionDtos.ChatSummaryResponse(
                chat.conversationId(),
                chat.workspaceId(),
                chat.title(),
                chat.createdAt().toString(),
                chat.updatedAt().toString()
        );
    }

    private AiInteractionDtos.ChatMessageResponse toChatMessage(ConversationMemoryService.ChatMessageRecord message) {
        return new AiInteractionDtos.ChatMessageResponse(
                message.messageId(),
                message.role(),
                message.content(),
                message.payload(),
                message.timestamp().toString()
        );
    }
}
