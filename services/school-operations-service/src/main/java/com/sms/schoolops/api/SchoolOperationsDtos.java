package com.sms.schoolops.api;

import com.sms.schoolops.domain.StudentStatus;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;

public class SchoolOperationsDtos {
    public record DepartmentRequest(@NotNull UUID schoolId, @NotBlank String departmentName, @NotBlank String departmentCode) {}
    public record DepartmentResponse(UUID departmentId, UUID schoolId, String departmentName, String departmentCode, Instant createdAt) {}
    public record DepartmentUpdate(String departmentName, String departmentCode) {}
    public record SubjectRequest(@NotNull UUID schoolId, UUID departmentId, @NotBlank String subjectName, @NotBlank String subjectCode) {}
    public record SubjectResponse(UUID subjectId, UUID schoolId, UUID departmentId, String subjectName, String subjectCode, Instant createdAt) {}
    public record SubjectUpdate(String subjectName, String subjectCode, UUID departmentId) {}
    public record DepartmentHodView(UUID assignmentId, UUID departmentId, String departmentName, UUID teacherUserId, String teacherName, Instant createdAt) {}
    public record AcademicClassRequest(@NotNull UUID schoolId, @NotBlank String className, @NotBlank String sectionName, @NotBlank String academicYear) {}
    public record AcademicClassResponse(UUID classId, UUID schoolId, String className, String sectionName, String academicYear, Instant createdAt) {}
    public record SchoolUserRequest(@NotNull UUID tenantId, @NotNull UUID schoolId, String schoolCode, String schoolName, @NotBlank String fullName, @Email @NotBlank String email, @NotBlank String roleName, String accessKey) {}

    /**
     * Internal-only: upsert the school-ops user profile using the auth-service accountId as the userId.
     * This keeps X-User-ID (from JWT) aligned with school-ops domain IDs.
     */
    public record SchoolUserProfileUpsertRequest(
            @NotNull UUID userId,
            @NotNull UUID tenantId,
            @NotNull UUID schoolId,
            @NotBlank String schoolCode,
            @NotBlank String schoolName,
            @NotBlank String fullName,
            @Email @NotBlank String email,
            @NotBlank String roleName
    ) {}
    public record SchoolUserResponse(
            UUID userId, 
            UUID tenantId, 
            UUID schoolId, 
            String schoolCode, 
            String fullName, 
            String email, 
            String roleName, 
            Instant createdAt,
            String theme,
            String activeTheme,
            String vibe,
            String accentColor,
            Double glassIntensity,
            String borderRadius,
            String accessKey
    ) {}
    public record UserPreferencesRequest(
            String theme,
            String activeTheme,
            String vibe,
            String accentColor,
            Double glassIntensity,
            String borderRadius
    ) {}
    public record MappingRequest(@NotNull UUID schoolId, @NotNull UUID primaryId, @NotNull UUID secondaryId) {}
    public record MappingResponse(UUID mappingId, UUID schoolId, UUID primaryId, UUID secondaryId, Instant createdAt) {}
    public record SchoolDashboardResponse(
            UUID schoolId,
            int departmentCount,
            int subjectCount,
            int classCount,
            int teacherCount,
            int studentCount,
            int staffCount,
            int principalCount,
            int managerCount,
            int teacherSubjectMappings,
            int teacherClassMappings,
            int classTeacherMappings,
            int studentEnrollments,
            int admissionsCount,
            int timetableSlotCount,
            int feeRecordCount,
            int attendanceRecordCount,
            int homeworkCount,
            int noticeCount,
            int examResultCount,
            int teacherReportCount,
            int studentReportCount,
            int activityCount,
            int libraryResourceCount,
            int noteShareCount,
            int transportRouteCount,
            int voiceNoteCount,
            int reminderCount
    ) {}
    public record WorkspaceUser(UUID userId, String fullName, String email, String roleName) {}
    public record WorkspaceClass(UUID classId, String className, String sectionName, String academicYear) {}
    public record WorkspaceSubject(UUID subjectId, String subjectName, String subjectCode) {}
    public record StudentSubjectTeacher(String subjectName, String subjectCode, String teacherName, String teacherEmail) {}
    public record TeacherWorkspaceResponse(
            UUID schoolId,
            String schoolCode,
            WorkspaceUser teacher,
            java.util.List<WorkspaceSubject> assignedSubjects,
            java.util.List<WorkspaceClass> assignedClasses,
            java.util.List<WorkspaceClass> classTeacherOf,
            String scheduleStatus,
            String scheduleMessage
    ) {}
    public record StudentWorkspaceResponse(
            UUID schoolId,
            String schoolCode,
            WorkspaceUser student,
            WorkspaceClass enrolledClass,
            WorkspaceUser classTeacher,
            java.util.List<StudentSubjectTeacher> subjectTeachers,
            String scheduleStatus,
            String scheduleMessage
    ) {}
    public record StudentAdmissionRequest(
            @NotNull UUID schoolId, 
            UUID tenantId,
            String schoolCode,
            UUID studentUserId, 
            String studentFullName,
            String studentEmail,
            String admissionNo,
            @NotNull LocalDate admittedOn, 
            LocalDate dateOfBirth, 
            @NotBlank String guardianName, 
            @NotBlank String guardianPhone, 
            String address, 
            String previousSchool, 
            @NotNull StudentStatus admissionStatus,
            UUID classId
    ) {}

