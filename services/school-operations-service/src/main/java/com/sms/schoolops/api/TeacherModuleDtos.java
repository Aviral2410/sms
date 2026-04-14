package com.sms.schoolops.api;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

public class TeacherModuleDtos {

    // --- Homework Management ---

    public record TeacherHomeworkRequest(
            @NotNull UUID classId,
            @NotNull UUID subjectId,
            @NotBlank String title,
            @NotBlank String description,
            @NotNull LocalDate dueDate
    ) {}

    public record TeacherHomeworkResponse(
            UUID homeworkId,
            String className,
            String subjectName,
            String title,
            String description,
            LocalDate dueDate,
            Integer submissionCount
    ) {}

    // --- Marks Entry ---

    public record MarksEntryRequest(
            @NotNull UUID examId,
            @NotNull UUID subjectId,
            List<StudentMarkEntry> marks
    ) {}

    public record StudentMarkEntry(
            @NotNull UUID studentUserId,
            Double marksObtained,
            String remarks
    ) {}

    // --- Attendance Marking (Existing logic exists but simplified view for Teacher) ---

    // --- Behaviour Management ---

    public record BehaviourRemarkRequest(
            @NotNull UUID studentUserId,
            @NotBlank String category, // DISCIPLINE, PARTICIPATION, etc.
            @NotBlank String remark,
            @NotNull Integer points, // positive or negative
            Boolean escalateToAdmin
    ) {}

    // --- Teacher Workspace ---

    public record TeacherWorkspaceSummary(
            Integer totalClassesToday,
            Integer pendingHomeworkReviews,
            List<UpcomingPeriod> upcomingPeriods
    ) {}

    public record UpcomingPeriod(
            String time,
            String className,
            String subjectName,
            String room
    ) {}

    // --- Biometric Compliance ---
    public record TeacherBiometricComplianceResponse(
            String reportMonth,
            String academicYear,
            java.math.BigDecimal attendancePercentage,
            String biometricCompliance, // "COMPLIANT" or "NON_COMPLIANT"
            String principalNote
    ) {}

    // --- Communication ---
    public record TeacherCommunicationRequest(
            @NotNull UUID studentUserId,
            @NotBlank String subject,
            @NotBlank String message
    ) {}

    // --- Forum ---
    public record ForumAnswerApprovalRequest(
            @NotNull UUID answerId,
            @NotNull Boolean isCorrect
    ) {}
}
