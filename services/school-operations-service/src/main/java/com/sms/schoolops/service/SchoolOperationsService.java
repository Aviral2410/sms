package com.sms.schoolops.service;

import com.sms.common.exception.ForbiddenException;
import com.sms.common.exception.NotFoundException;
import com.sms.schoolops.api.SchoolOperationsDtos.*;
import com.sms.schoolops.domain.AcademicClassEntity;
import com.sms.schoolops.domain.ClassSubjectTeacherMappingEntity;
import com.sms.schoolops.domain.AttendanceRecordEntity;
import com.sms.schoolops.domain.ClassTeacherMappingEntity;
import com.sms.schoolops.domain.CoCurricularActivityEntity;
import com.sms.schoolops.domain.DepartmentEntity;
import com.sms.schoolops.domain.DepartmentHodAssignmentEntity;
import com.sms.schoolops.domain.ExamResultRecordEntity;
import com.sms.schoolops.domain.FeeRecordEntity;
import com.sms.schoolops.domain.HomeworkItemEntity;
import com.sms.schoolops.domain.LibraryResourceEntity;
import com.sms.schoolops.domain.NoteShareEntity;
import com.sms.schoolops.domain.NoticeBoardItemEntity;
import com.sms.schoolops.domain.ReminderEntity;
import com.sms.schoolops.domain.SchoolUserDocumentEntity;
import com.sms.schoolops.domain.SchoolUserEntity;
import com.sms.schoolops.domain.StudentAdmissionEntity;
import com.sms.schoolops.domain.StudentClassEnrollmentEntity;
import com.sms.schoolops.domain.StudentMonitoringReportEntity;
import com.sms.schoolops.domain.StudentParentMappingEntity;
import com.sms.schoolops.domain.SubjectEntity;
import com.sms.schoolops.domain.TeacherClassMappingEntity;
import com.sms.schoolops.domain.TeacherMonthlyReportEntity;
import com.sms.schoolops.domain.TeacherSubjectMappingEntity;
import com.sms.schoolops.domain.TimetableSlotEntity;
import com.sms.schoolops.domain.TransportPickupLogEntity;
import com.sms.schoolops.domain.TransportRouteEntity;
import com.sms.schoolops.domain.TransportStopEntity;
import com.sms.schoolops.domain.TransportStudentAssignmentEntity;
import com.sms.schoolops.domain.TransportVehiclePositionEntity;
import com.sms.schoolops.domain.VoiceNoteEntity;
import com.sms.schoolops.event.MqttEventPublisher;
import com.sms.schoolops.repository.AcademicClassRepository;
import com.sms.schoolops.repository.ClassSubjectTeacherMappingRepository;
import com.sms.schoolops.repository.AttendanceRecordRepository;
import com.sms.schoolops.repository.ClassTeacherMappingRepository;
import com.sms.schoolops.repository.CoCurricularActivityRepository;
import com.sms.schoolops.repository.DepartmentHodAssignmentRepository;
import com.sms.schoolops.repository.DepartmentRepository;
import com.sms.schoolops.repository.ExamResultRecordRepository;
import com.sms.schoolops.repository.FeeRecordRepository;
import com.sms.schoolops.repository.HomeworkItemRepository;
import com.sms.schoolops.repository.LibraryResourceRepository;
import com.sms.schoolops.repository.NoteShareRepository;
import com.sms.schoolops.repository.NoticeBoardItemRepository;
import com.sms.schoolops.repository.ReminderRepository;
import com.sms.schoolops.repository.SchoolUserDocumentRepository;
import com.sms.schoolops.repository.SchoolUserRepository;
import com.sms.schoolops.repository.StudentAdmissionRepository;
import com.sms.schoolops.repository.StudentClassEnrollmentRepository;
import com.sms.schoolops.repository.StudentMonitoringReportRepository;
import com.sms.schoolops.repository.StudentParentMappingRepository;
import com.sms.schoolops.repository.SubjectRepository;
import com.sms.schoolops.repository.TeacherClassMappingRepository;
import com.sms.schoolops.repository.TeacherMonthlyReportRepository;
import com.sms.schoolops.repository.TeacherSubjectMappingRepository;
import com.sms.schoolops.repository.TimetableSlotRepository;
import com.sms.schoolops.repository.TransportPickupLogRepository;
import com.sms.schoolops.repository.TransportRouteRepository;
import com.sms.schoolops.repository.TransportStopRepository;
import com.sms.schoolops.repository.TransportStudentAssignmentRepository;
import com.sms.schoolops.repository.TransportVehiclePositionRepository;
import com.sms.schoolops.repository.ResourceBookmarkRepository;
import com.sms.schoolops.repository.ResourceViewLogRepository;
import com.sms.schoolops.repository.VoiceNoteRepository;
import com.sms.schoolops.security.TenantContext;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Instant;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Objects;
import java.util.Optional;
import java.util.UUID;
import java.util.function.Function;
import java.util.stream.Collectors;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.client.RestClient;

@Service
public class SchoolOperationsService {
    private static final Logger logger = LoggerFactory.getLogger(SchoolOperationsService.class);
    private final DepartmentRepository departmentRepository;
    private final SubjectRepository subjectRepository;
    private final AcademicClassRepository academicClassRepository;
    private final SchoolUserRepository schoolUserRepository;
    private final DepartmentHodAssignmentRepository departmentHodAssignmentRepository;
    private final TeacherSubjectMappingRepository teacherSubjectMappingRepository;
    private final TeacherClassMappingRepository teacherClassMappingRepository;
    private final ClassTeacherMappingRepository classTeacherMappingRepository;
    private final StudentClassEnrollmentRepository studentClassEnrollmentRepository;
    private final StudentAdmissionRepository studentAdmissionRepository;
    private final TimetableSlotRepository timetableSlotRepository;
    private final ClassSubjectTeacherMappingRepository classSubjectTeacherMappingRepository;
    private final FeeRecordRepository feeRecordRepository;
    private final AttendanceRecordRepository attendanceRecordRepository;
    private final HomeworkItemRepository homeworkItemRepository;
    private final NoticeBoardItemRepository noticeBoardItemRepository;
    private final ExamResultRecordRepository examResultRecordRepository;
    private final TeacherMonthlyReportRepository teacherMonthlyReportRepository;
    private final StudentMonitoringReportRepository studentMonitoringReportRepository;
    private final CoCurricularActivityRepository coCurricularActivityRepository;
    private final LibraryResourceRepository libraryResourceRepository;
    private final NoteShareRepository noteShareRepository;
    private final TransportRouteRepository transportRouteRepository;
    private final VoiceNoteRepository voiceNoteRepository;
    private final ReminderRepository reminderRepository;
    private final StudentParentMappingRepository parentMappingRepository;
    private final TransportStopRepository transportStopRepository;
    private final TransportStudentAssignmentRepository transportStudentAssignmentRepository;
    private final TransportVehiclePositionRepository transportVehiclePositionRepository;
    private final TransportPickupLogRepository transportPickupLogRepository;
    private final SchoolUserDocumentRepository schoolUserDocumentRepository;
    private final ResourceBookmarkRepository resourceBookmarkRepository;
    private final ResourceViewLogRepository resourceViewLogRepository;
    private final MqttEventPublisher mqttEventPublisher;
    private final RestClient authRestClient;
    private final RestClient communicationRestClient;
    private final SubscriptionService subscriptionService;

    public SchoolOperationsService(DepartmentRepository departmentRepository, SubjectRepository subjectRepository, AcademicClassRepository academicClassRepository, SchoolUserRepository schoolUserRepository, DepartmentHodAssignmentRepository departmentHodAssignmentRepository, TeacherSubjectMappingRepository teacherSubjectMappingRepository, TeacherClassMappingRepository teacherClassMappingRepository, ClassTeacherMappingRepository classTeacherMappingRepository, StudentClassEnrollmentRepository studentClassEnrollmentRepository, StudentAdmissionRepository studentAdmissionRepository, TimetableSlotRepository timetableSlotRepository, ClassSubjectTeacherMappingRepository classSubjectTeacherMappingRepository, FeeRecordRepository feeRecordRepository, AttendanceRecordRepository attendanceRecordRepository, HomeworkItemRepository homeworkItemRepository, NoticeBoardItemRepository noticeBoardItemRepository, ExamResultRecordRepository examResultRecordRepository, TeacherMonthlyReportRepository teacherMonthlyReportRepository, StudentMonitoringReportRepository studentMonitoringReportRepository, CoCurricularActivityRepository coCurricularActivityRepository, LibraryResourceRepository libraryResourceRepository, NoteShareRepository noteShareRepository, TransportRouteRepository transportRouteRepository, VoiceNoteRepository voiceNoteRepository, ReminderRepository reminderRepository, StudentParentMappingRepository parentMappingRepository, TransportStopRepository transportStopRepository, TransportStudentAssignmentRepository transportStudentAssignmentRepository, TransportVehiclePositionRepository transportVehiclePositionRepository, TransportPickupLogRepository transportPickupLogRepository, SchoolUserDocumentRepository schoolUserDocumentRepository, ResourceBookmarkRepository resourceBookmarkRepository, ResourceViewLogRepository resourceViewLogRepository, MqttEventPublisher mqttEventPublisher, SubscriptionService subscriptionService, RestClient.Builder restClientBuilder, @Value(value="${app.auth-service-url}") String authServiceUrl, @Value(value="${app.communication-service-url}") String communicationServiceUrl) {
        this.departmentRepository = departmentRepository;
        this.subjectRepository = subjectRepository;
        this.academicClassRepository = academicClassRepository;
        this.schoolUserRepository = schoolUserRepository;
        this.departmentHodAssignmentRepository = departmentHodAssignmentRepository;
        this.teacherSubjectMappingRepository = teacherSubjectMappingRepository;
        this.teacherClassMappingRepository = teacherClassMappingRepository;
        this.classTeacherMappingRepository = classTeacherMappingRepository;
        this.studentClassEnrollmentRepository = studentClassEnrollmentRepository;
        this.studentAdmissionRepository = studentAdmissionRepository;
        this.timetableSlotRepository = timetableSlotRepository;
        this.classSubjectTeacherMappingRepository = classSubjectTeacherMappingRepository;
        this.feeRecordRepository = feeRecordRepository;
        this.attendanceRecordRepository = attendanceRecordRepository;
        this.homeworkItemRepository = homeworkItemRepository;
        this.noticeBoardItemRepository = noticeBoardItemRepository;
        this.examResultRecordRepository = examResultRecordRepository;
        this.teacherMonthlyReportRepository = teacherMonthlyReportRepository;
        this.studentMonitoringReportRepository = studentMonitoringReportRepository;
        this.coCurricularActivityRepository = coCurricularActivityRepository;
        this.libraryResourceRepository = libraryResourceRepository;
        this.noteShareRepository = noteShareRepository;
        this.transportRouteRepository = transportRouteRepository;
        this.voiceNoteRepository = voiceNoteRepository;
        this.reminderRepository = reminderRepository;
        this.parentMappingRepository = parentMappingRepository;
        this.transportStopRepository = transportStopRepository;
        this.transportStudentAssignmentRepository = transportStudentAssignmentRepository;
        this.transportVehiclePositionRepository = transportVehiclePositionRepository;
        this.transportPickupLogRepository = transportPickupLogRepository;
        this.schoolUserDocumentRepository = schoolUserDocumentRepository;
        this.resourceBookmarkRepository = resourceBookmarkRepository;
        this.resourceViewLogRepository = resourceViewLogRepository;
        this.mqttEventPublisher = mqttEventPublisher;
        this.subscriptionService = subscriptionService;
        this.authRestClient = restClientBuilder.baseUrl(authServiceUrl).build();
        this.communicationRestClient = restClientBuilder.baseUrl(communicationServiceUrl).build();
    }

    public List<DepartmentResponse> listDepartments(UUID schoolId) {
        return this.departmentRepository.findBySchoolIdOrderByDepartmentNameAsc(schoolId).stream().map(d -> new DepartmentResponse(d.getDepartmentId(), d.getSchoolId(), d.getDepartmentName(), d.getDepartmentCode(), d.getCreatedAt())).toList();
    }

    public List<SubjectResponse> listSubjects(UUID schoolId) {
        return this.subjectRepository.findBySchoolIdOrderBySubjectNameAsc(schoolId).stream().map(s -> new SubjectResponse(s.getSubjectId(), s.getSchoolId(), s.getDepartmentId(), s.getSubjectName(), s.getSubjectCode(), s.getCreatedAt())).toList();
    }

    public List<AcademicClassResponse> listClasses(UUID schoolId) {
        return this.academicClassRepository.findBySchoolIdOrderByClassNameAscSectionNameAsc(schoolId).stream().map(c -> new AcademicClassResponse(c.getClassId(), c.getSchoolId(), c.getClassName(), c.getSectionName(), c.getAcademicYear(), c.getCreatedAt())).toList();
    }

    public List<SchoolUserResponse> listUsers(UUID schoolId) {
        return this.schoolUserRepository.findBySchoolIdOrderByRoleNameAscFullNameAsc(schoolId).stream().map(u -> new SchoolUserResponse(u.getUserId(), u.getTenantId(), u.getSchoolId(), u.getSchoolCode(), u.getFullName(), u.getEmail(), u.getRoleName(), u.getCreatedAt(), u.getTheme(), u.getActiveTheme(), u.getVibe(), u.getAccentColor(), u.getGlassIntensity(), u.getBorderRadius(), null)).toList();
    }

