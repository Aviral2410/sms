package com.sms.aiinteraction.tool.impl;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ObjectNode;
import com.sms.aiinteraction.security.UserContext;
import com.sms.aiinteraction.security.UserRole;
import com.sms.aiinteraction.service.AuditEventService;
import com.sms.aiinteraction.service.GatewayApiClient;
import com.sms.aiinteraction.service.IdempotencyService;
import com.sms.aiinteraction.tool.AiTool;
import com.sms.aiinteraction.tool.ToolDescriptor;
import com.sms.aiinteraction.tool.ToolResult;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.time.Duration;
import java.util.Set;
import org.springframework.stereotype.Component;

@Component
public class SendNotificationTool implements AiTool {
    private final GatewayApiClient gatewayApiClient;
    private final ObjectMapper objectMapper;
    private final IdempotencyService idempotencyService;
    private final AuditEventService auditEventService;

    public SendNotificationTool(
            GatewayApiClient gatewayApiClient,
            ObjectMapper objectMapper,
            IdempotencyService idempotencyService,
            AuditEventService auditEventService
    ) {
        this.gatewayApiClient = gatewayApiClient;
        this.objectMapper = objectMapper;
        this.idempotencyService = idempotencyService;
        this.auditEventService = auditEventService;
    }

    @Override
    public String name() {
        return "sendNotification";
    }

    @Override
    public ToolDescriptor descriptor() {
        ObjectNode schema = objectMapper.createObjectNode();
        schema.put("type", "object");
        ObjectNode props = schema.putObject("properties");
        props.putObject("recipientUserId").put("type", "string").put("format", "uuid");
        props.putObject("title").put("type", "string");
        props.putObject("message").put("type", "string");
        props.putObject("idempotencyKey").put("type", "string");
        schema.putArray("required").add("recipientUserId").add("message");
        return new ToolDescriptor(name(), "Send notification to a recipient within authorized school scope.", schema);
    }

    @Override
    public Set<UserRole> allowedRoles() {
        return Set.of(UserRole.PLATFORM_ADMIN, UserRole.SCHOOL_ADMIN, UserRole.TEACHER, UserRole.STAFF);
    }

    @Override
    public boolean cacheable() {
        return false;
    }

    @Override
    public boolean requiresConfirmation() {
        return true;
    }

    @Override
    public ToolResult execute(ObjectNode arguments, UserContext userContext) {
        if (!arguments.hasNonNull("recipientUserId")) {
            throw new IllegalArgumentException("recipientUserId is required.");
        }
        if (!arguments.hasNonNull("message")) {
            throw new IllegalArgumentException("message is required.");
        }

        ObjectNode payload = objectMapper.createObjectNode();
        payload.put("schoolId", userContext.schoolId().toString());
        payload.put("recipientId", arguments.get("recipientUserId").asText());
        payload.put("title", arguments.hasNonNull("title") ? arguments.get("title").asText() : "AI Assistant");
        payload.put("message", arguments.get("message").asText());
        payload.put("isRead", false);

        String idempotencyKey = arguments.hasNonNull("idempotencyKey")
                ? arguments.get("idempotencyKey").asText()
                : computeIdempotencyKey(
                        userContext.schoolId().toString(),
                        payload.get("recipientId").asText(),
                        payload.get("title").asText(),
                        payload.get("message").asText()
                );
        boolean claimed = idempotencyService.claim(userContext, name(), idempotencyKey, Duration.ofMinutes(5));
        if (!claimed) {
            auditEventService.idempotentSkip(userContext, name(), idempotencyKey, "na");
            ObjectNode duplicate = objectMapper.createObjectNode();
            duplicate.put("status", "DUPLICATE_SKIPPED");
            duplicate.put("action", "sendNotification");
            duplicate.put("idempotencyKey", idempotencyKey);
            duplicate.put("reason", "An equivalent notification request was recently processed.");

            ObjectNode duplicateMeta = objectMapper.createObjectNode();
            duplicateMeta.put("tool", name());
            duplicateMeta.put("idempotencyKey", idempotencyKey);
            return new ToolResult("action", duplicate, duplicateMeta);
        }

        JsonNode response = gatewayApiClient.post(
                "/api/v1/communication/notifications",
                payload,
                userContext.authorization()
        );

        ObjectNode action = objectMapper.createObjectNode();
        action.put("status", "SUCCESS");
        action.put("action", "sendNotification");
        action.set("result", response);

        ObjectNode meta = objectMapper.createObjectNode();
        meta.put("tool", name());
        meta.put("recipientUserId", arguments.get("recipientUserId").asText());
        meta.put("idempotencyKey", idempotencyKey);
        return new ToolResult("action", action, meta);
    }

    private String computeIdempotencyKey(String schoolId, String recipientId, String title, String message) {
        String raw = schoolId + "|" + recipientId + "|" + title + "|" + message;
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] hashed = digest.digest(raw.getBytes(StandardCharsets.UTF_8));
            StringBuilder sb = new StringBuilder();
            for (byte b : hashed) {
                sb.append(String.format("%02x", b));
            }
            return sb.toString();
        } catch (NoSuchAlgorithmException ex) {
            return Integer.toHexString(raw.hashCode());
        }
    }
}
