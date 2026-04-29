package com.sms.aiinteraction.llm;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.sms.aiinteraction.security.UserContext;
import com.sms.aiinteraction.security.UserRole;
import com.sms.aiinteraction.tool.ToolCall;
import com.sms.aiinteraction.tool.ToolDescriptor;
import java.time.LocalDate;
import java.util.List;
import java.util.Set;
import java.util.UUID;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

class RuleBasedPlanningEngineTest {
    private final RuleBasedPlanningEngine engine = new RuleBasedPlanningEngine(new ObjectMapper());

    @Test
    void selectsSubscriptionPlansForPublicPricingQuestion() {
        List<ToolCall> calls = engine.plan(
                "Compare your pricing plans for my school",
                user(UserRole.PUBLIC_ANONYMOUS),
                descriptors("getSubscriptionPlans", "getPublicPlatformInfo"),
                List.of()
        );

        assertEquals(1, calls.size());
        assertEquals("getSubscriptionPlans", calls.getFirst().toolName());
    }

    @Test
    void infersThisMonthAttendanceRange() {
        List<ToolCall> calls = engine.plan(
                "Show attendance trends for this month",
                user(UserRole.SCHOOL_ADMIN),
                descriptors("getAttendanceReport"),
                List.of()
        );

        assertEquals(1, calls.size());
        ToolCall call = calls.getFirst();
        assertEquals("getAttendanceReport", call.toolName());
        assertEquals(LocalDate.now().withDayOfMonth(1).toString(), call.arguments().path("fromDate").asText());
        assertEquals(LocalDate.now().toString(), call.arguments().path("toDate").asText());
    }

    @Test
    void buildsMultiToolDashboardPlan() {
        List<ToolCall> calls = engine.plan(
                "Give me a school dashboard overview",
                user(UserRole.SCHOOL_ADMIN),
                descriptors("getSchoolDashboard", "getAttendanceReport", "getFeeDefaulters", "getTransportOverview"),
                List.of()
        );

        Set<String> toolNames = calls.stream().map(ToolCall::toolName).collect(java.util.stream.Collectors.toSet());
        assertTrue(toolNames.contains("getSchoolDashboard"));
        assertTrue(toolNames.contains("getAttendanceReport"));
        assertTrue(toolNames.contains("getFeeDefaulters"));
        assertTrue(toolNames.contains("getTransportOverview"));
        assertFalse(calls.isEmpty());
    }

    @Test
    void extractsAnnouncementIntentAndAudience() {
        List<ToolCall> calls = engine.plan(
                "Create announcement for parents about PTM tomorrow at 10 AM",
                user(UserRole.TEACHER),
                descriptors("createAnnouncement"),
                List.of()
        );

        assertEquals(1, calls.size());
        ToolCall call = calls.getFirst();
        assertEquals("createAnnouncement", call.toolName());
        assertEquals("PARENT", call.arguments().path("targetAudience").asText());
        assertTrue(call.arguments().path("content").asText().contains("PTM"));
    }

    private List<ToolDescriptor> descriptors(String... names) {
        return java.util.Arrays.stream(names)
                .map(name -> new ToolDescriptor(name, name + " description", new ObjectMapper().createObjectNode()))
                .toList();
    }

    private UserContext user(UserRole role) {
        return new UserContext(
                UUID.fromString("4f2f9e5a-43e0-4fb6-8652-2a9f2c819c83"),
                UUID.fromString("f56f6db0-cf66-4f80-b9d5-b96d95f73ff0"),
                UUID.fromString("412c9f44-c2d4-4ac8-b6c0-df1ef170f6f2"),
                "user@example.com",
                role.name(),
                role,
                "Bearer fake",
                "req-rule",
                role == UserRole.PUBLIC_ANONYMOUS ? "guest-1" : null
        );
    }
}
