package com.sms.aiinteraction.llm;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ObjectNode;
import com.sms.aiinteraction.security.UserContext;
import com.sms.aiinteraction.security.UserRole;
import com.sms.aiinteraction.service.ConversationMemoryService.ChatMessageRecord;
import com.sms.aiinteraction.tool.ToolCall;
import com.sms.aiinteraction.tool.ToolDescriptor;
import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.YearMonth;
import java.time.format.DateTimeParseException;
import java.time.temporal.TemporalAdjusters;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Locale;
import java.util.Set;
import java.util.UUID;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import org.springframework.stereotype.Component;

@Component
public class RuleBasedPlanningEngine implements LlmPlanningEngine {
    private static final Pattern ISO_DATE = Pattern.compile("\\b(\\d{4}-\\d{2}-\\d{2})\\b");
    private static final Pattern UUID_PATTERN = Pattern.compile(
            "\\b[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[1-5][0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}\\b"
    );
    private static final Pattern LAST_N_DAYS = Pattern.compile("\\blast\\s+(\\d{1,3})\\s+days?\\b");
    private static final Pattern LAST_N_WEEKS = Pattern.compile("\\blast\\s+(\\d{1,3})\\s+weeks?\\b");
    private static final Pattern LAST_N_MONTHS = Pattern.compile("\\blast\\s+(\\d{1,2})\\s+months?\\b");
    private static final Pattern SCHOOL_CODE = Pattern.compile("\\b(?:code|school code|joining code)\\s*[:#-]?\\s*([A-Z0-9][A-Z0-9-]{2,})\\b", Pattern.CASE_INSENSITIVE);
    private static final int MAX_MULTI_TOOL_CALLS = 4;

    private final ObjectMapper objectMapper;

    public RuleBasedPlanningEngine(ObjectMapper objectMapper) {
        this.objectMapper = objectMapper;
    }

    @Override
    public List<ToolCall> plan(String message, UserContext userContext, List<ToolDescriptor> tools, List<ChatMessageRecord> history) {
        if (message == null || message.isBlank()) {
            return List.of();
        }

        String normalized = normalize(message);
        Set<String> availableTools = new HashSet<>(tools.stream().map(ToolDescriptor::name).toList());
        List<ToolCall> calls = new ArrayList<>();
        Set<String> chosenTools = new LinkedHashSet<>();

        if (isPublicRole(userContext.role())) {
            handlePublicFlows(message, normalized, availableTools, calls, chosenTools);
            if (!calls.isEmpty()) {
                return calls;
            }
        }

        if (userContext.role() == UserRole.PLATFORM_ADMIN) {
            handlePlatformAdminQueries(message, normalized, availableTools, calls, chosenTools);
            if (!calls.isEmpty()) {
                return trim(calls);
            }
        }

        handleAuthenticatedActions(message, normalized, userContext, availableTools, calls, chosenTools);
        if (!calls.isEmpty()) {
            return trim(calls);
        }

        handleOperationalQueries(message, normalized, userContext, availableTools, calls, chosenTools);
        if (!calls.isEmpty()) {
            return trim(calls);
        }

        handleHelpQueries(normalized, availableTools, calls, chosenTools, userContext);
        return trim(calls);
    }