    public List<StudentDirectoryRowResponse> listStudentDirectory(UUID schoolId, String search, String status, UUID classId, UUID routeId, String sortBy, String sortDir) {
        List<SchoolUserEntity> studentUsers = this.schoolUserRepository.findBySchoolIdOrderByRoleNameAscFullNameAsc(schoolId).stream()
                .filter(user -> "STUDENT".equalsIgnoreCase(user.getRoleName()))
                .filter(user -> user.getActive() == null || Boolean.TRUE.equals(user.getActive()))
                .toList();

        Map<UUID, StudentAdmissionEntity> admissionsByStudentId = this.studentAdmissionRepository.findBySchoolIdOrderByCreatedAtDesc(schoolId).stream()
                .collect(Collectors.toMap(StudentAdmissionEntity::getStudentUserId, Function.identity(), (existing, replacement) -> existing));

        Map<UUID, StudentClassEnrollmentEntity> enrollmentsByStudentId = this.studentClassEnrollmentRepository.findBySchoolId(schoolId).stream()
                .collect(Collectors.toMap(StudentClassEnrollmentEntity::getStudentUserId, Function.identity(), (existing, replacement) -> replacement));

        Map<UUID, AcademicClassEntity> classesById = this.academicClassRepository.findBySchoolIdOrderByClassNameAscSectionNameAsc(schoolId).stream()
                .collect(Collectors.toMap(AcademicClassEntity::getClassId, Function.identity()));

        Map<UUID, TransportStudentAssignmentEntity> transportAssignmentsByStudentId = this.transportStudentAssignmentRepository.findBySchoolId(schoolId).stream()
                .collect(Collectors.toMap(TransportStudentAssignmentEntity::getStudentUserId, Function.identity(), (existing, replacement) -> replacement));

        Map<UUID, TransportRouteEntity> routesById = this.transportRouteRepository.findBySchoolIdOrderByCreatedAtDesc(schoolId).stream()
                .collect(Collectors.toMap(TransportRouteEntity::getRouteId, Function.identity()));

        Map<UUID, TransportStopEntity> stopsById = this.transportStopRepository.findAll().stream()
                .filter(stop -> stop.getSchoolId().equals(schoolId))
                .collect(Collectors.toMap(TransportStopEntity::getStopId, Function.identity()));

        Map<UUID, StudentMonitoringReportEntity> latestReportsByStudentId = this.studentMonitoringReportRepository.findBySchoolIdOrderByCreatedAtDesc(schoolId).stream()
                .collect(Collectors.toMap(StudentMonitoringReportEntity::getStudentUserId, Function.identity(), (existing, replacement) -> existing));

        String normalizedSearch = search == null ? "" : search.trim().toLowerCase(Locale.ROOT);
        String normalizedStatus = status == null ? "" : status.trim().toUpperCase(Locale.ROOT);

        Comparator<StudentDirectoryRowResponse> comparator = studentDirectoryComparator(sortBy == null ? "fullName" : sortBy);
        if ("desc".equalsIgnoreCase(sortDir)) {
            comparator = comparator.reversed();
        }

        return studentUsers.stream()
                .map(user -> {
                    StudentAdmissionEntity admission = admissionsByStudentId.get(user.getUserId());
                    StudentClassEnrollmentEntity enrollment = enrollmentsByStudentId.get(user.getUserId());
                    AcademicClassEntity academicClass = enrollment == null ? null : classesById.get(enrollment.getClassId());
                    TransportStudentAssignmentEntity transportAssignment = transportAssignmentsByStudentId.get(user.getUserId());
                    TransportRouteEntity route = transportAssignment == null ? null : routesById.get(transportAssignment.getRouteId());
                    TransportStopEntity stop = transportAssignment == null || transportAssignment.getStopId() == null ? null : stopsById.get(transportAssignment.getStopId());
                    StudentMonitoringReportEntity latestReport = latestReportsByStudentId.get(user.getUserId());

                    return new StudentDirectoryRowResponse(
                            user.getUserId(),
                            user.getFullName(),
                            user.getEmail(),
                            user.getCreatedAt(),
                            admission == null ? null : admission.getAdmissionId(),
                            admission == null ? null : admission.getAdmissionNo(),
                            admission == null ? null : admission.getAdmittedOn(),
                            admission == null || admission.getAdmissionStatus() == null ? null : admission.getAdmissionStatus().name(),
                            admission == null ? null : admission.getGuardianName(),
                            admission == null ? null : admission.getGuardianPhone(),
                            academicClass == null ? null : academicClass.getClassId(),
                            academicClass == null ? null : academicClass.getClassName(),
                            academicClass == null ? null : academicClass.getSectionName(),
                            route == null ? null : route.getRouteId(),
                            route == null ? null : route.getRouteName(),
                            stop == null ? null : stop.getStopId(),
                            stop == null ? null : stop.getStopName(),
                            latestReport == null ? null : latestReport.getReportMonth(),
                            latestReport == null ? null : latestReport.getAcademicYear(),
                            latestReport == null ? null : latestReport.getAttendancePercentage(),
                            latestReport == null ? null : latestReport.getAcademicNote(),
                            latestReport == null ? null : latestReport.getBehaviourNote(),
                            latestReport == null ? null : latestReport.getWellbeingNote()
                    );
                })
                .filter(row -> normalizedSearch.isBlank() || studentDirectoryMatchesSearch(row, normalizedSearch))
                .filter(row -> normalizedStatus.isBlank() || "ALL".equals(normalizedStatus) || normalizedStatus.equalsIgnoreCase(row.admissionStatus()))
                .filter(row -> classId == null || classId.equals(row.classId()))
                .filter(row -> routeId == null || routeId.equals(row.routeId()))
                .sorted(comparator)
                .toList();
    }

    public StudentsPageResponse listStudents(
            UUID schoolId,
            String search,
            UUID classId,
            String section,
            String transport,
            String status,
            String sortBy,
            String sortDir,
            int page,
            int size
    ) {
        int safePage = Math.max(page, 0);
        int safeSize = Math.min(Math.max(size, 1), 100);
        String normalizedSearch = search == null ? "" : search.trim().toLowerCase(Locale.ROOT);
        String normalizedSection = section == null ? "" : section.trim().toLowerCase(Locale.ROOT);
        String normalizedTransport = transport == null ? "" : transport.trim().toUpperCase(Locale.ROOT);
        String normalizedStatus = status == null ? "" : status.trim().toUpperCase(Locale.ROOT);

        List<StudentRowResponse> filtered = buildStudentRows(schoolId).stream()
                .filter(row -> normalizedSearch.isBlank() || java.util.stream.Stream.of(
                                row.fullName(),
                                row.admissionNo(),
                                row.className(),
                                row.sectionName(),
                                row.guardianName(),
                                row.contact()
                        )
                        .filter(Objects::nonNull)
                        .map(value -> value.toLowerCase(Locale.ROOT))
                        .anyMatch(value -> value.contains(normalizedSearch)))
                .filter(row -> classId == null || classId.equals(row.classId()))
                .filter(row -> normalizedSection.isBlank() || normalizedSection.equals(safeString(row.sectionName()).toLowerCase(Locale.ROOT)))
                .filter(row -> normalizedTransport.isBlank() || "ALL".equals(normalizedTransport) || normalizedTransport.equalsIgnoreCase(safeString(row.transportStatus())))
                .filter(row -> normalizedStatus.isBlank() || "ALL".equals(normalizedStatus) || normalizedStatus.equalsIgnoreCase(safeString(row.status())))
                .sorted(studentRowComparator(sortBy, sortDir))
                .toList();

        int fromIndex = safePage * safeSize;
        int toIndex = Math.min(fromIndex + safeSize, filtered.size());
        List<StudentRowResponse> items = fromIndex >= filtered.size() ? List.of() : filtered.subList(fromIndex, toIndex);
        return new StudentsPageResponse(items, filtered.size(), safePage, safeSize, toIndex < filtered.size());
    }

    @Transactional
    public StudentRowResponse createStudent(StudentUpsertRequest request) {
        if (request.studentUserId() != null) {
            throw new IllegalArgumentException("studentUserId must not be provided while creating a student.");
        }
        UUID studentUserId = upsertStudentUser(request.schoolId(), null, request.fullName(), request.email(), request.admissionNo());
        upsertStudentRecords(request, studentUserId);
        return getStudentRow(request.schoolId(), studentUserId);
    }

    @Transactional
    public StudentRowResponse updateStudent(UUID studentId, StudentUpsertRequest request) {
        SchoolUserEntity user = this.schoolUserRepository.findById(studentId)
                .orElseThrow(() -> new IllegalArgumentException("Student user not found."));
        if (!request.schoolId().equals(user.getSchoolId())) {
            throw new IllegalArgumentException("Student does not belong to this school.");
        }
        upsertStudentUser(request.schoolId(), studentId, request.fullName(), request.email(), request.admissionNo());
        upsertStudentRecords(request, studentId);
        return getStudentRow(request.schoolId(), studentId);
    }

    @Transactional
    public void deleteStudent(UUID studentId, UUID schoolId) {
        SchoolUserEntity user = this.schoolUserRepository.findById(studentId)
                .orElseThrow(() -> new IllegalArgumentException("Student user not found."));
        if (!schoolId.equals(user.getSchoolId())) {
            throw new IllegalArgumentException("Student does not belong to this school.");
        }
        user.setActive(false);
        this.schoolUserRepository.save(user);
        this.studentAdmissionRepository.findBySchoolIdAndStudentUserId(schoolId, studentId)
                .ifPresent(this.studentAdmissionRepository::delete);
        this.studentClassEnrollmentRepository.findBySchoolId(schoolId).stream()
                .filter(enrollment -> studentId.equals(enrollment.getStudentUserId()))
                .forEach(this.studentClassEnrollmentRepository::delete);
        this.transportStudentAssignmentRepository.findByStudentUserId(studentId)
                .ifPresent(this.transportStudentAssignmentRepository::delete);
    }

    public StudentAnalyticsResponse getStudentAnalytics(UUID schoolId, UUID studentUserId) {
        List<AttendanceRecordEntity> attendance = this.attendanceRecordRepository
                .findBySchoolIdAndUserIdOrderByAttendanceDateDescCreatedAtDesc(schoolId, studentUserId);
        long presentLikeCount = attendance.stream()
                .filter(record -> {
                    String status = safeString(record.getAttendanceStatus()).toUpperCase(Locale.ROOT);
                    return "PRESENT".equals(status) || "LATE".equals(status);
                })
                .count();
        BigDecimal attendancePct = attendance.isEmpty()
                ? BigDecimal.ZERO
                : BigDecimal.valueOf((presentLikeCount * 100.0d) / attendance.size()).setScale(2, RoundingMode.HALF_UP);

        Map<LocalDate, List<AttendanceRecordEntity>> attendanceByDate = attendance.stream()
                .collect(Collectors.groupingBy(AttendanceRecordEntity::getAttendanceDate, LinkedHashMap::new, Collectors.toList()));
        List<StudentAnalyticsPoint> attendanceTrend = attendanceByDate.entrySet().stream()
                .sorted(Map.Entry.comparingByKey())
                .skip(Math.max(0, attendanceByDate.size() - 10))
                .map(entry -> {
                    long presentCount = entry.getValue().stream()
                            .filter(record -> {
                                String recordStatus = safeString(record.getAttendanceStatus()).toUpperCase(Locale.ROOT);
                                return "PRESENT".equals(recordStatus) || "LATE".equals(recordStatus);
                            })
                            .count();
                    BigDecimal pct = entry.getValue().isEmpty()
                            ? BigDecimal.ZERO
                            : BigDecimal.valueOf((presentCount * 100.0d) / entry.getValue().size()).setScale(2, RoundingMode.HALF_UP);
                    return new StudentAnalyticsPoint(entry.getKey().toString(), pct);
                })
                .toList();

        List<ExamResultRecordEntity> studentResults = this.examResultRecordRepository.findBySchoolIdOrderByCreatedAtDesc(schoolId).stream()
                .filter(result -> studentUserId.equals(result.getStudentUserId()))
                .sorted(Comparator.comparing(ExamResultRecordEntity::getCreatedAt))
                .toList();
        List<StudentAnalyticsPoint> academicProgress = studentResults.stream()
                .skip(Math.max(0, studentResults.size() - 10))
                .map(result -> {
                    BigDecimal percentage = result.getMaxMarks() == null || BigDecimal.ZERO.compareTo(result.getMaxMarks()) == 0
                            ? BigDecimal.ZERO
                            : result.getMarksObtained().multiply(BigDecimal.valueOf(100)).divide(result.getMaxMarks(), 2, RoundingMode.HALF_UP);
                    return new StudentAnalyticsPoint(result.getExamName(), percentage);
                })
                .toList();

        StudentMonitoringReportEntity report = this.studentMonitoringReportRepository.findBySchoolIdOrderByCreatedAtDesc(schoolId).stream()
                .filter(item -> studentUserId.equals(item.getStudentUserId()))
                .findFirst()
                .orElse(null);

        return new StudentAnalyticsResponse(
                studentUserId,
                attendancePct,
                attendanceTrend,
                academicProgress,
                report == null ? "No behaviour report available." : safeString(report.getBehaviourNote()),
                report == null ? "No remarks available." : safeString(report.getAcademicNote()).isBlank() ? safeString(report.getWellbeingNote()) : safeString(report.getAcademicNote())
        );
    }

    private void upsertStudentRecords(StudentUpsertRequest request, UUID studentUserId) {
        StudentAdmissionEntity admission = this.studentAdmissionRepository.findBySchoolIdAndStudentUserId(request.schoolId(), studentUserId)
                .orElseGet(() -> {
                    StudentAdmissionEntity entity = new StudentAdmissionEntity();
                    entity.setAdmissionId(UUID.randomUUID());
                    entity.setSchoolId(request.schoolId());
                    entity.setStudentUserId(studentUserId);
                    entity.setAdmittedOn(LocalDate.now());
                    entity.setCreatedAt(Instant.now());
                    return entity;
                });

        admission.setAdmissionNo(request.admissionNo());
        admission.setRollNo(request.rollNo());
        admission.setGuardianName(request.guardianName());
        admission.setGuardianPhone(request.contact());
        admission.setAddress(request.address());
        admission.setPreviousSchool(request.previousSchool());
        admission.setAdmissionStatus(request.admissionStatus());
        this.studentAdmissionRepository.save(admission);

        if (request.classId() != null) {
            StudentClassEnrollmentEntity enrollment = this.studentClassEnrollmentRepository.findBySchoolId(request.schoolId()).stream()
                    .filter(item -> studentUserId.equals(item.getStudentUserId()))
                    .findFirst()
                    .orElseGet(() -> {
                        StudentClassEnrollmentEntity entity = new StudentClassEnrollmentEntity();
                        entity.setEnrollmentId(UUID.randomUUID());
                        entity.setSchoolId(request.schoolId());
                        entity.setStudentUserId(studentUserId);
                        entity.setCreatedAt(Instant.now());
                        return entity;
                    });
            enrollment.setClassId(request.classId());
            this.studentClassEnrollmentRepository.save(enrollment);
        }

        if (request.routeId() == null) {
            this.transportStudentAssignmentRepository.findByStudentUserId(studentUserId)
                    .ifPresent(this.transportStudentAssignmentRepository::delete);
        } else {
            this.assignStudentToRoute(new TransportStudentAssignmentRequest(
                    request.schoolId(),
                    studentUserId,
                    request.routeId(),
                    request.stopId()
            ));
        }
    }

    private UUID upsertStudentUser(UUID schoolId, UUID studentUserId, String fullName, String email, String admissionNo) {
        SchoolUserEntity user = studentUserId == null
                ? this.schoolUserRepository.findBySchoolIdOrderByRoleNameAscFullNameAsc(schoolId).stream()
                    .filter(existing -> email.equalsIgnoreCase(existing.getEmail()))
                    .findFirst()
                    .orElse(null)
                : this.schoolUserRepository.findById(studentUserId).orElse(null);

        if (user == null) {
            SchoolUserEntity contextUser = this.schoolUserRepository.findBySchoolIdOrderByRoleNameAscFullNameAsc(schoolId).stream()
                    .findFirst()
                    .orElseThrow(() -> new IllegalArgumentException("Cannot create student. No school context user exists."));
            SchoolUserResponse created = this.createUser(new SchoolUserRequest(
                    contextUser.getTenantId(),
                    contextUser.getSchoolId(),
                    contextUser.getSchoolCode(),
                    "Institutional User",
                    fullName,
                    email,
                    "STUDENT",
                    "Pass@" + admissionNo
            ));
            return created.userId();
        }

        user.setFullName(fullName);
        user.setEmail(email);
        user.setRoleName("STUDENT");
        user.setActive(true);
        this.schoolUserRepository.save(user);
        return user.getUserId();
    }

    private StudentRowResponse getStudentRow(UUID schoolId, UUID studentUserId) {
        return buildStudentRows(schoolId).stream()
                .filter(row -> studentUserId.equals(row.studentUserId()))
                .findFirst()
                .orElseThrow(() -> new IllegalArgumentException("Student not found in school directory."));
    }