    public record StudentAdmissionUpdateRequest(
            @NotBlank String guardianName, 
            @NotBlank String guardianPhone, 
            String address, 
            String previousSchool, 
            @NotNull StudentStatus admissionStatus
    ) {}

    public record PromoteStudentRequest(
            @NotNull UUID schoolId,
            @NotNull UUID studentUserId,
            @NotNull UUID newClassId
    ) {}

    public record StudentAdmissionResponse(
            UUID admissionId,
            UUID schoolId,
            UUID studentUserId,
            String studentFullName,
            String studentEmail,
            String admissionNo,
            LocalDate admittedOn,
            LocalDate dateOfBirth,
            String guardianName,
            String guardianPhone,
            String address,
            String previousSchool,
            StudentStatus admissionStatus,
            Instant createdAt
    ) {}
    public record TimetableSlotRequest(@NotNull UUID schoolId, @NotNull UUID classId, @NotNull UUID subjectId, @NotNull UUID teacherUserId, @NotBlank String dayOfWeek, @NotBlank String startTime, @NotBlank String endTime, String roomName) {}
    public record TimetableSlotResponse(UUID slotId, UUID schoolId, UUID classId, UUID subjectId, UUID teacherUserId, String dayOfWeek, String startTime, String endTime, String roomName, Instant createdAt) {}
    public record TimetableBulkRequest(@NotNull UUID schoolId, @NotNull UUID classId, @NotNull java.util.List<TimetableSlotRequest> slots) {}
    public record TimetableOptimizeRequest(
            @NotNull UUID schoolId, 
            @NotNull UUID classId,
            Integer classesPerTeacherPerWeek,
            Integer periodLengthMinutes,
            Integer recessLengthMinutes,
            String schoolStartTime,
            java.util.List<String> workingDays
    ) {}
    public record TimetableOptimizeResponse(UUID schoolId, UUID classId, java.util.List<TimetableSlotResponse> suggestedSlots, String optimizationInsight) {}
    public record FeeRecordRequest(@NotNull UUID schoolId, @NotNull UUID studentUserId, @NotBlank String feeCategory, @NotNull BigDecimal amountDue, @NotNull BigDecimal amountPaid, @NotNull LocalDate dueDate, @NotBlank String paymentStatus) {}
    public record FeeRecordResponse(UUID feeRecordId, UUID schoolId, UUID studentUserId, String feeCategory, BigDecimal amountDue, BigDecimal amountPaid, LocalDate dueDate, String paymentStatus, Instant createdAt) {}
    public record AttendanceRecordRequest(
            @NotNull UUID schoolId,
            @NotNull UUID userId,
            @NotBlank String roleName,
            UUID classId,
            UUID teacherUserId,
            UUID subjectId,
            String attendanceMode,
            UUID timetableSlotId,
            Integer periodNumber,
            @NotNull LocalDate attendanceDate,
            @NotBlank String attendanceStatus,
            @NotBlank String markedBy
    ) {}
    public record AttendanceRecordResponse(
            UUID attendanceId,
            UUID schoolId,
            UUID userId,
            String roleName,
            UUID classId,
            UUID teacherUserId,
            UUID subjectId,
            String attendanceMode,
            UUID timetableSlotId,
            Integer periodNumber,
            LocalDate attendanceDate,
            String attendanceStatus,
            String markedBy,
            Instant recordedAt,
            Instant createdAt
    ) {}
    public record AttendanceBulkUpsertRequest(
            @NotNull UUID schoolId,
            @NotNull UUID classId,
            @NotNull UUID teacherUserId,
            UUID subjectId,
            String attendanceMode,
            UUID timetableSlotId,
            Integer periodNumber,
            @NotNull LocalDate attendanceDate,
            @NotBlank String markedBy,
            @NotNull java.util.List<AttendanceStudentStatus> entries
    ) {}
    public record AttendanceStudentStatus(@NotNull UUID userId, @NotBlank String attendanceStatus, String roleName) {}
    public record AttendanceSummaryPoint(LocalDate date, long total, long present, long absent, long late, long leave) {}
    public record AttendanceClassSummary(UUID classId, String className, String sectionName, long total, long present, long absent) {}
    public record AttendanceTeacherSummary(UUID teacherUserId, String teacherName, long totalMarked) {}
    public record AttendanceAnalyticsResponse(
            java.util.List<AttendanceSummaryPoint> trend,
            java.util.List<AttendanceClassSummary> byClass,
            java.util.List<AttendanceTeacherSummary> byTeacher
    ) {}
    public record TeacherClassMappingView(UUID mappingId, UUID schoolId, UUID teacherUserId, UUID classId, Instant createdAt) {}
    public record ClassTeacherMappingView(UUID mappingId, UUID schoolId, UUID teacherUserId, UUID classId, Instant createdAt) {}
    public record TeacherSubjectMappingView(UUID mappingId, UUID schoolId, UUID teacherUserId, UUID subjectId, Instant createdAt) {}
    public record ClassSubjectTeacherMappingView(UUID mappingId, UUID schoolId, UUID classId, UUID subjectId, UUID teacherUserId, Instant createdAt) {}
    public record StudentClassEnrollmentView(UUID enrollmentId, UUID schoolId, UUID studentUserId, UUID classId, Instant createdAt) {}
    public record HomeworkItemRequest(@NotNull UUID schoolId, @NotNull UUID classId, @NotNull UUID subjectId, @NotNull UUID teacherUserId, @NotBlank String title, @NotBlank String description, @NotNull LocalDate dueDate) {}
    public record HomeworkItemResponse(UUID homeworkId, UUID schoolId, UUID classId, UUID subjectId, UUID teacherUserId, String title, String description, LocalDate dueDate, Instant createdAt) {}
    public record NoticeBoardItemRequest(@NotNull UUID schoolId, @NotBlank String title, @NotBlank String message, @NotBlank String audience, Instant publishedAt) {}
    public record NoticeBoardItemResponse(UUID noticeId, UUID schoolId, String title, String message, String audience, Instant publishedAt, Instant createdAt) {}
    public record ExamResultRecordRequest(@NotNull UUID schoolId, @NotNull UUID studentUserId, @NotNull UUID subjectId, @NotBlank String examName, @NotBlank String academicYear, @NotNull BigDecimal marksObtained, @NotNull BigDecimal maxMarks, String grade) {}
    public record ExamResultRecordResponse(UUID resultId, UUID schoolId, UUID studentUserId, UUID subjectId, String examName, String academicYear, BigDecimal marksObtained, BigDecimal maxMarks, String grade, Instant createdAt) {}

