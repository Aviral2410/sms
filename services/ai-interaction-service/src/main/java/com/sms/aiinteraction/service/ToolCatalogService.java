package com.sms.aiinteraction.service;

import com.sms.aiinteraction.api.AiInteractionDtos;
import com.sms.aiinteraction.security.UserContext;
import com.sms.aiinteraction.security.UserRole;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class ToolCatalogService {
    private final ToolRegistry toolRegistry;
    private final ToolAccessPolicyService toolAccessPolicyService;

    public ToolCatalogService(ToolRegistry toolRegistry, ToolAccessPolicyService toolAccessPolicyService) {
        this.toolRegistry = toolRegistry;
        this.toolAccessPolicyService = toolAccessPolicyService;
    }

    public List<AiInteractionDtos.ToolCatalogItem> forUser(UserContext user) {
        return toolRegistry.all().stream()
                .filter(tool -> toolAccessPolicyService.canDiscover(tool, user))
                .map(tool -> new AiInteractionDtos.ToolCatalogItem(
                        tool.name(),
                        tool.descriptor().description(),
                        tool.descriptor().inputSchema(),
                        tool.requiresConfirmation(),
                        examplesFor(tool.name())
                ))
                .toList();
    }

    private List<String> examplesFor(String toolName) {
        return switch (toolName) {
            case "getAttendanceReport" -> List.of(
                    "Show attendance trend for last 30 days",
                    "Attendance overview from 2026-04-01 to 2026-04-14"
            );
            case "getEnrollmentTrend" -> List.of(
                    "Show enrollment trend for last 12 months",
                    "Show admissions trend for last 6 months"
            );
            case "getAnnouncements" -> List.of(
                    "Show latest school announcements",
                    "List notices for my role"
            );
            case "getHomeworkSummary" -> List.of(
                    "Show homework due summary",
                    "Homework trend by due date"
            );
            case "getExamResultsSummary" -> List.of(
                    "Show exam grade distribution",
                    "Summarize recent exam results"
            );
            case "getTransportOverview" -> List.of(
                    "Show transport route status summary",
                    "Transport operations overview"
            );
            case "getFeeDefaulters" -> List.of(
                    "List fee defaulters",
                    "Who has overdue fees?"
            );
            case "getStudentPerformance" -> List.of(
                    "Show student performance for <student-id>",
                    "How is this student doing academically?"
            );
            case "sendNotification" -> List.of(
                    "Notify parent <user-id> about attendance",
                    "Send reminder notification to <user-id>"
            );
            case "getSchoolDashboard" -> List.of(
                    "Show school dashboard KPIs",
                    "Give me overall school summary"
            );
            case "getLibraryResources" -> List.of(
                    "Show library resources summary",
                    "Library catalog overview"
            );
            case "getForumLeaderboard" -> List.of(
                    "Show weekly forum leaderboard",
                    "Top contributors this month"
            );
            case "getMessageThreads" -> List.of(
                    "Show my unread message threads",
                    "Open inbox summary"
            );
            case "getMyLeaveRequests" -> List.of(
                    "Show my leave requests",
                    "My leave status summary"
            );
            case "getLeaveRequests" -> List.of(
                    "List pending leave approvals",
                    "Show approved leave requests"
            );
            case "createAnnouncement" -> List.of(
                    "Create an announcement for all parents about PTM",
                    "Publish urgent school-wide notice"
            );
            case "createLeaveRequest" -> List.of(
                    "Request sick leave from 2026-04-15 to 2026-04-16",
                    "Apply leave for tomorrow with reason"
            );
            case "reviewLeaveRequest" -> List.of(
                    "Approve leave <leave-request-id> with note",
                    "Reject leave <leave-request-id> with reason"
            );
            default -> List.of();
        };
    }
}
