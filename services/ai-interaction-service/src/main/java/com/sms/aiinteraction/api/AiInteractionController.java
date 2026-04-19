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
import org.springframework.http.ResponseEntity;
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
    public ResponseEntity<AiInteractionDtos.ChatResponse> chat(
            @Valid @RequestBody AiInteractionDtos.ChatRequest request,
            HttpServletRequest servletRequest
    ) {
        UserContext user = userContextResolver.resolve(servletRequest);
        return ResponseEntity.ok(orchestrator.chat(user, request));
    }

    @PostMapping(value = "/chat/stream", produces = MediaType.TEXT_EVENT_STREAM_VALUE)
    public ResponseEntity<SseEmitter> stream(
            @Valid @RequestBody AiInteractionDtos.ChatRequest request,
            HttpServletRequest servletRequest
    ) {
        UserContext user = userContextResolver.resolve(servletRequest);
        SseEmitter emitter = new SseEmitter(300_000L);

        emitter.onTimeout(() -> {
            try {
                emitter.send(SseEmitter.event().name("error").data("{\"text\":\"Stream timed out.\"}"));
            } catch (Exception ignored) {
                // ignore
            } finally {
                emitter.complete();
            }
        });

        emitter.onError((_ex) -> {
            try {
                emitter.send(SseEmitter.event().name("error").data("{\"text\":\"Stream error.\"}"));
            } catch (Exception ignored) {
                // ignore
            } finally {
                emitter.complete();
            }
        });

        orchestrator.streamChat(user, request, event -> {
            try {
                emitter.send(SseEmitter.event()
                        .name(event.event())
                        .data(objectMapper.writeValueAsString(event.payload()), MediaType.APPLICATION_JSON));
            } catch (IOException e) {
                try {
                    emitter.send(SseEmitter.event().name("error").data("{\"text\":\"Stream write failed.\"}"));
                } catch (Exception ignored) {
                    // ignore
                } finally {
                    emitter.complete();
                }
            }
        }, ex -> {
            try {
                String msg = ex == null ? "Stream failed." : ex.getMessage();
                emitter.send(SseEmitter.event().name("error").data(objectMapper.writeValueAsString(Map.of("text", msg == null ? "Stream failed." : msg)), MediaType.APPLICATION_JSON));
            } catch (Exception ignored) {
                // ignore
            } finally {
                emitter.complete();
            }
        }, () -> {
            try {
                emitter.send(SseEmitter.event().name("done").data("[DONE]"));
            } catch (Exception ignored) {
                // ignore
            } finally {
                emitter.complete();
            }
        });

        return ResponseEntity.ok()
                .contentType(MediaType.TEXT_EVENT_STREAM)
                .header("Cache-Control", "no-cache")
                .header("X-Accel-Buffering", "no")
                .body(emitter);
    }

    @PostMapping("/actions/confirm")
    public ResponseEntity<AiInteractionDtos.ChatResponse> confirmAction(
            @Valid @RequestBody AiInteractionDtos.ConfirmActionRequest request,
            HttpServletRequest servletRequest
    ) {
        UserContext user = userContextResolver.resolve(servletRequest);
        return ResponseEntity.ok(orchestrator.confirmAction(user, request.confirmationToken()));
    }

    @GetMapping("/tools")
    public ResponseEntity<List<AiInteractionDtos.ToolCatalogItem>> tools(HttpServletRequest servletRequest) {
        UserContext user = userContextResolver.resolve(servletRequest);
        return ResponseEntity.ok(toolCatalogService.forUser(user));
    }

    @PostMapping("/workspaces")
    public ResponseEntity<AiInteractionDtos.WorkspaceResponse> createWorkspace(
            @Valid @RequestBody AiInteractionDtos.WorkspaceCreateRequest request,
            HttpServletRequest servletRequest
    ) {
        UserContext user = userContextResolver.resolve(servletRequest);
        ConversationMemoryService.WorkspaceRecord workspace = conversationMemoryService.createWorkspace(user, request.name());
        return ResponseEntity.ok(toWorkspaceResponse(workspace));
    }

    @GetMapping("/workspaces")
    public ResponseEntity<List<AiInteractionDtos.WorkspaceResponse>> listWorkspaces(HttpServletRequest servletRequest) {
        UserContext user = userContextResolver.resolve(servletRequest);
        
        // Ensure at least one workspace exists for the user/guest
        conversationMemoryService.ensureDefaultWorkspace(user);
        
        return ResponseEntity.ok(conversationMemoryService.listWorkspaces(user).stream()
                .map(this::toWorkspaceResponse)
                .toList());
    }

    @PostMapping("/chats")
    public ResponseEntity<AiInteractionDtos.ChatSummaryResponse> createChatInDefaultWorkspace(
            @RequestBody(required = false) AiInteractionDtos.ChatCreateRequest request,
            HttpServletRequest servletRequest
    ) {
        UserContext user = userContextResolver.resolve(servletRequest);
        String title = request == null ? null : request.title();
        ConversationMemoryService.WorkspaceRecord workspace = conversationMemoryService.ensureDefaultWorkspace(user);
        ConversationMemoryService.ChatRecord chat = conversationMemoryService.createChat(user, workspace.workspaceId(), title);
        return ResponseEntity.ok(toChatSummary(chat));
    }

    @PostMapping("/workspaces/{workspaceId}/chats")
    public ResponseEntity<AiInteractionDtos.ChatSummaryResponse> createChat(
            @PathVariable java.util.UUID workspaceId,
            @RequestBody(required = false) AiInteractionDtos.ChatCreateRequest request,
            HttpServletRequest servletRequest
    ) {
        UserContext user = userContextResolver.resolve(servletRequest);
        String title = request == null ? null : request.title();
        ConversationMemoryService.ChatRecord chat = conversationMemoryService.createChat(user, workspaceId, title);
        return ResponseEntity.ok(toChatSummary(chat));
    }

    @GetMapping("/workspaces/{workspaceId}/chats")
    public ResponseEntity<List<AiInteractionDtos.ChatSummaryResponse>> listChats(
            @PathVariable java.util.UUID workspaceId,
            HttpServletRequest servletRequest
    ) {
        UserContext user = userContextResolver.resolve(servletRequest);
        return ResponseEntity.ok(conversationMemoryService.listChats(user, workspaceId).stream()
                .map(this::toChatSummary)
                .toList());
    }

    @GetMapping("/chats/{conversationId}/messages")
    public ResponseEntity<List<AiInteractionDtos.ChatMessageResponse>> listChatMessages(
            @PathVariable java.util.UUID conversationId,
            @RequestParam(defaultValue = "50") int limit,
            HttpServletRequest servletRequest
    ) {
        UserContext user = userContextResolver.resolve(servletRequest);
        return ResponseEntity.ok(conversationMemoryService.listMessages(user, conversationId, limit).stream()
                .map(this::toChatMessage)
                .toList());
    }

    @GetMapping("/audit/events")
    public ResponseEntity<List<com.fasterxml.jackson.databind.JsonNode>> auditEvents(
            @RequestParam(defaultValue = "100") int limit,
            HttpServletRequest servletRequest
    ) {
        UserContext user = userContextResolver.resolve(servletRequest);
        return ResponseEntity.ok(auditTrailStore.list(user, limit));
    }

    @GetMapping("/admin/rate-limits")
    public ResponseEntity<AiInteractionDtos.RateLimitPolicyResponse> getRateLimits(HttpServletRequest servletRequest) {
        UserContext user = userContextResolver.resolve(servletRequest);
        return ResponseEntity.ok(rateLimitPolicyService.readPolicy(user));
    }

    @PostMapping("/admin/rate-limits")
    public ResponseEntity<AiInteractionDtos.RateLimitPolicyResponse> updateRateLimits(
            @Valid @RequestBody AiInteractionDtos.PlanToolRateLimits request,
            HttpServletRequest servletRequest
    ) {
        UserContext user = userContextResolver.resolve(servletRequest);
        return ResponseEntity.ok(rateLimitPolicyService.updatePolicy(user, request));
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