    // Academics: Exams (schedule-first model)
    public record ExamCreateRequest(
            @NotNull UUID schoolId,
            @NotBlank String examName,
            @NotBlank String academicYear,
            String term,
            LocalDate startDate,
            LocalDate endDate
    ) {}

    public record ExamResponse(
            UUID examId,
            UUID schoolId,
            String examName,
            String academicYear,
            String term,
            LocalDate startDate,
            LocalDate endDate,
            String status,
            Instant createdAt,
            Instant publishedAt
    ) {}

    public record ExamScheduleItemCreateRequest(
            @NotNull UUID schoolId,
            @NotNull UUID classId,
            @NotNull UUID subjectId,
            @NotNull LocalDate examDate,
            String startTime,
            String endTime,
            String roomName,
            @NotNull BigDecimal maxMarks,
            BigDecimal passMarks
    ) {}

    public record ExamScheduleItemResponse(
            UUID scheduleItemId,
            UUID schoolId,
            UUID examId,
            UUID classId,
            UUID subjectId,
            LocalDate examDate,
            String startTime,
            String endTime,
            String roomName,
            BigDecimal maxMarks,
            BigDecimal passMarks,
            Instant createdAt
    ) {}

    public record ExamMarkUpsertRequest(
            @NotNull UUID schoolId,
            UUID scheduleItemId,
            @NotNull UUID studentUserId,
            @NotNull UUID subjectId,
            @NotNull BigDecimal marksObtained,
            @NotNull BigDecimal maxMarks,
            String grade
    ) {}

