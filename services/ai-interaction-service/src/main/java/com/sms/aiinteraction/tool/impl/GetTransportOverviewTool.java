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
public class GetTransportOverviewTool implements AiTool {
    private final GatewayApiClient gatewayApiClient;
    private final ObjectMapper objectMapper;

    public GetTransportOverviewTool(GatewayApiClient gatewayApiClient, ObjectMapper objectMapper) {
        this.gatewayApiClient = gatewayApiClient;
        this.objectMapper = objectMapper;
    }

    @Override
    public String name() {
        return "getTransportOverview";
    }

    @Override
    public ToolDescriptor descriptor() {
        ObjectNode schema = objectMapper.createObjectNode();
        schema.put("type", "object");
        schema.putObject("properties");
        return new ToolDescriptor(name(), "Fetch transport routes and summarize by status.", schema);
    }

    @Override
    public Set<UserRole> allowedRoles() {
        return Set.of(UserRole.PLATFORM_ADMIN, UserRole.SCHOOL_ADMIN, UserRole.STAFF, UserRole.TEACHER, UserRole.PARENT, UserRole.STUDENT);
    }

    @Override
    public boolean cacheable() {
        return true;
    }

    @Override
    public ToolResult execute(ObjectNode arguments, UserContext userContext) {
        JsonNode routes = gatewayApiClient.get(
                "/api/v1/school-ops/transport",
                Map.of("schoolId", userContext.schoolId().toString()),
                userContext.authorization()
        );

        java.util.Map<String, Integer> byStatus = new java.util.TreeMap<>();
        if (routes.isArray()) {
            for (JsonNode row : routes) {
                String status = row.path("status").asText("UNKNOWN");
                byStatus.merge(status, 1, Integer::sum);
            }
        }

        ObjectNode chart = objectMapper.createObjectNode();
        chart.put("xKey", "status");
        chart.put("yKey", "count");
        ArrayNode points = chart.putArray("points");
        byStatus.forEach((status, count) -> {
            ObjectNode p = points.addObject();
            p.put("status", status);
            p.put("count", count);
        });

        ObjectNode data = objectMapper.createObjectNode();
        data.set("rows", routes);
        data.set("chart", chart);
        data.put("totalRoutes", routes.isArray() ? routes.size() : 0);

        ObjectNode meta = objectMapper.createObjectNode();
        meta.put("tool", name());
        return new ToolResult("chart", data, meta);
    }
}
