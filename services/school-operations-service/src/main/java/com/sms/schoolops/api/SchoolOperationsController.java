package com.sms.schoolops.api;

import com.sms.schoolops.api.SchoolOperationsDtos.*;
import com.sms.schoolops.service.AIService;
import com.sms.schoolops.service.SchoolOperationsService;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/school-ops")
public class SchoolOperationsController {

    private final SchoolOperationsService schoolOperationsService;
    private final AIService aiService;

    public SchoolOperationsController(SchoolOperationsService schoolOperationsService, AIService aiService) {
        this.schoolOperationsService = schoolOperationsService;
        this.aiService = aiService;
    }

    @org.springframework.web.bind.annotation.ExceptionHandler(IllegalArgumentException.class)
    public org.springframework.http.ResponseEntity<String> handleIllegalArgument(IllegalArgumentException ex) {
        return org.springframework.http.ResponseEntity.badRequest().body(ex.getMessage());
    }

    @org.springframework.web.bind.annotation.ExceptionHandler(org.springframework.web.method.annotation.MethodArgumentTypeMismatchException.class)
    public org.springframework.http.ResponseEntity<String> handleTypeMismatch(org.springframework.web.method.annotation.MethodArgumentTypeMismatchException ex) {
        return org.springframework.http.ResponseEntity.badRequest().body("Invalid parameter: " + ex.getName());
    }

    @GetMapping("/departments")
    public List<DepartmentResponse> listDepartments(@RequestParam UUID schoolId) {
        return schoolOperationsService.listDepartments(schoolId);
    }

    @PostMapping("/departments")
    public DepartmentResponse createDepartment(@Valid @RequestBody DepartmentRequest request) {
        return schoolOperationsService.createDepartment(request);
    }

    @GetMapping("/subjects")
    public List<SubjectResponse> listSubjects(@RequestParam UUID schoolId) {
        return schoolOperationsService.listSubjects(schoolId);
    }

    @PostMapping("/subjects")
    public SubjectResponse createSubject(@Valid @RequestBody SubjectRequest request) {
        return schoolOperationsService.createSubject(request);
    }

    @GetMapping("/classes")
    public List<AcademicClassResponse> listClasses(@RequestParam UUID schoolId) {
        return schoolOperationsService.listClasses(schoolId);
    }

    @PostMapping("/classes")
    public AcademicClassResponse createClass(@Valid @RequestBody AcademicClassRequest request) {
        return schoolOperationsService.createClass(request);
    }

    @GetMapping("/users")
    public List<SchoolUserResponse> listUsers(@RequestParam UUID schoolId) {
        return schoolOperationsService.listUsers(schoolId);
    }