    public record ExamMarkResponse(
            UUID markId,
            UUID schoolId,
            UUID examId,
            UUID scheduleItemId,
            UUID studentUserId,
            UUID subjectId,
            BigDecimal marksObtained,
            BigDecimal maxMarks,
            String grade,
            Instant createdAt,
            Instant updatedAt
    ) {}

    public record ReportCardEntry(
            UUID subjectId,
            BigDecimal marksObtained,
            BigDecimal maxMarks,
            BigDecimal percentage,
            String grade
    ) {}

    public record StudentReportCardResponse(
            UUID examId,
            UUID schoolId,
            UUID studentUserId,
            String examName,
            String academicYear,
            String term,
            BigDecimal totalMarksObtained,
            BigDecimal totalMaxMarks,
            BigDecimal overallPercentage,
            String overallGrade,
            java.util.List<ReportCardEntry> entries
    ) {}

    public record TeacherMonthlyReportRequest(@NotNull UUID schoolId, @NotNull UUID teacherUserId, @NotBlank String reportMonth, @NotBlank String academicYear, @NotNull Integer classesHandled, @NotNull BigDecimal attendancePercentage, @NotBlank String biometricCompliance, String principalNote) {}
    public record TeacherMonthlyReportResponse(UUID reportId, UUID schoolId, UUID teacherUserId, String reportMonth, String academicYear, Integer classesHandled, BigDecimal attendancePercentage, String biometricCompliance, String principalNote, Instant createdAt) {}
    public record StudentMonitoringReportRequest(@NotNull UUID schoolId, @NotNull UUID studentUserId, @NotBlank String reportMonth, @NotBlank String academicYear, @NotNull BigDecimal attendancePercentage, String academicNote, String behaviourNote, String wellbeingNote) {}
    public record StudentMonitoringReportResponse(UUID reportId, UUID schoolId, UUID studentUserId, String reportMonth, String academicYear, BigDecimal attendancePercentage, String academicNote, String behaviourNote, String wellbeingNote, Instant createdAt) {}
    public record StudentDirectoryRowResponse(
            UUID studentUserId,
            String fullName,
            String email,
            Instant createdAt,
            UUID admissionId,
            String admissionNo,
            LocalDate admittedOn,
            String admissionStatus,
            String guardianName,
            String guardianPhone,
            UUID classId,
            String className,
            String sectionName,
            UUID routeId,
            String routeName,
            UUID stopId,
            String stopName,
            String latestReportMonth,
            String latestReportAcademicYear,
            BigDecimal latestAttendancePercentage,
            String latestAcademicNote,
            String latestBehaviourNote,
            String latestWellbeingNote
    ) {}
    public record StudentsPageResponse(
            java.util.List<StudentRowResponse> items,
            long total,
            int page,
            int size,
            boolean hasMore
    ) {}
    public record StudentRowResponse(
            UUID studentUserId,
            UUID schoolId,
            UUID admissionId,
            String fullName,
            String email,
            String admissionNo,
            String rollNo,
            String className,
            String sectionName,
            UUID classId,
            String classTeacherName,
            String guardianName,
            String contact,
            String transportStatus,
            UUID routeId,
            String routeName,
            UUID stopId,
            String status,
            Instant createdAt
    ) {}
    public record StudentUpsertRequest(
            @NotNull UUID schoolId,
            UUID studentUserId,
            @NotBlank String fullName,
            @Email @NotBlank String email,
            @NotBlank String admissionNo,
            String rollNo,
            @NotBlank String guardianName,
            @NotBlank String contact,
            String address,
            String previousSchool,
            @NotNull StudentStatus admissionStatus,
            UUID classId,
            UUID routeId,
            UUID stopId
    ) {}
    public record StudentAnalyticsPoint(String label, BigDecimal value) {}
    public record StudentAnalyticsResponse(
            UUID studentUserId,
            BigDecimal attendancePercentage,
            java.util.List<StudentAnalyticsPoint> attendanceTrend,
            java.util.List<StudentAnalyticsPoint> academicProgress,
            String behaviourSummary,
            String remarksSummary
    ) {}
    public record CoCurricularActivityRequest(@NotNull UUID schoolId, @NotBlank String title, @NotBlank String activityType, @NotNull LocalDate eventDate, UUID coordinatorUserId, String description) {}
    public record CoCurricularActivityResponse(UUID activityId, UUID schoolId, String title, String activityType, LocalDate eventDate, UUID coordinatorUserId, String description, Instant createdAt) {}
    public record LibraryResourceRequest(
            @NotNull UUID schoolId, 
            @NotBlank String title, 
            @NotBlank String resourceType, 
            String authorName, 
            String accessUrl,
            String description,
            String subject,
            String gradeLevel,
            String tags,
            UUID uploadedByUserId,
            Long fileSize
    ) {}
    public record LibraryResourceResponse(
            UUID resourceId, 
            UUID schoolId, 
            String title, 
            String resourceType, 
            String authorName, 
            String accessUrl,
            String description,
            String subject,
            String gradeLevel,
            String tags,
            UUID uploadedByUserId,
            Long fileSize,
            Instant createdAt,
            boolean isBookmarked,
            long viewCount
    ) {}
    public record NoteShareRequest(@NotNull UUID schoolId, @NotNull UUID sharedByUserId, UUID classId, UUID subjectId, @NotBlank String title, @NotBlank String accessUrl) {}
    public record NoteShareResponse(UUID noteId, UUID schoolId, UUID sharedByUserId, UUID classId, UUID subjectId, String title, String accessUrl, Instant createdAt) {}
    public record TransportRouteRequest(@NotNull UUID schoolId, @NotBlank String routeName, @NotBlank String vehicleNumber, @NotBlank String driverName, @NotBlank String driverPhone, String attendantName, String status, Integer capacity, String conductorName, String conductorPhone) {}
    public record TransportRouteResponse(UUID routeId, UUID schoolId, String routeName, String vehicleNumber, String driverName, String driverPhone, String attendantName, String status, Integer capacity, String conductorName, String conductorPhone, Instant createdAt) {}
    public record TransportStopRequest(@NotNull UUID schoolId, @NotNull UUID routeId, @NotBlank String stopName, @NotNull Integer stopOrder, BigDecimal latitude, BigDecimal longitude, String pickupTime, String dropTime) {}
    public record TransportStopResponse(UUID stopId, UUID schoolId, UUID routeId, String stopName, Integer stopOrder, BigDecimal latitude, BigDecimal longitude, String pickupTime, String dropTime, Instant createdAt) {}
    public record TransportStudentAssignmentRequest(@NotNull UUID schoolId, @NotNull UUID studentUserId, @NotNull UUID routeId, UUID stopId) {}
    public record TransportStudentAssignmentResponse(UUID assignmentId, UUID schoolId, UUID studentUserId, UUID routeId, UUID stopId, Instant createdAt) {}
    public record TransportGpsUpdate(@NotNull UUID schoolId, @NotNull UUID routeId, @NotNull BigDecimal latitude, @NotNull BigDecimal longitude, BigDecimal speed, BigDecimal heading) {}
    public record TransportVehiclePositionResponse(UUID positionId, UUID schoolId, UUID routeId, BigDecimal latitude, BigDecimal longitude, BigDecimal speed, BigDecimal heading, Instant recordedAt) {}
    public record TransportPickupLogRequest(@NotNull UUID schoolId, @NotNull UUID routeId, @NotNull UUID studentUserId, UUID stopId, @NotBlank String action, @NotBlank String markedBy, @NotNull LocalDate tripDate) {}
    public record TransportPickupLogResponse(UUID logId, UUID schoolId, UUID routeId, UUID studentUserId, UUID stopId, String action, String markedBy, LocalDate tripDate, Instant markedAt) {}
    public record TransportRouteFull(
        TransportRouteResponse route,
        java.util.List<TransportStopResponse> stops,
        java.util.List<TransportStudentAssignmentResponse> assignments,
        TransportVehiclePositionResponse latestPosition
    ) {}
    public record VoiceNoteRequest(@NotNull UUID schoolId, UUID relatedUserId, @NotBlank String audience, @NotBlank String title, String transcript, String audioUrl) {}
    public record VoiceNoteResponse(UUID voiceNoteId, UUID schoolId, UUID relatedUserId, String audience, String title, String transcript, String audioUrl, String translations, Instant createdAt) {}
    public record StudentParentMappingRequest(@NotNull UUID schoolId, @NotNull UUID studentUserId, @NotNull UUID parentUserId, @NotBlank String relationship) {}
    public record StudentParentMappingResponse(UUID mappingId, UUID studentUserId, UUID parentUserId, String relationship, Instant createdAt) {}
    public record ParentWorkspaceResponse(
            UUID schoolId,
            String schoolCode,
            WorkspaceUser parent,
            java.util.List<StudentWorkspaceResponse> children,
            java.util.List<VoiceNoteResponse> recentVoiceNotes
    ) {}
    public record ReminderRequest(@NotNull UUID schoolId, @NotBlank String reminderType, UUID targetUserId, @NotBlank String message, @NotNull Instant dueAt, @NotBlank String reminderStatus) {}
    public record ReminderResponse(UUID reminderId, UUID schoolId, String reminderType, UUID targetUserId, String message, Instant dueAt, String reminderStatus, Instant createdAt) {}
    public record LessonPlanRequest(@NotNull UUID schoolId, @NotNull UUID subjectId, @NotBlank String topic, String gradeLevel, String additionalInstructions) {}
    public record LessonPlanResponse(String content, java.util.List<String> objectives, java.util.List<String> materials, String estimatedDuration) {}
    public record FeedbackRequest(@NotNull UUID studentUserId, @NotNull UUID schoolId, @NotBlank String category, String context) {}
    public record FeedbackResponse(String suggestion, String tone, java.util.List<String> improvements) {}
    public record RiskAnalysisResponse(UUID studentUserId, String riskLevel, String reason, java.util.List<String> suggestedActions) {}
    
