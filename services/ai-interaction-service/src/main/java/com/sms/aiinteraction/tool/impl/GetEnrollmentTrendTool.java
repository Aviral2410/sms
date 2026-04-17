package com.sms.aiinteraction.tool.impl;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ArrayNode;
import com.fasterxml.jackson.databind.node.ObjectNode;
import com.sms.aiinteraction.security.UserContext;
import com.sms.aiinteraction.security.UserRole;
import com.sms.aiinteraction.service.GatewayApiClient;
import com.sms.aiinteraction.service.TrendNarrationService;
import com.sms.aiinteraction.tool.AiTool;
import com.sms.aiinteraction.tool.ToolDescriptor;
import com.sms.aiinteraction.tool.ToolResult;
import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.Set;
import org.springframework.stereotype.Component;

@Component
public class GetEnrollmentTrendTool implements AiTool {
    private static final DateTimeFormatter MONTH = DateTimeFormatter.ofPattern("yyyy-MM");

    private final GatewayApiClient gatewayApiClient;
    private final TrendNarrationService narrationService;
    private final ObjectMapper objectMapper;

    public GetEnrollmentTrendTool(
            GatewayApiClient gatewayApiClient,
            TrendNarrationService narrationService,
            ObjectMapper objectMapper
    ) {
        this.gatewayApiClient = gatewayApiClient;
        this.narrationService = narrationService;
        this.objectMapper = objectMapper;
    }

    @Override
    public String name() {
        return "getEnrollmentTrend";
    }

    @Override
    public ToolDescriptor descriptor() {
        ObjectNode schema = objectMapper.createObjectNode();
        schema.put("type", "object");
        ObjectNode props = schema.putObject("properties");
        props.putObject("months")
                .put("type", "integer")
                .put("minimum", 3)
                .put("maximum", 24)
                .put("description", "Number of months to include in the trend.");
        return new ToolDescriptor(name(), "Show enrollment/admissions trend over time with multiple charts and a summary.", schema);
    }

    @Override
    public Set<UserRole> allowedRoles() {
        return Set.of(UserRole.PLATFORM_ADMIN, UserRole.SCHOOL_ADMIN, UserRole.TEACHER);
    }

    @Override
    public boolean cacheable() {
        return true;
    }

    @Override
    public ToolResult execute(ObjectNode arguments, UserContext userContext) {
        int months = 12;
        if (arguments != null && arguments.hasNonNull("months")) {
            months = Math.max(3, Math.min(24, arguments.path("months").asInt(12)));
        }

        JsonNode admissions = gatewayApiClient.get(
                "/api/v1/school-ops/admissions",
                Map.of(),
                userContext.authorization()
        );

        LocalDate start = LocalDate.now().minusMonths(months - 1L).withDayOfMonth(1);
        Map<String, Integer> byMonth = new LinkedHashMap<>();
        for (int i = 0; i < months; i++) {
            byMonth.put(start.plusMonths(i).format(MONTH), 0);
        }

        int total = 0;
        if (admissions != null && admissions.isArray()) {
            for (JsonNode row : admissions) {
                String createdAt = row.path("createdAt").asText(null);
                LocalDate d = parseDate(createdAt);
                if (d == null) continue;
                String key = d.withDayOfMonth(1).format(MONTH);
                if (!byMonth.containsKey(key)) continue;
                byMonth.put(key, byMonth.get(key) + 1);
                total++;
            }
        }

        // this month metrics
        String currentMonth = LocalDate.now().withDayOfMonth(1).format(MONTH);
        int thisMonth = byMonth.getOrDefault(currentMonth, 0);
        double avg = byMonth.isEmpty() ? 0 : byMonth.values().stream().mapToInt(Integer::intValue).average().orElse(0);

        // Chart 1: monthly admissions (bar)
        ObjectNode chartMonthly = objectMapper.createObjectNode();
        chartMonthly.put("chartType", "bar");
        chartMonthly.put("title", "New admissions by month");
        chartMonthly.put("xKey", "month");
        chartMonthly.put("yKey", "count");
        ArrayNode monthlyPoints = chartMonthly.putArray("points");
        byMonth.forEach((month, count) -> monthlyPoints.addObject().put("month", month).put("count", count));

        // Chart 2: cumulative (line)
        ObjectNode chartCumulative = objectMapper.createObjectNode();
        chartCumulative.put("chartType", "line");
        chartCumulative.put("title", "Cumulative admissions");
        chartCumulative.put("xKey", "month");
        chartCumulative.put("yKey", "total");
        ArrayNode cumulativePoints = chartCumulative.putArray("points");
        int running = 0;
        for (Map.Entry<String, Integer> entry : byMonth.entrySet()) {
            running += entry.getValue();
            cumulativePoints.addObject().put("month", entry.getKey()).put("total", running);
        }

        // Cards
        ObjectNode cards = objectMapper.createObjectNode();
        cards.put("type", "cards");
        cards.put("title", "Enrollment at a glance");
        ArrayNode items = cards.putArray("items");
        items.addObject().put("label", "Admissions (period)").put("value", total);
        items.addObject().put("label", "This month").put("value", thisMonth);
        items.addObject().put("label", "Avg / month").put("value", Math.round(avg * 10.0) / 10.0);

        // Widgets (2-3 charts + cards)
        ArrayNode widgets = objectMapper.createArrayNode();
        widgets.add(cards);
        widgets.add(chartMonthly);
        widgets.add(chartCumulative);

        ObjectNode trend = objectMapper.createObjectNode();
        trend.put("months", months);
        trend.put("totalAdmissions", total);
        trend.put("thisMonthAdmissions", thisMonth);
        trend.put("avgAdmissionsPerMonth", Math.round(avg * 10.0) / 10.0);
        trend.set("monthly", monthlyPoints);
        trend.set("cumulative", cumulativePoints);

        String question = "Show enrollment trend";
        String summary = narrationService.summarizeEnrollmentTrend(question, trend);

        ObjectNode data = objectMapper.createObjectNode();
        data.put("text", summary);
        data.set("trend", trend);
        data.set("widgets", widgets);
        // Backward compatible single-chart field (existing UI expects chart sometimes)
        ObjectNode legacyChart = objectMapper.createObjectNode();
        legacyChart.put("xKey", "month");
        legacyChart.put("yKey", "count");
        ArrayNode legacyPoints = legacyChart.putArray("points");
        byMonth.forEach((month, count) -> legacyPoints.addObject().put("month", month).put("count", count));
        data.set("chart", legacyChart);

        ObjectNode meta = objectMapper.createObjectNode();
        meta.put("tool", name());
        meta.put("intent", "enrollment_trend");

        return new ToolResult("chart", data, meta);
    }

    private LocalDate parseDate(String createdAt) {
        if (createdAt == null || createdAt.isBlank()) return null;
        try {
            // ISO instant
            Instant instant = Instant.parse(createdAt);
            return instant.atZone(ZoneId.systemDefault()).toLocalDate();
        } catch (Exception ignored) {
            // fallthrough
        }
        try {
            return LocalDate.parse(createdAt);
        } catch (Exception ignored) {
            return null;
        }
    }
}