    private void handlePublicFlows(
            String message,
            String normalized,
            Set<String> availableTools,
            List<ToolCall> calls,
            Set<String> chosenTools
    ) {
        if (containsAny(normalized, "pricing", "price", "plans", "subscription", "tier", "compare plan")) {
            addTool(calls, chosenTools, availableTools, "getSubscriptionPlans", arguments(), "Rule-based pricing lookup");
        }

        if (containsAny(normalized, "roadmap", "upcoming", "future", "coming soon")) {
            addTool(calls, chosenTools, availableTools, "getPlatformRoadmap", arguments(), "Rule-based roadmap lookup");
        }

        if (containsAny(normalized, "vision", "mission", "why elevate", "why this platform")) {
            addTool(calls, chosenTools, availableTools, "getPlatformVision", arguments(), "Rule-based vision lookup");
        }

        if (containsAny(normalized, "security", "privacy", "compliance", "data protection")) {
            addTool(calls, chosenTools, availableTools, "getPlatformSecurityInfo", arguments(), "Rule-based security lookup");
        }

        if (containsAny(normalized, "faq", "frequently asked", "common questions")) {
            addTool(calls, chosenTools, availableTools, "getPlatformFaq", arguments(), "Rule-based FAQ lookup");
        }

        if (containsAny(normalized, "support", "contact support", "help desk")) {
            addTool(calls, chosenTools, availableTools, "getSupportInfo", arguments(), "Rule-based support lookup");
        }

        if (containsAny(normalized, "how many schools", "schools overview", "schools onboarded", "platform growth")) {
            ObjectNode args = arguments();
            args.put("lastMonths", extractLastMonths(normalized).orElse(12));
            args.put("chartType", containsAny(normalized, "pie") ? "chart_pie" : containsAny(normalized, "line", "trend", "growth") ? "chart_line" : "chart_bar");
            addTool(calls, chosenTools, availableTools, "getPlatformSchoolsOverview", args, "Rule-based platform growth lookup");
        }

        if (containsAny(normalized, "join school", "joining code", "school code", "school code verification")) {
            extractSchoolCode(message).ifPresent(code -> {
                ObjectNode args = arguments();
                args.put("schoolCode", code);
                addTool(calls, chosenTools, availableTools, "validateSchoolJoiningCode", args, "Rule-based school code validation");
            });
            if (calls.isEmpty()) {
                addTool(calls, chosenTools, availableTools, "getSchoolJoiningInfo", arguments(), "Rule-based school joining help");
            }
        }

        if (calls.isEmpty() && containsAny(normalized, "feature", "module", "what can", "platform do", "tell me about the platform")) {
            addTool(calls, chosenTools, availableTools, "getPublicPlatformInfo", arguments(), "Rule-based platform info lookup");
        }
    }

    private void handleAuthenticatedActions(
            String message,
            String normalized,
            UserContext userContext,
            Set<String> availableTools,
            List<ToolCall> calls,
            Set<String> chosenTools
    ) {
        if (containsAny(normalized, "create announcement", "publish announcement", "announce ", "post announcement")) {
            ObjectNode args = extractAnnouncementArguments(message, normalized);
            if (args != null) {
                addTool(calls, chosenTools, availableTools, "createAnnouncement", args, "Rule-based announcement creation");
                return;
            }
        }

        if (containsAny(normalized, "apply leave", "request leave", "sick leave", "casual leave")) {
            ObjectNode args = extractLeaveRequestArguments(normalized);
            if (args != null) {
                addTool(calls, chosenTools, availableTools, "createLeaveRequest", args, "Rule-based leave creation");
                return;
            }
        }

        if (containsAny(normalized, "approve leave", "reject leave")) {
            extractUuid(normalized).ifPresent(leaveRequestId -> {
                ObjectNode args = arguments();
                args.put("leaveRequestId", leaveRequestId);
                args.put("decision", normalized.contains("reject") ? "reject" : "approve");
                args.put("note", normalized.contains("reject") ? "Rejected via assistant request" : "Approved via assistant request");
                addTool(calls, chosenTools, availableTools, "reviewLeaveRequest", args, "Rule-based leave review");
            });
            if (!calls.isEmpty()) {
                return;
            }
        }

        if (containsAny(normalized, "send notification", "notify parent", "notify student", "send reminder")) {
            ObjectNode args = extractNotificationArguments(message);
            if (args != null) {
                addTool(calls, chosenTools, availableTools, "sendNotification", args, "Rule-based notification send");
                return;
            }
        }

        if (userContext.role() == UserRole.PUBLIC_ANONYMOUS) {
            return;
        }
    }

