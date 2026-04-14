package com.sms.schoolops.api;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

public class StudentModuleDtos {

    // --- Profile ---

    public record StudentProfileResponse(
            UUID studentId,
            String admissionNo,
            String rollNo,
            String fullName,
            String email,
            String profilePhotoUrl,
            String address,
            String guardianName,
            String guardianPhone,
            LocalDate admittedOn,
            String className,
            String sectionName,
            String status
    ) {}

    public record StudentProfileUpdateRequest(
            String profilePhotoUrl,
            String address,
            String guardianName,
            String guardianPhone
    ) {}

    // --- Classroom / Teachers ---

    public record ClassroomDetailResponse(
            UUID classId,
            String className,
            String sectionName,
            String classTeacherName,
            List<SubjectTeacherResponse> subjects,
            List<ClassmateResponse> classmates
    ) {}

    public record SubjectTeacherResponse(
            UUID subjectId,
            String subjectName,
            String teacherName,
            String teacherEmail
    ) {}

    public record ClassmateResponse(
            UUID userId,
            String fullName,
            String rollNo,
            String profilePhotoUrl
    ) {}

    // --- Timetable ---

    public record StudentTimetableResponse(
            List<TimetableDaySchedule> schedule
    ) {}

    public record TimetableDaySchedule(
            String dayOfWeek,
            List<TimetablePeriodResponse> periods
    ) {}

    public record TimetablePeriodResponse(
            Integer periodNumber,
            String subjectName,
            String teacherName,
            String room,
            String startTime,
            String endTime
    ) {}

    // --- Attendance ---

    public record StudentAttendanceAnalyticsResponse(
            Double attendancePercentage,
            Integer totalWorkingDays,
            Integer presentCount,
            Integer absentCount,
            Integer lateCount,
            Integer excusedCount,
            List<AttendanceInsight> insights
    ) {}

    public record AttendanceInsight(
            String title,
            String detail,
            String trend // UP, DOWN, STABLE
    ) {}

    // --- Homework ---

    public record StudentHomeworkResponse(
            UUID homeworkId,
            String subjectName,
            String title,
            String description,
            LocalDate dueDate,
            String status, // PENDING, IN_PROGRESS, COMPLETED
            String teacherRemarks,
            List<String> attachments
    ) {}

    public record HomeworkStatusUpdateRequest(
            String status,
            String notes
    ) {}

    // --- Communication ---
    public record StudentCommunicationRequest(
            @jakarta.validation.constraints.NotBlank String audience, // "PRINCIPAL" or "CLASS_TEACHER"
            @jakarta.validation.constraints.NotBlank String subject,
            @jakarta.validation.constraints.NotBlank String message
    ) {}

    // --- Analytics / Results ---
    public record AbsenceReasonRequest(
            @jakarta.validation.constraints.NotNull UUID attendanceId,
            @jakarta.validation.constraints.NotBlank String reason
    ) {}

    public record StudentResultResponse(
            String examName,
            String subjectName,
            java.math.BigDecimal marksObtained,
            java.math.BigDecimal maxMarks,
            String grade,
            String academicYear
    ) {}

    // --- Library & Forum ---
    public record LibraryReservationRequest(
            @jakarta.validation.constraints.NotNull UUID resourceId
    ) {}

    public record LibraryReservationResponse(
            UUID reservationId,
            UUID resourceId,
            String title,
            String status,
            java.time.Instant reservedAt,
            java.time.Instant validUntil
    ) {}

    public record StudentForumReputationResponse(
            Integer totalUpvotes,
            Integer answersProvided,
            String currentBadge, // e.g., "NOVICE", "SCHOLAR", "EXPERT"
            Integer nextBadgeThreshold
    ) {}
}