    // Document Upload DTOs
    public record SchoolUserDocumentResponse(UUID documentId, UUID userId, String documentType, String documentName, String accessUrl, Instant createdAt) {}
    public record SchoolUserDocumentRequest(@NotNull UUID schoolId, @NotBlank String documentType, @NotBlank String documentName, @NotBlank String accessUrl) {}

    public record UserUpdateRequest(
            String fullName,
            String email,
            String roleName,
            Boolean active
    ) {}

    public record TeacherPerformanceResponse(
            UUID teacherUserId,
            int totalClassesAssigned,
            int totalSubjectsAssigned,
            double attendanceRate,
            int homeworksPosed,
            int reportsFiled,
            String averageGrade,
            String performanceVibe // EXCELLENT | GOOD | NEEDS_IMPROVEMENT
    ) {}

    // Library Search & Analytics DTOs
    public record LibrarySearchRequest(
            @NotNull UUID schoolId,
            String query,
            String resourceType,
            String subject,
            String gradeLevel,
            Boolean onlyBookmarked
    ) {}

    public record BookmarkToggleRequest(@NotNull UUID schoolId, @NotNull UUID userId, @NotNull UUID resourceId) {}

    // ── AI Learning Mode DTOs ────────────────────────────────────────────────

    /**
     * A single step in a step-by-step breakdown visualization.
     * icon: an emoji or icon hint for the UI; visual: optional ASCII/unicode diagram.
     */
    public record VisualizationStep(
            int stepNumber,
            String heading,
            String explanation,
            String icon,
            String visual,
            String tip
    ) {}

