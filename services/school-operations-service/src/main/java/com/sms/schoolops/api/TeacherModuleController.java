package com.sms.schoolops.api;

import com.sms.schoolops.api.TeacherModuleDtos.*;
import com.sms.schoolops.security.PermissionActor;
import com.sms.schoolops.service.TeacherModuleService;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/v1/school-ops/teacher")
@Tag(name = "Teacher Module", description = "Teacher-facing APIs for homework, marks entry, and class management.")
public class TeacherModuleController {

    private final TeacherModuleService teacherModuleService;

    public TeacherModuleController(TeacherModuleService teacherModuleService) {
        this.teacherModuleService = teacherModuleService;
    }

    @PostMapping("/homework")
    public TeacherHomeworkResponse createHomework(
            @RequestHeader("X-User-ID") UUID userId,
            @RequestHeader("X-School-ID") UUID schoolId,
            @RequestHeader("X-Tenant-ID") UUID tenantId,
            @RequestHeader("X-User-Role") String role,
            @RequestHeader("X-User-Email") String email,
            @Valid @RequestBody TeacherHomeworkRequest request
    ) {
        return teacherModuleService.createHomework(new PermissionActor(userId, schoolId, tenantId, email, role, ""), request);
    }

    @PostMapping("/marks")
    public void enterMarks(
            @RequestHeader("X-User-ID") UUID userId,
            @RequestHeader("X-School-ID") UUID schoolId,
            @RequestHeader("X-Tenant-ID") UUID tenantId,
            @RequestHeader("X-User-Role") String role,
            @RequestHeader("X-User-Email") String email,
            @Valid @RequestBody MarksEntryRequest request
    ) {
        teacherModuleService.enterMarks(new PermissionActor(userId, schoolId, tenantId, email, role, ""), request);
    }

    @PostMapping("/behaviour")
    public void logBehaviourRemark(
            @RequestHeader("X-User-ID") UUID userId,
            @RequestHeader("X-School-ID") UUID schoolId,
            @RequestHeader("X-Tenant-ID") UUID tenantId,
            @RequestHeader("X-User-Role") String role,
            @RequestHeader("X-User-Email") String email,
            @Valid @RequestBody BehaviourRemarkRequest request
    ) {
        teacherModuleService.logBehaviourRemark(new PermissionActor(userId, schoolId, tenantId, email, role, ""), request);
    }

    @GetMapping("/workspace")
    public TeacherWorkspaceSummary getWorkspace(
            @RequestHeader("X-User-ID") UUID userId,
            @RequestHeader("X-School-ID") UUID schoolId,
            @RequestHeader("X-Tenant-ID") UUID tenantId,
            @RequestHeader("X-User-Role") String role,
            @RequestHeader("X-User-Email") String email
    ) {
        return teacherModuleService.getWorkspaceSummary(new PermissionActor(userId, schoolId, tenantId, email, role, ""));
    }

    @PostMapping("/communication")
    public void sendCommunication(
            @RequestHeader("X-User-ID") UUID userId,
            @RequestHeader("X-School-ID") UUID schoolId,
            @RequestHeader("X-Tenant-ID") UUID tenantId,
            @RequestHeader("X-User-Role") String role,
            @RequestHeader("X-User-Email") String email,
            @Valid @RequestBody TeacherCommunicationRequest request
    ) {
        teacherModuleService.sendCommunication(new PermissionActor(userId, schoolId, tenantId, email, role, ""), request);
    }

    @PostMapping("/forum/approve-answer")
    public void approveForumAnswer(
            @RequestHeader("X-User-ID") UUID userId,
            @RequestHeader("X-School-ID") UUID schoolId,
            @RequestHeader("X-Tenant-ID") UUID tenantId,
            @RequestHeader("X-User-Role") String role,
            @RequestHeader("X-User-Email") String email,
            @Valid @RequestBody ForumAnswerApprovalRequest request
    ) {
        teacherModuleService.approveForumAnswer(new PermissionActor(userId, schoolId, tenantId, email, role, ""), request);
    }

    @GetMapping("/biometric/compliance")
    public TeacherBiometricComplianceResponse getTeacherBiometricCompliance(
            @RequestHeader("X-User-ID") UUID userId,
            @RequestHeader("X-School-ID") UUID schoolId,
            @RequestHeader("X-Tenant-ID") UUID tenantId,
            @RequestHeader("X-User-Role") String role,
            @RequestHeader("X-User-Email") String email
    ) {
        return teacherModuleService.getTeacherBiometricCompliance(new PermissionActor(userId, schoolId, tenantId, email, role, ""));
    }
}