    private List<StudentRowResponse> buildStudentRows(UUID schoolId) {
        List<SchoolUserEntity> studentUsers = this.schoolUserRepository.findBySchoolIdOrderByRoleNameAscFullNameAsc(schoolId).stream()
                .filter(user -> "STUDENT".equalsIgnoreCase(user.getRoleName()))
                .filter(user -> user.getActive() == null || Boolean.TRUE.equals(user.getActive()))
                .toList();

        Map<UUID, StudentAdmissionEntity> admissionsByStudentId = this.studentAdmissionRepository.findBySchoolIdOrderByCreatedAtDesc(schoolId).stream()
                .collect(Collectors.toMap(StudentAdmissionEntity::getStudentUserId, Function.identity(), (existing, replacement) -> existing));
        Map<UUID, StudentClassEnrollmentEntity> enrollmentsByStudentId = this.studentClassEnrollmentRepository.findBySchoolId(schoolId).stream()
                .collect(Collectors.toMap(StudentClassEnrollmentEntity::getStudentUserId, Function.identity(), (existing, replacement) -> replacement));
        Map<UUID, AcademicClassEntity> classesById = this.academicClassRepository.findBySchoolIdOrderByClassNameAscSectionNameAsc(schoolId).stream()
                .collect(Collectors.toMap(AcademicClassEntity::getClassId, Function.identity()));
        Map<UUID, ClassTeacherMappingEntity> classTeacherByClassId = this.classTeacherMappingRepository.findBySchoolId(schoolId).stream()
                .collect(Collectors.toMap(ClassTeacherMappingEntity::getClassId, Function.identity(), (existing, replacement) -> replacement));
        Map<UUID, SchoolUserEntity> usersById = this.schoolUserRepository.findBySchoolIdOrderByRoleNameAscFullNameAsc(schoolId).stream()
                .collect(Collectors.toMap(SchoolUserEntity::getUserId, Function.identity(), (existing, replacement) -> existing));
        Map<UUID, TransportStudentAssignmentEntity> transportAssignmentByStudentId = this.transportStudentAssignmentRepository.findBySchoolId(schoolId).stream()
                .collect(Collectors.toMap(TransportStudentAssignmentEntity::getStudentUserId, Function.identity(), (existing, replacement) -> replacement));
        Map<UUID, TransportRouteEntity> routesById = this.transportRouteRepository.findBySchoolIdOrderByCreatedAtDesc(schoolId).stream()
                .collect(Collectors.toMap(TransportRouteEntity::getRouteId, Function.identity()));

        return studentUsers.stream().map(student -> {
            StudentAdmissionEntity admission = admissionsByStudentId.get(student.getUserId());
            StudentClassEnrollmentEntity enrollment = enrollmentsByStudentId.get(student.getUserId());
            AcademicClassEntity classroom = enrollment == null ? null : classesById.get(enrollment.getClassId());
            ClassTeacherMappingEntity classTeacher = classroom == null ? null : classTeacherByClassId.get(classroom.getClassId());
            SchoolUserEntity teacher = classTeacher == null ? null : usersById.get(classTeacher.getTeacherUserId());
            TransportStudentAssignmentEntity transportAssignment = transportAssignmentByStudentId.get(student.getUserId());
            TransportRouteEntity route = transportAssignment == null ? null : routesById.get(transportAssignment.getRouteId());

            return new StudentRowResponse(
                    student.getUserId(),
                    schoolId,
                    admission == null ? null : admission.getAdmissionId(),
                    student.getFullName(),
                    student.getEmail(),
                    admission == null ? null : admission.getAdmissionNo(),
                    admission == null ? null : admission.getRollNo(),
                    classroom == null ? null : classroom.getClassName(),
                    classroom == null ? null : classroom.getSectionName(),
                    classroom == null ? null : classroom.getClassId(),
                    teacher == null ? null : teacher.getFullName(),
                    admission == null ? null : admission.getGuardianName(),
                    admission == null ? null : admission.getGuardianPhone(),
                    route == null ? "UNASSIGNED" : "ASSIGNED",
                    route == null ? null : route.getRouteId(),
                    route == null ? null : route.getRouteName(),
                    transportAssignment == null ? null : transportAssignment.getStopId(),
                    admission == null || admission.getAdmissionStatus() == null ? "UNTRACKED" : admission.getAdmissionStatus().name(),
                    student.getCreatedAt()
            );
        }).toList();
    }

    public List<StudentAdmissionResponse> listStudentAdmissions(UUID schoolId) {
        return this.studentAdmissionRepository
                .findBySchoolIdOrderByCreatedAtDesc(schoolId)
                .stream()
                .map(this::toAdmissionResponse)
                .toList();
    }

    public List<TimetableSlotResponse> listTimetableSlots(UUID schoolId) {
        return this.timetableSlotRepository.findBySchoolIdOrderByDayOfWeekAscStartTimeAsc(schoolId).stream().map(s -> new TimetableSlotResponse(s.getSlotId(), s.getSchoolId(), s.getClassId(), s.getSubjectId(), s.getTeacherUserId(), s.getDayOfWeek(), s.getStartTime(), s.getEndTime(), s.getRoomName(), s.getCreatedAt())).toList();
    }

    public List<FeeRecordResponse> listFeeRecords(UUID schoolId) {
        return this.feeRecordRepository.findBySchoolIdOrderByDueDateDesc(schoolId).stream().map(f -> new FeeRecordResponse(f.getFeeRecordId(), f.getSchoolId(), f.getStudentUserId(), f.getFeeCategory(), f.getAmountDue(), f.getAmountPaid(), f.getDueDate(), f.getPaymentStatus(), f.getCreatedAt())).toList();
    }

    private VoiceNoteResponse toVoiceNoteResponse(VoiceNoteEntity n) {
        return new VoiceNoteResponse(n.getVoiceNoteId(), n.getSchoolId(), n.getRelatedUserId(), n.getAudience(), n.getTitle(), n.getTranscript(), n.getAudioUrl(), n.getTranslations(), n.getCreatedAt());
    }

    public List<AttendanceRecordResponse> listAttendanceRecords(UUID schoolId, UUID classId, UUID teacherUserId, LocalDate attendanceDate, LocalDate fromDate, LocalDate toDate) {
        List<AttendanceRecordEntity> records = classId != null ? this.attendanceRecordRepository.findBySchoolIdAndClassIdOrderByAttendanceDateDescCreatedAtDesc(schoolId, classId) : (teacherUserId != null ? this.attendanceRecordRepository.findBySchoolIdAndTeacherUserIdOrderByAttendanceDateDescCreatedAtDesc(schoolId, teacherUserId) : (attendanceDate != null ? this.attendanceRecordRepository.findBySchoolIdAndAttendanceDateOrderByCreatedAtDesc(schoolId, attendanceDate) : (fromDate != null && toDate != null ? this.attendanceRecordRepository.findBySchoolIdAndAttendanceDateBetweenOrderByAttendanceDateAsc(schoolId, fromDate, toDate) : this.attendanceRecordRepository.findBySchoolIdOrderByAttendanceDateDescCreatedAtDesc(schoolId))));
        return records.stream().map(this::toAttendanceResponse).toList();
    }

    private UUID resolveTenantId(UUID schoolId) {
        String tenant = TenantContext.getCurrentTenant();
        if (tenant == null || tenant.isBlank()) {
            return schoolId;
        }
        try {
            return UUID.fromString(tenant.trim());
        } catch (IllegalArgumentException ex) {
            return schoolId;
        }
    }

    public List<HomeworkItemResponse> listHomeworkItems(UUID schoolId) {
        return this.homeworkItemRepository.findBySchoolIdOrderByDueDateDescCreatedAtDesc(schoolId).stream().map(h -> new HomeworkItemResponse(h.getHomeworkId(), h.getSchoolId(), h.getClassId(), h.getSubjectId(), h.getTeacherUserId(), h.getTitle(), h.getDescription(), h.getDueDate(), h.getCreatedAt())).toList();
    }

    public List<NoticeBoardItemResponse> listNoticeBoardItems(UUID schoolId) {
        return this.noticeBoardItemRepository.findBySchoolIdOrderByPublishedAtDesc(schoolId).stream().map(n -> new NoticeBoardItemResponse(n.getNoticeId(), n.getSchoolId(), n.getTitle(), n.getMessage(), n.getAudience(), n.getPublishedAt(), n.getCreatedAt())).toList();
    }

    public List<ExamResultRecordResponse> listExamResults(UUID schoolId) {
        return this.examResultRecordRepository.findBySchoolIdOrderByCreatedAtDesc(schoolId).stream().map(r -> new ExamResultRecordResponse(r.getResultId(), r.getSchoolId(), r.getStudentUserId(), r.getSubjectId(), r.getExamName(), r.getAcademicYear(), r.getMarksObtained(), r.getMaxMarks(), r.getGrade(), r.getCreatedAt())).toList();
    }

    public List<TeacherMonthlyReportResponse> listTeacherReports(UUID schoolId) {
        return this.teacherMonthlyReportRepository.findBySchoolIdOrderByCreatedAtDesc(schoolId).stream().map(r -> new TeacherMonthlyReportResponse(r.getReportId(), r.getSchoolId(), r.getTeacherUserId(), r.getReportMonth(), r.getAcademicYear(), r.getClassesHandled(), r.getAttendancePercentage(), r.getBiometricCompliance(), r.getPrincipalNote(), r.getCreatedAt())).toList();
    }

    public List<StudentMonitoringReportResponse> listStudentMonitoringReports(UUID schoolId) {
        return this.studentMonitoringReportRepository.findBySchoolIdOrderByCreatedAtDesc(schoolId).stream().map(r -> new StudentMonitoringReportResponse(r.getReportId(), r.getSchoolId(), r.getStudentUserId(), r.getReportMonth(), r.getAcademicYear(), r.getAttendancePercentage(), r.getAcademicNote(), r.getBehaviourNote(), r.getWellbeingNote(), r.getCreatedAt())).toList();
    }

    public List<CoCurricularActivityResponse> listActivities(UUID schoolId) {
        return this.coCurricularActivityRepository.findBySchoolIdOrderByEventDateDesc(schoolId).stream().map(a -> new CoCurricularActivityResponse(a.getActivityId(), a.getSchoolId(), a.getTitle(), a.getActivityType(), a.getEventDate(), a.getCoordinatorUserId(), a.getDescription(), a.getCreatedAt())).toList();
    }

    public List<LibraryResourceResponse> listLibraryResources(UUID schoolId) {
        return this.libraryResourceRepository.findBySchoolIdOrderByCreatedAtDesc(schoolId).stream().map(r -> toLibraryResponse(r, null)).toList();
    }

    private LibraryResourceResponse toLibraryResponse(LibraryResourceEntity r, UUID currentUserId) {
        boolean bookmarked = false;
        if (currentUserId != null) {
            bookmarked = !resourceBookmarkRepository.findBySchoolIdAndUserIdAndResourceId(r.getSchoolId(), currentUserId, r.getResourceId()).isEmpty();
        }
        long viewCount = resourceViewLogRepository.countByResourceId(r.getResourceId());
        return new LibraryResourceResponse(r.getResourceId(), r.getSchoolId(), r.getTitle(), r.getResourceType(), r.getAuthorName(), r.getAccessUrl(), r.getDescription(), r.getSubject(), r.getGradeLevel(), r.getTags(), r.getUploadedByUserId(), r.getFileSize(), r.getCreatedAt(), bookmarked, viewCount);
    }

    public List<NoteShareResponse> listNoteShares(UUID schoolId) {
        return this.noteShareRepository.findBySchoolIdOrderByCreatedAtDesc(schoolId).stream().map(n -> new NoteShareResponse(n.getNoteId(), n.getSchoolId(), n.getSharedByUserId(), n.getClassId(), n.getSubjectId(), n.getTitle(), n.getAccessUrl(), n.getCreatedAt())).toList();
    }

    public List<TransportRouteResponse> listTransportRoutes(UUID schoolId) {
        requireTransportEnabled(schoolId);
        return this.transportRouteRepository.findBySchoolIdOrderByCreatedAtDesc(schoolId).stream().map(this::toTransportRouteResponse).toList();
    }

    public List<VoiceNoteResponse> listVoiceNotes(UUID schoolId) {
        return this.voiceNoteRepository.findBySchoolIdOrderByCreatedAtDesc(schoolId).stream().map(this::toVoiceNoteResponse).toList();
    }

    public List<ReminderResponse> listReminders(UUID schoolId) {
        return this.reminderRepository.findBySchoolIdOrderByDueAtAsc(schoolId).stream().map(r -> new ReminderResponse(r.getReminderId(), r.getSchoolId(), r.getReminderType(), r.getTargetUserId(), r.getMessage(), r.getDueAt(), r.getReminderStatus(), r.getCreatedAt())).toList();
    }

    @Transactional
    public DepartmentResponse createDepartment(DepartmentRequest request) {
        DepartmentEntity entity = new DepartmentEntity();
        entity.setDepartmentId(UUID.randomUUID());
        entity.setSchoolId(request.schoolId());
        entity.setDepartmentName(request.departmentName());
        entity.setDepartmentCode(request.departmentCode());
        entity.setCreatedAt(Instant.now());
        this.departmentRepository.save(entity);
        return new DepartmentResponse(entity.getDepartmentId(), entity.getSchoolId(), entity.getDepartmentName(), entity.getDepartmentCode(), entity.getCreatedAt());
    }

    @Transactional
    public SubjectResponse createSubject(SubjectRequest request) {
        SubjectEntity entity = new SubjectEntity();
        entity.setSubjectId(UUID.randomUUID());
        entity.setSchoolId(request.schoolId());
        entity.setDepartmentId(request.departmentId());
        entity.setSubjectName(request.subjectName());
        entity.setSubjectCode(request.subjectCode());
        entity.setCreatedAt(Instant.now());
        this.subjectRepository.save(entity);
        return new SubjectResponse(entity.getSubjectId(), entity.getSchoolId(), entity.getDepartmentId(), entity.getSubjectName(), entity.getSubjectCode(), entity.getCreatedAt());
    }

    @Transactional
    public AcademicClassResponse createClass(AcademicClassRequest request) {
        AcademicClassEntity entity = new AcademicClassEntity();
        entity.setClassId(UUID.randomUUID());
        entity.setSchoolId(request.schoolId());
        entity.setClassName(request.className());
        entity.setSectionName(request.sectionName());
        entity.setAcademicYear(request.academicYear());
        entity.setCreatedAt(Instant.now());
        this.academicClassRepository.save(entity);
        return new AcademicClassResponse(entity.getClassId(), entity.getSchoolId(), entity.getClassName(), entity.getSectionName(), entity.getAcademicYear(), entity.getCreatedAt());
    }

    @Transactional
    public SchoolUserResponse createUser(SchoolUserRequest request) {
        // Backward-compatible overload for internal flows that don't have an actor role handy.
        return this.createUser(request, (String) null);
    }

