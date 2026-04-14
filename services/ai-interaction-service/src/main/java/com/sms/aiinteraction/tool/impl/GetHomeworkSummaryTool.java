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
public class GetHomeworkSummaryTool implements AiTool {
    private final GatewayApiClient gatewayApiClient;
    private final ObjectMapper objectMapper;

    public GetHomeworkSummaryTool(GatewayApiClient gatewayApiClient, ObjectMapper objectMapper) {
        this.gatewayApiClient = gatewayApiClient;
        this.objectMapper = objectMapper;
    }

    @Override
    public String name() {
        return "getHomeworkSummary";
    }

    @Override
    public ToolDescriptor descriptor() {
        ObjectNode schema = objectMapper.createObjectNode();
        schema.put("type", "object");
        schema.putObject("properties");
        return new ToolDescriptor(name(), "Fetch homework list and aggregated due-date chart for current school.", schema);
    }

    @Override
    public Set<UserRole> allowedRoles() {
        return Set.of(UserRole.PLATFORM_ADMIN, UserRole.SCHOOL_ADMIN, UserRole.TEACHER, UserRole.STUDENT, UserRole.PARENT);
    }

    @Override
    public boolean cacheable() {
        return true;
    }

    @Override
    public ToolResult execute(ObjectNode arguments, UserContext userContext) {
        JsonNode homework = gatewayApiClient.get(
                "/api/v1/school-ops/homework",
                Map.of("schoolId", userContext.schoolId().toString()),
                userContext.authorization()
        );

        ObjectNode chart = objectMapper.createObjectNode();
        chart.put("xKey", "dueDate");
        chart.put("yKey", "count");
        ArrayNode points = chart.putArray("points");

        java.util.Map<String, Integer> byDueDate = new java.util.TreeMap<>();
        if (homework.isArray()) {
            for (JsonNode row : homework) {
                String due = row.path("dueDate").asText("");
                if (!due.isBlank()) {
                    byDueDate.merge(due, 1, Integer::sum);
                }
            }
        }
        byDueDate.forEach((due, count) -> {
            ObjectNode p = points.addObject();
            p.put("dueDate", due);
            p.put("count", count);
        });

        ObjectNode data = objectMapper.createObjectNode();
        data.set("rows", homework);
        data.set("chart", chart);
        data.put("total", homework.isArray() ? homework.size() : 0);

        ObjectNode meta = objectMapper.createObjectNode();
        meta.put("tool", name());
        meta.put("schoolId", userContext.schoolId().toString());
        return new ToolResult("chart", data, meta);
    }
}
