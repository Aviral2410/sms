package com.sms.aiinteraction.tool;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.sms.aiinteraction.security.UserRole;
import com.sms.aiinteraction.service.AuditEventService;
import com.sms.aiinteraction.service.GatewayApiClient;
import com.sms.aiinteraction.service.IdempotencyService;
import com.sms.aiinteraction.tool.impl.GetAttendanceReportTool;
import com.sms.aiinteraction.tool.impl.GetAnnouncementsTool;
import com.sms.aiinteraction.tool.impl.GetExamResultsSummaryTool;
import com.sms.aiinteraction.tool.impl.GetFeeDefaultersTool;
import com.sms.aiinteraction.tool.impl.GetForumLeaderboardTool;
import com.sms.aiinteraction.tool.impl.GetHomeworkSummaryTool;
import com.sms.aiinteraction.tool.impl.GetLeaveRequestsTool;
import com.sms.aiinteraction.tool.impl.GetLibraryResourcesTool;
import com.sms.aiinteraction.tool.impl.GetMessageThreadsTool;
import com.sms.aiinteraction.tool.impl.GetMyLeaveRequestsTool;
import com.sms.aiinteraction.tool.impl.GetSchoolDashboardTool;
import com.sms.aiinteraction.tool.impl.GetStudentPerformanceTool;
import com.sms.aiinteraction.tool.impl.GetTransportOverviewTool;
import com.sms.aiinteraction.tool.impl.CreateAnnouncementTool;
import com.sms.aiinteraction.tool.impl.CreateLeaveRequestTool;
import com.sms.aiinteraction.tool.impl.ReviewLeaveRequestTool;
import com.sms.aiinteraction.tool.impl.SendNotificationTool;
import org.junit.jupiter.api.Test;
import org.mockito.Mockito;

import java.util.Set;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

class ToolRoleMatrixTest {
    private final GatewayApiClient gatewayApiClient = Mockito.mock(GatewayApiClient.class);
    private final ObjectMapper objectMapper = new ObjectMapper();
    private final IdempotencyService idempotencyService = Mockito.mock(IdempotencyService.class);
    private final AuditEventService auditEventService = Mockito.mock(AuditEventService.class);

