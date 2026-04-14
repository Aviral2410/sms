package com.sms.schoolops.api;

import com.sms.schoolops.api.AttendanceManagementDtos.AbsenceReasonRequest;
import com.sms.schoolops.api.AttendanceManagementDtos.AbsenceReasonResponse;
import com.sms.schoolops.api.AttendanceManagementDtos.AttendanceCalendarResponse;
import com.sms.schoolops.api.AttendanceManagementDtos.AttendanceContextResponse;
import com.sms.schoolops.api.AttendanceManagementDtos.AttendanceHeatmapResponse;
import com.sms.schoolops.api.AttendanceManagementDtos.AttendanceOverviewResponse;
import com.sms.schoolops.api.AttendanceManagementDtos.AttendancePolicyResponse;
import com.sms.schoolops.api.AttendanceManagementDtos.AttendancePolicyUpdateRequest;
import com.sms.schoolops.api.AttendanceManagementDtos.AttendanceRiskResponse;
import com.sms.schoolops.api.AttendanceManagementDtos.AttendanceSessionDetailResponse;
import com.sms.schoolops.api.AttendanceManagementDtos.BulkMarkRequest;
import com.sms.schoolops.api.AttendanceManagementDtos.ClassMonitorResponse;
import com.sms.schoolops.api.AttendanceManagementDtos.CreateAttendanceSessionRequest;
import com.sms.schoolops.api.AttendanceManagementDtos.EditAttendanceRecordRequest;
import com.sms.schoolops.api.AttendanceManagementDtos.FaceScanRequest;
import com.sms.schoolops.api.AttendanceManagementDtos.FaceScanResponse;
import com.sms.schoolops.api.AttendanceManagementDtos.GpsVerificationRequest;
import com.sms.schoolops.api.AttendanceManagementDtos.GpsVerificationResponse;
import com.sms.schoolops.api.AttendanceManagementDtos.StudentAttendanceSummaryResponse;
import com.sms.schoolops.api.AttendanceManagementDtos.SubmitAttendanceSessionRequest;
import com.sms.schoolops.api.AttendanceManagementDtos.UpdateAttendanceStudentRequest;
import com.sms.schoolops.api.AttendanceManagementDtos.VoiceCommandRequest;
import com.sms.schoolops.api.AttendanceManagementDtos.VoiceCommandResponse;
import com.sms.schoolops.service.AttendanceActor;
import com.sms.schoolops.service.AttendanceManagementService;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import java.time.LocalDate;
import java.util.UUID;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/school-ops")
@Tag(name = "Attendance", description = "Attendance context, session management, analytics, exports, and policy APIs.")
public class AttendanceManagementController {

    private final AttendanceManagementService attendanceManagementService;

    public AttendanceManagementController(AttendanceManagementService attendanceManagementService) {
        this.attendanceManagementService = attendanceManagementService;
    }

    @GetMapping("/attendance/context")
    public AttendanceContextResponse getContext(
            @RequestHeader("X-User-ID") String userIdHeader,
            @RequestHeader("X-School-ID") String schoolIdHeader,
            @RequestHeader(value = "X-Tenant-ID", required = false) String tenantIdHeader,
            @RequestHeader(value = "X-User-Email", required = false) String emailHeader,
            @RequestHeader(value = "X-User-Role", required = false) String roleHeader
    ) {
        return this.attendanceManagementService.getContext(resolveActor(userIdHeader, schoolIdHeader, tenantIdHeader, emailHeader, roleHeader));
    }

    @PostMapping("/attendance/sessions")
    public AttendanceSessionDetailResponse createOrReopenSession(
            @RequestHeader("X-User-ID") String userIdHeader,
            @RequestHeader("X-School-ID") String schoolIdHeader,
            @RequestHeader(value = "X-Tenant-ID", required = false) String tenantIdHeader,
            @RequestHeader(value = "X-User-Email", required = false) String emailHeader,
            @RequestHeader(value = "X-User-Role", required = false) String roleHeader,
            @Valid @RequestBody CreateAttendanceSessionRequest request
    ) {
        return this.attendanceManagementService.createOrReopenSession(resolveActor(userIdHeader, schoolIdHeader, tenantIdHeader, emailHeader, roleHeader), request);
    }

    @GetMapping("/attendance/sessions/{sessionId}")
    public AttendanceSessionDetailResponse getSession(
            @RequestHeader("X-User-ID") String userIdHeader,
            @RequestHeader("X-School-ID") String schoolIdHeader,
            @RequestHeader(value = "X-Tenant-ID", required = false) String tenantIdHeader,
            @RequestHeader(value = "X-User-Email", required = false) String emailHeader,
            @RequestHeader(value = "X-User-Role", required = false) String roleHeader,
            @PathVariable UUID sessionId
    ) {
        return this.attendanceManagementService.getSessionDetail(resolveActor(userIdHeader, schoolIdHeader, tenantIdHeader, emailHeader, roleHeader), sessionId);
    }