    @Transactional
    public SchoolUserResponse upsertUserProfile(com.sms.schoolops.api.SchoolOperationsDtos.SchoolUserProfileUpsertRequest request) {
        SchoolUserEntity existing = this.schoolUserRepository.findById(request.userId()).orElse(null);
        if (existing == null) {
            // If the email already exists in this school under a different id, reject rather than duplicating.
            this.schoolUserRepository.findBySchoolIdAndEmailIgnoreCase(request.schoolId(), request.email())
                    .ifPresent(u -> { throw new IllegalArgumentException("User already exists for this email."); });

            existing = new SchoolUserEntity();
            existing.setUserId(request.userId());
            existing.setCreatedAt(Instant.now());
        }

        existing.setTenantId(request.tenantId());
        existing.setSchoolId(request.schoolId());
        existing.setSchoolCode(request.schoolCode());
        existing.setFullName(request.fullName());
        existing.setEmail(request.email());
        existing.setRoleName(request.roleName());
        existing.setActive(true);
        this.schoolUserRepository.save(existing);

        return new SchoolUserResponse(
                existing.getUserId(),
                existing.getTenantId(),
                existing.getSchoolId(),
                existing.getSchoolCode(),
                existing.getFullName(),
                existing.getEmail(),
                existing.getRoleName(),
                existing.getCreatedAt(),
                existing.getTheme(),
                existing.getActiveTheme(),
                existing.getVibe(),
                existing.getAccentColor(),
                existing.getGlassIntensity() == null ? null : existing.getGlassIntensity().doubleValue(),
                existing.getBorderRadius(),
                null
        );
    }

    @Transactional
    public SchoolUserResponse createUser(SchoolUserRequest request, String actorRole) {
        String schoolCode = request.schoolCode();
        String schoolName = request.schoolName();
        
        if ((schoolCode == null || schoolCode.isBlank()) || (schoolName == null || schoolName.isBlank())) {
            Optional<SchoolUserEntity> contextUser = this.schoolUserRepository.findBySchoolIdOrderByRoleNameAscFullNameAsc(request.schoolId()).stream().findFirst();
            if (contextUser.isPresent()) {
                if (schoolCode == null || schoolCode.isBlank()) schoolCode = contextUser.get().getSchoolCode();
                if (schoolName == null || schoolName.isBlank()) schoolName = "Institutional User";
            }
        }

        // Re-construct request if field values were recovered
        SchoolUserRequest finalRequest = new SchoolUserRequest(
            request.tenantId(), 
            request.schoolId(), 
            schoolCode, 
            schoolName, 
            request.fullName(), 
            request.email(), 
            request.roleName(), 
            request.accessKey()
        );

        SchoolUserEntity entity = new SchoolUserEntity();
        entity.setUserId(UUID.randomUUID());
        entity.setTenantId(finalRequest.tenantId());
        entity.setSchoolId(finalRequest.schoolId());
        entity.setSchoolCode(finalRequest.schoolCode());
        entity.setFullName(finalRequest.fullName());
        entity.setEmail(finalRequest.email());
        entity.setRoleName(finalRequest.roleName());
        entity.setActive(true);
        entity.setCreatedAt(Instant.now());
        this.schoolUserRepository.save(entity);

        String accessKey = finalRequest.accessKey();
        if (accessKey == null || accessKey.isBlank()) {
            accessKey = UUID.randomUUID().toString().substring(0, 8).toUpperCase();
        }

        ProvisionUserAccountResponse provisioned = this.provisionAccount(finalRequest, accessKey, actorRole);
        try {
            this.communicationRestClient.post().uri("/api/v1/communication/notifications", new Object[0]).body(Map.of("recipientId", entity.getUserId(), "title", "Welcome to " + finalRequest.schoolName(), "message", "Your account has been created. Login with: " + finalRequest.email() + " and temporary password: " + accessKey, "type", "CREDENTIALS_GENERATED", "channel", "EMAIL")).retrieve().toBodilessEntity();
        } catch (Exception e) {
            logger.warn("Failed to send credential notification. userId={} email={} error={}", entity.getUserId(), entity.getEmail(), e.getMessage());
        }
        String roleName = provisioned == null ? entity.getRoleName() : provisioned.roleName();
        return new SchoolUserResponse(entity.getUserId(), entity.getTenantId(), entity.getSchoolId(), entity.getSchoolCode(), entity.getFullName(), entity.getEmail(), roleName, entity.getCreatedAt(), entity.getTheme(), entity.getActiveTheme(), entity.getVibe(), entity.getAccentColor(), entity.getGlassIntensity(), entity.getBorderRadius(), accessKey);
    }

    private ProvisionUserAccountResponse provisionAccount(SchoolUserRequest request, String accessKey, String actorRole) {
        return (ProvisionUserAccountResponse) this.authRestClient.post()
                .uri("/api/v1/auth/internal/provision-user", new Object[0])
                .header("X-User-Role", actorRole == null || actorRole.isBlank() ? "SCHOOL_ADMIN" : actorRole)
                .body(new ProvisionUserAccountRequest(
                        request.tenantId(),
                        request.schoolId(),
                        request.schoolCode(),
                        request.schoolName(),
                        request.email(),
                        request.fullName(),
                        request.roleName(),
                        accessKey
                ))
                .retrieve()
                .body(ProvisionUserAccountResponse.class);
    }

    public SchoolDashboardResponse getDashboard(UUID schoolId) {
        List<SchoolUserEntity> users = this.schoolUserRepository.findBySchoolIdOrderByRoleNameAscFullNameAsc(schoolId);
        return new SchoolDashboardResponse(schoolId, this.departmentRepository.findBySchoolIdOrderByDepartmentNameAsc(schoolId).size(), this.subjectRepository.findBySchoolIdOrderBySubjectNameAsc(schoolId).size(), this.academicClassRepository.findBySchoolIdOrderByClassNameAscSectionNameAsc(schoolId).size(), this.countByRole(users, "TEACHER"), this.countByRole(users, "STUDENT"), this.countByRole(users, "STAFF"), this.countByRole(users, "PRINCIPAL"), this.countByRole(users, "MANAGER"), this.teacherSubjectMappingRepository.findBySchoolId(schoolId).size(), this.teacherClassMappingRepository.findBySchoolId(schoolId).size(), this.classTeacherMappingRepository.findBySchoolId(schoolId).size(), this.studentClassEnrollmentRepository.findBySchoolId(schoolId).size(), this.studentAdmissionRepository.findBySchoolIdOrderByCreatedAtDesc(schoolId).size(), this.timetableSlotRepository.findBySchoolIdOrderByDayOfWeekAscStartTimeAsc(schoolId).size(), this.feeRecordRepository.findBySchoolIdOrderByDueDateDesc(schoolId).size(), this.attendanceRecordRepository.findBySchoolIdOrderByAttendanceDateDescCreatedAtDesc(schoolId).size(), this.homeworkItemRepository.findBySchoolIdOrderByDueDateDescCreatedAtDesc(schoolId).size(), this.noticeBoardItemRepository.findBySchoolIdOrderByPublishedAtDesc(schoolId).size(), this.examResultRecordRepository.findBySchoolIdOrderByCreatedAtDesc(schoolId).size(), this.teacherMonthlyReportRepository.findBySchoolIdOrderByCreatedAtDesc(schoolId).size(), this.studentMonitoringReportRepository.findBySchoolIdOrderByCreatedAtDesc(schoolId).size(), this.coCurricularActivityRepository.findBySchoolIdOrderByEventDateDesc(schoolId).size(), this.libraryResourceRepository.findBySchoolIdOrderByCreatedAtDesc(schoolId).size(), this.noteShareRepository.findBySchoolIdOrderByCreatedAtDesc(schoolId).size(), this.transportRouteRepository.findBySchoolIdOrderByCreatedAtDesc(schoolId).size(), this.voiceNoteRepository.findBySchoolIdOrderByCreatedAtDesc(schoolId).size(), this.reminderRepository.findBySchoolIdOrderByDueAtAsc(schoolId).size());
    }

    public TeacherWorkspaceResponse getTeacherWorkspace(UUID schoolId, String email) {
        List<SchoolUserEntity> users = this.schoolUserRepository.findBySchoolIdOrderByRoleNameAscFullNameAsc(schoolId);
        SchoolUserEntity teacher = this.schoolUserRepository.findBySchoolIdAndEmailIgnoreCase(schoolId, email)
                .orElseThrow(() -> new NotFoundException("Teacher account not found for this school."));
        Map subjectsById = this.subjectRepository.findBySchoolIdOrderBySubjectNameAsc(schoolId).stream().collect(Collectors.toMap(SubjectEntity::getSubjectId, Function.identity()));
        Map classesById = this.academicClassRepository.findBySchoolIdOrderByClassNameAscSectionNameAsc(schoolId).stream().collect(Collectors.toMap(AcademicClassEntity::getClassId, Function.identity()));
        List<WorkspaceSubject> assignedSubjects = this.teacherSubjectMappingRepository.findBySchoolId(schoolId).stream().filter(mapping -> mapping.getTeacherUserId().equals(teacher.getUserId())).map(mapping -> (SubjectEntity)subjectsById.get(mapping.getSubjectId())).filter(subject -> subject != null).map(subject -> new WorkspaceSubject(subject.getSubjectId(), subject.getSubjectName(), subject.getSubjectCode())).toList();
        List<WorkspaceClass> assignedClasses = this.teacherClassMappingRepository.findBySchoolId(schoolId).stream().filter(mapping -> mapping.getTeacherUserId().equals(teacher.getUserId())).map(mapping -> (AcademicClassEntity)classesById.get(mapping.getClassId())).filter(classroom -> classroom != null).map(this::toWorkspaceClass).toList();
        List<WorkspaceClass> classTeacherOf = this.classTeacherMappingRepository.findBySchoolId(schoolId).stream().filter(mapping -> mapping.getTeacherUserId().equals(teacher.getUserId())).map(mapping -> (AcademicClassEntity)classesById.get(mapping.getClassId())).filter(classroom -> classroom != null).map(this::toWorkspaceClass).toList();
        List<TimetableSlotEntity> timetableSlots = this.timetableSlotRepository.findBySchoolIdOrderByDayOfWeekAscStartTimeAsc(schoolId).stream().filter(slot -> slot.getTeacherUserId().equals(teacher.getUserId())).toList();
        String scheduleStatus = timetableSlots.isEmpty() ? "PENDING" : "CONFIGURED";
        String scheduleMessage = timetableSlots.isEmpty() ? "Timetable slots will appear here after the school schedules your classes." : "Timetable scheduling is live. " + timetableSlots.size() + " period slots are assigned to this teacher.";
        return new TeacherWorkspaceResponse(schoolId, teacher.getSchoolCode(), this.toWorkspaceUser(teacher), assignedSubjects, assignedClasses, classTeacherOf, scheduleStatus, scheduleMessage);
    }

    public StudentWorkspaceResponse getStudentWorkspace(UUID schoolId, String email) {
        return buildStudentWorkspace(schoolId, email);
    }

    private StudentWorkspaceResponse buildStudentWorkspace(UUID schoolId, String email) {
        List<SchoolUserEntity> users = this.schoolUserRepository.findBySchoolIdOrderByRoleNameAscFullNameAsc(schoolId);
        SchoolUserEntity student = this.schoolUserRepository.findBySchoolIdAndEmailIgnoreCase(schoolId, email)
                .orElseThrow(() -> new NotFoundException("Student account not found for this school."));

        Map<UUID, SchoolUserEntity> usersById = users.stream().collect(Collectors.toMap(SchoolUserEntity::getUserId, Function.identity()));
        Map<UUID, SubjectEntity> subjectsById = this.subjectRepository.findBySchoolIdOrderBySubjectNameAsc(schoolId).stream().collect(Collectors.toMap(SubjectEntity::getSubjectId, Function.identity()));
        Map<UUID, AcademicClassEntity> classesById = this.academicClassRepository.findBySchoolIdOrderByClassNameAscSectionNameAsc(schoolId).stream().collect(Collectors.toMap(AcademicClassEntity::getClassId, Function.identity()));
        StudentClassEnrollmentEntity enrollment = this.studentClassEnrollmentRepository.findBySchoolId(schoolId).stream()
                .filter(item -> item.getStudentUserId().equals(student.getUserId()))
                .findFirst()
                .orElse(null);

        AcademicClassEntity academicClass = enrollment == null ? null : classesById.get(enrollment.getClassId());
        SchoolUserEntity classTeacher = enrollment == null ? null : this.classTeacherMappingRepository.findBySchoolId(schoolId).stream()
                .filter(mapping -> mapping.getClassId().equals(enrollment.getClassId()))
                .map(mapping -> usersById.get(mapping.getTeacherUserId()))
                .filter(Objects::nonNull)
                .findFirst()
                .orElse(null);

        List<StudentSubjectTeacher> subjectTeachers = enrollment == null ? List.of()
                : this.teacherClassMappingRepository.findBySchoolId(schoolId).stream()
                        .filter(mapping -> mapping.getClassId().equals(enrollment.getClassId()))
                        .flatMap(classMapping -> this.teacherSubjectMappingRepository.findBySchoolId(schoolId).stream()
                                .filter(subjectMapping -> subjectMapping.getTeacherUserId().equals(classMapping.getTeacherUserId()))
                                .map(subjectMapping -> {
                                    SchoolUserEntity teacher = usersById.get(classMapping.getTeacherUserId());
                                    SubjectEntity subject = subjectsById.get(subjectMapping.getSubjectId());
                                    if (teacher == null || subject == null) {
                                        return null;
                                    }
                                    return new StudentSubjectTeacher(subject.getSubjectName(), subject.getSubjectCode(), teacher.getFullName(), teacher.getEmail());
                                }))
                        .filter(Objects::nonNull)
                        .distinct()
                        .toList();

        List<TimetableSlotEntity> timetableSlots = enrollment == null ? List.of()
                : this.timetableSlotRepository.findBySchoolIdOrderByDayOfWeekAscStartTimeAsc(schoolId).stream()
                        .filter(slot -> slot.getClassId().equals(enrollment.getClassId()))
                        .toList();

        String scheduleStatus = timetableSlots.isEmpty() ? "PENDING" : "CONFIGURED";
        String scheduleMessage = timetableSlots.isEmpty()
                ? "Class and teacher mappings are available. Timetable periods will appear after scheduling."
                : "Timetable scheduling is live. " + timetableSlots.size() + " period slots are mapped to this class.";

        return new StudentWorkspaceResponse(
                schoolId,
                student.getSchoolCode(),
                this.toWorkspaceUser(student),
                academicClass == null ? null : this.toWorkspaceClass(academicClass),
                classTeacher == null ? null : this.toWorkspaceUser(classTeacher),
                subjectTeachers,
                scheduleStatus,
                scheduleMessage
        );
    }