    private void handlePlatformAdminQueries(
            String message,
            String normalized,
            Set<String> availableTools,
            List<ToolCall> calls,
            Set<String> chosenTools
    ) {
        if (containsAny(normalized, "platform growth", "schools overview", "schools onboarded", "how many schools", "platform schools", "school onboarding and growth")) {
            ObjectNode args = arguments();
            args.put("lastMonths", extractLastMonths(normalized).orElse(12));
            args.put("chartType", containsAny(normalized, "pie") ? "chart_pie" : containsAny(normalized, "line", "trend", "growth") ? "chart_line" : "chart_bar");
            addTool(calls, chosenTools, availableTools, "getPlatformSchoolsOverview", args, "Rule-based platform growth lookup");
            return;
        }

        if (containsAny(normalized, "pending onboarding", "pending approvals", "onboarding queue", "awaiting approval", "schools awaiting approval")) {
            ObjectNode args = arguments();
            args.put("status", "PENDING_REVIEW");
            args.put("lastMonths", extractLastMonths(normalized).orElse(12));
            args.put("chartType", "chart_bar");
            addTool(calls, chosenTools, availableTools, "getPlatformSchoolsOverview", args, "Rule-based onboarding review queue");
            return;
        }
    }

    private void handleOperationalQueries(
            String message,
            String normalized,
            UserContext userContext,
            Set<String> availableTools,
            List<ToolCall> calls,
            Set<String> chosenTools
    ) {
        boolean dashboardLike = containsAny(normalized, "dashboard", "overview", "kpi", "summary", "snapshot");
        boolean wantsAttendance = containsAny(normalized, "attendance", "absent", "present");
        boolean wantsEnrollment = containsAny(normalized, "enrollment", "admission", "admissions");
        boolean wantsHomework = containsAny(normalized, "homework", "assignment");
        boolean wantsExam = containsAny(normalized, "exam", "result", "grades", "marks");
        boolean wantsFees = containsAny(normalized, "fee", "fees", "dues", "defaulter", "defaulters");
        boolean wantsTransport = containsAny(normalized, "transport", "bus", "route", "vehicle");
        boolean wantsLibrary = containsAny(normalized, "library", "books", "resources");
        boolean wantsForum = containsAny(normalized, "forum", "leaderboard", "contributors");
        boolean wantsMessages = containsAny(normalized, "messages", "threads", "inbox", "unread");
        boolean wantsAnnouncements = containsAny(normalized, "announcement", "announcements", "notices");
        boolean wantsLeave = containsAny(normalized, "leave", "leaves", "time off");

        if (dashboardLike || normalized.contains("school status")) {
            addTool(calls, chosenTools, availableTools, "getSchoolDashboard", arguments(), "Rule-based school dashboard");
        }

        if (wantsAttendance) {
            addTool(calls, chosenTools, availableTools, "getAttendanceReport", attendanceArguments(normalized), "Rule-based attendance report");
        }

        if (wantsEnrollment) {
            ObjectNode args = arguments();
            args.put("months", extractLastMonths(normalized).orElse(containsAny(normalized, "quarter") ? 3 : 12));
            addTool(calls, chosenTools, availableTools, "getEnrollmentTrend", args, "Rule-based enrollment trend");
        }

        if (wantsHomework) {
            addTool(calls, chosenTools, availableTools, "getHomeworkSummary", arguments(), "Rule-based homework summary");
        }

        if (wantsExam) {
            extractUuid(normalized)
                    .filter(_id -> containsAny(normalized, "student", "for student", "how is this student"))
                    .ifPresentOrElse(studentId -> {
                        ObjectNode args = arguments();
                        args.put("studentId", studentId);
                        addTool(calls, chosenTools, availableTools, "getStudentPerformance", args, "Rule-based student performance lookup");
                    }, () -> addTool(calls, chosenTools, availableTools, "getExamResultsSummary", arguments(), "Rule-based exam summary"));
        }

        if (wantsFees) {
            addTool(calls, chosenTools, availableTools, "getFeeDefaulters", arguments(), "Rule-based fee defaulter lookup");
        }

        if (wantsTransport) {
            addTool(calls, chosenTools, availableTools, "getTransportOverview", arguments(), "Rule-based transport overview");
        }

        if (wantsLibrary) {
            addTool(calls, chosenTools, availableTools, "getLibraryResources", arguments(), "Rule-based library overview");
        }

        if (wantsForum) {
            ObjectNode args = arguments();
            args.put("period", normalized.contains("month") ? "MONTHLY" : normalized.contains("all time") ? "ALL_TIME" : "WEEKLY");
            addTool(calls, chosenTools, availableTools, "getForumLeaderboard", args, "Rule-based forum leaderboard");
        }

        if (wantsMessages) {
            addTool(calls, chosenTools, availableTools, "getMessageThreads", arguments(), "Rule-based message thread lookup");
        }

        if (wantsAnnouncements && !containsAny(normalized, "create announcement", "publish announcement")) {
            addTool(calls, chosenTools, availableTools, "getAnnouncements", arguments(), "Rule-based announcement feed");
        }

        if (wantsLeave) {
            if (containsAny(normalized, "my leave", "my leaves", "my requests") || userContext.role() == UserRole.TEACHER || userContext.role() == UserRole.STAFF) {
                addTool(calls, chosenTools, availableTools, "getMyLeaveRequests", arguments(), "Rule-based personal leave lookup");
            } else {
                ObjectNode args = arguments();
                if (normalized.contains("pending")) {
                    args.put("status", "PENDING");
                } else if (normalized.contains("approved")) {
                    args.put("status", "APPROVED");
                } else if (normalized.contains("rejected")) {
                    args.put("status", "REJECTED");
                }
                addTool(calls, chosenTools, availableTools, "getLeaveRequests", args, "Rule-based leave review queue");
            }
        }

        if (calls.isEmpty() && containsAny(normalized, "workspace", "create workspace")) {
            ObjectNode args = arguments();
            args.put("name", "My Workspace");
            addTool(calls, chosenTools, availableTools, "submitCreateWorkspace", args, "Rule-based workspace creation");
        }

        if (dashboardLike && calls.size() == 1 && chosenTools.contains("getSchoolDashboard")) {
            if (availableTools.contains("getAttendanceReport")) {
                addTool(calls, chosenTools, availableTools, "getAttendanceReport", attendanceArguments(normalized), "Rule-based supporting attendance context");
            }
            if (availableTools.contains("getFeeDefaulters")) {
                addTool(calls, chosenTools, availableTools, "getFeeDefaulters", arguments(), "Rule-based supporting finance context");
            }
            if (availableTools.contains("getTransportOverview")) {
                addTool(calls, chosenTools, availableTools, "getTransportOverview", arguments(), "Rule-based supporting transport context");
            }
        }
    }

