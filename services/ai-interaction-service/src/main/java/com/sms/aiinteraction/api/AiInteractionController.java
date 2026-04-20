package com.sms.aiinteraction.api;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.sms.aiinteraction.security.UserContext;
import com.sms.aiinteraction.security.UserContextResolver;
import com.sms.aiinteraction.service.ConversationOrchestrator;
import com.sms.aiinteraction.service.ConversationMemoryService;
import com.sms.aiinteraction.service.ToolCatalogService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import java.io.IOException;
import java.util.List;
import java.util.Map;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

@RestController
@RequestMapping("/api/v1/ai-interaction")
public class AiInteractionController {
    private final ConversationOrchestrator orchestrator;
    private final UserContextResolver userContextResolver;
    private final ToolCatalogService toolCatalogService;
    private final ConversationMemoryService conversationMemoryService;
    private final ObjectMapper objectMapper;

    public AiInteractionController(
            ConversationOrchestrator orchestrator,
            UserContextResolver userContextResolver,
            ToolCatalogService toolCatalogService,
            ConversationMemoryService conversationMemoryService,
            ObjectMapper objectMapper
    ) {
        this.orchestrator = orchestrator;
        this.userContextResolver = userContextResolver;
        this.toolCatalogService = toolCatalogService;
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
            } finally {
                emitter.complete();
            }
        });

        emitter.onError((_ex) -> {
            try {
                emitter.send(SseEmitter.event().name("error").data("{\"text\":\"Stream error.\"}"));
            } catch (Exception ignored) {
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
                } finally {
                    emitter.complete();
                }
            }
        }, ex -> {
            try {
                String msg = ex == null ? "Stream failed." : ex.getMessage();
                emitter.send(SseEmitter.event().name("error").data(objectMapper.writeValueAsString(Map.of("text", msg == null ? "Stream failed." : msg)), MediaType.APPLICATION_JSON));
            } catch (Exception ignored) {
            } finally {
                emitter.complete();
            }
        }, () -> {
            try {
                emitter.send(SseEmitter.event().name("done").data("[DONE]"));
            } catch (Exception ignored) {
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

    @GetMapping("/workspaces")
    public ResponseEntity<List<AiInteractionDtos.WorkspaceResponse>> listWorkspaces(HttpServletRequest servletRequest) {
        UserContext user = userContextResolver.resolve(servletRequest);
        conversationMemoryService.ensureDefaultWorkspace(user);
        return ResponseEntity.ok(conversationMemoryService.listWorkspaces(user).stream()
                .map(this::toWorkspaceResponse)
                .toList());
    }

    @GetMapping("/workspaces/{workspaceId}/chats")
    public ResponseEntity<List<AiInteractionDtos.ChatSummaryResponse>> listWorkspaceChats(
            @PathVariable java.util.UUID workspaceId,
            HttpServletRequest servletRequest
    ) {
        UserContext user = userContextResolver.resolve(servletRequest);
        return ResponseEntity.ok(conversationMemoryService.listChats(user, workspaceId).stream()
                .map(this::toChatSummary)
                .toList());
    }

    @GetMapping("/chats")
    public ResponseEntity<List<AiInteractionDtos.ChatSummaryResponse>> listAllChats(HttpServletRequest servletRequest) {
        UserContext user = userContextResolver.resolve(servletRequest);
        return ResponseEntity.ok(conversationMemoryService.listChats(user, null).stream()
                .map(this::toChatSummary)
                .toList());
    }

    @DeleteMapping("/chats/{conversationId}")
    public ResponseEntity<Void> deleteChat(
            @PathVariable java.util.UUID conversationId,
            HttpServletRequest servletRequest
    ) {
        UserContext user = userContextResolver.resolve(servletRequest);
        conversationMemoryService.deleteChat(user, conversationId);
        return ResponseEntity.noContent().build();
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
                message.timestamp().toString(),
                null 
        );
    }
}
