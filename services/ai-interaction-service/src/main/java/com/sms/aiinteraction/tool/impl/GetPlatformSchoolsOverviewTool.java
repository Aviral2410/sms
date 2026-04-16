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
import java.time.ZonedDateTime;
import java.time.format.DateTimeFormatter;
import java.util.Collections;
import java.util.Map;
import java.util.Set;
import java.util.TreeMap;
import org.springframework.stereotype.Component;

@Component
public class GetPlatformSchoolsOverviewTool implements AiTool {
    private final GatewayApiClient gatewayApiClient;
    private final ObjectMapper objectMapper;

    public GetPlatformSchoolsOverviewTool(GatewayApiClient gatewayApiClient, ObjectMapper objectMapper) {
        this.gatewayApiClient = gatewayApiClient;
        this.objectMapper = objectMapper;
    }

    @Override
    public String name() {
        return "getPlatformSchoolsOverview";
    }

    @Override
    public ToolDescriptor descriptor() {
        ObjectNode schema = objectMapper.createObjectNode();
        schema.put("type", "object");
        schema.putObject("properties");
        return new ToolDescriptor(name(), "Retrieve count of onboarded schools and growth metrics across the platform.", schema);
    }

    @Override
    public Set<UserRole> allowedRoles() {
        return Set.of(UserRole.PLATFORM_ADMIN);
    }

    @Override
    public boolean cacheable() {
        return true;
    }

    @Override
    public ToolResult execute(ObjectNode arguments, UserContext userContext) {
        // Fetch all schools from the onboarding service
        JsonNode schoolsResponse = gatewayApiClient.get(
                "/api/v1/onboarding/schools",
                Collections.emptyMap(),
                userContext.authorization()
        );

        int totalCount = 0;
        Map<String, Integer> growthByMonth = new TreeMap<>();
        DateTimeFormatter monthFormatter = DateTimeFormatter.ofPattern("yyyy-MM");

        if (schoolsResponse != null && schoolsResponse.isArray()) {
            totalCount = schoolsResponse.size();
            for (JsonNode school : schoolsResponse) {
                String createdAtStr = school.path("createdAt").asText(null);
                if (createdAtStr != null) {
                    try {
                        String month;
                        if (createdAtStr.contains("Z") || createdAtStr.contains("+")) {
                            month = ZonedDateTime.parse(createdAtStr).format(monthFormatter);
                        } else {
                            // Fallback for LocalDateTime format
                            month = java.time.LocalDateTime.parse(createdAtStr).format(monthFormatter);
                        }
                        growthByMonth.put(month, growthByMonth.getOrDefault(month, 0) + 1);
                    } catch (Exception ex) {
                        // Silent fallback - still count the school but don't group by month
                    }
                }
            }
        }

        ObjectNode chartData = objectMapper.createObjectNode();
        chartData.put("xKey", "month");
        chartData.put("yKey", "count");
        ArrayNode points = chartData.putArray("points");

        growthByMonth.forEach((month, count) -> {
            ObjectNode point = points.addObject();
            point.put("month", month);
            point.put("count", count);
        });

        ObjectNode data = objectMapper.createObjectNode();
        data.put("text", "There are currently " + totalCount + " schools onboarded on the platform.");
        data.put("totalSchools", totalCount);
        data.set("chart", chartData);
        data.set("schools", schoolsResponse != null ? schoolsResponse : objectMapper.createArrayNode());

        ObjectNode meta = objectMapper.createObjectNode();
        meta.put("tool", name());

        return new ToolResult("chart", data, meta);
    }
}