    @PatchMapping("/attendance/sessions/{sessionId}/students/{studentId}")
    public AttendanceSessionDetailResponse updateStudent(
            @RequestHeader("X-User-ID") String userIdHeader,
            @RequestHeader("X-School-ID") String schoolIdHeader,
            @RequestHeader(value = "X-Tenant-ID", required = false) String tenantIdHeader,
            @RequestHeader(value = "X-User-Email", required = false) String emailHeader,
            @RequestHeader(value = "X-User-Role", required = false) String roleHeader,
            @PathVariable UUID sessionId,
            @PathVariable UUID studentId,
            @Valid @RequestBody UpdateAttendanceStudentRequest request
    ) {
        return this.attendanceManagementService.updateStudentStatus(resolveActor(userIdHeader, schoolIdHeader, tenantIdHeader, emailHeader, roleHeader), sessionId, studentId, request);
    }

    @PostMapping("/attendance/sessions/{sessionId}/bulk-present")
    public AttendanceSessionDetailResponse bulkMark(
            @RequestHeader("X-User-ID") String userIdHeader,
            @RequestHeader("X-School-ID") String schoolIdHeader,
            @RequestHeader(value = "X-Tenant-ID", required = false) String tenantIdHeader,
            @RequestHeader(value = "X-User-Email", required = false) String emailHeader,
            @RequestHeader(value = "X-User-Role", required = false) String roleHeader,
            @PathVariable UUID sessionId,
            @Valid @RequestBody BulkMarkRequest request
    ) {
        return this.attendanceManagementService.bulkMark(resolveActor(userIdHeader, schoolIdHeader, tenantIdHeader, emailHeader, roleHeader), sessionId, request);
    }

    @PostMapping("/attendance/sessions/{sessionId}/voice-commands")
    public VoiceCommandResponse voiceCommands(
            @RequestHeader("X-User-ID") String userIdHeader,
            @RequestHeader("X-School-ID") String schoolIdHeader,
            @RequestHeader(value = "X-Tenant-ID", required = false) String tenantIdHeader,
            @RequestHeader(value = "X-User-Email", required = false) String emailHeader,
            @RequestHeader(value = "X-User-Role", required = false) String roleHeader,
            @PathVariable UUID sessionId,
            @Valid @RequestBody VoiceCommandRequest request
    ) {
        return this.attendanceManagementService.applyVoiceCommands(resolveActor(userIdHeader, schoolIdHeader, tenantIdHeader, emailHeader, roleHeader), sessionId, request);
    }

    @PostMapping("/attendance/sessions/{sessionId}/gps-verify")
    public GpsVerificationResponse verifyGps(
            @RequestHeader("X-User-ID") String userIdHeader,
            @RequestHeader("X-School-ID") String schoolIdHeader,
            @RequestHeader(value = "X-Tenant-ID", required = false) String tenantIdHeader,
            @RequestHeader(value = "X-User-Email", required = false) String emailHeader,
            @RequestHeader(value = "X-User-Role", required = false) String roleHeader,
            @PathVariable UUID sessionId,
            @Valid @RequestBody GpsVerificationRequest request
    ) {
        return this.attendanceManagementService.verifyGps(resolveActor(userIdHeader, schoolIdHeader, tenantIdHeader, emailHeader, roleHeader), sessionId, request);
    }

    @PostMapping("/attendance/sessions/{sessionId}/face-scan")
    public FaceScanResponse faceScan(
            @RequestHeader("X-User-ID") String userIdHeader,
            @RequestHeader("X-School-ID") String schoolIdHeader,
            @RequestHeader(value = "X-Tenant-ID", required = false) String tenantIdHeader,
            @RequestHeader(value = "X-User-Email", required = false) String emailHeader,
            @RequestHeader(value = "X-User-Role", required = false) String roleHeader,
            @PathVariable UUID sessionId,
            @Valid @RequestBody FaceScanRequest request
    ) {
        return this.attendanceManagementService.faceScan(resolveActor(userIdHeader, schoolIdHeader, tenantIdHeader, emailHeader, roleHeader), sessionId, request);
    }

    @PostMapping("/attendance/sessions/{sessionId}/submit")
    public AttendanceSessionDetailResponse submitSession(
            @RequestHeader("X-User-ID") String userIdHeader,
            @RequestHeader("X-School-ID") String schoolIdHeader,
            @RequestHeader(value = "X-Tenant-ID", required = false) String tenantIdHeader,
            @RequestHeader(value = "X-User-Email", required = false) String emailHeader,
            @RequestHeader(value = "X-User-Role", required = false) String roleHeader,
            @PathVariable UUID sessionId,
            @RequestBody(required = false) SubmitAttendanceSessionRequest request
    ) {
        SubmitAttendanceSessionRequest body = request == null ? new SubmitAttendanceSessionRequest(null, false) : request;
        return this.attendanceManagementService.submitSession(resolveActor(userIdHeader, schoolIdHeader, tenantIdHeader, emailHeader, roleHeader), sessionId, body);
    }

