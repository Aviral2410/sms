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
public class GetForumLeaderboardTool implements AiTool {
    private final GatewayApiClient gatewayApiClient;
    private final ObjectMapper objectMapper;

    public GetForumLeaderboardTool(GatewayApiClient gatewayApiClient, ObjectMapper objectMapper) {
        this.gatewayApiClient = gatewayApiClient;
        this.objectMapper = objectMapper;
    }

    @Override
    public String name() {
        return "getForumLeaderboard";
    }

    @Override
    public ToolDescriptor descriptor() {
        ObjectNode schema = objectMapper.createObjectNode();
        schema.put("type", "object");
        ObjectNode props = schema.putObject("properties");
        props.putObject("period")
                .put("type", "string")
                .put("description", "Leaderboard period: DAILY, WEEKLY, MONTHLY.");
        return new ToolDescriptor(name(), "Get forum leaderboard for the school community.", schema);
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
        String period = arguments.hasNonNull("period") ? arguments.get("period").asText() : "WEEKLY";
        JsonNode leaderboard = gatewayApiClient.get(
                "/api/v1/school-ops/forum/leaderboard",
                Map.of("schoolId", userContext.schoolId().toString(), "period", period),
                userContext.authorization()
        );

        ArrayNode points = objectMapper.createArrayNode();
        JsonNode entries = leaderboard.path("entries");
        if (entries.isArray()) {
            for (JsonNode entry : entries) {
                ObjectNode point = points.addObject();
                point.put("name", firstNonBlank(
                        entry.path("name").asText(""),
                        entry.path("displayName").asText(""),
                        entry.path("userName").asText(""),
                        entry.path("userId").asText("Unknown")
                ));
                point.put("score", entry.path("score").asDouble(0.0));
            }
        }

        ObjectNode chart = objectMapper.createObjectNode();
        chart.put("xKey", "name");
        chart.put("yKey", "score");
        chart.set("points", points);

        ObjectNode data = objectMapper.createObjectNode();
        data.set("raw", leaderboard);
        data.set("chart", chart);
        data.put("totalEntries", points.size());

        ObjectNode meta = objectMapper.createObjectNode();
        meta.put("tool", name());
        meta.put("period", period);
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