    public record VisualizationElement(
            String type,      // arrow | object | label | motion
            String name,
            String direction,
            String note
    ) {}

    public record VisualizationStepDetail(
            int step,
            String title,
            String description,
            java.util.List<VisualizationElement> visualElements
    ) {}

    public record ConceptMapNode(
            String id,
            String label
    ) {}

    public record ConceptMapConnection(
            String from,
            String to,
            String relationship
    ) {}

    public record ConceptMapData(
            java.util.List<ConceptMapNode> nodes,
            java.util.List<ConceptMapConnection> connections
    ) {}

    public record SimulationObject(
            String name,
            String type,
            java.util.Map<String, Object> properties
    ) {}

    public record SimulationForce(
            String source,
            String target,
            String magnitudeRelation,
            String direction
    ) {}

    public record SimulationData(
            java.util.List<SimulationObject> objects,
            java.util.List<SimulationForce> forces
    ) {}

    public record FlowDiagramStage(
            String stage,
            String description
    ) {}

    public record RealWorldExample(
            String title,
            String explanation
    ) {}

    public record StructuredVisualization(
            String conceptTitle,
            String summary,
            String subject,
            String difficultyLevel,
            java.util.List<VisualizationStepDetail> stepByStepVisualization,
            ConceptMapData conceptMap,
            SimulationData simulation,
            java.util.List<FlowDiagramStage> flowDiagram,
            java.util.List<RealWorldExample> realWorldExamples
    ) {}

