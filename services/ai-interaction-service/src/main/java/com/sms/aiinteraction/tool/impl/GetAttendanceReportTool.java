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
import java.time.LocalDate;
import java.util.Map;
import java.util.Set;
import org.springframework.stereotype.Component;

@Component
public class GetAttendanceReportTool implements AiTool {
    private final GatewayApiClient gatewayApiClient;
    private final ObjectMapper objectMapper;

    public GetAttendanceReportTool(GatewayApiClient gatewayApiClient, ObjectMapper objectMapper) {
        this.gatewayApiClient = gatewayApiClient;
        this.objectMapper = objectMapper;
    }

    @Override
    public String name() {
        return "getAttendanceReport";
    }

    @Override
    public ToolDescriptor descriptor() {
        ObjectNode schema = objectMapper.createObjectNode();
        schema.put("type", "object");
        ObjectNode props = schema.putObject("properties");
        props.putObject("fromDate").put("type", "string").put("format", "date");
        props.putObject("toDate").put("type", "string").put("format", "date");
        schema.putArray("required").add("fromDate").add("toDate");
        return new ToolDescriptor(name(), "Get attendance summary/overview for the authorized school scope.", schema);
    }

    @Override
    public Set<UserRole> allowedRoles() {
        return Set.of(UserRole.PLATFORM_ADMIN, UserRole.SCHOOL_ADMIN, UserRole.TEACHER, UserRole.PARENT, UserRole.STUDENT, UserRole.STAFF);
    }

    @Override
    public boolean cacheable() {
        return true;
    }

    @Override
    public ToolResult execute(ObjectNode arguments, UserContext userContext) {
        String from = arguments.hasNonNull("fromDate")
                ? arguments.get("fromDate").asText()
                : LocalDate.now().minusDays(30).toString();
        String to = arguments.hasNonNull("toDate")
                ? arguments.get("toDate").asText()
                : LocalDate.now().toString();

        JsonNode overview = gatewayApiClient.get(
                "/api/v1/school-ops/attendance/analytics/overview",
                Map.of("from", from, "to", to),
                userContext.authorization()
        );

        ObjectNode data = objectMapper.createObjectNode();
        data.set("raw", overview);
        data.set("chart", toChart(overview));

        ObjectNode meta = objectMapper.createObjectNode();
        meta.put("fromDate", from);
        meta.put("toDate", to);
        meta.put("tool", name());
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