    @Transactional
    public StudentAdmissionResponse createStudentAdmission(StudentAdmissionRequest request) {
        String resolvedAdmissionNo = resolveAdmissionNo(request.schoolId(), request.admissionNo());
        UUID studentUserId = request.studentUserId();
        if (studentUserId == null) {
            if (request.studentEmail() == null || request.studentFullName() == null) {
                throw new IllegalArgumentException("Student email and full name are required if studentUserId is not provided.");
            }
            Optional<SchoolUserEntity> existingUser = this.schoolUserRepository.findBySchoolIdOrderByRoleNameAscFullNameAsc(request.schoolId())
                    .stream().filter(u -> u.getEmail().equalsIgnoreCase(request.studentEmail())).findFirst();
            if (existingUser.isPresent()) {
                studentUserId = existingUser.get().getUserId();
            } else {
                Optional<SchoolUserEntity> contextUserOpt = this.schoolUserRepository.findBySchoolIdOrderByRoleNameAscFullNameAsc(request.schoolId())
                        .stream().findFirst();
                UUID tId = request.tenantId();
                String sCode = request.schoolCode();
                
                if (contextUserOpt.isPresent()) {
                    tId = contextUserOpt.get().getTenantId();
                    sCode = contextUserOpt.get().getSchoolCode();
                }
                
                if (tId != null && sCode != null) {
                    SchoolUserRequest userRequest = new SchoolUserRequest(
                        tId, request.schoolId(), sCode, 
                        "Institutional User", request.studentFullName(), request.studentEmail(), "STUDENT", "Pass@" + resolvedAdmissionNo
                    );
                    try {
                        SchoolUserResponse newUser = this.createUser(userRequest);
                        studentUserId = newUser.userId();
                    } catch (Exception e) {
                        logger.warn("Failed to auto-create user for admission; proceeding with staged enrollment. schoolId={} admissionNo={} email={} error={}",
                                request.schoolId(), resolvedAdmissionNo, request.studentEmail(), e.getMessage());
                    }
                }
            }
        }
        StudentAdmissionEntity entity = new StudentAdmissionEntity();
        entity.setAdmissionId(UUID.randomUUID());
        entity.setSchoolId(request.schoolId());
        entity.setStudentUserId(studentUserId);
        entity.setStudentFullName(request.studentFullName());
        entity.setStudentEmail(request.studentEmail());
        entity.setAdmissionNo(resolvedAdmissionNo);
        entity.setAdmittedOn(request.admittedOn());
        entity.setDateOfBirth(request.dateOfBirth());
        entity.setGuardianName(request.guardianName());
        entity.setGuardianPhone(request.guardianPhone());
        entity.setAddress(request.address());
        entity.setPreviousSchool(request.previousSchool());
        entity.setAdmissionStatus(request.admissionStatus());
        entity.setCreatedAt(Instant.now());
        this.studentAdmissionRepository.save(entity);

        // Auto-enroll if classId provided
        if (request.classId() != null) {
            StudentClassEnrollmentEntity enrollment = new StudentClassEnrollmentEntity();
            enrollment.setEnrollmentId(UUID.randomUUID());
            enrollment.setSchoolId(request.schoolId());
            enrollment.setStudentUserId(studentUserId);
            enrollment.setClassId(request.classId());
            enrollment.setCreatedAt(Instant.now());
            this.studentClassEnrollmentRepository.save(enrollment);
        }

        if (entity.getStudentUserId() != null) {
            try {
                (this.communicationRestClient.post().uri("/api/v1/communication/notifications", new Object[0])).body(Map.of("recipientId", entity.getStudentUserId(), "title", "Admission Confirmed", "message", "Welcome to the school! Your admission " + entity.getAdmissionNo() + " is confirmed.", "type", "ADMISSION_CONFIRMATION", "channel", "PUSH")).retrieve().toBodilessEntity();
            }
            catch (Exception e) {
                logger.warn("Failed to send admission notification. schoolId={} admissionNo={} studentUserId={} error={}",
                        entity.getSchoolId(), entity.getAdmissionNo(), entity.getStudentUserId(), e.getMessage());
            }
        }
        return this.toAdmissionResponse(entity);
    }

    private StudentAdmissionResponse toAdmissionResponse(StudentAdmissionEntity entity) {
        String fullName = entity.getStudentFullName() != null ? entity.getStudentFullName() : "";
        String email = entity.getStudentEmail() != null ? entity.getStudentEmail() : "";
        try {
            if (entity.getStudentUserId() != null) {
                SchoolUserEntity user = this.schoolUserRepository.findById(entity.getStudentUserId())
                        .orElse(null);
                if (user != null) {
                    fullName = user.getFullName();
                    email = user.getEmail();
                }
            }
        } catch (Exception e) {
            // Log but don't fail
            logger.warn("Failed to fetch user for admission response. admissionId={} studentUserId={} error={}",
                    entity.getAdmissionId(), entity.getStudentUserId(), e.getMessage());
        }

        return new StudentAdmissionResponse(
                entity.getAdmissionId(),
                entity.getSchoolId(),
                entity.getStudentUserId(),
                fullName,
                email,
                entity.getAdmissionNo(),
                entity.getAdmittedOn(),
                entity.getDateOfBirth(),
                entity.getGuardianName(),
                entity.getGuardianPhone(),
                entity.getAddress(),
                entity.getPreviousSchool(),
                entity.getAdmissionStatus(),
                entity.getCreatedAt()
        );
    }

    public StudentAdmissionResponse getStudentAdmission(UUID admissionId) {
        StudentAdmissionEntity entity = this.studentAdmissionRepository.findById(admissionId)
                .orElseThrow(() -> new IllegalArgumentException("Admission record not found."));
        return this.toAdmissionResponse(entity);
    }

    public String previewNextAdmissionNo(UUID schoolId) {
        return generateNextAdmissionNo(schoolId);
    }

    private String resolveAdmissionNo(UUID schoolId, String requestedAdmissionNo) {
        String normalized = normalizeAdmissionNo(requestedAdmissionNo);
        if (normalized != null) {
            return normalized;
        }
        return generateNextAdmissionNo(schoolId);
    }

    private String normalizeAdmissionNo(String admissionNo) {
        if (admissionNo == null) {
            return null;
        }
        String normalized = admissionNo.trim().toUpperCase(Locale.ROOT);
        if (normalized.isBlank()) {
            return null;
        }
        return normalized;
    }

    private String generateNextAdmissionNo(UUID schoolId) {
        String prefix = "ADM-" + LocalDate.now().format(DateTimeFormatter.BASIC_ISO_DATE) + "-";
        long existingCount = this.studentAdmissionRepository.countBySchoolIdAndAdmissionNoStartingWith(schoolId, prefix);
        long sequence = Math.max(existingCount + 1L, 1L);

        for (long candidateOffset = 0L; candidateOffset < 10000L; candidateOffset++) {
            String candidate = prefix + String.format(Locale.ROOT, "%04d", sequence + candidateOffset);
            if (!this.studentAdmissionRepository.existsBySchoolIdAndAdmissionNo(schoolId, candidate)) {
                return candidate;
            }
        }

        throw new IllegalStateException("Unable to allocate an admission number. Please retry.");
    }

    @Transactional
    public StudentAdmissionResponse updateStudentAdmission(UUID admissionId, StudentAdmissionUpdateRequest request) {
        StudentAdmissionEntity entity = this.studentAdmissionRepository.findById(admissionId)
                .orElseThrow(() -> new IllegalArgumentException("Admission record not found."));
        
        entity.setGuardianName(request.guardianName());
        entity.setGuardianPhone(request.guardianPhone());
        entity.setAddress(request.address());
        entity.setPreviousSchool(request.previousSchool());
        entity.setAdmissionStatus(request.admissionStatus());
        
        this.studentAdmissionRepository.save(entity);
        return this.toAdmissionResponse(entity);
    }

    @Transactional
    public void deleteStudentAdmission(UUID admissionId) {
        StudentAdmissionEntity entity = this.studentAdmissionRepository.findById(admissionId)
                .orElseThrow(() -> new IllegalArgumentException("Admission record not found."));
        
        // Deactivate user instead of hard delete
        if (entity.getStudentUserId() != null) {
            this.schoolUserRepository.findById(entity.getStudentUserId()).ifPresent(user -> {
                user.setActive(false);
                this.schoolUserRepository.save(user);
            });
        }
        
        this.studentAdmissionRepository.delete(entity);
    }

    @Transactional
    public MappingResponse promoteStudent(PromoteStudentRequest request) {
        // Find existing enrollment and update it (or replace)
        StudentClassEnrollmentEntity enrollment = this.studentClassEnrollmentRepository.findBySchoolId(request.schoolId())
                .stream().filter(e -> e.getStudentUserId().equals(request.studentUserId())).findFirst()
                .orElseGet(() -> {
                    StudentClassEnrollmentEntity newE = new StudentClassEnrollmentEntity();
                    newE.setEnrollmentId(UUID.randomUUID());
                    newE.setSchoolId(request.schoolId());
                    newE.setStudentUserId(request.studentUserId());
                    newE.setCreatedAt(Instant.now());
                    return newE;
                });
        
        enrollment.setClassId(request.newClassId());
        this.studentClassEnrollmentRepository.save(enrollment);
        
        return new MappingResponse(enrollment.getEnrollmentId(), enrollment.getSchoolId(), enrollment.getStudentUserId(), enrollment.getClassId(), enrollment.getCreatedAt());
    }

    @Transactional
    public TimetableSlotResponse createTimetableSlot(TimetableSlotRequest request) {
        TimetableSlotEntity entity = new TimetableSlotEntity();
        entity.setSlotId(UUID.randomUUID());
        entity.setSchoolId(request.schoolId());
        entity.setClassId(request.classId());
        entity.setSubjectId(request.subjectId());
        entity.setTeacherUserId(request.teacherUserId());
        entity.setDayOfWeek(request.dayOfWeek());
        entity.setStartTime(request.startTime());
        entity.setEndTime(request.endTime());
        entity.setRoomName(request.roomName());
        entity.setCreatedAt(Instant.now());
        this.timetableSlotRepository.save(entity);
        return new TimetableSlotResponse(entity.getSlotId(), entity.getSchoolId(), entity.getClassId(), entity.getSubjectId(), entity.getTeacherUserId(), entity.getDayOfWeek(), entity.getStartTime(), entity.getEndTime(), entity.getRoomName(), entity.getCreatedAt());
    }

    @Transactional
    public FeeRecordResponse createFeeRecord(FeeRecordRequest request) {
        FeeRecordEntity entity = new FeeRecordEntity();
        entity.setFeeRecordId(UUID.randomUUID());
        entity.setSchoolId(request.schoolId());
        entity.setStudentUserId(request.studentUserId());
        entity.setFeeCategory(request.feeCategory());
        entity.setAmountDue(request.amountDue());
        entity.setAmountPaid(request.amountPaid());
        entity.setDueDate(request.dueDate());
        entity.setPaymentStatus(request.paymentStatus());
        entity.setCreatedAt(Instant.now());
        this.feeRecordRepository.save(entity);
        return new FeeRecordResponse(entity.getFeeRecordId(), entity.getSchoolId(), entity.getStudentUserId(), entity.getFeeCategory(), entity.getAmountDue(), entity.getAmountPaid(), entity.getDueDate(), entity.getPaymentStatus(), entity.getCreatedAt());
    }

    @Transactional
    public AttendanceRecordResponse createAttendanceRecord(AttendanceRecordRequest request) {
        AttendanceRecordEntity entity = new AttendanceRecordEntity();
        entity.setAttendanceId(UUID.randomUUID());
        entity.setSchoolId(request.schoolId());
        entity.setUserId(request.userId());
        entity.setRoleName(request.roleName());
        entity.setClassId(request.classId());
        entity.setTeacherUserId(request.teacherUserId());
        entity.setSubjectId(request.subjectId());
        entity.setAttendanceMode(request.attendanceMode() == null || request.attendanceMode().isBlank() ? "DAILY" : request.attendanceMode());
        entity.setTimetableSlotId(request.timetableSlotId());
        entity.setPeriodNumber(request.periodNumber());
        entity.setAttendanceDate(request.attendanceDate());
        entity.setAttendanceStatus(request.attendanceStatus());
        entity.setMarkedBy(request.markedBy());
        entity.setRecordedAt(Instant.now());
        entity.setCreatedAt(Instant.now());
        this.attendanceRecordRepository.save(entity);
        return this.toAttendanceResponse(entity);
    }

    @Transactional
    public List<AttendanceRecordResponse> upsertBulkAttendance(AttendanceBulkUpsertRequest request) {
        String mode = request.attendanceMode() == null || request.attendanceMode().isBlank() ? "DAILY" : request.attendanceMode();
        Instant now = Instant.now();
        List<AttendanceRecordEntity> existing = this.attendanceRecordRepository.findBySchoolIdAndClassIdOrderByAttendanceDateDescCreatedAtDesc(request.schoolId(), request.classId()).stream().filter(item -> request.attendanceDate().equals(item.getAttendanceDate())).filter(item -> mode.equalsIgnoreCase(item.getAttendanceMode())).filter(item -> "DAILY".equalsIgnoreCase(mode) || item.getPeriodNumber() != null && item.getPeriodNumber().equals(request.periodNumber()) && (request.subjectId() == null || item.getSubjectId() != null && item.getSubjectId().equals(request.subjectId()))).toList();
        Map<UUID, AttendanceRecordEntity> existingByUser = existing.stream().collect(Collectors.toMap(AttendanceRecordEntity::getUserId, Function.identity(), (a, b) -> a));
        List<AttendanceRecordEntity> upserts = request.entries().stream().map(entry -> {
            AttendanceRecordEntity entity = existingByUser.getOrDefault(entry.userId(), new AttendanceRecordEntity());
            if (entity.getAttendanceId() == null) {
                entity.setAttendanceId(UUID.randomUUID());
                entity.setCreatedAt(now);
            }
            entity.setSchoolId(request.schoolId());
            entity.setClassId(request.classId());
            entity.setTeacherUserId(request.teacherUserId());
            entity.setSubjectId(request.subjectId());
            entity.setTimetableSlotId(request.timetableSlotId());
            entity.setPeriodNumber(request.periodNumber());
            entity.setAttendanceMode(mode);
            entity.setUserId(entry.userId());
            entity.setRoleName(entry.roleName() == null || entry.roleName().isBlank() ? "STUDENT" : entry.roleName());
            entity.setAttendanceDate(request.attendanceDate());
            entity.setAttendanceStatus(entry.attendanceStatus());
            entity.setMarkedBy(request.markedBy());
            entity.setRecordedAt(now);
            return entity;
        }).toList();
        return this.attendanceRecordRepository.saveAll(upserts).stream().map(this::toAttendanceResponse).toList();
    }