    @Test
    void verifiesRoleMatrix() {
        AiTool attendance = new GetAttendanceReportTool(gatewayApiClient, objectMapper);
        AiTool feeDefaulters = new GetFeeDefaultersTool(gatewayApiClient, objectMapper);
        AiTool studentPerformance = new GetStudentPerformanceTool(gatewayApiClient, objectMapper);
        AiTool sendNotification = new SendNotificationTool(gatewayApiClient, objectMapper, idempotencyService, auditEventService);
        AiTool announcements = new GetAnnouncementsTool(gatewayApiClient, objectMapper);
        AiTool homework = new GetHomeworkSummaryTool(gatewayApiClient, objectMapper);
        AiTool results = new GetExamResultsSummaryTool(gatewayApiClient, objectMapper);
        AiTool transport = new GetTransportOverviewTool(gatewayApiClient, objectMapper);
        AiTool dashboard = new GetSchoolDashboardTool(gatewayApiClient, objectMapper);
        AiTool library = new GetLibraryResourcesTool(gatewayApiClient, objectMapper);
        AiTool leaderboard = new GetForumLeaderboardTool(gatewayApiClient, objectMapper);
        AiTool threads = new GetMessageThreadsTool(gatewayApiClient, objectMapper);
        AiTool myLeaves = new GetMyLeaveRequestsTool(gatewayApiClient, objectMapper);
        AiTool leaveRequests = new GetLeaveRequestsTool(gatewayApiClient, objectMapper);
        AiTool createAnnouncement = new CreateAnnouncementTool(gatewayApiClient, objectMapper);
        AiTool createLeaveRequest = new CreateLeaveRequestTool(gatewayApiClient, objectMapper);
        AiTool reviewLeaveRequest = new ReviewLeaveRequestTool(gatewayApiClient, objectMapper);

        assertEquals(Set.of(UserRole.PLATFORM_ADMIN, UserRole.SCHOOL_ADMIN, UserRole.TEACHER, UserRole.PARENT, UserRole.STUDENT, UserRole.STAFF), attendance.allowedRoles());
        assertEquals(Set.of(UserRole.PLATFORM_ADMIN, UserRole.SCHOOL_ADMIN, UserRole.STAFF), feeDefaulters.allowedRoles());
        assertEquals(Set.of(UserRole.PLATFORM_ADMIN, UserRole.SCHOOL_ADMIN, UserRole.TEACHER, UserRole.PARENT, UserRole.STUDENT), studentPerformance.allowedRoles());
        assertEquals(Set.of(UserRole.PLATFORM_ADMIN, UserRole.SCHOOL_ADMIN, UserRole.TEACHER, UserRole.STAFF), sendNotification.allowedRoles());
        assertTrue(sendNotification.requiresConfirmation());
        assertEquals(Set.of(UserRole.PLATFORM_ADMIN, UserRole.SCHOOL_ADMIN, UserRole.TEACHER, UserRole.PARENT, UserRole.STUDENT, UserRole.STAFF), announcements.allowedRoles());
        assertEquals(Set.of(UserRole.PLATFORM_ADMIN, UserRole.SCHOOL_ADMIN, UserRole.TEACHER, UserRole.STUDENT, UserRole.PARENT), homework.allowedRoles());
        assertEquals(Set.of(UserRole.PLATFORM_ADMIN, UserRole.SCHOOL_ADMIN, UserRole.TEACHER, UserRole.STUDENT, UserRole.PARENT), results.allowedRoles());
        assertEquals(Set.of(UserRole.PLATFORM_ADMIN, UserRole.SCHOOL_ADMIN, UserRole.STAFF, UserRole.TEACHER, UserRole.PARENT, UserRole.STUDENT), transport.allowedRoles());
        assertEquals(Set.of(UserRole.PLATFORM_ADMIN, UserRole.SCHOOL_ADMIN, UserRole.STAFF), dashboard.allowedRoles());
        assertEquals(Set.of(UserRole.PLATFORM_ADMIN, UserRole.SCHOOL_ADMIN, UserRole.TEACHER, UserRole.PARENT, UserRole.STUDENT, UserRole.STAFF), library.allowedRoles());
        assertEquals(Set.of(UserRole.PLATFORM_ADMIN, UserRole.SCHOOL_ADMIN, UserRole.TEACHER, UserRole.PARENT, UserRole.STUDENT, UserRole.STAFF), leaderboard.allowedRoles());
        assertEquals(Set.of(UserRole.PLATFORM_ADMIN, UserRole.SCHOOL_ADMIN, UserRole.TEACHER, UserRole.PARENT, UserRole.STUDENT, UserRole.STAFF), threads.allowedRoles());
        assertEquals(Set.of(UserRole.PLATFORM_ADMIN, UserRole.SCHOOL_ADMIN, UserRole.TEACHER, UserRole.STAFF), myLeaves.allowedRoles());
        assertEquals(Set.of(UserRole.PLATFORM_ADMIN, UserRole.SCHOOL_ADMIN, UserRole.STAFF), leaveRequests.allowedRoles());
        assertEquals(Set.of(UserRole.PLATFORM_ADMIN, UserRole.SCHOOL_ADMIN, UserRole.TEACHER, UserRole.STAFF), createAnnouncement.allowedRoles());
        assertTrue(createAnnouncement.requiresConfirmation());
        assertEquals(Set.of(UserRole.PLATFORM_ADMIN, UserRole.SCHOOL_ADMIN, UserRole.TEACHER, UserRole.STAFF), createLeaveRequest.allowedRoles());
        assertTrue(createLeaveRequest.requiresConfirmation());
        assertEquals(Set.of(UserRole.PLATFORM_ADMIN, UserRole.SCHOOL_ADMIN, UserRole.STAFF), reviewLeaveRequest.allowedRoles());
        assertTrue(reviewLeaveRequest.requiresConfirmation());
    }
}
