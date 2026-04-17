package com.sms.aiinteraction.api;

import com.fasterxml.jackson.annotation.JsonProperty;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ObjectNode;
import com.sms.aiinteraction.security.UserContext;
import com.sms.aiinteraction.security.UserContextResolver;
import com.sms.aiinteraction.service.ConversationMemoryService;
import com.sms.aiinteraction.service.ConversationOrchestrator;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import java.io.IOException;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.CompletableFuture;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

/**
 * Compatibility endpoints for the Claude-like chat UI in {@code docs/ai-chat}.
 *
 * This intentionally uses the event shape:
 *   {"type":"text","content":"..."}
 *   {"type":"component","componentType":"...","props":{...}}
 *   {"type":"complete","usage":{...}}
 *   {"type":"error","error":"..."}
 *
 * so the React template can parse SSE lines with only {@code data: <json>}.
 */
@RestController
public class AiChatCompatController {
    private final ConversationOrchestrator orchestrator;
    private final UserContextResolver userContextResolver;
    private final ConversationMemoryService conversationMemoryService;
    private final ObjectMapper objectMapper;
    private final AiChatCompatMapper mapper;

    public AiChatCompatController(
            ConversationOrchestrator orchestrator,
            UserContextResolver userContextResolver,
            ConversationMemoryService conversationMemoryService,
            ObjectMapper objectMapper
    ) {
        this.orchestrator = orchestrator;
        this.userContextResolver = userContextResolver;
        this.conversationMemoryService = conversationMemoryService;
        this.objectMapper = objectMapper;
        this.mapper = new AiChatCompatMapper(objectMapper);
    }

    public record AiChatRequest(
            @NotBlank @Size(max = 2000) String message,
            @JsonProperty("conversation_id") String conversationId,
            Boolean stream
    ) {}

    @PostMapping(value = "/api/chat", produces = MediaType.TEXT_EVENT_STREAM_VALUE)
    public ResponseEntity<SseEmitter> chat(@Valid @RequestBody AiChatRequest request, HttpServletRequest servletRequest) {
        UserContext user = userContextResolver.resolve(servletRequest);
        UUID conversationId = parseConversationId(request.conversationId());

        SseEmitter emitter = new SseEmitter(300_000L);

        emitter.onTimeout(() -> {
            try {
                send(emitter, mapper.errorEvent("Stream timed out."));
            } catch (Exception ignored) {
                // ignore
            } finally {
                emitter.complete();
            }
        });

        emitter.onError((_ex) -> {
            try {
                send(emitter, mapper.errorEvent("Stream error."));
            } catch (Exception ignored) {
                // ignore
            } finally {
                emitter.complete();
            }
        });

        CompletableFuture.runAsync(() -> {
            try {
                AiInteractionDtos.ChatRequest chatReq = new AiInteractionDtos.ChatRequest(
                        null,
                        conversationId,
                        request.message(),
                        null
                );

                AiInteractionDtos.ChatResponse response = orchestrator.chat(user, chatReq);
                var events = mapper.toStreamEvents(response);

                for (ObjectNode event : events) {
                    send(emitter, event);
                }
                send(emitter, mapper.completeEvent(request.message(), events, response.conversationId()));
                emitter.complete();
            } catch (Exception ex) {
                try {
                    send(emitter, mapper.errorEvent(ex.getMessage()));
                } catch (Exception ignored) {
                    // ignore
                } finally {
                    emitter.complete();
                }
            }
        });

        return ResponseEntity.ok()
                .contentType(MediaType.TEXT_EVENT_STREAM)
                .header("Cache-Control", "no-cache")
                .header("Connection", "keep-alive")
                .header("X-Accel-Buffering", "no")
                .body(emitter);
    }

    @GetMapping("/api/health")
    public Map<String, Object> health() {
        return Map.of("status", "ok");
    }

    @PostMapping("/api/clear/{conversationId}")
    public Map<String, Object> clear(@PathVariable UUID conversationId, HttpServletRequest servletRequest) {
        UserContext user = userContextResolver.resolve(servletRequest);
        conversationMemoryService.clearMessages(user, conversationId);
        return Map.of("status", "cleared", "conversation_id", conversationId.toString());
    }

    @PostMapping("/api/conversations/{conversationId}/clear")
    public Map<String, Object> clearAlt(@PathVariable UUID conversationId, HttpServletRequest servletRequest) {
        return clear(conversationId, servletRequest);
    }

    private void send(SseEmitter emitter, ObjectNode node) throws IOException {
        emitter.send(SseEmitter.event().data(objectMapper.writeValueAsString(node), MediaType.APPLICATION_JSON));
    }

    private UUID parseConversationId(String raw) {
        if (raw == null || raw.isBlank()) return null;
        try {
            return UUID.fromString(raw.trim());
        } catch (IllegalArgumentException ex) {
            return null;
        }
    }
}