    public AttendanceAnalyticsResponse getAttendanceAnalytics(UUID schoolId, LocalDate fromDate, LocalDate toDate) {
        List<AttendanceRecordEntity> records = this.attendanceRecordRepository.findBySchoolIdAndAttendanceDateBetweenOrderByAttendanceDateAsc(schoolId, fromDate, toDate);
        Map<LocalDate, List<AttendanceRecordEntity>> byDate = records.stream().collect(Collectors.groupingBy(AttendanceRecordEntity::getAttendanceDate));
        List<AttendanceSummaryPoint> trend = byDate.entrySet().stream().sorted(Map.Entry.comparingByKey()).map(entry -> {
            List<AttendanceRecordEntity> items = entry.getValue();
            return new AttendanceSummaryPoint(entry.getKey(), items.size(), items.stream().filter(r -> "PRESENT".equalsIgnoreCase(r.getAttendanceStatus())).count(), items.stream().filter(r -> "ABSENT".equalsIgnoreCase(r.getAttendanceStatus())).count(), items.stream().filter(r -> "LATE".equalsIgnoreCase(r.getAttendanceStatus())).count(), items.stream().filter(r -> "LEAVE".equalsIgnoreCase(r.getAttendanceStatus())).count());
        }).toList();

        List<AcademicClassEntity> allClasses = this.academicClassRepository.findBySchoolIdOrderByClassNameAscSectionNameAsc(schoolId);
        Map<UUID, List<AttendanceRecordEntity>> recordsByClass = records.stream()
                .filter(r -> r.getClassId() != null)
                .collect(Collectors.groupingBy(AttendanceRecordEntity::getClassId));

        List<AttendanceClassSummary> byClass = allClasses.stream().map(classroom -> {
            List<AttendanceRecordEntity> items = recordsByClass.getOrDefault(classroom.getClassId(), java.util.List.of());
            return new AttendanceClassSummary(
                classroom.getClassId(),
                classroom.getClassName(),
                classroom.getSectionName(),
                items.size(),
                items.stream().filter(r -> "PRESENT".equalsIgnoreCase(r.getAttendanceStatus())).count(),
                items.stream().filter(r -> "ABSENT".equalsIgnoreCase(r.getAttendanceStatus())).count()
            );
        }).sorted(Comparator.comparingLong(AttendanceClassSummary::total).reversed()).toList();

        Map<UUID, SchoolUserEntity> usersById = this.schoolUserRepository.findBySchoolIdOrderByRoleNameAscFullNameAsc(schoolId).stream().collect(Collectors.toMap(SchoolUserEntity::getUserId, Function.identity()));
        List<AttendanceTeacherSummary> byTeacher = records.stream().filter(r -> r.getTeacherUserId() != null).collect(Collectors.groupingBy(AttendanceRecordEntity::getTeacherUserId)).entrySet().stream().map(entry -> new AttendanceTeacherSummary(entry.getKey(), usersById.get(entry.getKey()) == null ? "Unknown Teacher" : usersById.get(entry.getKey()).getFullName(), entry.getValue().size())).sorted(Comparator.comparingLong(AttendanceTeacherSummary::totalMarked).reversed()).toList();

        return new AttendanceAnalyticsResponse(trend, byClass, byTeacher);
    }

    @Transactional
    public HomeworkItemResponse createHomeworkItem(HomeworkItemRequest request) {
        HomeworkItemEntity entity = new HomeworkItemEntity();
        entity.setHomeworkId(UUID.randomUUID());
        entity.setSchoolId(request.schoolId());
        entity.setClassId(request.classId());
        entity.setSubjectId(request.subjectId());
        entity.setTeacherUserId(request.teacherUserId());
        entity.setTitle(request.title());
        entity.setDescription(request.description());
        entity.setDueDate(request.dueDate());
        entity.setCreatedAt(Instant.now());
        this.homeworkItemRepository.save(entity);
        return new HomeworkItemResponse(entity.getHomeworkId(), entity.getSchoolId(), entity.getClassId(), entity.getSubjectId(), entity.getTeacherUserId(), entity.getTitle(), entity.getDescription(), entity.getDueDate(), entity.getCreatedAt());
    }

    @Transactional
    public NoticeBoardItemResponse createNoticeBoardItem(NoticeBoardItemRequest request) {
        NoticeBoardItemEntity entity = new NoticeBoardItemEntity();
        entity.setNoticeId(UUID.randomUUID());
        entity.setSchoolId(request.schoolId());
        entity.setTitle(request.title());
        entity.setMessage(request.message());
        entity.setAudience(request.audience());
        entity.setPublishedAt(request.publishedAt() == null ? Instant.now() : request.publishedAt());
        entity.setCreatedAt(Instant.now());
        this.noticeBoardItemRepository.save(entity);
        return new NoticeBoardItemResponse(entity.getNoticeId(), entity.getSchoolId(), entity.getTitle(), entity.getMessage(), entity.getAudience(), entity.getPublishedAt(), entity.getCreatedAt());
    }

    @Transactional
    public ExamResultRecordResponse createExamResult(ExamResultRecordRequest request) {
        ExamResultRecordEntity entity = new ExamResultRecordEntity();
        entity.setResultId(UUID.randomUUID());
        entity.setSchoolId(request.schoolId());
        entity.setStudentUserId(request.studentUserId());
        entity.setSubjectId(request.subjectId());
        entity.setExamName(request.examName());
        entity.setAcademicYear(request.academicYear());
        entity.setMarksObtained(request.marksObtained());
        entity.setMaxMarks(request.maxMarks());
        entity.setGrade(request.grade());
        entity.setCreatedAt(Instant.now());
        this.examResultRecordRepository.save(entity);
        return new ExamResultRecordResponse(entity.getResultId(), entity.getSchoolId(), entity.getStudentUserId(), entity.getSubjectId(), entity.getExamName(), entity.getAcademicYear(), entity.getMarksObtained(), entity.getMaxMarks(), entity.getGrade(), entity.getCreatedAt());
    }

    @Transactional
    public TeacherMonthlyReportResponse createTeacherReport(TeacherMonthlyReportRequest request) {
        TeacherMonthlyReportEntity entity = new TeacherMonthlyReportEntity();
        entity.setReportId(UUID.randomUUID());
        entity.setSchoolId(request.schoolId());
        entity.setTeacherUserId(request.teacherUserId());
        entity.setReportMonth(request.reportMonth());
        entity.setAcademicYear(request.academicYear());
        entity.setClassesHandled(request.classesHandled());
        entity.setAttendancePercentage(request.attendancePercentage());
        entity.setBiometricCompliance(request.biometricCompliance());
        entity.setPrincipalNote(request.principalNote());
        entity.setCreatedAt(Instant.now());
        this.teacherMonthlyReportRepository.save(entity);
        return new TeacherMonthlyReportResponse(entity.getReportId(), entity.getSchoolId(), entity.getTeacherUserId(), entity.getReportMonth(), entity.getAcademicYear(), entity.getClassesHandled(), entity.getAttendancePercentage(), entity.getBiometricCompliance(), entity.getPrincipalNote(), entity.getCreatedAt());
    }

    @Transactional
    public StudentMonitoringReportResponse createStudentMonitoringReport(StudentMonitoringReportRequest request) {
        StudentMonitoringReportEntity entity = new StudentMonitoringReportEntity();
        entity.setReportId(UUID.randomUUID());
        entity.setSchoolId(request.schoolId());
        entity.setStudentUserId(request.studentUserId());
        entity.setReportMonth(request.reportMonth());
        entity.setAcademicYear(request.academicYear());
        entity.setAttendancePercentage(request.attendancePercentage());
        entity.setAcademicNote(request.academicNote());
        entity.setBehaviourNote(request.behaviourNote());
        entity.setWellbeingNote(request.wellbeingNote());
        entity.setCreatedAt(Instant.now());
        this.studentMonitoringReportRepository.save(entity);
        return new StudentMonitoringReportResponse(entity.getReportId(), entity.getSchoolId(), entity.getStudentUserId(), entity.getReportMonth(), entity.getAcademicYear(), entity.getAttendancePercentage(), entity.getAcademicNote(), entity.getBehaviourNote(), entity.getWellbeingNote(), entity.getCreatedAt());
    }

    @Transactional
    public CoCurricularActivityResponse createActivity(CoCurricularActivityRequest request) {
        CoCurricularActivityEntity entity = new CoCurricularActivityEntity();
        entity.setActivityId(UUID.randomUUID());
        entity.setSchoolId(request.schoolId());
        entity.setTitle(request.title());
        entity.setActivityType(request.activityType());
        entity.setEventDate(request.eventDate());
        entity.setCoordinatorUserId(request.coordinatorUserId());
        entity.setDescription(request.description());
        entity.setCreatedAt(Instant.now());
        this.coCurricularActivityRepository.save(entity);
        return new CoCurricularActivityResponse(entity.getActivityId(), entity.getSchoolId(), entity.getTitle(), entity.getActivityType(), entity.getEventDate(), entity.getCoordinatorUserId(), entity.getDescription(), entity.getCreatedAt());
    }

    @Transactional
    public LibraryResourceResponse createLibraryResource(LibraryResourceRequest request) {
        LibraryResourceEntity entity = new LibraryResourceEntity();
        entity.setResourceId(UUID.randomUUID());
        entity.setSchoolId(request.schoolId());
        entity.setTitle(request.title());
        entity.setResourceType(request.resourceType());
        entity.setAuthorName(request.authorName());
        entity.setAccessUrl(request.accessUrl());
        entity.setDescription(request.description());
        entity.setSubject(request.subject());
        entity.setGradeLevel(request.gradeLevel());
        entity.setTags(request.tags());
        entity.setUploadedByUserId(request.uploadedByUserId());
        entity.setFileSize(request.fileSize());
        entity.setCreatedAt(Instant.now());
        this.libraryResourceRepository.save(entity);
        return toLibraryResponse(entity, null);
    }

    public List<LibraryResourceResponse> searchLibraryResources(LibrarySearchRequest request, UUID userId) {
        List<LibraryResourceEntity> resources;
        if (request.query() != null && !request.query().isBlank()) {
            resources = libraryResourceRepository.findBySchoolIdOrderByCreatedAtDesc(request.schoolId())
                    .stream()
                    .filter(r -> r.getTitle().toLowerCase().contains(request.query().toLowerCase())
                            || (r.getDescription() != null && r.getDescription().toLowerCase().contains(request.query().toLowerCase()))
                            || (r.getTags() != null && r.getTags().toLowerCase().contains(request.query().toLowerCase())))
                    .toList();
        } else if (request.subject() != null) {
            resources = libraryResourceRepository.findBySchoolIdAndSubject(request.schoolId(), request.subject());
        } else if (request.resourceType() != null) {
            resources = libraryResourceRepository.findBySchoolIdAndResourceType(request.schoolId(), request.resourceType());
        } else if (request.gradeLevel() != null) {
            resources = libraryResourceRepository.findBySchoolIdAndGradeLevel(request.schoolId(), request.gradeLevel());
        } else {
            resources = libraryResourceRepository.findBySchoolIdOrderByCreatedAtDesc(request.schoolId());
        }

        if (Boolean.TRUE.equals(request.onlyBookmarked()) && userId != null) {
            List<UUID> bookmarkedIds = resourceBookmarkRepository.findBySchoolIdAndUserId(request.schoolId(), userId)
                    .stream().map(com.sms.schoolops.domain.ResourceBookmarkEntity::getResourceId).toList();
            resources = resources.stream().filter(r -> bookmarkedIds.contains(r.getResourceId())).toList();
        }

        return resources.stream().map(r -> toLibraryResponse(r, userId)).toList();
    }

    @Transactional
    public void toggleBookmark(BookmarkToggleRequest request) {
        List<com.sms.schoolops.domain.ResourceBookmarkEntity> existing = resourceBookmarkRepository.findBySchoolIdAndUserIdAndResourceId(request.schoolId(), request.userId(), request.resourceId());
        if (existing.isEmpty()) {
            com.sms.schoolops.domain.ResourceBookmarkEntity entity = new com.sms.schoolops.domain.ResourceBookmarkEntity();
            entity.setBookmarkId(UUID.randomUUID());
            entity.setSchoolId(request.schoolId());
            entity.setUserId(request.userId());
            entity.setResourceId(request.resourceId());
            entity.setCreatedAt(Instant.now());
            resourceBookmarkRepository.save(entity);
        } else {
            resourceBookmarkRepository.deleteBySchoolIdAndUserIdAndResourceId(request.schoolId(), request.userId(), request.resourceId());
        }
    }

    @Transactional
    public void logResourceView(UUID schoolId, UUID userId, UUID resourceId) {
        com.sms.schoolops.domain.ResourceViewLogEntity log = new com.sms.schoolops.domain.ResourceViewLogEntity();
        log.setLogId(UUID.randomUUID());
        log.setSchoolId(schoolId);
        log.setUserId(userId);
        log.setResourceId(resourceId);
        log.setViewedAt(Instant.now());
        resourceViewLogRepository.save(log);
    }

    public List<LibraryResourceResponse> getRecentlyViewed(UUID schoolId, UUID userId) {
        return resourceViewLogRepository.findBySchoolIdAndUserIdOrderByViewedAtDesc(schoolId, userId)
                .stream()
                .map(log -> libraryResourceRepository.findById(log.getResourceId()))
                .filter(java.util.Optional::isPresent)
                .map(java.util.Optional::get)
                .distinct()
                .limit(10)
                .map(r -> toLibraryResponse(r, userId))
                .toList();
    }

    @Transactional
    public NoteShareResponse createNoteShare(NoteShareRequest request) {
        NoteShareEntity entity = new NoteShareEntity();
        entity.setNoteId(UUID.randomUUID());
        entity.setSchoolId(request.schoolId());
        entity.setSharedByUserId(request.sharedByUserId());
        entity.setClassId(request.classId());
        entity.setSubjectId(request.subjectId());
        entity.setTitle(request.title());
        entity.setAccessUrl(request.accessUrl());
        entity.setCreatedAt(Instant.now());
        this.noteShareRepository.save(entity);
        return new NoteShareResponse(entity.getNoteId(), entity.getSchoolId(), entity.getSharedByUserId(), entity.getClassId(), entity.getSubjectId(), entity.getTitle(), entity.getAccessUrl(), entity.getCreatedAt());
    }

    @Transactional
    public TransportRouteResponse createTransportRoute(TransportRouteRequest request) {
        requireTransportEnabled(request.schoolId());
        TransportRouteEntity entity = new TransportRouteEntity();
        entity.setRouteId(UUID.randomUUID());
        entity.setSchoolId(request.schoolId());
        entity.setRouteName(request.routeName());
        entity.setVehicleNumber(request.vehicleNumber());
        entity.setDriverName(request.driverName());
        entity.setDriverPhone(request.driverPhone());
        entity.setAttendantName(request.attendantName());
        entity.setStatus(request.status() != null ? request.status() : "ACTIVE");
        entity.setCapacity(request.capacity() != null ? request.capacity() : 40);
        entity.setConductorName(request.conductorName());
        entity.setConductorPhone(request.conductorPhone());
        entity.setCreatedAt(Instant.now());
        this.transportRouteRepository.save(entity);
        return this.toTransportRouteResponse(entity);
    }

    @Transactional
    public TransportStudentAssignmentResponse assignStudentToRoute(TransportStudentAssignmentRequest request) {
        requireTransportEnabled(request.schoolId());
        TransportStudentAssignmentEntity entity = this.transportStudentAssignmentRepository.findByStudentUserId(request.studentUserId())
                .filter(existing -> existing.getSchoolId().equals(request.schoolId()))
                .orElseGet(() -> {
                    TransportStudentAssignmentEntity assignment = new TransportStudentAssignmentEntity();
                    assignment.setAssignmentId(UUID.randomUUID());
                    assignment.setSchoolId(request.schoolId());
                    assignment.setStudentUserId(request.studentUserId());
                    assignment.setCreatedAt(Instant.now());
                    return assignment;
                });

        entity.setRouteId(request.routeId());
        entity.setStopId(request.stopId());
        this.transportStudentAssignmentRepository.save(entity);
        return this.toTransportAssignmentResponse(entity);
    }

    @Transactional
    public void clearStudentTransportAssignment(UUID schoolId, UUID studentUserId) {
        requireTransportEnabled(schoolId);
        this.transportStudentAssignmentRepository.findByStudentUserId(studentUserId)
                .filter(existing -> existing.getSchoolId().equals(schoolId))
                .ifPresent(this.transportStudentAssignmentRepository::delete);
    }