    private void handleHelpQueries(
            String normalized,
            Set<String> availableTools,
            List<ToolCall> calls,
            Set<String> chosenTools,
            UserContext userContext
    ) {
        if (!containsAny(normalized, "help", "how do i", "can't login", "cannot login", "password", "activation", "onboarding")) {
            return;
        }

        if (containsAny(normalized, "login", "password", "activation", "reset")) {
            addTool(calls, chosenTools, availableTools, "getAuthHelp", arguments(), "Rule-based auth help");
            return;
        }

        if (containsAny(normalized, "onboarding", "join school", "joining")) {
            if (userContext.role() == UserRole.PUBLIC_ANONYMOUS) {
                addTool(calls, chosenTools, availableTools, "getSchoolJoiningInfo", arguments(), "Rule-based public onboarding help");
            } else {
                addTool(calls, chosenTools, availableTools, "getOnboardingInfo", arguments(), "Rule-based onboarding help");
            }
            return;
        }

        addTool(calls, chosenTools, availableTools, "getAdminHelp", arguments(), "Rule-based admin help");
    }

    private ObjectNode attendanceArguments(String normalized) {
        LocalDate today = LocalDate.now();
        DateRange range = resolveDateRange(normalized, today);
        ObjectNode args = arguments();
        args.put("fromDate", range.from().toString());
        args.put("toDate", range.to().toString());
        return args;
    }

