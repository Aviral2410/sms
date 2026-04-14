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
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.Set;
import java.util.TreeMap;
import org.springframework.stereotype.Component;

@Component
public class GetLeaveRequestsTool implements AiTool {
    private final GatewayApiClient gatewayApiClient;
    private final ObjectMapper objectMapper;

    public GetLeaveRequestsTool(GatewayApiClient gatewayApiClient, ObjectMapper objectMapper) {
        this.gatewayApiClient = gatewayApiClient;
        this.objectMapper = objectMapper;
    }

    @Override
    public String name() {
        return "getLeaveRequests";
    }

    @Override
    public ToolDescriptor descriptor() {
        ObjectNode schema = objectMapper.createObjectNode();
        schema.put("type", "object");
        ObjectNode props = schema.putObject("properties");
        props.putObject("status")
                .put("type", "string")
                .put("description", "Optional leave request status filter.");
        return new ToolDescriptor(name(), "List leave requests for HR/admin review scope.", schema);
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
    public ToolResult execute(ObjectNode arguments, UserContext userContext) {
        Map<String, String> query = new LinkedHashMap<>();
        if (arguments.hasNonNull("status")) {
            query.put("status", arguments.get("status").asText());
        }

        JsonNode leaves = gatewayApiClient.get(
                "/api/v1/school-ops/hr/leaves",
                query,
                userContext.authorization()
        );

        var byStatus = new TreeMap<String, Integer>();
        if (leaves.isArray()) {
            for (JsonNode row : leaves) {
                String status = row.path("status").asText("UNKNOWN");
                byStatus.merge(status, 1, Integer::sum);
            }
        }

        ObjectNode chart = objectMapper.createObjectNode();
        chart.put("xKey", "status");
        chart.put("yKey", "count");
        ArrayNode points = chart.putArray("points");
        byStatus.forEach((status, count) -> {
            ObjectNode point = points.addObject();
            point.put("status", status);
            point.put("count", count);
        });

        ObjectNode data = objectMapper.createObjectNode();
        data.set("rows", leaves);
        data.set("chart", chart);
        data.put("total", leaves.isArray() ? leaves.size() : 0);

        ObjectNode meta = objectMapper.createObjectNode();
        meta.put("tool", name());
        return new ToolResult("chart", data, meta);
    }
}
