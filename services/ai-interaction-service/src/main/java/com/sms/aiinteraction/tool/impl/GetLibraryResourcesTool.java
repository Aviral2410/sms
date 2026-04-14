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
import java.util.TreeMap;
import org.springframework.stereotype.Component;

@Component
public class GetLibraryResourcesTool implements AiTool {
    private final GatewayApiClient gatewayApiClient;
    private final ObjectMapper objectMapper;

    public GetLibraryResourcesTool(GatewayApiClient gatewayApiClient, ObjectMapper objectMapper) {
        this.gatewayApiClient = gatewayApiClient;
        this.objectMapper = objectMapper;
    }

    @Override
    public String name() {
        return "getLibraryResources";
    }

    @Override
    public ToolDescriptor descriptor() {
        ObjectNode schema = objectMapper.createObjectNode();
        schema.put("type", "object");
        schema.putObject("properties");
        return new ToolDescriptor(name(), "List library resources and summarize by type/category.", schema);
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
        JsonNode resources = gatewayApiClient.get(
                "/api/v1/school-ops/library",
                Map.of("schoolId", userContext.schoolId().toString()),
                userContext.authorization()
        );

        var byType = new TreeMap<String, Integer>();
        if (resources.isArray()) {
            for (JsonNode row : resources) {
                String type = firstNonBlank(
                        row.path("resourceType").asText(""),
                        row.path("type").asText(""),
                        row.path("category").asText("")
                );
                byType.merge(type.isBlank() ? "UNKNOWN" : type, 1, Integer::sum);
            }
        }

        ObjectNode chart = objectMapper.createObjectNode();
        chart.put("xKey", "type");
        chart.put("yKey", "count");
        ArrayNode points = chart.putArray("points");
        byType.forEach((type, count) -> {
            ObjectNode point = points.addObject();
            point.put("type", type);
            point.put("count", count);
        });

        ObjectNode data = objectMapper.createObjectNode();
        data.set("rows", resources);
        data.set("chart", chart);
        data.put("total", resources.isArray() ? resources.size() : 0);

        ObjectNode meta = objectMapper.createObjectNode();
        meta.put("tool", name());
        meta.put("schoolId", userContext.schoolId().toString());
        return new ToolResult("chart", data, meta);
    }

    private String firstNonBlank(String... values) {
        for (String value : values) {
            if (value != null && !value.isBlank()) {
                return value.trim();
            }
        }
        return "";
    }
}
