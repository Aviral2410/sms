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
public class GetSchoolDashboardTool implements AiTool {
    private final GatewayApiClient gatewayApiClient;
    private final ObjectMapper objectMapper;

    public GetSchoolDashboardTool(GatewayApiClient gatewayApiClient, ObjectMapper objectMapper) {
        this.gatewayApiClient = gatewayApiClient;
        this.objectMapper = objectMapper;
    }

    @Override
    public String name() {
        return "getSchoolDashboard";
    }

    @Override
    public ToolDescriptor descriptor() {
        ObjectNode schema = objectMapper.createObjectNode();
        schema.put("type", "object");
        schema.putObject("properties");
        return new ToolDescriptor(name(), "Fetch school dashboard metrics and chart numeric KPIs.", schema);
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
        JsonNode dashboard = gatewayApiClient.get(
                "/api/v1/school-ops/dashboard",
                Map.of("schoolId", userContext.schoolId().toString()),
                userContext.authorization()
        );

        ObjectNode chart = objectMapper.createObjectNode();
        chart.put("xKey", "metric");
        chart.put("yKey", "value");
        ArrayNode points = chart.putArray("points");

        if (dashboard != null && dashboard.isObject()) {
            dashboard.fields().forEachRemaining(entry -> {
                JsonNode value = entry.getValue();
                if (value != null && value.isNumber()) {
                    ObjectNode point = points.addObject();
                    point.put("metric", entry.getKey());
                    point.put("value", value.asDouble());
                }
            });
        }

        ObjectNode data = objectMapper.createObjectNode();
        data.set("raw", dashboard);
        data.set("chart", chart);

        ObjectNode meta = objectMapper.createObjectNode();
        meta.put("tool", name());
        meta.put("schoolId", userContext.schoolId().toString());
        return new ToolResult("chart", data, meta);
    }
}
