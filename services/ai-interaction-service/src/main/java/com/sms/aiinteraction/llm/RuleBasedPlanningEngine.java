package com.sms.aiinteraction.llm;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ObjectNode;
import com.sms.aiinteraction.security.UserContext;
import com.sms.aiinteraction.tool.ToolCall;
import com.sms.aiinteraction.tool.ToolDescriptor;
import java.time.LocalDate;
import java.util.List;
import java.util.Locale;
import java.util.Optional;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import org.springframework.stereotype.Component;

@Component
public class RuleBasedPlanningEngine implements LlmPlanningEngine {
    private static final Pattern UUID_PATTERN = Pattern.compile(
            "\\b[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[1-5][0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}\\b"
    );
    private static final Pattern DATE_PATTERN = Pattern.compile("\\b\\d{4}-\\d{2}-\\d{2}\\b");

    private final ObjectMapper objectMapper;

    public RuleBasedPlanningEngine(ObjectMapper objectMapper) {
        this.objectMapper = objectMapper;
    }

    @Override
    public Optional<ToolCall> plan(String message, UserContext userContext, List<ToolDescriptor> tools) {
        String normalized = message == null ? "" : message.trim().toLowerCase(Locale.ROOT);
        if (normalized.isBlank()) return Optional.empty();

        if (containsAny(normalized, "attendance", "absent", "present")) {
            return Optional.of(new ToolCall("getAttendanceReport", attendanceArgs(normalized), "rule_based:attendance"));
        }
        if (containsAny(normalized, "dashboard", "kpi", "school summary", "overall summary")) {
            return Optional.of(new ToolCall("getSchoolDashboard", objectMapper.createObjectNode(), "rule_based:dashboard"));
        }
        if (containsAny(normalized, "enrollment trend", "enrolment trend", "admission trend", "admissions trend", "student trend", "enrollment over time", "trend", "over time")) {
            return Optional.of(new ToolCall("getEnrollmentTrend", trendArgs(normalized), "rule_based:enrollment_trend"));
        }
        if (containsAny(normalized, "announcement", "announcements", "notice", "notices", "broadcast")) {
            if (containsAny(normalized, "create", "publish", "post")) {
                return Optional.of(new ToolCall("createAnnouncement", announcementArgs(message), "rule_based:create_announcement"));
            }
            return Optional.of(new ToolCall("getAnnouncements", objectMapper.createObjectNode(), "rule_based:announcements"));
        }
        if (containsAny(normalized, "fee", "fees", "defaulter", "dues", "due")) {
            return Optional.of(new ToolCall("getFeeDefaulters", objectMapper.createObjectNode(), "rule_based:finance"));
        }
        if (containsAny(normalized, "library", "book", "resources")) {
            return Optional.of(new ToolCall("getLibraryResources", objectMapper.createObjectNode(), "rule_based:library"));
        }
        if (containsAny(normalized, "homework", "assignment due", "assignments due")) {
            return Optional.of(new ToolCall("getHomeworkSummary", objectMapper.createObjectNode(), "rule_based:homework"));
        }
        if (containsAny(normalized, "exam", "result summary", "grade distribution")) {
            return Optional.of(new ToolCall("getExamResultsSummary", objectMapper.createObjectNode(), "rule_based:results"));
        }
        if (containsAny(normalized, "transport", "bus", "route", "pickup", "drop")) {
            return Optional.of(new ToolCall("getTransportOverview", objectMapper.createObjectNode(), "rule_based:transport"));
        }
        if (containsAny(normalized, "performance", "result", "marks", "report card", "student")) {
            return Optional.of(new ToolCall("getStudentPerformance", studentArgs(normalized), "rule_based:student_performance"));
        }
        if (containsAny(normalized, "notify", "notification", "announce", "announcement", "message parents")) {
            return Optional.of(new ToolCall("sendNotification", notificationArgs(message), "rule_based:notification"));
        }
        if (containsAny(normalized, "leave", "time off", "vacation", "absence request")) {
            if (containsAny(normalized, "approve leave", "reject leave", "leave approval")) {
                return Optional.of(new ToolCall("reviewLeaveRequest", leaveReviewArgs(message), "rule_based:leave_review"));
            }
            if (containsAny(normalized, "apply leave", "request leave", "create leave")) {
                return Optional.of(new ToolCall("createLeaveRequest", leaveCreateArgs(normalized), "rule_based:leave_create"));
            }
            if (containsAny(normalized, "my leave", "my leaves")) {
                return Optional.of(new ToolCall("getMyLeaveRequests", objectMapper.createObjectNode(), "rule_based:my_leaves"));
            }
            return Optional.of(new ToolCall("getLeaveRequests", leaveListArgs(normalized), "rule_based:leave_list"));
        }
        if (containsAny(normalized, "message threads", "threads", "inbox", "messages")) {
            return Optional.of(new ToolCall("getMessageThreads", objectMapper.createObjectNode(), "rule_based:threads"));
        }
        if (containsAny(normalized, "forum leaderboard", "leaderboard", "top contributors")) {
            return Optional.of(new ToolCall("getForumLeaderboard", leaderboardArgs(normalized), "rule_based:forum_leaderboard"));
        }
        if (containsAny(normalized, "school counts", "how many schools", "total schools", "onboarded schools", "school list")) {
            return Optional.of(new ToolCall("getPlatformSchoolsOverview", objectMapper.createObjectNode(), "rule_based:schools_overview"));
        }

        return Optional.empty();
    }