    @GetMapping("/attendance/class-monitor")
    public ClassMonitorResponse getClassMonitor(
            @RequestHeader("X-User-ID") String userIdHeader,
            @RequestHeader("X-School-ID") String schoolIdHeader,
            @RequestHeader(value = "X-Tenant-ID", required = false) String tenantIdHeader,
            @RequestHeader(value = "X-User-Email", required = false) String emailHeader,
            @RequestHeader(value = "X-User-Role", required = false) String roleHeader,
            @RequestParam(required = false) LocalDate date,
            @RequestParam(required = false) UUID classId,
            @RequestParam(required = false) UUID subjectId,
            @RequestParam(required = false) Integer periodNumber,
            @RequestParam(required = false) UUID studentId
    ) {
        return this.attendanceManagementService.getClassMonitor(resolveActor(userIdHeader, schoolIdHeader, tenantIdHeader, emailHeader, roleHeader), date, classId, subjectId, periodNumber, studentId);
    }

    @PatchMapping("/attendance/records/{attendanceId}")
    public AttendanceSessionDetailResponse editAttendanceRecord(
            @RequestHeader("X-User-ID") String userIdHeader,
            @RequestHeader("X-School-ID") String schoolIdHeader,
            @RequestHeader(value = "X-Tenant-ID", required = false) String tenantIdHeader,
            @RequestHeader(value = "X-User-Email", required = false) String emailHeader,
            @RequestHeader(value = "X-User-Role", required = false) String roleHeader,
            @PathVariable UUID attendanceId,
            @Valid @RequestBody EditAttendanceRecordRequest request
    ) {
        return this.attendanceManagementService.editAttendanceRecord(resolveActor(userIdHeader, schoolIdHeader, tenantIdHeader, emailHeader, roleHeader), attendanceId, request);
    }

    @PostMapping("/attendance/absence-reasons")
    public AbsenceReasonResponse submitAbsenceReason(
            @RequestHeader("X-User-ID") String userIdHeader,
            @RequestHeader("X-School-ID") String schoolIdHeader,
            @RequestHeader(value = "X-Tenant-ID", required = false) String tenantIdHeader,
            @RequestHeader(value = "X-User-Email", required = false) String emailHeader,
            @RequestHeader(value = "X-User-Role", required = false) String roleHeader,
            @Valid @RequestBody AbsenceReasonRequest request
    ) {
        return this.attendanceManagementService.submitAbsenceReason(resolveActor(userIdHeader, schoolIdHeader, tenantIdHeader, emailHeader, roleHeader), request);
    }

    @GetMapping("/attendance/policy")
    public AttendancePolicyResponse getPolicy(
            @RequestHeader("X-User-ID") String userIdHeader,
            @RequestHeader("X-School-ID") String schoolIdHeader,
            @RequestHeader(value = "X-Tenant-ID", required = false) String tenantIdHeader,
            @RequestHeader(value = "X-User-Email", required = false) String emailHeader,
            @RequestHeader(value = "X-User-Role", required = false) String roleHeader
    ) {
        return this.attendanceManagementService.getPolicy(resolveActor(userIdHeader, schoolIdHeader, tenantIdHeader, emailHeader, roleHeader));
    }

    @PatchMapping("/attendance/policy")
    public AttendancePolicyResponse updatePolicy(
            @RequestHeader("X-User-ID") String userIdHeader,
            @RequestHeader("X-School-ID") String schoolIdHeader,
            @RequestHeader(value = "X-Tenant-ID", required = false) String tenantIdHeader,
            @RequestHeader(value = "X-User-Email", required = false) String emailHeader,
            @RequestHeader(value = "X-User-Role", required = false) String roleHeader,
            @Valid @RequestBody AttendancePolicyUpdateRequest request
    ) {
        return this.attendanceManagementService.updatePolicy(resolveActor(userIdHeader, schoolIdHeader, tenantIdHeader, emailHeader, roleHeader), request);
    }

    @GetMapping("/attendance/analytics/overview")
    public AttendanceOverviewResponse getOverview(
            @RequestHeader("X-User-ID") String userIdHeader,
            @RequestHeader("X-School-ID") String schoolIdHeader,
            @RequestHeader(value = "X-Tenant-ID", required = false) String tenantIdHeader,
            @RequestHeader(value = "X-User-Email", required = false) String emailHeader,
            @RequestHeader(value = "X-User-Role", required = false) String roleHeader,
            @RequestParam(required = false) LocalDate from,
            @RequestParam(required = false) LocalDate to
    ) {
        return this.attendanceManagementService.getOverview(resolveActor(userIdHeader, schoolIdHeader, tenantIdHeader, emailHeader, roleHeader), from, to);
    }

