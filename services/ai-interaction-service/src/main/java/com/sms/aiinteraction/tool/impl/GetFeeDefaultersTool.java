package com.sms.aiinteraction.tool.impl;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ArrayNode;
import com.fasterxml.jackson.databind.node.ObjectNode;
import com.sms.aiinteraction.security.UserContext;
import com.sms.aiinteraction.security.UserRole;
import com.sms.aiinteraction.service.GatewayApiClient;
import com.sms.aiinteraction.tool.AiTool;
import com.sms.aiinteraction.tool.ToolDescriptor;
import com.sms.aiinteraction.tool.ToolResult;
import java.util.Map;
import java.util.Set;
import org.springframework.stereotype.Component;

@Component
public class GetFeeDefaultersTool implements AiTool {
    private final GatewayApiClient gatewayApiClient;
    private final ObjectMapper objectMapper;

    public GetFeeDefaultersTool(GatewayApiClient gatewayApiClient, ObjectMapper objectMapper) {
        this.gatewayApiClient = gatewayApiClient;
        this.objectMapper = objectMapper;
    }

    @Override
    public String name() {
        return "getFeeDefaulters";
    }

    @Override
    public ToolDescriptor descriptor() {
        ObjectNode schema = objectMapper.createObjectNode();
        schema.put("type", "object");
        schema.putObject("properties");
        return new ToolDescriptor(name(), "Fetch likely fee defaulters for the authorized school scope.", schema);
    }

    @Override
    public Set<UserRole> allowedRoles() {
        return Set.of(UserRole.PLATFORM_ADMIN, UserRole.SCHOOL_ADMIN, UserRole.STAFF);
    }

    @Override
    public boolean cacheable() {
        return true;
    }

    @Override
    public ToolResult execute(ObjectNode arguments, UserContext userContext) {
        JsonNode feeRecords = gatewayApiClient.get(
                "/api/v1/school-ops/fees",
                Map.of("schoolId", userContext.schoolId().toString()),
                userContext.authorization()
        );

        ArrayNode rows = objectMapper.createArrayNode();
        if (feeRecords.isArray()) {
            for (JsonNode row : feeRecords) {
                String status = row.path("status").asText("").toLowerCase();
                String dueStatus = row.path("dueStatus").asText("").toLowerCase();
                boolean paid = row.path("paid").asBoolean(false);
                boolean isDefaulter = !paid && (status.contains("overdue") || status.contains("due") || dueStatus.contains("overdue") || dueStatus.contains("due"));
                if (isDefaulter) {
                    rows.add(row);
                }
            }
        }

        ObjectNode table = objectMapper.createObjectNode();
        table.set("rows", rows);
        table.put("count", rows.size());

        ObjectNode meta = objectMapper.createObjectNode();
        meta.put("tool", name());
        meta.put("schoolId", userContext.schoolId().toString());

        return new ToolResult("table", table, meta);
    }
}