    private ObjectNode trendArgs(String message) {
        ObjectNode args = objectMapper.createObjectNode();
        // Simple heuristic: if user mentions "6 months" / "12 months", capture first integer.
        Matcher m = Pattern.compile("\\b(\\d{1,2})\\s*(month|months)\\b").matcher(message);
        if (m.find()) {
            try {
                args.put("months", Integer.parseInt(m.group(1)));
            } catch (Exception ignored) {
                // ignore
            }
        }
        return args;
    }

    private ObjectNode attendanceArgs(String message) {
        ObjectNode args = objectMapper.createObjectNode();
        Matcher dateMatcher = DATE_PATTERN.matcher(message);
        if (dateMatcher.find()) {
            args.put("fromDate", dateMatcher.group());
            if (dateMatcher.find()) {
                args.put("toDate", dateMatcher.group());
            }
        }
        if (!args.has("fromDate")) {
            args.put("fromDate", LocalDate.now().minusDays(30).toString());
        }
        if (!args.has("toDate")) {
            args.put("toDate", LocalDate.now().toString());
        }
        return args;
    }

    private ObjectNode studentArgs(String message) {
        ObjectNode args = objectMapper.createObjectNode();
        Matcher matcher = UUID_PATTERN.matcher(message);
        if (matcher.find()) {
            args.put("studentId", matcher.group());
        }
        return args;
    }

    private ObjectNode notificationArgs(String message) {
        ObjectNode args = objectMapper.createObjectNode();
        args.put("title", "AI Assistant Notification");
        args.put("message", message);
        Matcher matcher = UUID_PATTERN.matcher(message);
        if (matcher.find()) {
            args.put("recipientUserId", matcher.group());
        }
        return args;
    }

    private ObjectNode announcementArgs(String message) {
        ObjectNode args = objectMapper.createObjectNode();
        args.put("title", "AI Assistant Announcement");
        args.put("content", message);
        args.put("targetAudience", "ALL");
        return args;
    }

    private ObjectNode leaveCreateArgs(String normalizedMessage) {
        ObjectNode args = objectMapper.createObjectNode();
        args.put("leaveType", "SICK");
        args.put("startDate", LocalDate.now().toString());
        args.put("endDate", LocalDate.now().plusDays(1).toString());
        args.put("reason", normalizedMessage);
        return args;
    }

    private ObjectNode leaveReviewArgs(String message) {
        ObjectNode args = objectMapper.createObjectNode();
        Matcher idMatcher = UUID_PATTERN.matcher(message);
        if (idMatcher.find()) {
            args.put("leaveRequestId", idMatcher.group());
        }
        String lowered = message.toLowerCase(Locale.ROOT);
        args.put("decision", lowered.contains("reject") ? "reject" : "approve");
        args.put("note", "Reviewed via AI assistant");
        return args;
    }

    private ObjectNode leaveListArgs(String normalizedMessage) {
        ObjectNode args = objectMapper.createObjectNode();
        if (containsAny(normalizedMessage, "pending")) {
            args.put("status", "PENDING");
        } else if (containsAny(normalizedMessage, "approved")) {
            args.put("status", "APPROVED");
        } else if (containsAny(normalizedMessage, "rejected")) {
            args.put("status", "REJECTED");
        }
        return args;
    }

    private ObjectNode leaderboardArgs(String normalizedMessage) {
        ObjectNode args = objectMapper.createObjectNode();
        if (containsAny(normalizedMessage, "daily", "today")) {
            args.put("period", "DAILY");
        } else if (containsAny(normalizedMessage, "monthly", "month")) {
            args.put("period", "MONTHLY");
        } else {
            args.put("period", "WEEKLY");
        }
        return args;
    }

    private boolean containsAny(String value, String... tokens) {
        for (String token : tokens) {
            if (value.contains(token)) return true;
        }
        return false;
    }
}
