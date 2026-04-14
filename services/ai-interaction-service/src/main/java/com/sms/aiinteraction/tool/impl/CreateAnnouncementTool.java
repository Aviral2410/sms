package com.sms.aiinteraction.tool.impl;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ObjectNode;
import com.sms.aiinteraction.security.UserContext;
import com.sms.aiinteraction.security.UserRole;
import com.sms.aiinteraction.service.GatewayApiClient;
import com.sms.aiinteraction.tool.AiTool;
import com.sms.aiinteraction.tool.ToolDescriptor;
import com.sms.aiinteraction.tool.ToolResult;
import java.util.Set;
import org.springframework.stereotype.Component;

@Component
public class CreateAnnouncementTool implements AiTool {
    private final GatewayApiClient gatewayApiClient;
    private final ObjectMapper objectMapper;

    public CreateAnnouncementTool(GatewayApiClient gatewayApiClient, ObjectMapper objectMapper) {
        this.gatewayApiClient = gatewayApiClient;
        this.objectMapper = objectMapper;
    }

    @Override
    public String name() {
        return "createAnnouncement";
    }

    @Override
    public ToolDescriptor descriptor() {
        ObjectNode schema = objectMapper.createObjectNode();
        schema.put("type", "object");
        ObjectNode props = schema.putObject("properties");
        props.putObject("title").put("type", "string");
        props.putObject("content").put("type", "string");
        props.putObject("targetAudience")
                .put("type", "string")
                .put("description", "ALL, STUDENT, PARENT, TEACHER, STAFF, or class-specific audience as supported by backend.");
        props.putObject("targetClassId").put("type", "string").put("format", "uuid");
        props.putObject("priority").put("type", "string");
        props.putObject("type").put("type", "string");
        schema.putArray("required").add("title").add("content").add("targetAudience");
        return new ToolDescriptor(name(), "Create and publish announcement through communication service.", schema);
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
        ObjectNode payload = objectMapper.createObjectNode();
        payload.put("title", arguments.get("title").asText());
        payload.put("content", arguments.get("content").asText());
        payload.put("targetAudience", arguments.get("targetAudience").asText());
        if (arguments.hasNonNull("targetClassId")) {
            payload.put("targetClassId", arguments.get("targetClassId").asText());
        }
        if (arguments.hasNonNull("priority")) {
            payload.put("priority", arguments.get("priority").asText());
        }
        if (arguments.hasNonNull("type")) {
            payload.put("type", arguments.get("type").asText());
        }

        JsonNode result = gatewayApiClient.post(
                "/api/v1/communication/announcements/v2",
                payload,
                userContext.authorization()
        );

        ObjectNode data = objectMapper.createObjectNode();
        data.put("status", "SUCCESS");
        data.put("action", name());
        data.set("result", result);

        ObjectNode meta = objectMapper.createObjectNode();
        meta.put("tool", name());
        meta.put("targetAudience", payload.path("targetAudience").asText());
        return new ToolResult("action", data, meta);
    }
}