    /**
     * Base plan: rule-based breakdown (always present).
     * Premium plan (LLM): richer explanation, multiple approaches, deeper steps.
     */
    public record VisualizeResponse(
            String title,
            String summary,
            String subject,
            String level,
            java.util.List<VisualizationStep> steps,
            java.util.List<String> approaches,     // premium-only via LLM; empty for base
            java.util.List<String> tags,
            boolean llmEnhanced,                    // true if LLM was used
            String diagramType,                    // NONE | MIND_MAP | FLOWCHART
            String diagramDefinition,              // Mermaid syntax script
            StructuredVisualization structuredVisualization,
            com.fasterxml.jackson.databind.JsonNode tutorResponse
    ) {}

    public record VisualizeRequest(
            @NotBlank String question,
            String subject,
            String level,          // BEGINNER | STANDARD | ADVANCED
            String visualizationStyle, // STEP_LIST | SUMMARY | KEY_POINTS | MIND_MAP | FLOWCHART | COMPARISON | SCIENTIFIC_PLOT
            boolean premiumRequest // client signals it wants LLM premium features
    ) {}

    /**
     * A worked example generated for a concept.
     */
    public record AiExample(
            String title,
            String scenario,
            String solution,
            String difficulty  // EASY | MEDIUM | HARD
    ) {}

    /**
     * Base plan: 1 rule-based example (no LLM).
     * Premium plan: 3+ LLM-generated examples with explanations.
     */
    public record ExampleResponse(
            java.util.List<AiExample> examples,
            java.util.List<String> relatedTopics,
            boolean llmEnhanced
    ) {}

    public record ExampleRequest(
            @NotBlank String question,
            String context,
            int count,             // how many examples requested
            boolean premiumRequest
    ) {}
    // ── Forum DTOs ─────────────────────────────────────────────────────────

    public record ForumQuestionRequest(
            @NotNull UUID schoolId,
            @NotNull UUID authorId,
            @NotBlank String authorName,
            @NotBlank String title,
            @NotBlank String content,
            String subject
    ) {}

    public record ForumQuestionResponse(
            UUID questionId,
            UUID schoolId,
            UUID authorId,
            String authorName,
            String title,
            String content,
            String subject,
            String status,
            Integer upvotes,
            int answerCount,
            Instant createdAt,
            Instant updatedAt
    ) {}

    public record ForumAnswerRequest(
            @NotNull UUID questionId,
            @NotNull UUID authorId,
            @NotBlank String authorName,
            @NotBlank String content
    ) {}

    public record ForumAnswerResponse(
            UUID answerId,
            UUID questionId,
            UUID authorId,
            String authorName,
            String content,
            Boolean isCorrect,
            Integer upvotes,
            String status,
            Instant createdAt
    ) {}

    public record ForumVoteRequest(
            @NotNull UUID targetId,
            @NotNull UUID voterId,
            @NotNull Integer voteType // 1 or -1
    ) {}

    public record ForumFlagRequest(
            @NotNull UUID targetId,
            @NotNull UUID reporterId,
            @NotBlank String reason
    ) {}

    public record ForumLeaderboardEntry(
            UUID userId,
            String fullName,
            String roleName,
            long points,
            int rank
    ) {}

    public record ForumLeaderboardResponse(
            UUID schoolId,
            String period, // WEEKLY | MONTHLY | ALL_TIME
            java.util.List<ForumLeaderboardEntry> entries
    ) {}
}
