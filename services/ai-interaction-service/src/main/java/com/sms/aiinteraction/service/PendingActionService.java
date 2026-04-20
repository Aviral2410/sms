package com.sms.aiinteraction.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ObjectNode;
import com.sms.aiinteraction.security.UserContext;
import com.sms.aiinteraction.tool.ToolCall;
import com.sms.common.exception.ForbiddenException;
import java.time.Duration;
import java.util.Optional;
import java.util.UUID;
import org.springframework.stereotype.Service;

@Service
public class PendingActionService {
    private final CacheService cacheService;
    private final ObjectMapper objectMapper;

    public PendingActionService(CacheService cacheService, ObjectMapper objectMapper) {
        this.cacheService = cacheService;
        this.objectMapper = objectMapper;
    }

    public String register(UserContext user, ToolCall toolCall, UUID conversationId) {
        String token = UUID.randomUUID().toString();
        String key = key(token);

        ObjectNode payload = objectMapper.createObjectNode();
        payload.put("toolName", toolCall.toolName());
        payload.set("args", toolCall.arguments().deepCopy());
        payload.put("reasoning", toolCall.reasoning() == null ? "" : toolCall.reasoning());
        payload.put("conversationId", conversationId.toString());
        payload.put("tenantId", user.tenantId().toString());
        payload.put("schoolId", user.schoolId().toString());
        payload.put("userId", user.userId().toString());

        cacheService.put(key, payload, Duration.ofMinutes(5));
        return token;
    }

    public Optional<PendingAction> consume(String token) {
        if (token == null || token.isBlank()) return Optional.empty();
        String key = key(token);
        return cacheService.get(key).map(node -> {
            cacheService.delete(key);
            ToolCall call = new ToolCall(
                node.path("toolName").asText(),
                (ObjectNode) node.path("args"),
                node.path("reasoning").asText()
            );
            return new PendingAction(
                call,
                UUID.fromString(node.path("conversationId").asText())
            );
        });
    }

    private String key(String token) {
        return "ai:pending-action:" + token;
    }

    public record PendingAction(ToolCall toolCall, UUID conversationId) {}
}