    private DateRange resolveDateRange(String normalized, LocalDate today) {
        List<LocalDate> explicitDates = extractIsoDates(normalized);
        if (explicitDates.size() >= 2) {
            LocalDate first = explicitDates.get(0);
            LocalDate second = explicitDates.get(1);
            return first.isBefore(second) ? new DateRange(first, second) : new DateRange(second, first);
        }

        Matcher days = LAST_N_DAYS.matcher(normalized);
        if (days.find()) {
            int value = Integer.parseInt(days.group(1));
            return new DateRange(today.minusDays(Math.max(1, value) - 1L), today);
        }

        Matcher weeks = LAST_N_WEEKS.matcher(normalized);
        if (weeks.find()) {
            int value = Integer.parseInt(weeks.group(1));
            return new DateRange(today.minusWeeks(Math.max(1, value)).plusDays(1), today);
        }

        if (normalized.contains("this week")) {
            LocalDate start = today.with(TemporalAdjusters.previousOrSame(DayOfWeek.MONDAY));
            return new DateRange(start, today);
        }

        if (normalized.contains("last week")) {
            LocalDate start = today.with(TemporalAdjusters.previousOrSame(DayOfWeek.MONDAY)).minusWeeks(1);
            return new DateRange(start, start.plusDays(6));
        }

        Matcher months = LAST_N_MONTHS.matcher(normalized);
        if (months.find()) {
            int value = Integer.parseInt(months.group(1));
            return new DateRange(today.minusMonths(Math.max(1, value)).plusDays(1), today);
        }

        if (normalized.contains("this month")) {
            LocalDate start = today.withDayOfMonth(1);
            return new DateRange(start, today);
        }

        if (normalized.contains("last month")) {
            YearMonth lastMonth = YearMonth.from(today.minusMonths(1));
            return new DateRange(lastMonth.atDay(1), lastMonth.atEndOfMonth());
        }

        if (normalized.contains("today")) {
            return new DateRange(today, today);
        }

        if (normalized.contains("yesterday")) {
            LocalDate yesterday = today.minusDays(1);
            return new DateRange(yesterday, yesterday);
        }

        return new DateRange(today.minusDays(29), today);
    }

    private java.util.Optional<Integer> extractLastMonths(String normalized) {
        Matcher matcher = LAST_N_MONTHS.matcher(normalized);
        if (matcher.find()) {
            return java.util.Optional.of(Integer.parseInt(matcher.group(1)));
        }
        return java.util.Optional.empty();
    }

    private List<LocalDate> extractIsoDates(String normalized) {
        List<LocalDate> dates = new ArrayList<>();
        Matcher matcher = ISO_DATE.matcher(normalized);
        while (matcher.find()) {
            try {
                dates.add(LocalDate.parse(matcher.group(1)));
            } catch (DateTimeParseException ignored) {
                // Ignore malformed dates and keep best-effort parsing.
            }
        }
        return dates;
    }

    private ObjectNode extractAnnouncementArguments(String message, String normalized) {
        String lowered = message.trim();
        int aboutIndex = lowered.toLowerCase(Locale.ROOT).indexOf("about");
        String content = aboutIndex >= 0 ? lowered.substring(aboutIndex + 5).trim() : lowered;
        content = content.replaceFirst("(?i)^(create|publish|post)\\s+announcement\\s*", "").trim();
        content = content.replaceFirst("(?i)^announce\\s*", "").trim();
        if (content.isBlank()) {
            return null;
        }

        ObjectNode args = arguments();
        args.put("title", buildShortTitle(content));
        args.put("content", content);
        args.put("targetAudience", normalized.contains("parent") ? "PARENT"
                : normalized.contains("teacher") ? "TEACHER"
                : normalized.contains("staff") ? "STAFF"
                : normalized.contains("student") ? "STUDENT"
                : "ALL");
        if (normalized.contains("urgent")) {
            args.put("priority", "HIGH");
            args.put("type", "URGENT");
        }
        return args;
    }

