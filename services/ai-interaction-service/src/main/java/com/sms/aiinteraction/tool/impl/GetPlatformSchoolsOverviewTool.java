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
import java.util.stream.Collectors;
import java.util.stream.StreamSupport;
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
        ObjectNode props = schema.putObject("properties");
        
        props.putObject("lastMonths").put("type", "integer").put("description", "Last X months of growth.");
        props.putObject("status").put("type", "string").put("description", "Status filter.");
        props.putObject("state").put("type", "string").put("description", "State filter.");
        props.putObject("region").put("type", "string").put("description", "Region filter.");
        props.putObject("chartType").put("type", "string").put("description", "Recommendation: 'chart_bar', 'chart_line', or 'chart_pie'.");

        return new ToolDescriptor(name(), "Comprehensive platform analytics including schools growth, status distribution, and regional metrics.", schema);
    }

    @Override
    public Set<UserRole> allowedRoles() {
        return Set.of(UserRole.PLATFORM_ADMIN, UserRole.ROLE_ADMIN);
    }

    @Override
    public boolean cacheable() {
        return true;
    }

    @Override
    public ToolResult execute(ObjectNode arguments, UserContext userContext) {
        JsonNode schoolsResponse = gatewayApiClient.get("/api/v1/onboarding/schools", Collections.emptyMap(), userContext.authorization());
        
        String statusFilter = arguments.path("status").asText(null);
        String stateFilter = arguments.path("state").asText(null);
        int monthsLimit = arguments.path("lastMonths").asInt(0);
        String chartTypeSpec = arguments.path("chartType").asText("chart_bar");
        if (!chartTypeSpec.startsWith("chart_")) chartTypeSpec = "chart_" + chartTypeSpec;

        ZonedDateTime now = ZonedDateTime.now();
        var filtered = StreamSupport.stream(schoolsResponse.spliterator(), false)
            .filter(s -> statusFilter == null || statusFilter.equalsIgnoreCase(s.path("status").asText("")))
            .filter(s -> stateFilter == null || stateFilter.equalsIgnoreCase(s.path("state").asText("")))
            .filter(s -> {
                if (monthsLimit <= 0) return true;
                try { return ZonedDateTime.parse(s.path("createdAt").asText()).isAfter(now.minusMonths(monthsLimit)); }
                catch (Exception e) { return true; }
            }).collect(Collectors.toList());

        long activeCount = filtered.stream().filter(s -> "ACTIVE".equalsIgnoreCase(s.path("status").asText())).count();
        long pendingCount = filtered.stream().filter(s -> "PENDING".equalsIgnoreCase(s.path("status").asText())).count();
        
        Map<String, Integer> timeMap = new TreeMap<>();
        DateTimeFormatter fmt = DateTimeFormatter.ofPattern("yyyy-MM");
        filtered.forEach(s -> {
            try { String m = ZonedDateTime.parse(s.path("createdAt").asText()).format(fmt); timeMap.put(m, timeMap.getOrDefault(m, 0) + 1); } catch(Exception e){}
        });

        ObjectNode response = objectMapper.createObjectNode();
        response.put("title", "Platform Intelligence: Schools Onboarding");
        response.put("view", "mixed_dashboard");
        response.put("summary", "Analysis of " + filtered.size() + " schools matching criteria. Current health: " + 
                  (pendingCount > 5 ? "Action required on " + pendingCount + " pending registrations." : "Stable onboarding flow."));

        ArrayNode components = response.putArray("components");
        
        // KPI Cards
        components.addObject().put("type", "kpi_card").put("title", "Total Matches").put("value", String.valueOf(filtered.size())).put("color", "emerald");
        components.addObject().put("type", "kpi_card").put("title", "Active Schools").put("value", String.valueOf(activeCount)).put("color", "sky");
        components.addObject().put("type", "kpi_card").put("title", "Pending Verification").put("value", String.valueOf(pendingCount)).put("color", "amber");

        // Dynamic Chart
        ObjectNode chart = components.addObject();
        chart.put("type", chartTypeSpec);
        chart.put("title", "Growth Distribution");
        ArrayNode labels = chart.putArray("labels");
        ArrayNode series = chart.putArray("series");
        timeMap.forEach((l, v) -> { labels.add(l); series.add(v); });

        // Insights
        ArrayNode insights = response.putArray("insights");
        insights.add("Onboarding velocity has " + (timeMap.size() > 1 ? "shifted" : "remained steady") + " over the selected period.");
        if (pendingCount > 0) insights.add("There are " + pendingCount + " schools awaiting administrative approval.");
        if (stateFilter != null) insights.add("Regional density in " + stateFilter + " indicates strong market penetration.");

        ObjectNode meta = objectMapper.createObjectNode();
        meta.put("intent", "PLATFORM_ANALYTICS");

        return new ToolResult("smart_ui", response, meta);
    }
}