    @Transactional
    public TransportVehiclePositionResponse updateVehicleGps(TransportGpsUpdate request) {
        requireTransportEnabled(request.schoolId());
        TransportVehiclePositionEntity entity = new TransportVehiclePositionEntity();
        entity.setPositionId(UUID.randomUUID());
        entity.setSchoolId(request.schoolId());
        entity.setRouteId(request.routeId());
        entity.setLatitude(request.latitude());
        entity.setLongitude(request.longitude());
        entity.setSpeed(request.speed());
        entity.setHeading(request.heading());
        entity.setRecordedAt(Instant.now());
        this.transportVehiclePositionRepository.save(entity);
        TransportVehiclePositionResponse response = this.toGpsResponse(entity);
        this.mqttEventPublisher.publish("transport/gps/" + String.valueOf(request.schoolId()) + "/" + String.valueOf(request.routeId()), response);
        return response;
    }

    @Transactional
    public TransportPickupLogResponse markPickupDrop(TransportPickupLogRequest request) {
        requireTransportEnabled(request.schoolId());
        TransportPickupLogEntity entity = new TransportPickupLogEntity();
        entity.setLogId(UUID.randomUUID());
        entity.setSchoolId(request.schoolId());
        entity.setRouteId(request.routeId());
        entity.setStudentUserId(request.studentUserId());
        entity.setStopId(request.stopId());
        entity.setAction(request.action());
        entity.setMarkedBy(request.markedBy());
        entity.setTripDate(request.tripDate());
        entity.setMarkedAt(Instant.now());
        this.transportPickupLogRepository.save(entity);
        TransportPickupLogResponse response = this.toPickupLogResponse(entity);
        this.mqttEventPublisher.publish("transport/pickup/" + String.valueOf(request.schoolId()) + "/" + String.valueOf(request.routeId()), response);
        return response;
    }

    public List<TransportRouteFull> getFullTransportDashboard(UUID schoolId) {
        requireTransportEnabled(schoolId);
        List<TransportRouteEntity> routes = this.transportRouteRepository.findBySchoolIdOrderByCreatedAtDesc(schoolId);
        return routes.stream().map(route -> {
            List<TransportStopResponse> stops = this.transportStopRepository.findByRouteIdOrderByStopOrderAsc(route.getRouteId()).stream().map(this::toTransportStopResponse).toList();
            List<TransportStudentAssignmentResponse> assignments = this.transportStudentAssignmentRepository.findByRouteId(route.getRouteId()).stream().map(this::toTransportAssignmentResponse).toList();
            TransportVehiclePositionResponse latestPosition = this.transportVehiclePositionRepository.findByRouteIdOrderByRecordedAtDesc(route.getRouteId()).stream().findFirst().map(this::toGpsResponse).orElse(null);
            return new TransportRouteFull(this.toTransportRouteResponse((TransportRouteEntity)route), stops, assignments, latestPosition);
        }).toList();
    }

    private void requireTransportEnabled(UUID schoolId) {
        UUID tenantId = resolveTenantId(schoolId);
        if (!this.subscriptionService.isFeatureAccessibleStrict(tenantId, "TRANSPORT_BASE")) {
            throw new ForbiddenException("Transport is not enabled for the current subscription.");
        }
    }

    @Transactional
    public VoiceNoteResponse createVoiceNote(VoiceNoteRequest request) {
        VoiceNoteEntity entity = new VoiceNoteEntity();
        entity.setVoiceNoteId(UUID.randomUUID());
        entity.setSchoolId(request.schoolId());
        entity.setRelatedUserId(request.relatedUserId());
        entity.setAudience(request.audience());
        entity.setTitle(request.title());
        entity.setTranscript(request.transcript());
        entity.setAudioUrl(request.audioUrl());
        entity.setCreatedAt(Instant.now());
        this.voiceNoteRepository.save(entity);
        return this.toVoiceNoteResponse(entity);
    }

    @Transactional
    public ReminderResponse createReminder(ReminderRequest request) {
        ReminderEntity entity = new ReminderEntity();
        entity.setReminderId(UUID.randomUUID());
        entity.setSchoolId(request.schoolId());
        entity.setReminderType(request.reminderType());
        entity.setTargetUserId(request.targetUserId());
        entity.setMessage(request.message());
        entity.setDueAt(request.dueAt());
        entity.setReminderStatus(request.reminderStatus());
        entity.setCreatedAt(Instant.now());
        this.reminderRepository.save(entity);
        return new ReminderResponse(entity.getReminderId(), entity.getSchoolId(), entity.getReminderType(), entity.getTargetUserId(), entity.getMessage(), entity.getDueAt(), entity.getReminderStatus(), entity.getCreatedAt());
    }

    @Transactional
    public MappingResponse assignHod(MappingRequest request) {
        DepartmentHodAssignmentEntity entity = new DepartmentHodAssignmentEntity();
        entity.setAssignmentId(UUID.randomUUID());
        entity.setSchoolId(request.schoolId());
        entity.setDepartmentId(request.primaryId());
        entity.setTeacherUserId(request.secondaryId());
        entity.setCreatedAt(Instant.now());
        this.departmentHodAssignmentRepository.save(entity);
        return new MappingResponse(entity.getAssignmentId(), entity.getSchoolId(), entity.getDepartmentId(), entity.getTeacherUserId(), entity.getCreatedAt());
    }

    @Transactional
    public MappingResponse assignTeacherSubject(MappingRequest request) {
        TeacherSubjectMappingEntity entity = new TeacherSubjectMappingEntity();
        entity.setMappingId(UUID.randomUUID());
        entity.setSchoolId(request.schoolId());
        entity.setTeacherUserId(request.primaryId());
        entity.setSubjectId(request.secondaryId());
        entity.setCreatedAt(Instant.now());
        this.teacherSubjectMappingRepository.save(entity);
        return new MappingResponse(entity.getMappingId(), entity.getSchoolId(), entity.getTeacherUserId(), entity.getSubjectId(), entity.getCreatedAt());
    }

    @Transactional
    public MappingResponse assignTeacherClass(MappingRequest request) {
        TeacherClassMappingEntity entity = new TeacherClassMappingEntity();
        entity.setMappingId(UUID.randomUUID());
        entity.setSchoolId(request.schoolId());
        entity.setTeacherUserId(request.primaryId());
        entity.setClassId(request.secondaryId());
        entity.setCreatedAt(Instant.now());
        this.teacherClassMappingRepository.save(entity);
        return new MappingResponse(entity.getMappingId(), entity.getSchoolId(), entity.getTeacherUserId(), entity.getClassId(), entity.getCreatedAt());
    }

    public List<TeacherClassMappingView> listTeacherClassMappings(UUID schoolId) {
        return this.teacherClassMappingRepository.findBySchoolId(schoolId).stream().map(item -> new TeacherClassMappingView(item.getMappingId(), item.getSchoolId(), item.getTeacherUserId(), item.getClassId(), item.getCreatedAt())).toList();
    }

    @Transactional
    public MappingResponse assignClassTeacher(MappingRequest request) {
        ClassTeacherMappingEntity entity = new ClassTeacherMappingEntity();
        entity.setMappingId(UUID.randomUUID());
        entity.setSchoolId(request.schoolId());
        entity.setTeacherUserId(request.primaryId());
        entity.setClassId(request.secondaryId());
        entity.setCreatedAt(Instant.now());
        this.classTeacherMappingRepository.save(entity);
        return new MappingResponse(entity.getMappingId(), entity.getSchoolId(), entity.getTeacherUserId(), entity.getClassId(), entity.getCreatedAt());
    }

    public List<ClassTeacherMappingView> listClassTeacherMappings(UUID schoolId) {
        return this.classTeacherMappingRepository.findBySchoolId(schoolId).stream().map(item -> new ClassTeacherMappingView(item.getMappingId(), item.getSchoolId(), item.getTeacherUserId(), item.getClassId(), item.getCreatedAt())).toList();
    }

    public List<DepartmentHodView> listDepartmentHods(UUID schoolId) {
        List<DepartmentHodAssignmentEntity> assignments = this.departmentHodAssignmentRepository.findBySchoolId(schoolId);
        Map<UUID, DepartmentEntity> deptsById = this.departmentRepository.findBySchoolIdOrderByDepartmentNameAsc(schoolId).stream()
                .collect(Collectors.toMap(DepartmentEntity::getDepartmentId, Function.identity()));
        Map<UUID, SchoolUserEntity> usersById = this.schoolUserRepository.findBySchoolIdOrderByRoleNameAscFullNameAsc(schoolId).stream()
                .collect(Collectors.toMap(SchoolUserEntity::getUserId, Function.identity(), (a, b) -> a));

        return assignments.stream().map(a -> {
            DepartmentEntity dept = deptsById.get(a.getDepartmentId());
            SchoolUserEntity user = usersById.get(a.getTeacherUserId());
            return new DepartmentHodView(
                    a.getAssignmentId(),
                    a.getDepartmentId(),
                    dept != null ? dept.getDepartmentName() : "Unknown Department",
                    a.getTeacherUserId(),
                    user != null ? user.getFullName() : "Unknown Teacher",
                    a.getCreatedAt()
            );
        }).toList();
    }

    @Transactional
    public DepartmentResponse updateDepartment(UUID departmentId, DepartmentUpdate request) {
        DepartmentEntity entity = this.departmentRepository.findById(departmentId)
                .orElseThrow(() -> new IllegalArgumentException("Department not found."));
        if (request.departmentName() != null) entity.setDepartmentName(request.departmentName());
        if (request.departmentCode() != null) entity.setDepartmentCode(request.departmentCode());
        this.departmentRepository.save(entity);
        return new DepartmentResponse(entity.getDepartmentId(), entity.getSchoolId(), entity.getDepartmentName(), entity.getDepartmentCode(), entity.getCreatedAt());
    }

    @Transactional
    public void deleteDepartment(UUID departmentId) {
        this.departmentRepository.deleteById(departmentId);
    }

    @Transactional
    public SubjectResponse updateSubject(UUID subjectId, SubjectUpdate request) {
        SubjectEntity entity = this.subjectRepository.findById(subjectId)
                .orElseThrow(() -> new IllegalArgumentException("Subject not found."));
        if (request.subjectName() != null) entity.setSubjectName(request.subjectName());
        if (request.subjectCode() != null) entity.setSubjectCode(request.subjectCode());
        if (request.departmentId() != null) entity.setDepartmentId(request.departmentId());
        this.subjectRepository.save(entity);
        return new SubjectResponse(entity.getSubjectId(), entity.getSchoolId(), entity.getDepartmentId(), entity.getSubjectName(), entity.getSubjectCode(), entity.getCreatedAt());
    }

    @Transactional
    public void deleteSubject(UUID subjectId) {
        this.subjectRepository.deleteById(subjectId);
    }

    @Transactional
    public MappingResponse enrollStudent(MappingRequest request) {
        StudentClassEnrollmentEntity entity = this.studentClassEnrollmentRepository.findBySchoolId(request.schoolId())
                .stream()
                .filter(item -> item.getStudentUserId().equals(request.primaryId()))
                .findFirst()
                .orElseGet(() -> {
                    StudentClassEnrollmentEntity enrollment = new StudentClassEnrollmentEntity();
                    enrollment.setEnrollmentId(UUID.randomUUID());
                    enrollment.setSchoolId(request.schoolId());
                    enrollment.setStudentUserId(request.primaryId());
                    enrollment.setCreatedAt(Instant.now());
                    return enrollment;
                });

        entity.setClassId(request.secondaryId());
        this.studentClassEnrollmentRepository.save(entity);
        return new MappingResponse(entity.getEnrollmentId(), entity.getSchoolId(), entity.getStudentUserId(), entity.getClassId(), entity.getCreatedAt());
    }

    public List<StudentClassEnrollmentView> listStudentEnrollments(UUID schoolId) {
        return this.studentClassEnrollmentRepository.findBySchoolId(schoolId).stream().map(item -> new StudentClassEnrollmentView(item.getEnrollmentId(), item.getSchoolId(), item.getStudentUserId(), item.getClassId(), item.getCreatedAt())).toList();
    }

    private int countByRole(List<SchoolUserEntity> users, String roleName) {
        return (int)users.stream().filter(user -> roleName.equalsIgnoreCase(user.getRoleName())).count();
    }

    private boolean studentDirectoryMatchesSearch(StudentDirectoryRowResponse row, String normalizedSearch) {
        return List.of(
                row.fullName(),
                row.email(),
                row.admissionNo(),
                row.guardianName(),
                row.guardianPhone(),
                row.className(),
                row.sectionName(),
                row.routeName(),
                row.stopName()
        ).stream()
                .filter(Objects::nonNull)
                .map(value -> value.toLowerCase(Locale.ROOT))
                .anyMatch(value -> value.contains(normalizedSearch));
    }

    private Comparator<StudentDirectoryRowResponse> studentDirectoryComparator(String sortBy) {
        return switch (sortBy) {
            case "email" -> Comparator.comparing(row -> safeString(row.email()), String.CASE_INSENSITIVE_ORDER);
            case "admissionNo" -> Comparator.comparing(row -> safeString(row.admissionNo()), String.CASE_INSENSITIVE_ORDER);
            case "admissionStatus" -> Comparator.comparing(row -> safeString(row.admissionStatus()), String.CASE_INSENSITIVE_ORDER);
            case "className" -> Comparator.comparing(row -> safeString(row.className()) + " " + safeString(row.sectionName()), String.CASE_INSENSITIVE_ORDER);
            case "guardianName" -> Comparator.comparing(row -> safeString(row.guardianName()), String.CASE_INSENSITIVE_ORDER);
            case "transportRoute" -> Comparator.comparing(row -> safeString(row.routeName()), String.CASE_INSENSITIVE_ORDER);
            case "createdAt" -> Comparator.comparing(row -> row.createdAt() == null ? Instant.EPOCH : row.createdAt());
            default -> Comparator.comparing(row -> safeString(row.fullName()), String.CASE_INSENSITIVE_ORDER);
        };
    }

    private Comparator<StudentRowResponse> studentRowComparator(String sortBy, String sortDir) {
        Comparator<StudentRowResponse> comparator = switch (sortBy == null ? "createdAt" : sortBy) {
            case "name" -> Comparator.comparing(row -> safeString(row.fullName()), String.CASE_INSENSITIVE_ORDER);
            case "admissionNo" -> Comparator.comparing(row -> safeString(row.admissionNo()), String.CASE_INSENSITIVE_ORDER);
            case "class" -> Comparator.comparing(row -> (safeString(row.className()) + safeString(row.sectionName())), String.CASE_INSENSITIVE_ORDER);
            case "rollNo" -> Comparator.comparing(row -> safeString(row.rollNo()), String.CASE_INSENSITIVE_ORDER);
            case "teacher" -> Comparator.comparing(row -> safeString(row.classTeacherName()), String.CASE_INSENSITIVE_ORDER);
            case "transport" -> Comparator.comparing(row -> safeString(row.transportStatus()), String.CASE_INSENSITIVE_ORDER);
            default -> Comparator.comparing(row -> row.createdAt() == null ? Instant.EPOCH : row.createdAt());
        };

        if ("asc".equalsIgnoreCase(sortDir)) {
            return comparator;
        }
        return comparator.reversed();
    }

    private String safeString(String value) {
        return value == null ? "" : value;
    }

