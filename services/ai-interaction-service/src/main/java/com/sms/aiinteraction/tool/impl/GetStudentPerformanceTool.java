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
import java.util.Map;
import java.util.Set;
import java.util.UUID;
import org.springframework.stereotype.Component;

@Component
public class GetStudentPerformanceTool implements AiTool {
    private final GatewayApiClient gatewayApiClient;
    private final ObjectMapper objectMapper;

    public GetStudentPerformanceTool(GatewayApiClient gatewayApiClient, ObjectMapper objectMapper) {
        this.gatewayApiClient = gatewayApiClient;
        this.objectMapper = objectMapper;
    }

    @Override
    public String name() {
        return "getStudentPerformance";
    }

    @Override
    public ToolDescriptor descriptor() {
        ObjectNode schema = objectMapper.createObjectNode();
        schema.put("type", "object");
        ObjectNode props = schema.putObject("properties");
        props.putObject("studentId").put("type", "string").put("format", "uuid");
        return new ToolDescriptor(name(), "Fetch student performance analytics for authorized student scope.", schema);
    }

    @Override
    public Set<UserRole> allowedRoles() {
        return Set.of(UserRole.PLATFORM_ADMIN, UserRole.SCHOOL_ADMIN, UserRole.TEACHER, UserRole.PARENT, UserRole.STUDENT);
    }

    @Override
    public boolean cacheable() {
        return true;
    }

    @Override
    public ToolResult execute(ObjectNode arguments, UserContext userContext) {
        UUID studentId = userContext.userId();
        if (arguments.hasNonNull("studentId")) {
            studentId = UUID.fromString(arguments.get("studentId").asText());
        }

        JsonNode performance = gatewayApiClient.get(
                "/api/v1/school-ops/students/" + studentId + "/analytics",
                Map.of("schoolId", userContext.schoolId().toString()),
                userContext.authorization()
        );

        ObjectNode data = objectMapper.createObjectNode();
        data.set("raw", performance);
        data.set("chart", toChart(performance));

        ObjectNode meta = objectMapper.createObjectNode();
        meta.put("tool", name());
        meta.put("studentId", studentId.toString());
        return new ToolResult("chart", data, meta);
    }

    private ObjectNode toChart(JsonNode source) {
        ObjectNode chart = objectMapper.createObjectNode();
        chart.put("xKey", "metric");
        chart.put("yKey", "value");
        var points = chart.putArray("points");
        if (source != null && source.isObject()) {
            source.fields().forEachRemaining(entry -> {
                JsonNode value = entry.getValue();
                if (value != null && value.isNumber()) {
                    ObjectNode p = points.addObject();
                    p.put("metric", entry.getKey());
                    p.put("value", value.asDouble());
                }
            });
        }
        return chart;
    }
}
