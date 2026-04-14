package com.sms.aiinteraction.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ObjectNode;
import com.sms.aiinteraction.security.UserContext;
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

    public String create(UserContext user, String toolName, ObjectNode args, String reasoning) {
        String token = UUID.randomUUID().toString();
        String key = key(token);

        ObjectNode payload = objectMapper.createObjectNode();
        payload.put("toolName", toolName);
        payload.set("args", args.deepCopy());
        payload.put("tenantId", user.tenantId().toString());
        payload.put("schoolId", user.schoolId().toString());
        payload.put("userId", user.userId().toString());
        payload.put("reasoning", reasoning == null ? "" : reasoning);

        cacheService.put(key, payload, Duration.ofMinutes(5));
        return token;
    }

    public PendingAction resolveAndConsume(String token, UserContext user) {
        if (token == null || token.isBlank()) {
            throw new IllegalArgumentException("confirmationToken is required.");
        }
        String key = key(token);
        Optional<JsonNode> node = cacheService.get(key);
        if (node.isEmpty()) {
            throw new IllegalArgumentException("Invalid or expired confirmation token.");
        }

        JsonNode payload = node.get();
        String tenantId = payload.path("tenantId").asText();
        String schoolId = payload.path("schoolId").asText();
        String userId = payload.path("userId").asText();

        if (!user.tenantId().toString().equals(tenantId)
                || !user.schoolId().toString().equals(schoolId)
                || !user.userId().toString().equals(userId)) {
            throw new ForbiddenException("Confirmation token does not belong to the current user scope.");
        }

        String toolName = payload.path("toolName").asText();
        JsonNode argsNode = payload.path("args");
        ObjectNode args = argsNode.isObject() ? (ObjectNode) argsNode.deepCopy() : objectMapper.createObjectNode();
        cacheService.delete(key);
        return new PendingAction(toolName, args, payload.path("reasoning").asText(""));
    }

    private String key(String token) {
        return "ai:pending-action:" + token;
    }

    public record PendingAction(String toolName, ObjectNode args, String reasoning) {}
}
