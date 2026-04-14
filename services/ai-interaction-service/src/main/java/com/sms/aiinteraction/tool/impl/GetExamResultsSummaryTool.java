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
public class GetExamResultsSummaryTool implements AiTool {
    private final GatewayApiClient gatewayApiClient;
    private final ObjectMapper objectMapper;

    public GetExamResultsSummaryTool(GatewayApiClient gatewayApiClient, ObjectMapper objectMapper) {
        this.gatewayApiClient = gatewayApiClient;
        this.objectMapper = objectMapper;
    }

    @Override
    public String name() {
        return "getExamResultsSummary";
    }

    @Override
    public ToolDescriptor descriptor() {
        ObjectNode schema = objectMapper.createObjectNode();
        schema.put("type", "object");
        schema.putObject("properties");
        return new ToolDescriptor(name(), "Fetch exam results and compute grade distribution chart.", schema);
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
        JsonNode results = gatewayApiClient.get(
                "/api/v1/school-ops/results",
                Map.of("schoolId", userContext.schoolId().toString()),
                userContext.authorization()
        );

        Map<String, Integer> distribution = new java.util.TreeMap<>();
        if (results.isArray()) {
            for (JsonNode row : results) {
                String grade = row.path("grade").asText("");
                if (grade.isBlank()) {
                    double pct = row.path("percentage").asDouble(-1);
                    grade = gradeFromPercentage(pct);
                }
                distribution.merge(grade.isBlank() ? "UNKNOWN" : grade, 1, Integer::sum);
            }
        }

        ObjectNode chart = objectMapper.createObjectNode();
        chart.put("xKey", "grade");
        chart.put("yKey", "count");
        ArrayNode points = chart.putArray("points");
        distribution.forEach((grade, count) -> {
            ObjectNode p = points.addObject();
            p.put("grade", grade);
            p.put("count", count);
        });

        ObjectNode data = objectMapper.createObjectNode();
        data.set("rows", results);
        data.set("chart", chart);
        data.put("total", results.isArray() ? results.size() : 0);

        ObjectNode meta = objectMapper.createObjectNode();
        meta.put("tool", name());
        return new ToolResult("chart", data, meta);
    }

    private String gradeFromPercentage(double percentage) {
        if (percentage < 0) return "";
        if (percentage >= 90) return "A";
        if (percentage >= 80) return "B";
        if (percentage >= 70) return "C";
        if (percentage >= 60) return "D";
        return "E";
    }
}