    private WorkspaceUser toWorkspaceUser(SchoolUserEntity user) {
        return new WorkspaceUser(user.getUserId(), user.getFullName(), user.getEmail(), user.getRoleName());
    }

    private WorkspaceClass toWorkspaceClass(AcademicClassEntity classroom) {
        return new WorkspaceClass(classroom.getClassId(), classroom.getClassName(), classroom.getSectionName(), classroom.getAcademicYear());
    }

    @Transactional
    public StudentParentMappingResponse linkParentToStudent(StudentParentMappingRequest request) {
        int limit;
        long currentCount = this.parentMappingRepository.countByStudentUserId(request.studentUserId());
        if (currentCount >= (long)(limit = 2)) {
            throw new RuntimeException("Maximum parent limit reached for this student's subscription tier.");
        }
        StudentParentMappingEntity entity = new StudentParentMappingEntity();
        entity.setMappingId(UUID.randomUUID());
        entity.setSchoolId(request.schoolId());
        entity.setStudentUserId(request.studentUserId());
        entity.setParentUserId(request.parentUserId());
        entity.setRelationship(request.relationship());
        entity.setCreatedAt(Instant.now());
        this.parentMappingRepository.save(entity);
        return new StudentParentMappingResponse(entity.getMappingId(), entity.getStudentUserId(), entity.getParentUserId(), entity.getRelationship(), entity.getCreatedAt());
    }

    public ParentWorkspaceResponse getParentWorkspace(UUID schoolId, String email) {
        SchoolUserEntity parent = this.schoolUserRepository.findBySchoolIdAndEmailIgnoreCase(schoolId, email)
                .orElseThrow(() -> new NotFoundException("Parent account not found for this school."));

        List<StudentParentMappingEntity> mappings = this.parentMappingRepository.findByParentUserId(parent.getUserId());
        List<UUID> studentUserIds = mappings.stream()
                .map(StudentParentMappingEntity::getStudentUserId)
                .filter(Objects::nonNull)
                .distinct()
                .toList();

        Map<UUID, SchoolUserEntity> studentsById = this.schoolUserRepository.findBySchoolIdAndUserIdIn(schoolId, studentUserIds).stream()
                .collect(Collectors.toMap(SchoolUserEntity::getUserId, Function.identity()));

        List<StudentWorkspaceResponse> children = studentUserIds.stream()
                .map(studentsById::get)
                .filter(Objects::nonNull)
                .map(student -> buildStudentWorkspace(schoolId, student.getEmail()))
                .toList();

        List<VoiceNoteResponse> recentVoiceNotes = this.voiceNoteRepository.findBySchoolIdOrderByCreatedAtDesc(schoolId).stream()
                .limit(5L)
                .map(this::toVoiceNoteResponse)
                .toList();

        return new ParentWorkspaceResponse(schoolId, parent.getSchoolCode(), this.toWorkspaceUser(parent), children, recentVoiceNotes);
    }

    private AttendanceRecordResponse toAttendanceResponse(AttendanceRecordEntity entity) {
        return new AttendanceRecordResponse(entity.getAttendanceId(), entity.getSchoolId(), entity.getUserId(), entity.getRoleName(), entity.getClassId(), entity.getTeacherUserId(), entity.getSubjectId(), entity.getAttendanceMode(), entity.getTimetableSlotId(), entity.getPeriodNumber(), entity.getAttendanceDate(), entity.getAttendanceStatus(), entity.getMarkedBy(), entity.getRecordedAt(), entity.getCreatedAt());
    }

    @Transactional
    public SchoolUserResponse updateUserPreferences(String email, UserPreferencesRequest request) {
        SchoolUserEntity entity = this.schoolUserRepository.findByEmailIgnoreCase(email).orElseThrow(() -> new IllegalArgumentException("User not found: " + email));
        if (request.theme() != null) {
            entity.setTheme(request.theme());
        }
        if (request.activeTheme() != null) {
            entity.setActiveTheme(request.activeTheme());
        }
        if (request.vibe() != null) {
            entity.setVibe(request.vibe());
        }
        if (request.accentColor() != null) {
            entity.setAccentColor(request.accentColor());
        }
        if (request.glassIntensity() != null) {
            entity.setGlassIntensity(request.glassIntensity());
        }
        if (request.borderRadius() != null) {
            entity.setBorderRadius(request.borderRadius());
        }
        this.schoolUserRepository.save(entity);
        try {
            (this.authRestClient.patch().uri("/api/v1/auth/internal/user-preferences?email=" + email, new Object[0])).body(request).retrieve().toBodilessEntity();
        }
        catch (Exception e) {
            logger.warn("Failed to sync preferences to auth-service. userId={} email={} error={}", entity.getUserId(), email, e.getMessage());
        }
        return new SchoolUserResponse(entity.getUserId(), entity.getTenantId(), entity.getSchoolId(), entity.getSchoolCode(), entity.getFullName(), entity.getEmail(), entity.getRoleName(), entity.getCreatedAt(), entity.getTheme(), entity.getActiveTheme(), entity.getVibe(), entity.getAccentColor(), entity.getGlassIntensity(), entity.getBorderRadius(), null);
    }

    private TransportRouteResponse toTransportRouteResponse(TransportRouteEntity entity) {
        return new TransportRouteResponse(entity.getRouteId(), entity.getSchoolId(), entity.getRouteName(), entity.getVehicleNumber(), entity.getDriverName(), entity.getDriverPhone(), entity.getAttendantName(), entity.getStatus(), entity.getCapacity(), entity.getConductorName(), entity.getConductorPhone(), entity.getCreatedAt());
    }

    private TransportStopResponse toTransportStopResponse(TransportStopEntity entity) {
        return new TransportStopResponse(entity.getStopId(), entity.getSchoolId(), entity.getRouteId(), entity.getStopName(), entity.getStopOrder(), entity.getLatitude(), entity.getLongitude(), entity.getPickupTime(), entity.getDropTime(), entity.getCreatedAt());
    }

    private TransportStudentAssignmentResponse toTransportAssignmentResponse(TransportStudentAssignmentEntity entity) {
        return new TransportStudentAssignmentResponse(entity.getAssignmentId(), entity.getSchoolId(), entity.getStudentUserId(), entity.getRouteId(), entity.getStopId(), entity.getCreatedAt());
    }

    private TransportVehiclePositionResponse toGpsResponse(TransportVehiclePositionEntity entity) {
        return new TransportVehiclePositionResponse(entity.getPositionId(), entity.getSchoolId(), entity.getRouteId(), entity.getLatitude(), entity.getLongitude(), entity.getSpeed(), entity.getHeading(), entity.getRecordedAt());
    }

    private TransportPickupLogResponse toPickupLogResponse(TransportPickupLogEntity entity) {
        return new TransportPickupLogResponse(entity.getLogId(), entity.getSchoolId(), entity.getRouteId(), entity.getStudentUserId(), entity.getStopId(), entity.getAction(), entity.getMarkedBy(), entity.getTripDate(), entity.getMarkedAt());
    }

    @Transactional
    public SchoolUserDocumentResponse addDocument(SchoolUserDocumentRequest request, UUID userId) {
        SchoolUserDocumentEntity entity = new SchoolUserDocumentEntity();
        entity.setDocumentId(UUID.randomUUID());
        entity.setSchoolId(request.schoolId());
        entity.setUserId(userId);
        entity.setDocumentType(request.documentType());
        entity.setDocumentName(request.documentName());
        entity.setAccessUrl(request.accessUrl());
        entity.setCreatedAt(Instant.now());
        this.schoolUserDocumentRepository.save(entity);
        return new SchoolUserDocumentResponse(entity.getDocumentId(), entity.getUserId(), entity.getDocumentType(), entity.getDocumentName(), entity.getAccessUrl(), entity.getCreatedAt());
    }

    public List<SchoolUserDocumentResponse> listDocuments(UUID userId) {
        return this.schoolUserDocumentRepository.findByUserIdOrderByCreatedAtDesc(userId).stream().map(d -> new SchoolUserDocumentResponse(d.getDocumentId(), d.getUserId(), d.getDocumentType(), d.getDocumentName(), d.getAccessUrl(), d.getCreatedAt())).toList();
    }

    @Transactional
    public List<TimetableSlotResponse> saveBulkTimetableSlots(TimetableBulkRequest request) {
        // Delete existing slots for this class only to replace with new schedule
        List<TimetableSlotEntity> existing = this.timetableSlotRepository
                .findBySchoolIdOrderByDayOfWeekAscStartTimeAsc(request.schoolId()).stream()
                .filter(slot -> slot.getClassId().equals(request.classId()))
                .toList();
        this.timetableSlotRepository.deleteAll(existing);

        Instant now = Instant.now();
        List<TimetableSlotEntity> entities = request.slots().stream().map(slotReq -> {
            TimetableSlotEntity entity = new TimetableSlotEntity();
            entity.setSlotId(UUID.randomUUID());
            entity.setSchoolId(request.schoolId());
            entity.setClassId(request.classId());
            entity.setSubjectId(slotReq.subjectId());
            entity.setTeacherUserId(slotReq.teacherUserId());
            entity.setDayOfWeek(slotReq.dayOfWeek());
            entity.setStartTime(slotReq.startTime());
            entity.setEndTime(slotReq.endTime());
            entity.setRoomName(slotReq.roomName());
            entity.setCreatedAt(now);
            return entity;
        }).toList();

        return this.timetableSlotRepository.saveAll(entities).stream()
                .map(s -> new TimetableSlotResponse(s.getSlotId(), s.getSchoolId(), s.getClassId(), s.getSubjectId(), s.getTeacherUserId(), s.getDayOfWeek(), s.getStartTime(), s.getEndTime(), s.getRoomName(), s.getCreatedAt()))
                .toList();
    }

    @Transactional
    public SchoolUserResponse updateUser(UUID userId, UserUpdateRequest request) {
        SchoolUserEntity entity = this.schoolUserRepository.findById(userId).orElseThrow(() -> new IllegalArgumentException("User not found: " + userId));
        if (request.fullName() != null) entity.setFullName(request.fullName());
        if (request.email() != null) entity.setEmail(request.email());
        if (request.roleName() != null) entity.setRoleName(request.roleName());
        if (request.active() != null) entity.setActive(request.active());
        this.schoolUserRepository.save(entity);
        return new SchoolUserResponse(entity.getUserId(), entity.getTenantId(), entity.getSchoolId(), entity.getSchoolCode(), entity.getFullName(), entity.getEmail(), entity.getRoleName(), entity.getCreatedAt(), entity.getTheme(), entity.getActiveTheme(), entity.getVibe(), entity.getAccentColor(), entity.getGlassIntensity(), entity.getBorderRadius(), null);
    }

    @Transactional
    public void deleteUser(UUID userId) {
        SchoolUserEntity entity = this.schoolUserRepository.findById(userId).orElseThrow(() -> new IllegalArgumentException("User not found: " + userId));
        entity.setActive(false);
        this.schoolUserRepository.save(entity);
    }

    public TeacherPerformanceResponse getTeacherPerformance(UUID schoolId, UUID teacherUserId) {
        int classes = this.teacherClassMappingRepository.findBySchoolId(schoolId).stream()
                .filter(m -> m.getTeacherUserId().equals(teacherUserId)).toList().size();
        int subjects = this.teacherSubjectMappingRepository.findBySchoolId(schoolId).stream()
                .filter(m -> m.getTeacherUserId().equals(teacherUserId)).toList().size();
        long homeworks = this.homeworkItemRepository.findBySchoolIdOrderByDueDateDescCreatedAtDesc(schoolId).stream()
                .filter(h -> h.getTeacherUserId().equals(teacherUserId)).count();
        long reports = this.teacherMonthlyReportRepository.findBySchoolIdOrderByCreatedAtDesc(schoolId).stream()
                .filter(r -> r.getTeacherUserId().equals(teacherUserId)).count();
        
        var teacherAttendanceRecords = this.attendanceRecordRepository.findBySchoolIdOrderByAttendanceDateDescCreatedAtDesc(schoolId).stream()
                .filter(record -> teacherUserId.equals(record.getTeacherUserId()))
                .toList();
        long totalAttendanceRows = teacherAttendanceRecords.size();
        long presentOrLateRows = teacherAttendanceRecords.stream()
                .filter(record -> {
                    String status = record.getAttendanceStatus();
                    if (status == null) return false;
                    String normalized = status.trim().toUpperCase(java.util.Locale.ROOT);
                    return "PRESENT".equals(normalized) || "LATE".equals(normalized);
                })
                .count();
        double attendance = totalAttendanceRows == 0
                ? 0.0
                : ((double) presentOrLateRows * 100.0) / (double) totalAttendanceRows;
        String vibe = attendance >= 95.0 ? "EXCELLENT"
                : attendance >= 85.0 ? "GOOD"
                : attendance >= 70.0 ? "WATCHLIST"
                : "CRITICAL";

        return new TeacherPerformanceResponse(teacherUserId, classes, subjects, attendance, (int)homeworks, (int)reports, "A", vibe);
    }

    public record ProvisionUserAccountResponse(UUID accountId, String schoolCode, String email, String fullName, String roleName) {
    }

    public record ProvisionUserAccountRequest(UUID tenantId, UUID schoolId, String schoolCode, String schoolName, String email, String fullName, String roleName, String accessKey) {
    }
    public List<TeacherSubjectMappingView> listTeacherSubjectMappings(UUID schoolId) {
        return this.teacherSubjectMappingRepository.findBySchoolId(schoolId).stream().map(item -> new TeacherSubjectMappingView(item.getMappingId(), item.getSchoolId(), item.getTeacherUserId(), item.getSubjectId(), item.getCreatedAt())).toList();
    }

    @Transactional
    public ClassSubjectTeacherMappingView assignClassSubjectTeacher(ClassSubjectTeacherMappingView request) {
        if (request == null) {
            throw new IllegalArgumentException("Request is required.");
        }
        if (request.schoolId() == null || request.classId() == null || request.subjectId() == null || request.teacherUserId() == null) {
            throw new IllegalArgumentException("schoolId, classId, subjectId, and teacherUserId are required.");
        }

        ClassSubjectTeacherMappingEntity entity = new ClassSubjectTeacherMappingEntity();
        entity.setMappingId(request.mappingId() == null ? UUID.randomUUID() : request.mappingId());
        entity.setSchoolId(request.schoolId());
        entity.setClassId(request.classId());
        entity.setSubjectId(request.subjectId());
        entity.setTeacherUserId(request.teacherUserId());
        entity.setCreatedAt(Instant.now());
        this.classSubjectTeacherMappingRepository.save(entity);

        return new ClassSubjectTeacherMappingView(
                entity.getMappingId(),
                entity.getSchoolId(),
                entity.getClassId(),
                entity.getSubjectId(),
                entity.getTeacherUserId(),
                entity.getCreatedAt()
        );
    }

    public List<ClassSubjectTeacherMappingView> listClassSubjectTeacherMappings(UUID schoolId) {
        return this.classSubjectTeacherMappingRepository.findBySchoolId(schoolId).stream()
                .map(item -> new ClassSubjectTeacherMappingView(
                        item.getMappingId(),
                        item.getSchoolId(),
                        item.getClassId(),
                        item.getSubjectId(),
                        item.getTeacherUserId(),
                        item.getCreatedAt()
                ))
                .toList();
    }
}