    @GetMapping("/students/directory")
    public List<StudentDirectoryRowResponse> listStudentDirectory(
            @RequestParam UUID schoolId,
            @RequestParam(required = false) String search,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) UUID classId,
            @RequestParam(required = false) UUID routeId,
            @RequestParam(required = false, defaultValue = "fullName") String sortBy,
            @RequestParam(required = false, defaultValue = "asc") String sortDir
    ) {
        return schoolOperationsService.listStudentDirectory(schoolId, search, status, classId, routeId, sortBy, sortDir);
    }

    @GetMapping("/students")
    public StudentsPageResponse listStudents(
            @RequestParam UUID schoolId,
            @RequestParam(required = false) String search,
            @RequestParam(required = false) UUID classId,
            @RequestParam(required = false) String section,
            @RequestParam(required = false) String transport,
            @RequestParam(required = false) String status,
            @RequestParam(required = false, defaultValue = "createdAt") String sortBy,
            @RequestParam(required = false, defaultValue = "desc") String sortDir,
            @RequestParam(required = false, defaultValue = "0") int page,
            @RequestParam(required = false, defaultValue = "20") int size
    ) {
        return schoolOperationsService.listStudents(schoolId, search, classId, section, transport, status, sortBy, sortDir, page, size);
    }

    @PostMapping("/students")
    public StudentRowResponse createStudent(@Valid @RequestBody StudentUpsertRequest request) {
        return schoolOperationsService.createStudent(request);
    }

    @PutMapping("/students/{studentId}")
    public StudentRowResponse updateStudent(@PathVariable UUID studentId, @Valid @RequestBody StudentUpsertRequest request) {
        return schoolOperationsService.updateStudent(studentId, request);
    }

    @DeleteMapping("/students/{studentId}")
    public org.springframework.http.ResponseEntity<Void> deleteStudent(@PathVariable UUID studentId, @RequestParam UUID schoolId) {
        schoolOperationsService.deleteStudent(studentId, schoolId);
        return org.springframework.http.ResponseEntity.noContent().build();
    }

    @GetMapping("/students/{studentId}/analytics")
    public StudentAnalyticsResponse getStudentAnalytics(@PathVariable UUID studentId, @RequestParam UUID schoolId) {
        return schoolOperationsService.getStudentAnalytics(schoolId, studentId);
    }

    @GetMapping("/admissions")
    public List<StudentAdmissionResponse> listAdmissions(@RequestParam UUID schoolId) {
        return schoolOperationsService.listStudentAdmissions(schoolId);
    }

    @GetMapping("/timetable")
    public List<TimetableSlotResponse> listTimetable(@RequestParam UUID schoolId) {
        return schoolOperationsService.listTimetableSlots(schoolId);
    }

    @GetMapping("/fees")
    public List<FeeRecordResponse> listFeeRecords(@RequestParam UUID schoolId) {
        return schoolOperationsService.listFeeRecords(schoolId);
    }

    @GetMapping("/attendance")
    public List<AttendanceRecordResponse> listAttendanceRecords(
            @RequestParam UUID schoolId,
            @RequestParam(required = false) UUID classId,
            @RequestParam(required = false) UUID teacherUserId,
            @RequestParam(required = false) LocalDate attendanceDate,
            @RequestParam(required = false) LocalDate fromDate,
            @RequestParam(required = false) LocalDate toDate
    ) {
        return schoolOperationsService.listAttendanceRecords(schoolId, classId, teacherUserId, attendanceDate, fromDate, toDate);
    }

    @GetMapping("/homework")
    public List<HomeworkItemResponse> listHomework(@RequestParam UUID schoolId) {
        return schoolOperationsService.listHomeworkItems(schoolId);
    }

    @GetMapping("/notices")
    public List<NoticeBoardItemResponse> listNotices(@RequestParam UUID schoolId) {
        return schoolOperationsService.listNoticeBoardItems(schoolId);
    }

    @GetMapping("/results")
    public List<ExamResultRecordResponse> listResults(@RequestParam UUID schoolId) {
        return schoolOperationsService.listExamResults(schoolId);
    }

    @GetMapping("/teacher-reports")
    public List<TeacherMonthlyReportResponse> listTeacherReports(@RequestParam UUID schoolId) {
        return schoolOperationsService.listTeacherReports(schoolId);
    }

    @GetMapping("/student-reports")
    public List<StudentMonitoringReportResponse> listStudentReports(@RequestParam UUID schoolId) {
        return schoolOperationsService.listStudentMonitoringReports(schoolId);
    }

    @GetMapping("/activities")
    public List<CoCurricularActivityResponse> listActivities(@RequestParam UUID schoolId) {
        return schoolOperationsService.listActivities(schoolId);
    }

    @GetMapping("/library")
    public List<LibraryResourceResponse> listLibraryResources(@RequestParam UUID schoolId, @RequestParam(required = false) UUID userId) {
        if (userId != null) {
            return schoolOperationsService.searchLibraryResources(new LibrarySearchRequest(schoolId, null, null, null, null, null), userId);
        }
        return schoolOperationsService.listLibraryResources(schoolId);
    }

    @PostMapping("/library/search")
    public List<LibraryResourceResponse> searchLibraryResources(@Valid @RequestBody LibrarySearchRequest request, @RequestParam(required = false) UUID userId) {
        return schoolOperationsService.searchLibraryResources(request, userId);
    }

    @PostMapping("/library/bookmark")
    public org.springframework.http.ResponseEntity<Void> toggleBookmark(@Valid @RequestBody BookmarkToggleRequest request) {
        schoolOperationsService.toggleBookmark(request);
        return org.springframework.http.ResponseEntity.ok().build();
    }

    @PostMapping("/library/view-log")
    public org.springframework.http.ResponseEntity<Void> logResourceView(@RequestParam UUID schoolId, @RequestParam UUID userId, @RequestParam UUID resourceId) {
        schoolOperationsService.logResourceView(schoolId, userId, resourceId);
        return org.springframework.http.ResponseEntity.ok().build();
    }

    @GetMapping("/library/recent")
    public List<LibraryResourceResponse> getRecentlyViewed(@RequestParam UUID schoolId, @RequestParam UUID userId) {
        return schoolOperationsService.getRecentlyViewed(schoolId, userId);
    }

    @GetMapping("/notes")
    public List<NoteShareResponse> listNoteShares(@RequestParam UUID schoolId) {
        return schoolOperationsService.listNoteShares(schoolId);
    }

    @GetMapping("/transport")
    public List<TransportRouteResponse> listTransportRoutes(@RequestParam UUID schoolId) {
        return schoolOperationsService.listTransportRoutes(schoolId);
    }

    @GetMapping("/voice-notes")
    public List<VoiceNoteResponse> listVoiceNotes(@RequestParam UUID schoolId) {
        return schoolOperationsService.listVoiceNotes(schoolId);
    }

    @GetMapping("/reminders")
    public List<ReminderResponse> listReminders(@RequestParam UUID schoolId) {
        return schoolOperationsService.listReminders(schoolId);
    }

    @GetMapping("/dashboard")
    public org.springframework.http.ResponseEntity<?> getDashboard(@RequestParam UUID schoolId) {
        if (schoolId == null) {
            return org.springframework.http.ResponseEntity.badRequest().body("schoolId must not be null");
        }
        try {
            SchoolDashboardResponse response = schoolOperationsService.getDashboard(schoolId);
            return org.springframework.http.ResponseEntity.ok(response);
        } catch (Exception e) {
            return org.springframework.http.ResponseEntity.ok(
                new SchoolDashboardResponse(
                    schoolId, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0
                )
            );
        }
    }

    @GetMapping("/teacher-workspace")
    public TeacherWorkspaceResponse getTeacherWorkspace(@RequestParam UUID schoolId, @RequestParam String email) {
        return schoolOperationsService.getTeacherWorkspace(schoolId, email);
    }

    @GetMapping("/student-workspace")
    public StudentWorkspaceResponse getStudentWorkspace(@RequestParam UUID schoolId, @RequestParam String email) {
        return schoolOperationsService.getStudentWorkspace(schoolId, email);
    }

    @GetMapping("/parent-workspace")
    public ParentWorkspaceResponse getParentWorkspace(@RequestParam UUID schoolId, @RequestParam String email) {
        return schoolOperationsService.getParentWorkspace(schoolId, email);
    }

    @PostMapping("/users")
    public SchoolUserResponse createUser(@Valid @RequestBody SchoolUserRequest request) {
        return schoolOperationsService.createUser(request);
    }

    @PostMapping("/users/{userId}/documents")
    public SchoolUserDocumentResponse addDocument(
            @PathVariable UUID userId,
            @Valid @RequestBody SchoolUserDocumentRequest request
    ) {
        return schoolOperationsService.addDocument(request, userId);
    }

    @GetMapping("/users/{userId}/documents")
    public List<SchoolUserDocumentResponse> listDocuments(@PathVariable UUID userId) {
        return schoolOperationsService.listDocuments(userId);
    }

    @PatchMapping("/users/{email}/preferences")
    public SchoolUserResponse updateUserPreferences(
            @PathVariable String email,
            @Valid @RequestBody UserPreferencesRequest request
    ) {
        return schoolOperationsService.updateUserPreferences(email, request);
    }

    @PostMapping("/admissions")
    public StudentAdmissionResponse createAdmission(@Valid @RequestBody StudentAdmissionRequest request) {
        return schoolOperationsService.createStudentAdmission(request);
    }

    @PatchMapping("/admissions/{admissionId}")
    public StudentAdmissionResponse updateAdmission(@PathVariable UUID admissionId, @Valid @RequestBody StudentAdmissionUpdateRequest request) {
        return schoolOperationsService.updateStudentAdmission(admissionId, request);
    }

    @DeleteMapping("/admissions/{admissionId}")
    public void deleteAdmission(@PathVariable UUID admissionId) {
        schoolOperationsService.deleteStudentAdmission(admissionId);
    }

    @PostMapping("/students/promote")
    public MappingResponse promoteStudent(@Valid @RequestBody PromoteStudentRequest request) {
        return schoolOperationsService.promoteStudent(request);
    }
    @PostMapping("/fees")
    public FeeRecordResponse createFeeRecord(@Valid @RequestBody FeeRecordRequest request) {
        return schoolOperationsService.createFeeRecord(request);
    }

    @PostMapping("/timetable")
    public TimetableSlotResponse createTimetable(@Valid @RequestBody TimetableSlotRequest request) {
        return schoolOperationsService.createTimetableSlot(request);
    }

    @PostMapping("/timetable/bulk")
    public java.util.List<TimetableSlotResponse> saveBulkTimetable(@Valid @RequestBody TimetableBulkRequest request) {
        return schoolOperationsService.saveBulkTimetableSlots(request);
    }

    @PostMapping("/timetable/optimize")
    public TimetableOptimizeResponse optimizeTimetable(@Valid @RequestBody TimetableOptimizeRequest request) {
        return aiService.optimizeTimetable(request);
    }

    @PostMapping("/attendance")
    public AttendanceRecordResponse createAttendanceRecord(@Valid @RequestBody AttendanceRecordRequest request) {
        return schoolOperationsService.createAttendanceRecord(request);
    }

    @PostMapping("/attendance/bulk")
    public List<AttendanceRecordResponse> upsertBulkAttendance(@Valid @RequestBody AttendanceBulkUpsertRequest request) {
        return schoolOperationsService.upsertBulkAttendance(request);
    }

    @GetMapping("/attendance/analytics")
    public AttendanceAnalyticsResponse getAttendanceAnalytics(
            @RequestParam UUID schoolId,
            @RequestParam LocalDate fromDate,
            @RequestParam LocalDate toDate
    ) {
        return schoolOperationsService.getAttendanceAnalytics(schoolId, fromDate, toDate);
    }

    @PostMapping("/homework")
    public HomeworkItemResponse createHomework(@Valid @RequestBody HomeworkItemRequest request) {
        return schoolOperationsService.createHomeworkItem(request);
    }

    @PostMapping("/notices")
    public NoticeBoardItemResponse createNotice(@Valid @RequestBody NoticeBoardItemRequest request) {
        return schoolOperationsService.createNoticeBoardItem(request);
    }

    @PostMapping("/results")
    public ExamResultRecordResponse createResult(@Valid @RequestBody ExamResultRecordRequest request) {
        return schoolOperationsService.createExamResult(request);
    }

    @PostMapping("/teacher-reports")
    public TeacherMonthlyReportResponse createTeacherReport(@Valid @RequestBody TeacherMonthlyReportRequest request) {
        return schoolOperationsService.createTeacherReport(request);
    }

    @PostMapping("/student-reports")
    public StudentMonitoringReportResponse createStudentReport(@Valid @RequestBody StudentMonitoringReportRequest request) {
        return schoolOperationsService.createStudentMonitoringReport(request);
    }

    @PostMapping("/activities")
    public CoCurricularActivityResponse createActivity(@Valid @RequestBody CoCurricularActivityRequest request) {
        return schoolOperationsService.createActivity(request);
    }

    @PostMapping("/library")
    public LibraryResourceResponse createLibraryResource(@Valid @RequestBody LibraryResourceRequest request) {
        return schoolOperationsService.createLibraryResource(request);
    }

    @PostMapping("/notes")
    public NoteShareResponse createNoteShare(@Valid @RequestBody NoteShareRequest request) {
        return schoolOperationsService.createNoteShare(request);
    }

    @GetMapping("/transport/full")
    public List<TransportRouteFull> getFullTransportDashboard(@RequestParam UUID schoolId) {
        return schoolOperationsService.getFullTransportDashboard(schoolId);
    }

    @PostMapping("/transport")
    public TransportRouteResponse createTransportRoute(@Valid @RequestBody TransportRouteRequest request) {
        return schoolOperationsService.createTransportRoute(request);
    }

    @PostMapping("/transport/stops")
    public TransportStopResponse createTransportStop(@Valid @RequestBody TransportStopRequest request) {
        return schoolOperationsService.createTransportStop(request);
    }

    @PostMapping("/transport/assign-student")
    public TransportStudentAssignmentResponse assignStudentToRoute(@Valid @RequestBody TransportStudentAssignmentRequest request) {
        return schoolOperationsService.assignStudentToRoute(request);
    }

    @DeleteMapping("/transport/assign-student")
    public org.springframework.http.ResponseEntity<Void> clearStudentTransportAssignment(@RequestParam UUID schoolId, @RequestParam UUID studentUserId) {
        schoolOperationsService.clearStudentTransportAssignment(schoolId, studentUserId);
        return org.springframework.http.ResponseEntity.noContent().build();
    }

    @PostMapping("/transport/gps")
    public TransportVehiclePositionResponse updateVehicleGps(@Valid @RequestBody TransportGpsUpdate request) {
        return schoolOperationsService.updateVehicleGps(request);
    }

    @PostMapping("/transport/pickup")
    public TransportPickupLogResponse markPickupDrop(@Valid @RequestBody TransportPickupLogRequest request) {
        return schoolOperationsService.markPickupDrop(request);
    }

    @PostMapping("/voice-notes")
    public VoiceNoteResponse createVoiceNote(@Valid @RequestBody VoiceNoteRequest request) {
        return schoolOperationsService.createVoiceNote(request);
    }

    @PostMapping("/reminders")
    public ReminderResponse createReminder(@Valid @RequestBody ReminderRequest request) {
        return schoolOperationsService.createReminder(request);
    }

    @PostMapping("/assignments/hod")
    public MappingResponse assignHod(@Valid @RequestBody MappingRequest request) {
        return schoolOperationsService.assignHod(request);
    }

    @PostMapping("/assignments/teacher-subject")
    public MappingResponse assignTeacherSubject(@Valid @RequestBody MappingRequest request) {
        return schoolOperationsService.assignTeacherSubject(request);
    }

    @PostMapping("/assignments/teacher-class")
    public MappingResponse assignTeacherClass(@Valid @RequestBody MappingRequest request) {
        return schoolOperationsService.assignTeacherClass(request);
    }

    @GetMapping("/assignments/teacher-class")
    public List<TeacherClassMappingView> listTeacherClassMappings(@RequestParam UUID schoolId) {
        return schoolOperationsService.listTeacherClassMappings(schoolId);
    }

    @PostMapping("/assignments/class-teacher")
    public MappingResponse assignClassTeacher(@Valid @RequestBody MappingRequest request) {
        return schoolOperationsService.assignClassTeacher(request);
    }

    @GetMapping("/assignments/class-teacher")
    public List<ClassTeacherMappingView> listClassTeacherMappings(@RequestParam UUID schoolId) {
        return schoolOperationsService.listClassTeacherMappings(schoolId);
    }

    @PostMapping("/assignments/student-class")
    public MappingResponse enrollStudent(@Valid @RequestBody MappingRequest request) {
        return schoolOperationsService.enrollStudent(request);
    }

    @GetMapping("/assignments/student-class")
    public List<StudentClassEnrollmentView> listStudentEnrollments(@RequestParam UUID schoolId) {
        return schoolOperationsService.listStudentEnrollments(schoolId);
    }

    @PostMapping("/assignments/student-parent")
    public StudentParentMappingResponse linkParentToStudent(@Valid @RequestBody StudentParentMappingRequest request) {
        return schoolOperationsService.linkParentToStudent(request);
    }

    // AI Endpoints
    @PostMapping("/ai/lesson-plan")
    public LessonPlanResponse generateLessonPlan(@Valid @RequestBody LessonPlanRequest request) {
        return aiService.generateLessonPlan(request);
    }

    @PostMapping("/ai/feedback")
    public FeedbackResponse generateFeedback(@RequestBody FeedbackRequest request) {
        return aiService.generateFeedback(request);
    }

    @PostMapping("/ai/visualize")
    public VisualizeResponse visualize(@RequestBody VisualizeRequest request) {
        return aiService.visualize(request);
    }

    @PostMapping("/ai/example")
    public ExampleResponse generateExamples(@RequestBody ExampleRequest request) {
        return aiService.generateExamples(request);
    }

    @GetMapping("/ai/risk-analysis")
    public RiskAnalysisResponse analyzeRisk(@RequestParam UUID studentUserId, @RequestParam UUID schoolId) {
        return aiService.analyzeRisk(studentUserId, schoolId);
    }

    @PatchMapping("/users/{userId}")
    public SchoolUserResponse updateUser(@PathVariable UUID userId, @Valid @RequestBody UserUpdateRequest request) {
        return schoolOperationsService.updateUser(userId, request);
    }

    @DeleteMapping("/users/{userId}")
    public org.springframework.http.ResponseEntity<Void> deleteUser(@PathVariable UUID userId) {
        schoolOperationsService.deleteUser(userId);
        return org.springframework.http.ResponseEntity.noContent().build();
    }

    @GetMapping("/users/{userId}/performance")
    public TeacherPerformanceResponse getTeacherPerformance(@RequestParam UUID schoolId, @PathVariable UUID userId) {
        return schoolOperationsService.getTeacherPerformance(schoolId, userId);
    }
}