    @GetMapping("/attendance/analytics/heatmap")
    public AttendanceHeatmapResponse getHeatmap(
            @RequestHeader("X-User-ID") String userIdHeader,
            @RequestHeader("X-School-ID") String schoolIdHeader,
            @RequestHeader(value = "X-Tenant-ID", required = false) String tenantIdHeader,
            @RequestHeader(value = "X-User-Email", required = false) String emailHeader,
            @RequestHeader(value = "X-User-Role", required = false) String roleHeader,
            @RequestParam(required = false) UUID studentId,
            @RequestParam(required = false) LocalDate from,
            @RequestParam(required = false) LocalDate to
    ) {
        return this.attendanceManagementService.getHeatmap(resolveActor(userIdHeader, schoolIdHeader, tenantIdHeader, emailHeader, roleHeader), studentId, from, to);
    }

    @GetMapping("/attendance/analytics/calendar")
    public AttendanceCalendarResponse getCalendar(
            @RequestHeader("X-User-ID") String userIdHeader,
            @RequestHeader("X-School-ID") String schoolIdHeader,
            @RequestHeader(value = "X-Tenant-ID", required = false) String tenantIdHeader,
            @RequestHeader(value = "X-User-Email", required = false) String emailHeader,
            @RequestHeader(value = "X-User-Role", required = false) String roleHeader,
            @RequestParam(required = false) UUID studentId,
            @RequestParam(required = false) LocalDate from,
            @RequestParam(required = false) LocalDate to
    ) {
        return this.attendanceManagementService.getCalendar(resolveActor(userIdHeader, schoolIdHeader, tenantIdHeader, emailHeader, roleHeader), studentId, from, to);
    }

    @GetMapping("/attendance/analytics/risk")
    public AttendanceRiskResponse getRisk(
            @RequestHeader("X-User-ID") String userIdHeader,
            @RequestHeader("X-School-ID") String schoolIdHeader,
            @RequestHeader(value = "X-Tenant-ID", required = false) String tenantIdHeader,
            @RequestHeader(value = "X-User-Email", required = false) String emailHeader,
            @RequestHeader(value = "X-User-Role", required = false) String roleHeader,
            @RequestParam(required = false) UUID classId
    ) {
        return this.attendanceManagementService.getRisk(resolveActor(userIdHeader, schoolIdHeader, tenantIdHeader, emailHeader, roleHeader), classId);
    }

    @GetMapping("/attendance/export")
    public ResponseEntity<byte[]> exportAttendance(
            @RequestHeader("X-User-ID") String userIdHeader,
            @RequestHeader("X-School-ID") String schoolIdHeader,
            @RequestHeader(value = "X-Tenant-ID", required = false) String tenantIdHeader,
            @RequestHeader(value = "X-User-Email", required = false) String emailHeader,
            @RequestHeader(value = "X-User-Role", required = false) String roleHeader,
            @RequestParam(defaultValue = "csv") String format,
            @RequestParam(required = false) UUID classId,
            @RequestParam(required = false) UUID subjectId,
            @RequestParam(required = false) UUID studentId,
            @RequestParam(required = false) LocalDate from,
            @RequestParam(required = false) LocalDate to
    ) {
        return this.attendanceManagementService.exportAttendance(resolveActor(userIdHeader, schoolIdHeader, tenantIdHeader, emailHeader, roleHeader), format, classId, subjectId, studentId, from, to);
    }

    @GetMapping("/students/{studentId}/attendance-summary")
    public StudentAttendanceSummaryResponse getStudentSummary(
            @RequestHeader("X-User-ID") String userIdHeader,
            @RequestHeader("X-School-ID") String schoolIdHeader,
            @RequestHeader(value = "X-Tenant-ID", required = false) String tenantIdHeader,
            @RequestHeader(value = "X-User-Email", required = false) String emailHeader,
            @RequestHeader(value = "X-User-Role", required = false) String roleHeader,
            @PathVariable UUID studentId,
            @RequestParam(defaultValue = "MONTHLY") String preset,
            @RequestParam(required = false) LocalDate from,
            @RequestParam(required = false) LocalDate to
    ) {
        return this.attendanceManagementService.getStudentAttendanceSummary(resolveActor(userIdHeader, schoolIdHeader, tenantIdHeader, emailHeader, roleHeader), studentId, preset, from, to);
    }

    private AttendanceActor resolveActor(String userIdHeader, String schoolIdHeader, String tenantIdHeader, String emailHeader, String roleHeader) {
        return this.attendanceManagementService.resolveActor(userIdHeader, schoolIdHeader, tenantIdHeader, emailHeader, roleHeader);
    }
}
