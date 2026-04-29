package com.sms.schoolops.api;

import com.sms.schoolops.api.StudentModuleDtos.*;
import com.sms.schoolops.security.PermissionActor;
import com.sms.schoolops.service.StudentModuleService;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/school-ops/student")
@Tag(name = "Student Module", description = "Student-facing APIs for profile, classroom, timetable, and homework.")
public class StudentModuleController {

    private final StudentModuleService studentModuleService;

    public StudentModuleController(StudentModuleService studentModuleService) {
        this.studentModuleService = studentModuleService;
    }

    @GetMapping("/profile")
    public StudentProfileResponse getProfile(
            @RequestHeader("X-User-ID") UUID userId,
            @RequestHeader("X-School-ID") UUID schoolId,
            @RequestHeader("X-Tenant-ID") UUID tenantId,
            @RequestHeader("X-User-Role") String role,
            @RequestHeader("X-User-Email") String email
    ) {
        return studentModuleService.getProfile(new PermissionActor(userId, schoolId, tenantId, email, role, ""));
    }

    @PatchMapping("/profile")
    public StudentProfileResponse updateProfile(
            @RequestHeader("X-User-ID") UUID userId,
            @RequestHeader("X-School-ID") UUID schoolId,
            @RequestHeader("X-Tenant-ID") UUID tenantId,
            @RequestHeader("X-User-Role") String role,
            @RequestHeader("X-User-Email") String email,
            @Valid @RequestBody StudentProfileUpdateRequest request
    ) {
        return studentModuleService.updateProfile(new PermissionActor(userId, schoolId, tenantId, email, role, ""), request);
    }

    @GetMapping("/classroom")
    public ClassroomDetailResponse getClassroom(
            @RequestHeader("X-User-ID") UUID userId,
            @RequestHeader("X-School-ID") UUID schoolId,
            @RequestHeader("X-Tenant-ID") UUID tenantId,
            @RequestHeader("X-User-Role") String role,
            @RequestHeader("X-User-Email") String email
    ) {
        return studentModuleService.getClassroom(new PermissionActor(userId, schoolId, tenantId, email, role, ""));
    }

    @GetMapping("/timetable")
    public StudentTimetableResponse getTimetable(
            @RequestHeader("X-User-ID") UUID userId,
            @RequestHeader("X-School-ID") UUID schoolId,
            @RequestHeader("X-Tenant-ID") UUID tenantId,
            @RequestHeader("X-User-Role") String role,
            @RequestHeader("X-User-Email") String email
    ) {
        return studentModuleService.getTimetable(new PermissionActor(userId, schoolId, tenantId, email, role, ""));
    }

    @GetMapping("/homework")
    public List<StudentHomeworkResponse> getHomework(
            @RequestHeader("X-User-ID") UUID userId,
            @RequestHeader("X-School-ID") UUID schoolId,
            @RequestHeader("X-Tenant-ID") UUID tenantId,
            @RequestHeader("X-User-Role") String role,
            @RequestHeader("X-User-Email") String email
    ) {
        return studentModuleService.getHomework(new PermissionActor(userId, schoolId, tenantId, email, role, ""));
    }

    @PostMapping("/homework/{homeworkId}/status")
    public void updateHomeworkStatus(
            @RequestHeader("X-User-ID") UUID userId,
            @RequestHeader("X-School-ID") UUID schoolId,
            @RequestHeader("X-Tenant-ID") UUID tenantId,
            @RequestHeader("X-User-Role") String role,
            @RequestHeader("X-User-Email") String email,
            @PathVariable UUID homeworkId,
            @Valid @RequestBody HomeworkStatusUpdateRequest request
    ) {
        studentModuleService.updateHomeworkStatus(new PermissionActor(userId, schoolId, tenantId, email, role, ""), homeworkId, request);
    }

    @GetMapping("/attendance/analytics")
    public StudentAttendanceAnalyticsResponse getAttendanceAnalytics(
            @RequestHeader("X-User-ID") UUID userId,
            @RequestHeader("X-School-ID") UUID schoolId,
            @RequestHeader("X-Tenant-ID") UUID tenantId,
            @RequestHeader("X-User-Role") String role,
            @RequestHeader("X-User-Email") String email
    ) {
        return studentModuleService.getAttendanceAnalytics(new PermissionActor(userId, schoolId, tenantId, email, role, ""));
    }

    @PutMapping("/attendance/absence-reason")
    public void submitAbsenceReason(
            @RequestHeader("X-User-ID") UUID userId,
            @RequestHeader("X-School-ID") UUID schoolId,
            @RequestHeader("X-Tenant-ID") UUID tenantId,
            @RequestHeader("X-User-Role") String role,
            @RequestHeader("X-User-Email") String email,
            @Valid @RequestBody AbsenceReasonRequest request
    ) {
        studentModuleService.submitAbsenceReason(new PermissionActor(userId, schoolId, tenantId, email, role, ""), request);
    }

    @GetMapping("/results")
    public List<StudentResultResponse> getResults(
            @RequestHeader("X-User-ID") UUID userId,
            @RequestHeader("X-School-ID") UUID schoolId,
            @RequestHeader("X-Tenant-ID") UUID tenantId,
            @RequestHeader("X-User-Role") String role,
            @RequestHeader("X-User-Email") String email
    ) {
        return studentModuleService.getResults(new PermissionActor(userId, schoolId, tenantId, email, role, ""));
    }

    @GetMapping("/fees")
    public List<StudentFeeRecordResponse> getFeeRecords(
            @RequestHeader("X-User-ID") UUID userId,
            @RequestHeader("X-School-ID") UUID schoolId,
            @RequestHeader("X-Tenant-ID") UUID tenantId,
            @RequestHeader("X-User-Role") String role,
            @RequestHeader("X-User-Email") String email
    ) {
        return studentModuleService.getFeeRecords(new PermissionActor(userId, schoolId, tenantId, email, role, ""));
    }

    @PostMapping("/communication")
    public void sendVoiceMessage(
            @RequestHeader("X-User-ID") UUID userId,
            @RequestHeader("X-School-ID") UUID schoolId,
            @RequestHeader("X-Tenant-ID") UUID tenantId,
            @RequestHeader("X-User-Role") String role,
            @RequestHeader("X-User-Email") String email,
            @Valid @RequestBody StudentCommunicationRequest request
    ) {
        studentModuleService.sendVoiceMessage(new PermissionActor(userId, schoolId, tenantId, email, role, ""), request);
    }

    @PostMapping("/library/reserve")
    public LibraryReservationResponse reserveLibraryResource(
            @RequestHeader("X-User-ID") UUID userId,
            @RequestHeader("X-School-ID") UUID schoolId,
            @RequestHeader("X-Tenant-ID") UUID tenantId,
            @RequestHeader("X-User-Role") String role,
            @RequestHeader("X-User-Email") String email,
            @Valid @RequestBody LibraryReservationRequest request
    ) {
        return studentModuleService.reserveLibraryResource(new PermissionActor(userId, schoolId, tenantId, email, role, ""), request);
    }

    @GetMapping("/forum/reputation")
    public StudentForumReputationResponse getForumReputation(
            @RequestHeader("X-User-ID") UUID userId,
            @RequestHeader("X-School-ID") UUID schoolId,
            @RequestHeader("X-Tenant-ID") UUID tenantId,
            @RequestHeader("X-User-Role") String role,
            @RequestHeader("X-User-Email") String email
    ) {
        return studentModuleService.getForumReputation(new PermissionActor(userId, schoolId, tenantId, email, role, ""));
    }
}
