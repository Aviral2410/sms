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
public class CreateLeaveRequestTool implements AiTool {
    private final GatewayApiClient gatewayApiClient;
    private final ObjectMapper objectMapper;

    public CreateLeaveRequestTool(GatewayApiClient gatewayApiClient, ObjectMapper objectMapper) {
        this.gatewayApiClient = gatewayApiClient;
        this.objectMapper = objectMapper;
    }

    @Override
    public String name() {
        return "createLeaveRequest";
    }

    @Override
    public ToolDescriptor descriptor() {
        ObjectNode schema = objectMapper.createObjectNode();
        schema.put("type", "object");
        ObjectNode props = schema.putObject("properties");
        props.putObject("leaveType")
                .put("type", "string")
                .put("description", "Leave type enum from HR service.");
        props.putObject("startDate").put("type", "string").put("format", "date");
        props.putObject("endDate").put("type", "string").put("format", "date");
        props.putObject("reason").put("type", "string");
        schema.putArray("required").add("leaveType").add("startDate").add("endDate");
        return new ToolDescriptor(name(), "Submit an HR leave request.", schema);
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
        payload.put("leaveType", arguments.get("leaveType").asText());
        payload.put("startDate", arguments.get("startDate").asText());
        payload.put("endDate", arguments.get("endDate").asText());
        if (arguments.hasNonNull("reason")) {
            payload.put("reason", arguments.get("reason").asText());
        }

        JsonNode result = gatewayApiClient.post(
                "/api/v1/school-ops/hr/leaves",
                payload,
                userContext.authorization()
        );

        ObjectNode data = objectMapper.createObjectNode();
        data.put("status", "SUCCESS");
        data.put("action", name());
        data.set("result", result);

        ObjectNode meta = objectMapper.createObjectNode();
        meta.put("tool", name());
        return new ToolResult("action", data, meta);
    }
}