    private ObjectNode extractLeaveRequestArguments(String normalized) {
        DateRange range = resolveDateRange(normalized, LocalDate.now());
        if (range == null) {
            return null;
        }

        ObjectNode args = arguments();
        args.put("leaveType", normalized.contains("sick") ? "SICK" : normalized.contains("casual") ? "CASUAL" : "OTHER");
        args.put("startDate", range.from().toString());
        args.put("endDate", range.to().toString());
        if (normalized.contains("because")) {
            args.put("reason", normalized.substring(normalized.indexOf("because") + 7).trim());
        } else if (normalized.contains("for ")) {
            args.put("reason", "Requested via assistant");
        }
        return args;
    }

    private ObjectNode extractNotificationArguments(String message) {
        java.util.Optional<String> recipientUserId = extractUuid(message);
        if (recipientUserId.isEmpty()) {
            return null;
        }

        String content = message.replace(recipientUserId.get(), "").trim();
        if (content.isBlank()) {
            return null;
        }

        ObjectNode args = arguments();
        args.put("recipientUserId", recipientUserId.get());
        args.put("message", content);
        args.put("title", buildShortTitle(content));
        args.put("idempotencyKey", UUID.nameUUIDFromBytes(message.getBytes()).toString());
        return args;
    }

    private java.util.Optional<String> extractSchoolCode(String message) {
        Matcher matcher = SCHOOL_CODE.matcher(message);
        if (matcher.find()) {
            return java.util.Optional.of(matcher.group(1).toUpperCase(Locale.ROOT));
        }
        return java.util.Optional.empty();
    }

    private java.util.Optional<String> extractUuid(String message) {
        Matcher matcher = UUID_PATTERN.matcher(message);
        if (matcher.find()) {
            return java.util.Optional.of(matcher.group());
        }
        return java.util.Optional.empty();
    }

    private String buildShortTitle(String content) {
        String compact = content.replaceAll("\\s+", " ").trim();
        if (compact.length() <= 48) {
            return compact;
        }
        return compact.substring(0, 45).trim() + "...";
    }

    private ObjectNode arguments() {
        return objectMapper.createObjectNode();
    }

    private void addTool(
            List<ToolCall> calls,
            Set<String> chosenTools,
            Set<String> availableTools,
            String toolName,
            ObjectNode arguments,
            String reasoning
    ) {
        if (!availableTools.contains(toolName) || chosenTools.contains(toolName) || calls.size() >= MAX_MULTI_TOOL_CALLS) {
            return;
        }
        calls.add(new ToolCall(toolName, arguments == null ? arguments() : arguments, reasoning));
        chosenTools.add(toolName);
    }

    private boolean isPublicRole(UserRole role) {
        return role == UserRole.PUBLIC_ANONYMOUS;
    }

    private boolean containsAny(String normalized, String... terms) {
        for (String term : terms) {
            if (normalized.contains(term)) {
                return true;
            }
        }
        return false;
    }

    private String normalize(String message) {
        return message.toLowerCase(Locale.ROOT).replaceAll("\\s+", " ").trim();
    }

    private List<ToolCall> trim(List<ToolCall> calls) {
        if (calls.size() <= MAX_MULTI_TOOL_CALLS) {
            return calls;
        }
        return new ArrayList<>(calls.subList(0, MAX_MULTI_TOOL_CALLS));
    }

    private record DateRange(LocalDate from, LocalDate to) {}
}
