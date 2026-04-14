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
import java.util.Locale;
import java.util.Set;
import org.springframework.stereotype.Component;

@Component
public class ReviewLeaveRequestTool implements AiTool {
    private final GatewayApiClient gatewayApiClient;
    private final ObjectMapper objectMapper;

    public ReviewLeaveRequestTool(GatewayApiClient gatewayApiClient, ObjectMapper objectMapper) {
        this.gatewayApiClient = gatewayApiClient;
        this.objectMapper = objectMapper;
    }

    @Override
    public String name() {
        return "reviewLeaveRequest";
    }

    @Override
    public ToolDescriptor descriptor() {
        ObjectNode schema = objectMapper.createObjectNode();
        schema.put("type", "object");
        ObjectNode props = schema.putObject("properties");
        props.putObject("leaveRequestId").put("type", "string").put("format", "uuid");
        props.putObject("decision")
                .put("type", "string")
                .put("description", "approve or reject");
        props.putObject("note").put("type", "string");
        schema.putArray("required").add("leaveRequestId").add("decision").add("note");
        return new ToolDescriptor(name(), "Approve or reject an HR leave request.", schema);
    }

    @Override
    public Set<UserRole> allowedRoles() {
        return Set.of(UserRole.PLATFORM_ADMIN, UserRole.SCHOOL_ADMIN, UserRole.STAFF);
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
        String leaveRequestId = arguments.get("leaveRequestId").asText();
        String decision = arguments.get("decision").asText().trim().toLowerCase(Locale.ROOT);

        String path = switch (decision) {
            case "approve" -> "/api/v1/school-ops/hr/leaves/" + leaveRequestId + "/approve";
            case "reject" -> "/api/v1/school-ops/hr/leaves/" + leaveRequestId + "/reject";
            default -> throw new IllegalArgumentException("decision must be approve or reject.");
        };

        ObjectNode payload = objectMapper.createObjectNode();
        payload.put("note", arguments.get("note").asText());

        JsonNode result = gatewayApiClient.post(path, payload, userContext.authorization());

        ObjectNode data = objectMapper.createObjectNode();
        data.put("status", "SUCCESS");
        data.put("action", name());
        data.put("decision", decision);
        data.set("result", result);

        ObjectNode meta = objectMapper.createObjectNode();
        meta.put("tool", name());
        meta.put("leaveRequestId", leaveRequestId);
        return new ToolResult("action", data, meta);
    }
}
