package com.sms.schoolops.service;

import com.sms.common.exception.ForbiddenException;
import com.lowagie.text.Document;
import com.lowagie.text.DocumentException;
import com.lowagie.text.FontFactory;
import com.lowagie.text.PageSize;
import com.lowagie.text.Paragraph;
import com.lowagie.text.Phrase;
import com.lowagie.text.pdf.PdfPCell;
import com.lowagie.text.pdf.PdfPTable;
import com.lowagie.text.pdf.PdfWriter;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.sms.schoolops.api.AttendanceManagementDtos.*;
import com.sms.schoolops.domain.AcademicClassEntity;
import com.sms.schoolops.domain.AttendanceAlertEventEntity;
import com.sms.schoolops.domain.AttendanceAuditLogEntity;
import com.sms.schoolops.domain.AttendanceFaceScanEntity;
import com.sms.schoolops.domain.AttendancePolicyEntity;
import com.sms.schoolops.domain.AttendancePredictionSnapshotEntity;
import com.sms.schoolops.domain.AttendanceRecordEntity;
import com.sms.schoolops.domain.AttendanceSessionEntity;
import com.sms.schoolops.domain.ClassTeacherMappingEntity;
import com.sms.schoolops.domain.ReminderEntity;
import com.sms.schoolops.domain.SchoolUserEntity;
import com.sms.schoolops.domain.StudentAbsenceReasonEntity;
import com.sms.schoolops.domain.StudentAdmissionEntity;
import com.sms.schoolops.domain.StudentClassEnrollmentEntity;
import com.sms.schoolops.domain.StudentParentMappingEntity;
import com.sms.schoolops.domain.SubjectEntity;
import com.sms.schoolops.domain.TeacherClassMappingEntity;
import com.sms.schoolops.domain.TeacherSubjectMappingEntity;
import com.sms.schoolops.domain.TimetableSlotEntity;
import com.sms.schoolops.domain.AttendanceVoiceCommandLogEntity;
import com.sms.schoolops.event.MqttEventPublisher;
import com.sms.schoolops.repository.AcademicClassRepository;
import com.sms.schoolops.repository.AttendanceAlertEventRepository;
import com.sms.schoolops.repository.AttendanceAuditLogRepository;
import com.sms.schoolops.repository.AttendanceFaceScanRepository;
import com.sms.schoolops.repository.AttendancePolicyRepository;
import com.sms.schoolops.repository.AttendancePredictionSnapshotRepository;
import com.sms.schoolops.repository.AttendanceRecordRepository;
import com.sms.schoolops.repository.AttendanceSessionRepository;
import com.sms.schoolops.repository.AttendanceVoiceCommandLogRepository;
import com.sms.schoolops.repository.ClassTeacherMappingRepository;
import com.sms.schoolops.repository.ReminderRepository;
import com.sms.schoolops.repository.SchoolUserRepository;
import com.sms.schoolops.repository.StudentAbsenceReasonRepository;
import com.sms.schoolops.repository.StudentAdmissionRepository;
import com.sms.schoolops.repository.StudentClassEnrollmentRepository;
import com.sms.schoolops.repository.StudentParentMappingRepository;
import com.sms.schoolops.repository.SubjectRepository;
import com.sms.schoolops.repository.TeacherClassMappingRepository;
import com.sms.schoolops.repository.TeacherSubjectMappingRepository;
import com.sms.schoolops.repository.TimetableSlotRepository;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.time.DayOfWeek;
import java.time.Instant;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.time.format.DateTimeParseException;
import java.util.ArrayList;
import java.util.Collection;
import java.util.Comparator;
import java.util.HashMap;
import java.util.HashSet;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Objects;
import java.util.Optional;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;
import java.util.stream.IntStream;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.apache.poi.ss.usermodel.Cell;
import org.apache.poi.ss.usermodel.CellStyle;
import org.apache.poi.ss.usermodel.FillPatternType;
import org.apache.poi.ss.usermodel.Font;
import org.apache.poi.ss.usermodel.IndexedColors;
import org.apache.poi.ss.usermodel.Row;
import org.apache.poi.ss.usermodel.Sheet;
import org.apache.poi.ss.usermodel.Workbook;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.client.RestClient;

@Service
public class AttendanceManagementService {
    private static final Logger logger = LoggerFactory.getLogger(AttendanceManagementService.class);
    private static final Set<String> ADMIN_ROLES = Set.of("SCHOOL_ADMIN", "PRINCIPAL", "MANAGER");
    private static final Set<String> PRESENT_LIKE_STATUSES = Set.of("PRESENT", "LATE", "EXCUSED");

    private final AttendancePolicyRepository attendancePolicyRepository;
    private final AttendanceSessionRepository attendanceSessionRepository;
    private final AttendanceRecordRepository attendanceRecordRepository;
    private final AttendanceAuditLogRepository attendanceAuditLogRepository;
    private final StudentAbsenceReasonRepository studentAbsenceReasonRepository;
    private final AttendanceAlertEventRepository attendanceAlertEventRepository;
    private final AttendanceVoiceCommandLogRepository attendanceVoiceCommandLogRepository;
    private final AttendanceFaceScanRepository attendanceFaceScanRepository;
    private final AttendancePredictionSnapshotRepository attendancePredictionSnapshotRepository;
    private final AcademicClassRepository academicClassRepository;
    private final SubjectRepository subjectRepository;
    private final SchoolUserRepository schoolUserRepository;
    private final TeacherClassMappingRepository teacherClassMappingRepository;
    private final TeacherSubjectMappingRepository teacherSubjectMappingRepository;
    private final ClassTeacherMappingRepository classTeacherMappingRepository;
    private final StudentClassEnrollmentRepository studentClassEnrollmentRepository;
    private final StudentAdmissionRepository studentAdmissionRepository;
    private final StudentParentMappingRepository studentParentMappingRepository;
    private final ReminderRepository reminderRepository;
    private final TimetableSlotRepository timetableSlotRepository;
    private final AttendanceVoiceParser attendanceVoiceParser;
    private final MqttEventPublisher mqttEventPublisher;
    private final RestClient communicationRestClient;
    private final ObjectMapper objectMapper;
    private final SubscriptionService subscriptionService;

    public AttendanceManagementService(
            AttendancePolicyRepository attendancePolicyRepository,
            AttendanceSessionRepository attendanceSessionRepository,
            AttendanceRecordRepository attendanceRecordRepository,
            AttendanceAuditLogRepository attendanceAuditLogRepository,
            StudentAbsenceReasonRepository studentAbsenceReasonRepository,
            AttendanceAlertEventRepository attendanceAlertEventRepository,
            AttendanceVoiceCommandLogRepository attendanceVoiceCommandLogRepository,
            AttendanceFaceScanRepository attendanceFaceScanRepository,
            AttendancePredictionSnapshotRepository attendancePredictionSnapshotRepository,
            AcademicClassRepository academicClassRepository,
            SubjectRepository subjectRepository,
            SchoolUserRepository schoolUserRepository,
            TeacherClassMappingRepository teacherClassMappingRepository,
            TeacherSubjectMappingRepository teacherSubjectMappingRepository,
            ClassTeacherMappingRepository classTeacherMappingRepository,
            StudentClassEnrollmentRepository studentClassEnrollmentRepository,
            StudentAdmissionRepository studentAdmissionRepository,
            StudentParentMappingRepository studentParentMappingRepository,
            ReminderRepository reminderRepository,
            TimetableSlotRepository timetableSlotRepository,
            AttendanceVoiceParser attendanceVoiceParser,
            MqttEventPublisher mqttEventPublisher,
            SubscriptionService subscriptionService,
            RestClient.Builder restClientBuilder,
            ObjectMapper objectMapper,
            @Value("${app.communication-service-url}") String communicationServiceUrl
    ) {
        this.attendancePolicyRepository = attendancePolicyRepository;
        this.attendanceSessionRepository = attendanceSessionRepository;
        this.attendanceRecordRepository = attendanceRecordRepository;
        this.attendanceAuditLogRepository = attendanceAuditLogRepository;
        this.studentAbsenceReasonRepository = studentAbsenceReasonRepository;
        this.attendanceAlertEventRepository = attendanceAlertEventRepository;
        this.attendanceVoiceCommandLogRepository = attendanceVoiceCommandLogRepository;
        this.attendanceFaceScanRepository = attendanceFaceScanRepository;
        this.attendancePredictionSnapshotRepository = attendancePredictionSnapshotRepository;
        this.academicClassRepository = academicClassRepository;
        this.subjectRepository = subjectRepository;
        this.schoolUserRepository = schoolUserRepository;
        this.teacherClassMappingRepository = teacherClassMappingRepository;
        this.teacherSubjectMappingRepository = teacherSubjectMappingRepository;
        this.classTeacherMappingRepository = classTeacherMappingRepository;
        this.studentClassEnrollmentRepository = studentClassEnrollmentRepository;
        this.studentAdmissionRepository = studentAdmissionRepository;
        this.studentParentMappingRepository = studentParentMappingRepository;
        this.reminderRepository = reminderRepository;
        this.timetableSlotRepository = timetableSlotRepository;
        this.attendanceVoiceParser = attendanceVoiceParser;
        this.mqttEventPublisher = mqttEventPublisher;
        this.subscriptionService = subscriptionService;
        this.communicationRestClient = restClientBuilder.baseUrl(communicationServiceUrl).build();
        this.objectMapper = objectMapper;
    }

    public AttendanceActor resolveActor(String userIdHeader, String schoolIdHeader, String tenantIdHeader, String emailHeader, String roleHeader) {
        UUID userId = parseUuid(userIdHeader, "Missing X-User-ID header");
        UUID schoolId = parseUuid(schoolIdHeader, "Missing X-School-ID header");
        UUID tenantId = tenantIdHeader == null || tenantIdHeader.isBlank() ? schoolId : parseUuid(tenantIdHeader, "Invalid X-Tenant-ID header");

        if (!this.subscriptionService.isFeatureAccessibleStrict(tenantId, "ATTENDANCE")) {
            throw new ForbiddenException("Attendance is not enabled for the current subscription.");
        }

        SchoolUserEntity user = resolveSchoolUser(userId, schoolId, emailHeader)
                .orElseThrow(() -> new IllegalArgumentException("Authenticated user not found in school directory."));
        return new AttendanceActor(
                user.getUserId(),
                user.getSchoolId(),
                tenantId,
                emailHeader == null || emailHeader.isBlank() ? user.getEmail() : emailHeader,
                roleHeader == null || roleHeader.isBlank() ? user.getRoleName() : roleHeader,
                user.getFullName()
        );
    }

    public AttendancePolicyResponse getPolicy(AttendanceActor actor) {
        return toPolicyResponse(getOrCreatePolicy(actor.schoolId()));
    }

    @Transactional
    public AttendancePolicyResponse updatePolicy(AttendanceActor actor, AttendancePolicyUpdateRequest request) {
        requireAdmin(actor);
        AttendancePolicyEntity policy = getOrCreatePolicy(actor.schoolId());
        if (request.warningThreshold() != null) policy.setWarningThreshold(request.warningThreshold());
        if (request.criticalThreshold() != null) policy.setCriticalThreshold(request.criticalThreshold());
        if (request.enabledChannels() != null && !request.enabledChannels().isEmpty()) policy.setEnabledChannels(joinList(request.enabledChannels()));
        if (request.autoAbsentEnabled() != null) policy.setAutoAbsentEnabled(request.autoAbsentEnabled());
        if (request.autoAbsentMinutes() != null) policy.setAutoAbsentMinutes(request.autoAbsentMinutes());
        if (request.gpsEnabled() != null) policy.setGpsEnabled(request.gpsEnabled());
        if (request.gpsMode() != null && !request.gpsMode().isBlank()) policy.setGpsMode(request.gpsMode().trim().toUpperCase(Locale.ROOT));
        if (request.geofenceLatitude() != null) policy.setGeofenceLatitude(request.geofenceLatitude());
        if (request.geofenceLongitude() != null) policy.setGeofenceLongitude(request.geofenceLongitude());
        if (request.geofenceRadiusMeters() != null) policy.setGeofenceRadiusMeters(request.geofenceRadiusMeters());
        if (request.voiceEnabled() != null) policy.setVoiceEnabled(request.voiceEnabled());
        if (request.faceEnabled() != null) policy.setFaceEnabled(request.faceEnabled());
        if (request.aiPredictionEnabled() != null) policy.setAiPredictionEnabled(request.aiPredictionEnabled());
        if (request.reminderEnabled() != null) policy.setReminderEnabled(request.reminderEnabled());
        if (request.reminderFrequency() != null && !request.reminderFrequency().isBlank()) policy.setReminderFrequency(request.reminderFrequency().trim().toUpperCase(Locale.ROOT));
        if (request.faceConfidenceThreshold() != null) policy.setFaceConfidenceThreshold(request.faceConfidenceThreshold());
        policy.setUpdatedAt(Instant.now());
        this.attendancePolicyRepository.save(policy);
        publishAttendanceRefresh(actor.tenantId(), actor.schoolId(), "ATTENDANCE_POLICY_UPDATED", Map.of("schoolId", actor.schoolId().toString()));
        return toPolicyResponse(policy);
    }

    public AttendanceContextResponse getContext(AttendanceActor actor) {
        AttendancePolicyEntity policy = getOrCreatePolicy(actor.schoolId());
        List<AcademicClassEntity> allClasses = this.academicClassRepository.findBySchoolIdOrderByClassNameAscSectionNameAsc(actor.schoolId());
        List<SubjectEntity> allSubjects = this.subjectRepository.findBySchoolIdOrderBySubjectNameAsc(actor.schoolId());
        List<TimetableSlotEntity> slots = this.timetableSlotRepository.findBySchoolIdOrderByDayOfWeekAscStartTimeAsc(actor.schoolId());
        List<AttendanceClassContext> classes = new ArrayList<>();
        List<AttendanceSessionSummary> recentSessions;

        if (isAdmin(actor)) {
            classes = allClasses.stream().map(classroom -> buildClassContext(classroom, allSubjects, slots, false)).toList();
            recentSessions = buildSessionSummaries(this.attendanceSessionRepository.findBySchoolIdAndAttendanceDateBetweenOrderByAttendanceDateDescPeriodNumberDesc(actor.schoolId(), LocalDate.now().minusDays(30), LocalDate.now()), actor.schoolId()).stream().limit(8).toList();
        } else if (isTeacher(actor)) {
            Set<UUID> classTeacherIds = this.classTeacherMappingRepository.findBySchoolId(actor.schoolId()).stream()
                    .filter(mapping -> mapping.getTeacherUserId().equals(actor.userId()))
                    .map(ClassTeacherMappingEntity::getClassId)
                    .collect(Collectors.toSet());
            Set<UUID> teacherClassIds = this.teacherClassMappingRepository.findBySchoolIdAndTeacherUserId(actor.schoolId(), actor.userId()).stream()
                    .map(TeacherClassMappingEntity::getClassId)
                    .collect(Collectors.toSet());
            Set<UUID> teacherSubjectIds = this.teacherSubjectMappingRepository.findBySchoolId(actor.schoolId()).stream()
                    .filter(mapping -> mapping.getTeacherUserId().equals(actor.userId()))
                    .map(TeacherSubjectMappingEntity::getSubjectId)
                    .collect(Collectors.toSet());
            List<SubjectEntity> teacherSubjects = allSubjects.stream().filter(subject -> teacherSubjectIds.contains(subject.getSubjectId())).toList();
            classes = allClasses.stream()
                    .filter(classroom -> teacherClassIds.contains(classroom.getClassId()) || classTeacherIds.contains(classroom.getClassId()))
                    .map(classroom -> buildClassContext(classroom, teacherSubjects.isEmpty() ? allSubjects : teacherSubjects, slots, classTeacherIds.contains(classroom.getClassId())))
                    .toList();
            recentSessions = buildSessionSummaries(this.attendanceSessionRepository.findBySchoolIdAndTeacherUserIdOrderByAttendanceDateDescPeriodNumberDesc(actor.schoolId(), actor.userId()), actor.schoolId()).stream().limit(8).toList();
        } else if (isStudent(actor)) {
            StudentClassEnrollmentEntity enrollment = this.studentClassEnrollmentRepository.findBySchoolId(actor.schoolId()).stream()
                    .filter(item -> item.getStudentUserId().equals(actor.userId()))
                    .findFirst()
                    .orElse(null);
            if (enrollment != null) {
                classes = allClasses.stream()
                        .filter(classroom -> classroom.getClassId().equals(enrollment.getClassId()))
                        .limit(1)
                        .map(classroom -> buildClassContext(classroom, allSubjects, slots, false))
                        .toList();
            }
            recentSessions = List.of();
        } else {
            classes = List.of();
            recentSessions = List.of();
        }

        return new AttendanceContextResponse(
                toPolicyResponse(policy),
                isAdmin(actor) || isTeacher(actor),
                isAdmin(actor) || isTeacher(actor),
                isStudent(actor),
                classes,
                recentSessions
        );
    }

    @Transactional
    public AttendanceSessionDetailResponse createOrReopenSession(AttendanceActor actor, CreateAttendanceSessionRequest request) {
        requireCanMark(actor, request.classId(), request.subjectId());
        AttendancePolicyEntity policy = getOrCreatePolicy(actor.schoolId());
        Instant now = Instant.now();
        AttendanceSessionEntity session = this.attendanceSessionRepository
                .findBySchoolIdAndClassIdAndSubjectIdAndAttendanceDateAndPeriodNumber(actor.schoolId(), request.classId(), request.subjectId(), request.attendanceDate(), request.periodNumber())
                .orElseGet(() -> {
                    AttendanceSessionEntity entity = new AttendanceSessionEntity();
                    entity.setSessionId(UUID.randomUUID());
                    entity.setSchoolId(actor.schoolId());
                    entity.setClassId(request.classId());
                    entity.setSubjectId(request.subjectId());
                    entity.setTeacherUserId(actor.userId());
                    entity.setAttendanceDate(request.attendanceDate());
                    entity.setPeriodNumber(request.periodNumber());
                    entity.setTimetableSlotId(request.timetableSlotId());
                    entity.setSessionStatus("DRAFT");
                    entity.setGpsVerificationStatus(policy.getGpsEnabled() ? "PENDING" : "SKIPPED");
                    entity.setGpsMessage(policy.getGpsEnabled() ? "Waiting for teacher GPS verification." : "GPS verification disabled in school policy.");
                    entity.setAutoGenerated(false);
                    entity.setCreatedAt(now);
                    return entity;
                });

        if ("SUBMITTED".equalsIgnoreCase(session.getSessionStatus())) {
            session.setSessionStatus("REOPENED");
            session.setLastEditedAt(now);
        }
        if (request.timetableSlotId() != null) {
            session.setTimetableSlotId(request.timetableSlotId());
        }
        this.attendanceSessionRepository.save(session);
        syncSessionRoster(session, "PRESENT", "MANUAL", actor.email());
        publishAttendanceRefresh(actor.tenantId(), actor.schoolId(), "ATTENDANCE_SESSION_OPENED", Map.of("sessionId", session.getSessionId().toString()));
        return getSessionDetail(actor, session.getSessionId());
    }

    public AttendanceSessionDetailResponse getSessionDetail(AttendanceActor actor, UUID sessionId) {
        AttendanceSessionEntity session = getSessionOrThrow(sessionId);
        requireCanViewSession(actor, session);
        List<AttendanceRecordEntity> records = syncSessionRoster(session, "PRESENT", "MANUAL", actor.email());
        AttendancePolicyResponse policy = toPolicyResponse(getOrCreatePolicy(actor.schoolId()));
        List<AttendanceAuditEntry> audits = buildAuditEntries(session, actor.schoolId());
        return new AttendanceSessionDetailResponse(
                buildSessionSummary(session, records, actor.schoolId()),
                policy,
                canEditSession(actor, session),
                buildRoster(records, actor.schoolId()),
                audits
        );
    }

    @Transactional
    public AttendanceSessionDetailResponse updateStudentStatus(AttendanceActor actor, UUID sessionId, UUID studentId, UpdateAttendanceStudentRequest request) {
        AttendanceSessionEntity session = getSessionOrThrow(sessionId);
        requireCanEditSession(actor, session);
        AttendanceRecordEntity record = findSessionRecord(session, studentId);
        String newStatus = normalizeAttendanceStatus(request.attendanceStatus());
        String oldStatus = normalizeAttendanceStatus(record.getAttendanceStatus());
        if (!Objects.equals(oldStatus, newStatus)) {
            record.setAttendanceStatus(newStatus);
            record.setCaptureSource(normalizeCaptureSource(request.captureSource(), "MANUAL"));
            record.setLastModifiedBy(actor.email());
            record.setLastModifiedAt(Instant.now());
            this.attendanceRecordRepository.save(record);
            writeAudit(session, record, studentId, oldStatus, newStatus, request.editReason(), actor);
        }
        session.setLastEditedAt(Instant.now());
        this.attendanceSessionRepository.save(session);
        if (session.getSubmittedAt() != null) {
            refreshStudentRiskArtifacts(actor, record.getClassId(), studentId);
        }
        publishAttendanceRefresh(actor.tenantId(), actor.schoolId(), "ATTENDANCE_UPDATED", Map.of("sessionId", sessionId.toString(), "studentId", studentId.toString()));
        return getSessionDetail(actor, sessionId);
    }

    @Transactional
    public AttendanceSessionDetailResponse bulkMark(AttendanceActor actor, UUID sessionId, BulkMarkRequest request) {
        AttendanceSessionEntity session = getSessionOrThrow(sessionId);
        requireCanEditSession(actor, session);
        List<AttendanceRecordEntity> records = syncSessionRoster(session, normalizeAttendanceStatus(request.attendanceStatus()), normalizeCaptureSource(request.captureSource(), "BULK"), actor.email());
        String normalizedStatus = normalizeAttendanceStatus(request.attendanceStatus());
        Instant now = Instant.now();
        for (AttendanceRecordEntity record : records) {
            String oldStatus = normalizeAttendanceStatus(record.getAttendanceStatus());
            if (!Objects.equals(oldStatus, normalizedStatus)) {
                record.setAttendanceStatus(normalizedStatus);
                record.setCaptureSource(normalizeCaptureSource(request.captureSource(), "BULK"));
                record.setLastModifiedBy(actor.email());
                record.setLastModifiedAt(now);
                writeAudit(session, record, record.getUserId(), oldStatus, normalizedStatus, "Bulk update", actor);
            }
        }
        this.attendanceRecordRepository.saveAll(records);
        session.setLastEditedAt(now);
        this.attendanceSessionRepository.save(session);
        publishAttendanceRefresh(actor.tenantId(), actor.schoolId(), "ATTENDANCE_BULK_UPDATED", Map.of("sessionId", sessionId.toString()));
        return getSessionDetail(actor, sessionId);
    }

    @Transactional
    public VoiceCommandResponse applyVoiceCommands(AttendanceActor actor, UUID sessionId, VoiceCommandRequest request) {
        AttendanceSessionEntity session = getSessionOrThrow(sessionId);
        requireCanEditSession(actor, session);
        List<AttendanceRecordEntity> records = syncSessionRoster(session, "PRESENT", "MANUAL", actor.email());
        Map<String, AttendanceRecordEntity> byRoll = records.stream().collect(Collectors.toMap(
                record -> normalizeRoll(getRollNumber(actor.schoolId(), record.getUserId())),
                record -> record,
                (left, right) -> left
        ));
        List<AttendanceVoiceParser.ParsedVoiceCommand> parsed = this.attendanceVoiceParser.parseTranscript(request.transcript());
        List<VoiceCommandMatch> matches = new ArrayList<>();
        int appliedCount = 0;
        int rejectedCount = 0;
        Instant now = Instant.now();
        for (AttendanceVoiceParser.ParsedVoiceCommand command : parsed) {
            if (!command.valid()) {
                matches.add(new VoiceCommandMatch(command.rollNumber(), null, command.attendanceStatus(), false, command.failureReason()));
                rejectedCount++;
                continue;
            }
            AttendanceRecordEntity record = byRoll.get(normalizeRoll(command.rollNumber()));
            if (record == null) {
                matches.add(new VoiceCommandMatch(command.rollNumber(), null, command.attendanceStatus(), false, "Roll number not found in this roster."));
                rejectedCount++;
                continue;
            }
            String oldStatus = normalizeAttendanceStatus(record.getAttendanceStatus());
            String newStatus = normalizeAttendanceStatus(command.attendanceStatus());
            record.setAttendanceStatus(newStatus);
            record.setCaptureSource("VOICE");
            record.setLastModifiedBy(actor.email());
            record.setLastModifiedAt(now);
            if (!Objects.equals(oldStatus, newStatus)) {
                writeAudit(session, record, record.getUserId(), oldStatus, newStatus, "Voice command", actor);
            }
            matches.add(new VoiceCommandMatch(command.rollNumber(), getStudentName(actor.schoolId(), record.getUserId()), newStatus, true, null));
            appliedCount++;
        }
        this.attendanceRecordRepository.saveAll(records);
        AttendanceVoiceCommandLogEntity log = new AttendanceVoiceCommandLogEntity();
        log.setVoiceLogId(UUID.randomUUID());
        log.setSchoolId(actor.schoolId());
        log.setSessionId(sessionId);
        log.setActorUserId(actor.userId());
        log.setActorName(actor.fullName());
        log.setTranscript(request.transcript());
        log.setParsedCommands(matches.stream().filter(VoiceCommandMatch::applied).map(match -> match.rollNumber() + ":" + match.attendanceStatus()).collect(Collectors.joining(";")));
        log.setRejectedCommands(matches.stream().filter(match -> !match.applied()).map(match -> safeString(match.rollNumber()) + ":" + safeString(match.reason())).collect(Collectors.joining(";")));
        log.setProcessingStatus(rejectedCount == 0 ? "APPLIED" : appliedCount > 0 ? "PARTIAL" : "REJECTED");
        log.setCreatedAt(now);
        this.attendanceVoiceCommandLogRepository.save(log);
        session.setLastEditedAt(now);
        this.attendanceSessionRepository.save(session);
        publishAttendanceRefresh(actor.tenantId(), actor.schoolId(), "ATTENDANCE_VOICE_APPLIED", Map.of("sessionId", sessionId.toString(), "appliedCount", appliedCount));
        return new VoiceCommandResponse(request.transcript(), matches, appliedCount, rejectedCount);
    }

    @Transactional
    public GpsVerificationResponse verifyGps(AttendanceActor actor, UUID sessionId, GpsVerificationRequest request) {
        AttendanceSessionEntity session = getSessionOrThrow(sessionId);
        requireCanEditSession(actor, session);
        AttendancePolicyEntity policy = getOrCreatePolicy(actor.schoolId());
        if (!policy.getGpsEnabled()) {
            session.setGpsVerificationStatus("SKIPPED");
            session.setGpsMessage("GPS verification is disabled by school policy.");
            this.attendanceSessionRepository.save(session);
            return new GpsVerificationResponse("SKIPPED", true, 0d, session.getGpsMessage(), policy.getGpsMode());
        }

        if (policy.getGeofenceLatitude() == null || policy.getGeofenceLongitude() == null || policy.getGeofenceRadiusMeters() == null) {
            session.setGpsVerificationStatus("NOT_CONFIGURED");
            session.setGpsMessage("School geofence is not configured. Submission will be allowed.");
            this.attendanceSessionRepository.save(session);
            return new GpsVerificationResponse("NOT_CONFIGURED", true, 0d, session.getGpsMessage(), policy.getGpsMode());
        }

        double distanceMeters = AttendanceGeoUtils.distanceMeters(policy.getGeofenceLatitude(), policy.getGeofenceLongitude(), request.latitude(), request.longitude());
        boolean allowed = distanceMeters <= policy.getGeofenceRadiusMeters() || !"ENFORCE".equalsIgnoreCase(policy.getGpsMode());
        session.setGpsLatitude(request.latitude());
        session.setGpsLongitude(request.longitude());
        session.setGpsDistanceMeters(distanceMeters);
        session.setGpsVerificationStatus(distanceMeters <= policy.getGeofenceRadiusMeters() ? "VERIFIED" : "OUTSIDE_GEOFENCE");
        session.setGpsMessage(distanceMeters <= policy.getGeofenceRadiusMeters() ? "Teacher verified inside the school geofence." : "Teacher is outside the configured geofence.");
        this.attendanceSessionRepository.save(session);
        return new GpsVerificationResponse(session.getGpsVerificationStatus(), allowed, distanceMeters, session.getGpsMessage(), policy.getGpsMode());
    }

    @Transactional
    public FaceScanResponse faceScan(AttendanceActor actor, UUID sessionId, FaceScanRequest request) {
        AttendanceSessionEntity session = getSessionOrThrow(sessionId);
        requireCanEditSession(actor, session);
        AttendancePolicyEntity policy = getOrCreatePolicy(actor.schoolId());
        AttendanceFaceScanEntity faceScan = new AttendanceFaceScanEntity();
        faceScan.setFaceScanId(UUID.randomUUID());
        faceScan.setSchoolId(actor.schoolId());
        faceScan.setSessionId(sessionId);
        faceScan.setCaptureReference(request.captureReference());
        faceScan.setCreatedAt(Instant.now());

        if (!policy.getFaceEnabled()) {
            faceScan.setProviderStatus("DISABLED");
            faceScan.setReviewOutcome("SKIPPED");
            this.attendanceFaceScanRepository.save(faceScan);
            return new FaceScanResponse(null, null, 0d, false, "DISABLED", "SKIPPED", "Face assist is disabled in school policy.");
        }

        if (request.hintedStudentId() == null) {
            faceScan.setProviderStatus("MANUAL_HINT_REQUIRED");
            faceScan.setReviewOutcome("PENDING");
            this.attendanceFaceScanRepository.save(faceScan);
            return new FaceScanResponse(null, null, 0d, false, "MANUAL_HINT_REQUIRED", "PENDING", "Provide a student hint until a face provider is connected.");
        }

        SchoolUserEntity student = this.schoolUserRepository.findById(request.hintedStudentId()).orElse(null);
        double confidence = student != null && student.getProfilePhotoUrl() != null && !student.getProfilePhotoUrl().isBlank() ? 0.94d : 0.42d;
        boolean autoApplied = confidence >= policy.getFaceConfidenceThreshold();
        faceScan.setMatchedStudentUserId(request.hintedStudentId());
        faceScan.setConfidence(confidence);
        faceScan.setProviderStatus(student == null ? "NOT_FOUND" : autoApplied ? "MATCHED" : "LOW_CONFIDENCE");
        faceScan.setReviewOutcome(autoApplied ? "AUTO_APPLIED" : "REVIEW_REQUIRED");
        this.attendanceFaceScanRepository.save(faceScan);

        if (autoApplied) {
            AttendanceRecordEntity record = findSessionRecord(session, request.hintedStudentId());
            String oldStatus = normalizeAttendanceStatus(record.getAttendanceStatus());
            record.setAttendanceStatus("PRESENT");
            record.setCaptureSource("FACE");
            record.setLastModifiedBy(actor.email());
            record.setLastModifiedAt(Instant.now());
            this.attendanceRecordRepository.save(record);
            if (!Objects.equals(oldStatus, "PRESENT")) {
                writeAudit(session, record, record.getUserId(), oldStatus, "PRESENT", "Face assist", actor);
            }
        }

        return new FaceScanResponse(
                request.hintedStudentId(),
                student == null ? "Unknown Student" : student.getFullName(),
                confidence,
                autoApplied,
                faceScan.getProviderStatus(),
                faceScan.getReviewOutcome(),
                autoApplied ? "Attendance was auto-marked present from face assist." : "Confidence below threshold. Review manually."
        );
    }

    @Transactional
    public AttendanceSessionDetailResponse submitSession(AttendanceActor actor, UUID sessionId, SubmitAttendanceSessionRequest request) {
        AttendanceSessionEntity session = getSessionOrThrow(sessionId);
        requireCanEditSession(actor, session);
        AttendancePolicyEntity policy = getOrCreatePolicy(actor.schoolId());
        if (policy.getGpsEnabled() && "ENFORCE".equalsIgnoreCase(policy.getGpsMode()) && !Boolean.TRUE.equals(request.forceSubmitOutsideGeofence())
                && !"VERIFIED".equalsIgnoreCase(session.getGpsVerificationStatus())
                && !"SKIPPED".equalsIgnoreCase(session.getGpsVerificationStatus())
                && !"NOT_CONFIGURED".equalsIgnoreCase(session.getGpsVerificationStatus())) {
            throw new IllegalArgumentException("GPS verification is required before submitting this attendance session.");
        }
        List<AttendanceRecordEntity> records = syncSessionRoster(session, "PRESENT", "MANUAL", actor.email());
        session.setSessionStatus("SUBMITTED");
        session.setSubmitNote(request.submitNote());
        session.setSubmittedAt(Instant.now());
        session.setLastEditedAt(Instant.now());
        this.attendanceSessionRepository.save(session);
        Set<UUID> studentIds = records.stream().map(AttendanceRecordEntity::getUserId).collect(Collectors.toSet());
        for (UUID studentId : studentIds) {
            refreshStudentRiskArtifacts(actor, session.getClassId(), studentId);
        }
        publishAttendanceRefresh(actor.tenantId(), actor.schoolId(), "ATTENDANCE_SUBMITTED", Map.of("sessionId", sessionId.toString()));
        return getSessionDetail(actor, sessionId);
    }

    public ClassMonitorResponse getClassMonitor(AttendanceActor actor, LocalDate date, UUID classId, UUID subjectId, Integer periodNumber, UUID studentId) {
        requireCanMonitor(actor, classId);
        LocalDate fromDate = date == null ? LocalDate.now().withDayOfMonth(1) : date;
        LocalDate toDate = date == null ? LocalDate.now() : date;
        Set<UUID> allowedClassIds = resolveMonitorClassIds(actor, classId);
        List<AttendanceSessionEntity> sessions = this.attendanceSessionRepository.findBySchoolIdAndAttendanceDateBetweenOrderByAttendanceDateDescPeriodNumberDesc(actor.schoolId(), fromDate, toDate).stream()
                .filter(session -> allowedClassIds.contains(session.getClassId()))
                .filter(session -> classId == null || session.getClassId().equals(classId))
                .filter(session -> subjectId == null || session.getSubjectId().equals(subjectId))
                .filter(session -> periodNumber == null || Objects.equals(session.getPeriodNumber(), periodNumber))
                .filter(session -> studentId == null || this.attendanceRecordRepository.findBySchoolIdAndSessionId(actor.schoolId(), session.getSessionId()).stream().anyMatch(record -> record.getUserId().equals(studentId)))
                .toList();
        List<AttendanceSessionSummary> summaries = buildSessionSummaries(sessions, actor.schoolId());
        List<AttendanceRiskStudentRow> risks = buildRiskRows(actor.schoolId(), allowedClassIds, 50);
        return new ClassMonitorResponse(summaries, risks);
    }

    @Transactional
    public AttendanceSessionDetailResponse editAttendanceRecord(AttendanceActor actor, UUID attendanceId, EditAttendanceRecordRequest request) {
        AttendanceRecordEntity record = this.attendanceRecordRepository.findById(attendanceId)
                .orElseThrow(() -> new IllegalArgumentException("Attendance record not found."));
        AttendanceSessionEntity session = record.getSessionId() == null ? null : getSessionOrThrow(record.getSessionId());
        if (session != null) {
            requireCanMonitor(actor, session.getClassId());
        } else {
            requireCanMonitor(actor, record.getClassId());
        }
        String oldStatus = normalizeAttendanceStatus(record.getAttendanceStatus());
        String newStatus = normalizeAttendanceStatus(request.attendanceStatus());
        if (!Objects.equals(oldStatus, newStatus)) {
            record.setAttendanceStatus(newStatus);
            record.setLastModifiedBy(actor.email());
            record.setLastModifiedAt(Instant.now());
            record.setCaptureSource(normalizeCaptureSource(record.getCaptureSource(), "MANUAL"));
            this.attendanceRecordRepository.save(record);
            if (session != null) {
                writeAudit(session, record, record.getUserId(), oldStatus, newStatus, request.editReason(), actor);
                session.setLastEditedAt(Instant.now());
                this.attendanceSessionRepository.save(session);
                refreshStudentRiskArtifacts(actor, record.getClassId(), record.getUserId());
                publishAttendanceRefresh(actor.tenantId(), actor.schoolId(), "ATTENDANCE_RECORD_EDITED", Map.of("attendanceId", attendanceId.toString(), "sessionId", session.getSessionId().toString()));
                return getSessionDetail(actor, session.getSessionId());
            }
        }
        if (session != null) {
            return getSessionDetail(actor, session.getSessionId());
        }
        throw new IllegalArgumentException("Attendance record is not linked to a session.");
    }

    @Transactional
    public AbsenceReasonResponse submitAbsenceReason(AttendanceActor actor, AbsenceReasonRequest request) {
        AttendanceRecordEntity record = this.attendanceRecordRepository.findById(request.attendanceId())
                .orElseThrow(() -> new IllegalArgumentException("Attendance record not found."));
        if (!actor.schoolId().equals(record.getSchoolId())) {
            throw new IllegalArgumentException("Attendance record does not belong to your school.");
        }
        if (isStudent(actor) && !actor.userId().equals(record.getUserId())) {
            throw new IllegalArgumentException("Students can only submit a reason for their own attendance.");
        }
        if (!"ABSENT".equalsIgnoreCase(normalizeAttendanceStatus(record.getAttendanceStatus()))) {
            throw new IllegalArgumentException("Absence reasons can only be submitted for absent attendance entries.");
        }

        StudentAbsenceReasonEntity entity = this.studentAbsenceReasonRepository.findByAttendanceId(request.attendanceId())
                .orElseGet(() -> {
                    StudentAbsenceReasonEntity reason = new StudentAbsenceReasonEntity();
                    reason.setAbsenceReasonId(UUID.randomUUID());
                    reason.setSchoolId(actor.schoolId());
                    reason.setAttendanceId(request.attendanceId());
                    reason.setStudentUserId(record.getUserId());
                    reason.setCreatedAt(Instant.now());
                    return reason;
                });
        entity.setCategory(normalizeReasonCategory(request.category()));
        entity.setDescription(trimToNull(request.description()));
        entity.setReviewStatus("SUBMITTED");
        entity.setReviewedBy(null);
        entity.setReviewedAt(null);
        this.studentAbsenceReasonRepository.save(entity);
        publishAttendanceRefresh(actor.tenantId(), actor.schoolId(), "ABSENCE_REASON_SUBMITTED", Map.of("attendanceId", request.attendanceId().toString()));
        return new AbsenceReasonResponse(
                entity.getAbsenceReasonId(),
                entity.getAttendanceId(),
                entity.getCategory(),
                entity.getDescription(),
                entity.getReviewStatus(),
                entity.getCreatedAt()
        );
    }

    public StudentAttendanceSummaryResponse getStudentAttendanceSummary(AttendanceActor actor, UUID requestedStudentId, String preset, LocalDate fromDate, LocalDate toDate) {
        UUID studentId = resolveStudentScope(actor, requestedStudentId);
        DateWindow window = resolveWindow(preset, fromDate, toDate);
        List<AttendanceRecordEntity> records = this.attendanceRecordRepository.findBySchoolIdAndUserIdAndAttendanceDateBetweenOrderByAttendanceDateAscCreatedAtAsc(
                actor.schoolId(),
                studentId,
                window.fromDate(),
                window.toDate()
        );
        SchoolUserEntity student = this.schoolUserRepository.findById(studentId)
                .orElseThrow(() -> new IllegalArgumentException("Student not found."));
        AcademicClassEntity classroom = resolveStudentClass(actor.schoolId(), studentId);
        AttendancePolicyEntity policy = getOrCreatePolicy(actor.schoolId());
        AttendanceMetrics metrics = calculateMetrics(records);
        List<AttendanceCalendarDay> calendar = buildStudentCalendar(records, window.fromDate(), window.toDate());
        List<AttendanceHeatmapPoint> heatmap = buildStudentHeatmap(calendar, policy);
        List<AttendanceDailyStatus> daily = buildDailyStatusRows(records, actor.schoolId());
        return new StudentAttendanceSummaryResponse(
                studentId,
                student.getFullName(),
                classroom == null ? null : classroom.getClassName(),
                classroom == null ? null : classroom.getSectionName(),
                window.preset(),
                window.fromDate(),
                window.toDate(),
                metrics.percentage(),
                metrics.presentDays(),
                metrics.absentDays(),
                metrics.lateDays(),
                metrics.excusedDays(),
                toWarningLevel(metrics.percentage(), policy),
                policy.getWarningThreshold(),
                policy.getCriticalThreshold(),
                calendar,
                heatmap,
                daily
        );
    }

    public AttendanceOverviewResponse getOverview(AttendanceActor actor, LocalDate fromDate, LocalDate toDate) {
        requireAdmin(actor);
        LocalDate rangeStart = fromDate == null ? LocalDate.now().minusDays(29) : fromDate;
        LocalDate rangeEnd = toDate == null ? LocalDate.now() : toDate;
        if (rangeEnd.isBefore(rangeStart)) {
            throw new IllegalArgumentException("End date cannot be before start date.");
        }
        AttendancePolicyEntity policy = getOrCreatePolicy(actor.schoolId());
        List<AttendanceSessionEntity> sessions = this.attendanceSessionRepository.findBySchoolIdAndAttendanceDateBetweenOrderByAttendanceDateDescPeriodNumberDesc(actor.schoolId(), rangeStart, rangeEnd);
        List<AttendanceRecordEntity> records = this.attendanceRecordRepository.findBySchoolIdAndAttendanceDateBetweenOrderByAttendanceDateAsc(actor.schoolId(), rangeStart, rangeEnd);
        AttendanceMetrics metrics = calculateMetrics(records);
        List<AttendanceTrendPoint> trend = buildTrend(records, rangeStart, rangeEnd);
        List<AttendanceClassOverview> byClass = buildClassOverview(records, actor.schoolId());
        List<AttendanceRiskStudentRow> riskStudents = buildRiskRows(actor.schoolId(), null, 20);
        Set<UUID> studentIds = records.stream().map(AttendanceRecordEntity::getUserId).collect(Collectors.toSet());
        return new AttendanceOverviewResponse(
                toPolicyResponse(policy),
                sessions.size(),
                sessions.stream().filter(session -> "SUBMITTED".equalsIgnoreCase(session.getSessionStatus())).count(),
                sessions.stream().filter(session -> !"SUBMITTED".equalsIgnoreCase(session.getSessionStatus())).count(),
                studentIds.size(),
                metrics.percentage(),
                trend,
                byClass,
                riskStudents
        );
    }

    public AttendanceHeatmapResponse getHeatmap(AttendanceActor actor, UUID requestedStudentId, LocalDate fromDate, LocalDate toDate) {
        LocalDate rangeStart = fromDate == null ? LocalDate.now().minusDays(29) : fromDate;
        LocalDate rangeEnd = toDate == null ? LocalDate.now() : toDate;
        if (requestedStudentId != null || isStudent(actor)) {
            UUID studentId = resolveStudentScope(actor, requestedStudentId);
            List<AttendanceRecordEntity> records = this.attendanceRecordRepository.findBySchoolIdAndUserIdAndAttendanceDateBetweenOrderByAttendanceDateAscCreatedAtAsc(actor.schoolId(), studentId, rangeStart, rangeEnd);
            return new AttendanceHeatmapResponse(rangeStart, rangeEnd, buildStudentHeatmap(buildStudentCalendar(records, rangeStart, rangeEnd), getOrCreatePolicy(actor.schoolId())));
        }
        requireAdmin(actor);
        return new AttendanceHeatmapResponse(rangeStart, rangeEnd, buildSchoolHeatmap(actor.schoolId(), rangeStart, rangeEnd, getOrCreatePolicy(actor.schoolId())));
    }

    public AttendanceCalendarResponse getCalendar(AttendanceActor actor, UUID requestedStudentId, LocalDate fromDate, LocalDate toDate) {
        UUID studentId = resolveStudentScope(actor, requestedStudentId);
        LocalDate rangeStart = fromDate == null ? LocalDate.now().withDayOfMonth(1) : fromDate;
        LocalDate rangeEnd = toDate == null ? LocalDate.now() : toDate;
        List<AttendanceRecordEntity> records = this.attendanceRecordRepository.findBySchoolIdAndUserIdAndAttendanceDateBetweenOrderByAttendanceDateAscCreatedAtAsc(actor.schoolId(), studentId, rangeStart, rangeEnd);
        return new AttendanceCalendarResponse(studentId, rangeStart, rangeEnd, buildStudentCalendar(records, rangeStart, rangeEnd));
    }

    public AttendanceRiskResponse getRisk(AttendanceActor actor, UUID classId) {
        Set<UUID> classIds = resolveRiskClassScope(actor, classId);
        List<AttendanceRiskStudentRow> students = buildRiskRows(actor.schoolId(), classIds, 200);
        return new AttendanceRiskResponse(LocalDate.now(), students);
    }

    public ResponseEntity<byte[]> exportAttendance(AttendanceActor actor, String format, UUID classId, UUID subjectId, UUID studentId, LocalDate fromDate, LocalDate toDate) {
        requireAdmin(actor);
        LocalDate rangeStart = fromDate == null ? LocalDate.now().minusDays(29) : fromDate;
        LocalDate rangeEnd = toDate == null ? LocalDate.now() : toDate;
        List<AttendanceSessionEntity> sessions = this.attendanceSessionRepository.findBySchoolIdAndAttendanceDateBetweenOrderByAttendanceDateDescPeriodNumberDesc(actor.schoolId(), rangeStart, rangeEnd).stream()
                .filter(session -> classId == null || session.getClassId().equals(classId))
                .filter(session -> subjectId == null || session.getSubjectId().equals(subjectId))
                .toList();

        Map<UUID, List<AttendanceRecordEntity>> recordsBySession = sessions.stream().collect(Collectors.toMap(
                AttendanceSessionEntity::getSessionId,
                session -> this.attendanceRecordRepository.findBySchoolIdAndSessionId(actor.schoolId(), session.getSessionId()).stream()
                        .filter(record -> studentId == null || record.getUserId().equals(studentId))
                        .toList(),
                (left, right) -> left,
                LinkedHashMap::new
        ));
        String normalizedFormat = format == null ? "csv" : format.trim().toLowerCase(Locale.ROOT);
        byte[] bytes;
        MediaType mediaType;
        switch (normalizedFormat) {
            case "csv" -> {
                bytes = buildCsvExport(sessions, recordsBySession, actor.schoolId()).getBytes(StandardCharsets.UTF_8);
                mediaType = MediaType.valueOf("text/csv");
            }
            case "xlsx" -> {
                bytes = buildXlsxExport(sessions, recordsBySession, actor.schoolId());
                mediaType = MediaType.valueOf("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
            }
            case "pdf" -> {
                bytes = buildPdfExport(sessions, recordsBySession, actor.schoolId(), rangeStart, rangeEnd);
                mediaType = MediaType.APPLICATION_PDF;
            }
            default -> throw new IllegalArgumentException("Unsupported attendance export format: " + format);
        }
        String fileName = "attendance-export-" + rangeStart + "-to-" + rangeEnd + "." + normalizedFormat;
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + fileName + "\"")
                .contentType(mediaType)
                .body(bytes);
    }

    @Transactional
    public void runAutoAbsentSweep() {
        LocalDate today = LocalDate.now();
        String currentDay = today.getDayOfWeek().name();
        LocalTime now = LocalTime.now();
        for (AttendancePolicyEntity policy : this.attendancePolicyRepository.findAll()) {
            if (!Boolean.TRUE.equals(policy.getAutoAbsentEnabled())) {
                continue;
            }
            UUID schoolId = policy.getSchoolId();
            List<TimetableSlotEntity> schoolSlots = this.timetableSlotRepository.findBySchoolIdOrderByDayOfWeekAscStartTimeAsc(schoolId).stream()
                    .filter(slot -> currentDay.equalsIgnoreCase(slot.getDayOfWeek()))
                    .toList();
            Map<UUID, List<TimetableSlotEntity>> slotsByClass = schoolSlots.stream().collect(Collectors.groupingBy(TimetableSlotEntity::getClassId));
            for (Map.Entry<UUID, List<TimetableSlotEntity>> entry : slotsByClass.entrySet()) {
                List<TimetableSlotEntity> classSlots = entry.getValue().stream().sorted(Comparator.comparing(slot -> parseTime(slot.getStartTime()))).toList();
                for (int index = 0; index < classSlots.size(); index++) {
                    TimetableSlotEntity slot = classSlots.get(index);
                    LocalTime deadline = parseTime(slot.getEndTime()).plusMinutes(policy.getAutoAbsentMinutes());
                    if (deadline.isAfter(now)) {
                        continue;
                    }
                    int periodNumber = index + 1;
                    Optional<AttendanceSessionEntity> existing = this.attendanceSessionRepository.findBySchoolIdAndClassIdAndSubjectIdAndAttendanceDateAndPeriodNumber(
                            schoolId,
                            slot.getClassId(),
                            slot.getSubjectId(),
                            today,
                            periodNumber
                    );
                    if (existing.isPresent()) {
                        continue;
                    }
                    AttendanceSessionEntity session = new AttendanceSessionEntity();
                    session.setSessionId(UUID.randomUUID());
                    session.setSchoolId(schoolId);
                    session.setClassId(slot.getClassId());
                    session.setSubjectId(slot.getSubjectId());
                    session.setTeacherUserId(slot.getTeacherUserId());
                    session.setAttendanceDate(today);
                    session.setPeriodNumber(periodNumber);
                    session.setTimetableSlotId(slot.getSlotId());
                    session.setSessionStatus("AUTO_DRAFT");
                    session.setGpsVerificationStatus("SKIPPED");
                    session.setGpsMessage("Auto-generated because attendance was not submitted on time.");
                    session.setAutoGenerated(true);
                    session.setCreatedAt(Instant.now());
                    session.setLastEditedAt(Instant.now());
                    this.attendanceSessionRepository.save(session);
                    syncSessionRoster(session, "ABSENT", "AUTO", "system@attendance");
                    publishAttendanceRefresh(resolveTenantIdForSchool(schoolId), schoolId, "ATTENDANCE_AUTO_DRAFTED", Map.of("sessionId", session.getSessionId().toString()));
                }
            }
        }
    }

    @Transactional
    public void runReminderSweep() {
        LocalDate today = LocalDate.now();
        for (AttendancePolicyEntity policy : this.attendancePolicyRepository.findAll()) {
            if (!Boolean.TRUE.equals(policy.getReminderEnabled())) {
                continue;
            }
            UUID schoolId = policy.getSchoolId();
            Set<UUID> classIds = this.academicClassRepository.findBySchoolIdOrderByClassNameAscSectionNameAsc(schoolId).stream()
                    .map(AcademicClassEntity::getClassId)
                    .collect(Collectors.toSet());
            List<AttendanceRiskStudentRow> risks = buildRiskRows(schoolId, classIds, Integer.MAX_VALUE);
            List<ReminderEntity> existingReminders = this.reminderRepository.findBySchoolIdOrderByDueAtAsc(schoolId);
            for (AttendanceRiskStudentRow risk : risks) {
                if ("HEALTHY".equalsIgnoreCase(risk.riskLevel())) {
                    continue;
                }
                boolean existsToday = existingReminders.stream().anyMatch(reminder ->
                        "ATTENDANCE_REMINDER".equalsIgnoreCase(reminder.getReminderType())
                                && risk.studentUserId().equals(reminder.getTargetUserId())
                                && reminder.getDueAt() != null
                                && LocalDateTime.ofInstant(reminder.getDueAt(), java.time.ZoneOffset.UTC).toLocalDate().equals(today)
                );
                if (existsToday) {
                    continue;
                }
                ReminderEntity reminder = new ReminderEntity();
                reminder.setReminderId(UUID.randomUUID());
                reminder.setSchoolId(schoolId);
                reminder.setReminderType("ATTENDANCE_REMINDER");
                reminder.setTargetUserId(risk.studentUserId());
                reminder.setMessage("Your attendance is " + formatPercentage(risk.attendancePercentage()) + "%. Please improve regularity.");
                reminder.setDueAt(Instant.now());
                reminder.setReminderStatus("PENDING");
                reminder.setCreatedAt(Instant.now());
                this.reminderRepository.save(reminder);
                sendNotification(resolveTenantIdForSchool(schoolId), schoolId, risk.studentUserId(), "Attendance Reminder", reminder.getMessage(), "ATTENDANCE_REMINDER", "IN_APP", null, Map.of("riskLevel", risk.riskLevel()));
            }
        }
    }

    private AttendanceSessionEntity getSessionOrThrow(UUID sessionId) {
        return this.attendanceSessionRepository.findById(sessionId)
                .orElseThrow(() -> new IllegalArgumentException("Attendance session not found."));
    }

    private AttendancePolicyEntity getOrCreatePolicy(UUID schoolId) {
        return this.attendancePolicyRepository.findBySchoolId(schoolId).orElseGet(() -> {
            AttendancePolicyEntity policy = new AttendancePolicyEntity();
            policy.setPolicyId(UUID.randomUUID());
            policy.setSchoolId(schoolId);
            policy.setWarningThreshold(75);
            policy.setCriticalThreshold(65);
            policy.setEnabledChannels("IN_APP,EMAIL,SMS,WHATSAPP");
            policy.setAutoAbsentEnabled(true);
            policy.setAutoAbsentMinutes(15);
            policy.setGpsEnabled(false);
            policy.setGpsMode("WARN");
            policy.setVoiceEnabled(true);
            policy.setFaceEnabled(false);
            policy.setAiPredictionEnabled(true);
            policy.setReminderEnabled(true);
            policy.setReminderFrequency("DAILY");
            policy.setFaceConfidenceThreshold(0.85d);
            policy.setCreatedAt(Instant.now());
            policy.setUpdatedAt(Instant.now());
            return this.attendancePolicyRepository.save(policy);
        });
    }

    private AttendancePolicyResponse toPolicyResponse(AttendancePolicyEntity policy) {
        return new AttendancePolicyResponse(
                policy.getPolicyId(),
                policy.getSchoolId(),
                safeInt(policy.getWarningThreshold(), 75),
                safeInt(policy.getCriticalThreshold(), 65),
                splitList(policy.getEnabledChannels()),
                Boolean.TRUE.equals(policy.getAutoAbsentEnabled()),
                safeInt(policy.getAutoAbsentMinutes(), 15),
                Boolean.TRUE.equals(policy.getGpsEnabled()),
                safeString(policy.getGpsMode(), "WARN"),
                policy.getGeofenceLatitude(),
                policy.getGeofenceLongitude(),
                policy.getGeofenceRadiusMeters(),
                Boolean.TRUE.equals(policy.getVoiceEnabled()),
                Boolean.TRUE.equals(policy.getFaceEnabled()),
                Boolean.TRUE.equals(policy.getAiPredictionEnabled()),
                Boolean.TRUE.equals(policy.getReminderEnabled()),
                safeString(policy.getReminderFrequency(), "DAILY"),
                policy.getFaceConfidenceThreshold() == null ? 0.85d : policy.getFaceConfidenceThreshold(),
                policy.getCreatedAt(),
                policy.getUpdatedAt()
        );
    }

    private AttendanceClassContext buildClassContext(AcademicClassEntity classroom, List<SubjectEntity> allowedSubjects, List<TimetableSlotEntity> slots, boolean classTeacher) {
        List<TimetableSlotEntity> classSlots = slots.stream()
                .filter(slot -> classroom.getClassId().equals(slot.getClassId()))
                .toList();
        Set<UUID> slotSubjectIds = classSlots.stream().map(TimetableSlotEntity::getSubjectId).collect(Collectors.toSet());
        List<AttendanceSubjectOption> subjects = allowedSubjects.stream()
                .filter(subject -> slotSubjectIds.isEmpty() || slotSubjectIds.contains(subject.getSubjectId()))
                .map(subject -> new AttendanceSubjectOption(subject.getSubjectId(), subject.getSubjectName(), subject.getSubjectCode()))
                .toList();
        List<LocalTime> distinctStartTimes = classSlots.stream()
                .map(slot -> parseTime(slot.getStartTime()))
                .distinct()
                .sorted()
                .toList();
        List<Integer> periods = distinctStartTimes.isEmpty()
                ? IntStream.rangeClosed(1, 8).boxed().toList()
                : IntStream.rangeClosed(1, distinctStartTimes.size()).boxed().toList();
        return new AttendanceClassContext(
                classroom.getClassId(),
                classroom.getClassName(),
                classroom.getSectionName(),
                classroom.getAcademicYear(),
                classTeacher,
                subjects,
                periods
        );
    }

    private List<AttendanceRecordEntity> syncSessionRoster(AttendanceSessionEntity session, String defaultStatus, String defaultCaptureSource, String actorEmail) {
        List<AttendanceRecordEntity> existing = new ArrayList<>(this.attendanceRecordRepository.findBySessionIdOrderByCreatedAtAsc(session.getSessionId()));
        Map<UUID, AttendanceRecordEntity> byStudentId = existing.stream().collect(Collectors.toMap(AttendanceRecordEntity::getUserId, record -> record, (left, right) -> left, LinkedHashMap::new));
        List<StudentClassEnrollmentEntity> enrollments = this.studentClassEnrollmentRepository.findBySchoolIdAndClassId(session.getSchoolId(), session.getClassId());
        Instant now = Instant.now();
        for (StudentClassEnrollmentEntity enrollment : enrollments) {
            if (byStudentId.containsKey(enrollment.getStudentUserId())) {
                continue;
            }
            AttendanceRecordEntity record = new AttendanceRecordEntity();
            record.setAttendanceId(UUID.randomUUID());
            record.setSchoolId(session.getSchoolId());
            record.setUserId(enrollment.getStudentUserId());
            record.setRoleName("STUDENT");
            record.setClassId(session.getClassId());
            record.setTeacherUserId(session.getTeacherUserId());
            record.setSessionId(session.getSessionId());
            record.setSubjectId(session.getSubjectId());
            record.setAttendanceMode("PERIOD");
            record.setTimetableSlotId(session.getTimetableSlotId());
            record.setPeriodNumber(session.getPeriodNumber());
            record.setAttendanceDate(session.getAttendanceDate());
            record.setAttendanceStatus(normalizeAttendanceStatus(defaultStatus));
            record.setMarkedBy(actorEmail);
            record.setCaptureSource(normalizeCaptureSource(defaultCaptureSource, "MANUAL"));
            record.setRecordedAt(now);
            record.setLastModifiedBy(actorEmail);
            record.setLastModifiedAt(now);
            record.setCreatedAt(now);
            existing.add(this.attendanceRecordRepository.save(record));
        }
        return existing.stream()
                .sorted(Comparator.comparing((AttendanceRecordEntity record) -> rollSortKey(getRollNumber(session.getSchoolId(), record.getUserId())))
                        .thenComparing((AttendanceRecordEntity record) -> safeString(getStudentName(session.getSchoolId(), record.getUserId()))))
                .toList();
    }

    private AttendanceRecordEntity findSessionRecord(AttendanceSessionEntity session, UUID studentId) {
        return syncSessionRoster(session, "PRESENT", "MANUAL", "system@attendance").stream()
                .filter(record -> record.getUserId().equals(studentId))
                .findFirst()
                .orElseThrow(() -> new IllegalArgumentException("Student is not part of this attendance roster."));
    }

    private List<AttendanceRosterStudent> buildRoster(List<AttendanceRecordEntity> records, UUID schoolId) {
        Set<UUID> studentIds = records.stream().map(AttendanceRecordEntity::getUserId).collect(Collectors.toSet());
        Map<UUID, SchoolUserEntity> usersById = this.schoolUserRepository.findBySchoolIdAndUserIdIn(schoolId, studentIds).stream()
                .collect(Collectors.toMap(SchoolUserEntity::getUserId, user -> user, (left, right) -> left));
        Map<UUID, StudentAdmissionEntity> admissionsById = this.studentAdmissionRepository.findBySchoolIdAndStudentUserIdIn(schoolId, studentIds).stream()
                .collect(Collectors.toMap(StudentAdmissionEntity::getStudentUserId, admission -> admission, (left, right) -> left));
        return records.stream()
                .map(record -> {
                    SchoolUserEntity user = usersById.get(record.getUserId());
                    StudentAbsenceReasonEntity reason = this.studentAbsenceReasonRepository.findByAttendanceId(record.getAttendanceId()).orElse(null);
                    return new AttendanceRosterStudent(
                            record.getAttendanceId(),
                            record.getUserId(),
                            user == null ? "Unknown Student" : user.getFullName(),
                            admissionsById.containsKey(record.getUserId()) ? admissionsById.get(record.getUserId()).getRollNo() : null,
                            user == null ? null : user.getProfilePhotoUrl(),
                            normalizeAttendanceStatus(record.getAttendanceStatus()),
                            safeString(record.getCaptureSource(), "MANUAL"),
                            reason == null ? null : reason.getCategory(),
                            reason == null ? null : reason.getDescription(),
                            record.getLastModifiedAt()
                    );
                })
                .sorted(Comparator.comparing((AttendanceRosterStudent item) -> rollSortKey(item.rollNumber()))
                        .thenComparing(AttendanceRosterStudent::fullName))
                .toList();
    }

    private List<AttendanceAuditEntry> buildAuditEntries(AttendanceSessionEntity session, UUID schoolId) {
        List<AttendanceAuditLogEntity> audits = this.attendanceAuditLogRepository.findBySessionIdOrderByCreatedAtDesc(session.getSessionId());
        Set<UUID> studentIds = audits.stream().map(AttendanceAuditLogEntity::getStudentUserId).collect(Collectors.toSet());
        Map<UUID, SchoolUserEntity> usersById = this.schoolUserRepository.findBySchoolIdAndUserIdIn(schoolId, studentIds).stream()
                .collect(Collectors.toMap(SchoolUserEntity::getUserId, user -> user, (left, right) -> left));
        return audits.stream()
                .map(audit -> new AttendanceAuditEntry(
                        audit.getAuditLogId(),
                        audit.getAttendanceId(),
                        audit.getStudentUserId(),
                        usersById.containsKey(audit.getStudentUserId()) ? usersById.get(audit.getStudentUserId()).getFullName() : "Unknown Student",
                        audit.getPreviousStatus(),
                        audit.getNewStatus(),
                        audit.getEditReason(),
                        audit.getChangedBy(),
                        audit.getChangedRole(),
                        audit.getCreatedAt()
                ))
                .toList();
    }

    private AttendanceSessionSummary buildSessionSummary(AttendanceSessionEntity session, List<AttendanceRecordEntity> records, UUID schoolId) {
        AcademicClassEntity classroom = this.academicClassRepository.findById(session.getClassId()).orElse(null);
        SubjectEntity subject = this.subjectRepository.findById(session.getSubjectId()).orElse(null);
        SchoolUserEntity teacher = this.schoolUserRepository.findById(session.getTeacherUserId()).orElse(null);
        long presentCount = records.stream().filter(record -> "PRESENT".equalsIgnoreCase(normalizeAttendanceStatus(record.getAttendanceStatus()))).count();
        long absentCount = records.stream().filter(record -> "ABSENT".equalsIgnoreCase(normalizeAttendanceStatus(record.getAttendanceStatus()))).count();
        long lateCount = records.stream().filter(record -> "LATE".equalsIgnoreCase(normalizeAttendanceStatus(record.getAttendanceStatus()))).count();
        long excusedCount = records.stream().filter(record -> "EXCUSED".equalsIgnoreCase(normalizeAttendanceStatus(record.getAttendanceStatus()))).count();
        return new AttendanceSessionSummary(
                session.getSessionId(),
                session.getSchoolId(),
                session.getClassId(),
                classroom == null ? null : classroom.getClassName(),
                classroom == null ? null : classroom.getSectionName(),
                session.getSubjectId(),
                subject == null ? null : subject.getSubjectName(),
                session.getTeacherUserId(),
                teacher == null ? null : teacher.getFullName(),
                session.getAttendanceDate(),
                session.getPeriodNumber(),
                session.getTimetableSlotId(),
                session.getSessionStatus(),
                session.getGpsVerificationStatus(),
                session.getGpsMessage(),
                session.getGpsDistanceMeters(),
                records.size(),
                presentCount,
                absentCount,
                lateCount,
                excusedCount,
                !"LOCKED".equalsIgnoreCase(session.getSessionStatus()),
                Boolean.TRUE.equals(session.getAutoGenerated()),
                session.getSubmittedAt(),
                session.getLastEditedAt()
        );
    }

    private List<AttendanceSessionSummary> buildSessionSummaries(List<AttendanceSessionEntity> sessions, UUID schoolId) {
        return sessions.stream()
                .map(session -> buildSessionSummary(session, this.attendanceRecordRepository.findBySchoolIdAndSessionId(schoolId, session.getSessionId()), schoolId))
                .toList();
    }

    private void writeAudit(AttendanceSessionEntity session, AttendanceRecordEntity record, UUID studentId, String previousStatus, String newStatus, String editReason, AttendanceActor actor) {
        AttendanceAuditLogEntity audit = new AttendanceAuditLogEntity();
        audit.setAuditLogId(UUID.randomUUID());
        audit.setSchoolId(session.getSchoolId());
        audit.setSessionId(session.getSessionId());
        audit.setAttendanceId(record.getAttendanceId());
        audit.setStudentUserId(studentId);
        audit.setPreviousStatus(previousStatus);
        audit.setNewStatus(newStatus);
        audit.setEditReason(trimToNull(editReason));
        audit.setChangedBy(actor.fullName());
        audit.setChangedRole(actor.roleName());
        audit.setCreatedAt(Instant.now());
        this.attendanceAuditLogRepository.save(audit);
    }

    private void refreshStudentRiskArtifacts(AttendanceActor actor, UUID classId, UUID studentId) {
        List<AttendanceRecordEntity> records = this.attendanceRecordRepository.findBySchoolIdAndUserIdOrderByAttendanceDateDescCreatedAtDesc(actor.schoolId(), studentId);
        AttendancePolicyEntity policy = getOrCreatePolicy(actor.schoolId());
        AttendanceMetrics metrics = calculateMetrics(records);
        double predictedAttendance = calculatePredictedPercentage(metrics);

        AttendancePredictionSnapshotEntity snapshot = this.attendancePredictionSnapshotRepository.findFirstBySchoolIdAndStudentUserIdOrderByGeneratedAtDesc(actor.schoolId(), studentId)
                .orElseGet(() -> {
                    AttendancePredictionSnapshotEntity entity = new AttendancePredictionSnapshotEntity();
                    entity.setPredictionId(UUID.randomUUID());
                    entity.setSchoolId(actor.schoolId());
                    entity.setStudentUserId(studentId);
                    return entity;
                });
        snapshot.setClassId(classId);
        snapshot.setSnapshotDate(LocalDate.now());
        snapshot.setCurrentAttendancePercentage(metrics.percentage());
        snapshot.setPredictedAttendancePercentage(predictedAttendance);
        snapshot.setRiskLevel(toWarningLevel(Math.min(metrics.percentage(), predictedAttendance), policy));
        snapshot.setRiskDrivers(buildRiskDrivers(metrics));
        snapshot.setGeneratedAt(Instant.now());
        this.attendancePredictionSnapshotRepository.save(snapshot);

        upsertAlert(actor, classId, studentId, metrics.percentage(), policy);
    }

    private void upsertAlert(AttendanceActor actor, UUID classId, UUID studentId, double attendancePercentage, AttendancePolicyEntity policy) {
        String level = toWarningLevel(attendancePercentage, policy);
        Optional<AttendanceAlertEventEntity> activeAlertOpt = this.attendanceAlertEventRepository.findFirstBySchoolIdAndStudentUserIdAndActiveTrueOrderByTriggeredAtDesc(actor.schoolId(), studentId);
        if ("HEALTHY".equals(level)) {
            activeAlertOpt.ifPresent(alert -> {
                alert.setActive(false);
                alert.setResolvedAt(Instant.now());
                this.attendanceAlertEventRepository.save(alert);
            });
            return;
        }

        AttendanceAlertEventEntity alert = activeAlertOpt.orElseGet(() -> {
            AttendanceAlertEventEntity entity = new AttendanceAlertEventEntity();
            entity.setAlertEventId(UUID.randomUUID());
            entity.setSchoolId(actor.schoolId());
            entity.setStudentUserId(studentId);
            entity.setTriggeredAt(Instant.now());
            entity.setActive(true);
            return entity;
        });
        boolean levelChanged = !level.equalsIgnoreCase(safeString(alert.getAlertLevel()));
        alert.setClassId(classId);
        alert.setAlertLevel(level);
        alert.setAttendancePercentage(attendancePercentage);
        alert.setActive(true);
        alert.setResolvedAt(null);
        alert.setChannelsSent(joinList(resolveNotificationChannels(policy)));
        alert.setNotificationSummary("Attendance dropped to " + formatPercentage(attendancePercentage) + "%");
        this.attendanceAlertEventRepository.save(alert);

        if (levelChanged || activeAlertOpt.isEmpty()) {
            fanOutAlertNotifications(actor, classId, studentId, attendancePercentage, level, resolveNotificationChannels(policy));
        }
    }

    private void fanOutAlertNotifications(AttendanceActor actor, UUID classId, UUID studentId, double attendancePercentage, String level, List<String> channels) {
        SchoolUserEntity student = this.schoolUserRepository.findById(studentId).orElse(null);
        String title = "Attendance " + ("CRITICAL".equals(level) ? "Alert" : "Warning");
        String message = (student == null ? "Student" : student.getFullName()) + " attendance is now " + formatPercentage(attendancePercentage) + "%.";
        Map<String, Object> metadata = Map.of(
                "level", level,
                "attendancePercentage", attendancePercentage,
                "classId", classId == null ? "" : classId.toString(),
                "studentId", studentId.toString()
        );
        for (String channel : channels) {
            sendNotification(actor.tenantId(), actor.schoolId(), studentId, title, message, "ATTENDANCE_ALERT", channel, student == null ? null : student.getEmail(), metadata);
        }
        for (StudentParentMappingEntity mapping : this.studentParentMappingRepository.findByStudentUserId(studentId)) {
            SchoolUserEntity parent = this.schoolUserRepository.findById(mapping.getParentUserId()).orElse(null);
            for (String channel : channels) {
                sendNotification(actor.tenantId(), actor.schoolId(), mapping.getParentUserId(), title, message, "ATTENDANCE_ALERT", channel, parent == null ? null : parent.getEmail(), metadata);
            }
        }
        List<ClassTeacherMappingEntity> classTeachers = this.classTeacherMappingRepository.findBySchoolId(actor.schoolId()).stream()
                .filter(mapping -> Objects.equals(mapping.getClassId(), classId))
                .toList();
        for (ClassTeacherMappingEntity mapping : classTeachers) {
            SchoolUserEntity classTeacher = this.schoolUserRepository.findById(mapping.getTeacherUserId()).orElse(null);
            for (String channel : channels) {
                sendNotification(actor.tenantId(), actor.schoolId(), mapping.getTeacherUserId(), title, message, "ATTENDANCE_ALERT", channel, classTeacher == null ? null : classTeacher.getEmail(), metadata);
            }
        }
        publishAttendanceRefresh(actor.tenantId(), actor.schoolId(), "ATTENDANCE_ALERT_" + level, metadata);
    }

    private void sendNotification(UUID tenantId, UUID schoolId, UUID recipientId, String title, String message, String type, String channel, String channelAddress, Map<String, Object> metadata) {
        try {
            Map<String, Object> body = new LinkedHashMap<>();
            body.put("recipientId", recipientId);
            body.put("title", title);
            body.put("message", message);
            body.put("type", type);
            body.put("channel", channel);
            body.put("channelAddress", channelAddress);
            body.put("deliveryStatus", "IN_APP".equalsIgnoreCase(channel) ? "DELIVERED" : "PENDING");
            body.put("providerReference", null);
            body.put("metadataJson", this.objectMapper.writeValueAsString(metadata));
            this.communicationRestClient.post()
                    .uri("/api/v1/communication/notifications")
                    .header("X-Tenant-ID", tenantId.toString())
                    .contentType(MediaType.APPLICATION_JSON)
                    .body(body)
                    .retrieve()
                    .toBodilessEntity();
        } catch (Exception ex) {
            logger.warn("Failed to send attendance notification. tenantId={} schoolId={} recipientId={} error={}",
                    tenantId, schoolId, recipientId, ex.getMessage());
        }
    }

    private void publishAttendanceRefresh(UUID tenantId, UUID schoolId, String eventType, Map<String, ?> payload) {
        Map<String, Object> event = new LinkedHashMap<>();
        event.put("type", eventType);
        event.put("schoolId", schoolId.toString());
        event.put("tenantId", tenantId.toString());
        event.put("payload", payload);
        event.put("occurredAt", Instant.now().toString());
        this.mqttEventPublisher.publish("school/notifications/" + tenantId, event);
    }

    private UUID resolveTenantIdForSchool(UUID schoolId) {
        return this.schoolUserRepository.findBySchoolIdOrderByRoleNameAscFullNameAsc(schoolId).stream()
                .map(SchoolUserEntity::getTenantId)
                .findFirst()
                .orElse(schoolId);
    }

    private UUID resolveStudentScope(AttendanceActor actor, UUID requestedStudentId) {
        if (isStudent(actor)) {
            if (requestedStudentId != null && !actor.userId().equals(requestedStudentId)) {
                throw new IllegalArgumentException("Students can only access their own attendance.");
            }
            return actor.userId();
        }
        if (requestedStudentId == null) {
            throw new IllegalArgumentException("Student id is required.");
        }
        if (isAdmin(actor)) {
            return requestedStudentId;
        }
        AcademicClassEntity classroom = resolveStudentClass(actor.schoolId(), requestedStudentId);
        requireCanMonitor(actor, classroom == null ? null : classroom.getClassId());
        return requestedStudentId;
    }

    private Set<UUID> resolveRiskClassScope(AttendanceActor actor, UUID classId) {
        if (isAdmin(actor)) {
            if (classId == null) {
                return this.academicClassRepository.findBySchoolIdOrderByClassNameAscSectionNameAsc(actor.schoolId()).stream()
                        .map(AcademicClassEntity::getClassId)
                        .collect(Collectors.toSet());
            }
            return Set.of(classId);
        }
        Set<UUID> classIds = resolveMonitorClassIds(actor, classId);
        if (classIds.isEmpty()) {
            throw new IllegalArgumentException("No class access for attendance risk analytics.");
        }
        return classIds;
    }

    private void requireAdmin(AttendanceActor actor) {
        if (!isAdmin(actor)) {
            throw new IllegalArgumentException("Only school admins can perform this attendance action.");
        }
    }

    private void requireCanMark(AttendanceActor actor, UUID classId, UUID subjectId) {
        if (isAdmin(actor)) {
            return;
        }
        if (!isTeacher(actor)) {
            throw new IllegalArgumentException("Only teachers can mark attendance.");
        }
        boolean classAllowed = this.teacherClassMappingRepository.findBySchoolIdAndTeacherUserId(actor.schoolId(), actor.userId()).stream()
                .map(TeacherClassMappingEntity::getClassId)
                .anyMatch(classId::equals)
                || this.classTeacherMappingRepository.findBySchoolId(actor.schoolId()).stream()
                .filter(mapping -> mapping.getTeacherUserId().equals(actor.userId()))
                .map(ClassTeacherMappingEntity::getClassId)
                .anyMatch(classId::equals);
        boolean subjectAllowed = this.teacherSubjectMappingRepository.findBySchoolId(actor.schoolId()).stream()
                .filter(mapping -> mapping.getTeacherUserId().equals(actor.userId()))
                .map(TeacherSubjectMappingEntity::getSubjectId)
                .anyMatch(subjectId::equals);
        if (!classAllowed || !subjectAllowed) {
            throw new IllegalArgumentException("You are not assigned to mark attendance for this class and subject.");
        }
    }

    private void requireCanMonitor(AttendanceActor actor, UUID classId) {
        if (isAdmin(actor)) {
            return;
        }
        if (!isTeacher(actor)) {
            throw new IllegalArgumentException("Only teachers or admins can review class attendance.");
        }
        Set<UUID> classTeacherIds = this.classTeacherMappingRepository.findBySchoolId(actor.schoolId()).stream()
                .filter(mapping -> mapping.getTeacherUserId().equals(actor.userId()))
                .map(ClassTeacherMappingEntity::getClassId)
                .collect(Collectors.toSet());
        if (classId != null && !classTeacherIds.contains(classId)) {
            throw new IllegalArgumentException("You are not assigned as class teacher for this class.");
        }
        if (classId == null && classTeacherIds.isEmpty()) {
            throw new IllegalArgumentException("You are not assigned as class teacher for any class.");
        }
    }

    private Set<UUID> resolveMonitorClassIds(AttendanceActor actor, UUID classId) {
        if (isAdmin(actor)) {
            return classId == null
                    ? this.academicClassRepository.findBySchoolIdOrderByClassNameAscSectionNameAsc(actor.schoolId()).stream().map(AcademicClassEntity::getClassId).collect(Collectors.toSet())
                    : Set.of(classId);
        }
        Set<UUID> classTeacherIds = this.classTeacherMappingRepository.findBySchoolId(actor.schoolId()).stream()
                .filter(mapping -> mapping.getTeacherUserId().equals(actor.userId()))
                .map(ClassTeacherMappingEntity::getClassId)
                .collect(Collectors.toSet());
        if (classId != null) {
            return classTeacherIds.contains(classId) ? Set.of(classId) : Set.of();
        }
        return classTeacherIds;
    }

    private void requireCanViewSession(AttendanceActor actor, AttendanceSessionEntity session) {
        if (isAdmin(actor)) {
            return;
        }
        if (isTeacher(actor) && (session.getTeacherUserId().equals(actor.userId()) || resolveMonitorClassIds(actor, session.getClassId()).contains(session.getClassId()))) {
            return;
        }
        if (isStudent(actor)) {
            StudentClassEnrollmentEntity enrollment = this.studentClassEnrollmentRepository.findBySchoolIdAndClassId(actor.schoolId(), session.getClassId()).stream()
                    .filter(item -> item.getStudentUserId().equals(actor.userId()))
                    .findFirst()
                    .orElse(null);
            if (enrollment != null) {
                return;
            }
        }
        throw new IllegalArgumentException("You do not have access to this attendance session.");
    }

    private boolean canEditSession(AttendanceActor actor, AttendanceSessionEntity session) {
        if (isAdmin(actor)) {
            return true;
        }
        if (!isTeacher(actor)) {
            return false;
        }
        return session.getTeacherUserId().equals(actor.userId()) || resolveMonitorClassIds(actor, session.getClassId()).contains(session.getClassId());
    }

    private void requireCanEditSession(AttendanceActor actor, AttendanceSessionEntity session) {
        if (!canEditSession(actor, session)) {
            throw new ForbiddenException("You do not have permission to edit this attendance session.");
        }
    }

    private boolean isAdmin(AttendanceActor actor) {
        String role = safeString(actor.roleName()).toUpperCase(Locale.ROOT);
        return ADMIN_ROLES.contains(role) || role.contains("ADMIN");
    }

    private boolean isTeacher(AttendanceActor actor) {
        String role = safeString(actor.roleName()).toUpperCase(Locale.ROOT);
        return role.contains("TEACHER");
    }

    private boolean isStudent(AttendanceActor actor) {
        String role = safeString(actor.roleName()).toUpperCase(Locale.ROOT);
        return role.contains("STUDENT");
    }

    private List<AttendanceRiskStudentRow> buildRiskRows(UUID schoolId, Set<UUID> allowedClassIds, int limit) {
        Set<UUID> effectiveClassIds = allowedClassIds == null || allowedClassIds.isEmpty()
                ? this.academicClassRepository.findBySchoolIdOrderByClassNameAscSectionNameAsc(schoolId).stream().map(AcademicClassEntity::getClassId).collect(Collectors.toSet())
                : allowedClassIds;
        List<StudentClassEnrollmentEntity> enrollments = this.studentClassEnrollmentRepository.findBySchoolId(schoolId).stream()
                .filter(enrollment -> effectiveClassIds.contains(enrollment.getClassId()))
                .toList();
        Set<UUID> studentIds = enrollments.stream().map(StudentClassEnrollmentEntity::getStudentUserId).collect(Collectors.toSet());
        Map<UUID, List<AttendanceRecordEntity>> recordsByStudent = this.attendanceRecordRepository.findBySchoolIdOrderByAttendanceDateDescCreatedAtDesc(schoolId).stream()
                .filter(record -> studentIds.contains(record.getUserId()))
                .collect(Collectors.groupingBy(AttendanceRecordEntity::getUserId));
        Map<UUID, SchoolUserEntity> usersById = this.schoolUserRepository.findBySchoolIdAndUserIdIn(schoolId, studentIds).stream()
                .collect(Collectors.toMap(SchoolUserEntity::getUserId, user -> user, (left, right) -> left));
        Map<UUID, StudentAdmissionEntity> admissionsById = this.studentAdmissionRepository.findBySchoolIdAndStudentUserIdIn(schoolId, studentIds).stream()
                .collect(Collectors.toMap(StudentAdmissionEntity::getStudentUserId, admission -> admission, (left, right) -> left));
        Map<UUID, AcademicClassEntity> classesById = this.academicClassRepository.findBySchoolIdOrderByClassNameAscSectionNameAsc(schoolId).stream()
                .collect(Collectors.toMap(AcademicClassEntity::getClassId, classroom -> classroom, (left, right) -> left));

        return enrollments.stream()
                .map(enrollment -> {
                    AttendanceMetrics metrics = calculateMetrics(recordsByStudent.getOrDefault(enrollment.getStudentUserId(), List.of()));
                    AttendancePredictionSnapshotEntity snapshot = this.attendancePredictionSnapshotRepository.findFirstBySchoolIdAndStudentUserIdOrderByGeneratedAtDesc(schoolId, enrollment.getStudentUserId()).orElse(null);
                    double predicted = snapshot == null ? calculatePredictedPercentage(metrics) : snapshot.getPredictedAttendancePercentage();
                    String riskLevel = snapshot == null ? inferRiskFromPercentage(metrics.percentage(), predicted, getOrCreatePolicy(schoolId)) : snapshot.getRiskLevel();
                    AttendanceAlertEventEntity activeAlert = this.attendanceAlertEventRepository.findFirstBySchoolIdAndStudentUserIdAndActiveTrueOrderByTriggeredAtDesc(schoolId, enrollment.getStudentUserId()).orElse(null);
                    SchoolUserEntity user = usersById.get(enrollment.getStudentUserId());
                    StudentAdmissionEntity admission = admissionsById.get(enrollment.getStudentUserId());
                    AcademicClassEntity classroom = classesById.get(enrollment.getClassId());
                    return new AttendanceRiskStudentRow(
                            enrollment.getStudentUserId(),
                            user == null ? "Unknown Student" : user.getFullName(),
                            admission == null ? null : admission.getRollNo(),
                            enrollment.getClassId(),
                            classroom == null ? null : classroom.getClassName(),
                            classroom == null ? null : classroom.getSectionName(),
                            metrics.percentage(),
                            predicted,
                            riskLevel,
                            metrics.absentMarks(),
                            metrics.lateMarks(),
                            activeAlert != null && Boolean.TRUE.equals(activeAlert.getActive())
                    );
                })
                .sorted(Comparator.comparingDouble((AttendanceRiskStudentRow item) -> item.attendancePercentage())
                        .thenComparing(AttendanceRiskStudentRow::fullName))
                .limit(limit < 1 ? Long.MAX_VALUE : limit)
                .toList();
    }

    private List<AttendanceTrendPoint> buildTrend(List<AttendanceRecordEntity> records, LocalDate fromDate, LocalDate toDate) {
        Map<LocalDate, List<AttendanceRecordEntity>> byDate = records.stream().collect(Collectors.groupingBy(AttendanceRecordEntity::getAttendanceDate));
        List<AttendanceTrendPoint> trend = new ArrayList<>();
        LocalDate cursor = fromDate;
        while (!cursor.isAfter(toDate)) {
            List<AttendanceRecordEntity> dayRecords = byDate.getOrDefault(cursor, List.of());
            trend.add(new AttendanceTrendPoint(
                    cursor,
                    dayRecords.size(),
                    dayRecords.stream().filter(record -> "PRESENT".equalsIgnoreCase(normalizeAttendanceStatus(record.getAttendanceStatus()))).count(),
                    dayRecords.stream().filter(record -> "ABSENT".equalsIgnoreCase(normalizeAttendanceStatus(record.getAttendanceStatus()))).count(),
                    dayRecords.stream().filter(record -> "LATE".equalsIgnoreCase(normalizeAttendanceStatus(record.getAttendanceStatus()))).count(),
                    dayRecords.stream().filter(record -> "EXCUSED".equalsIgnoreCase(normalizeAttendanceStatus(record.getAttendanceStatus()))).count()
            ));
            cursor = cursor.plusDays(1);
        }
        return trend;
    }

    private List<AttendanceClassOverview> buildClassOverview(List<AttendanceRecordEntity> records, UUID schoolId) {
        Map<UUID, List<AttendanceRecordEntity>> byClass = records.stream()
                .filter(record -> record.getClassId() != null)
                .collect(Collectors.groupingBy(AttendanceRecordEntity::getClassId));
        Map<UUID, AcademicClassEntity> classesById = this.academicClassRepository.findBySchoolIdOrderByClassNameAscSectionNameAsc(schoolId).stream()
                .collect(Collectors.toMap(AcademicClassEntity::getClassId, classroom -> classroom, (left, right) -> left));
        return byClass.entrySet().stream()
                .map(entry -> {
                    AttendanceMetrics metrics = calculateMetrics(entry.getValue());
                    AcademicClassEntity classroom = classesById.get(entry.getKey());
                    return new AttendanceClassOverview(
                            entry.getKey(),
                            classroom == null ? null : classroom.getClassName(),
                            classroom == null ? null : classroom.getSectionName(),
                            metrics.percentage(),
                            metrics.totalMarks(),
                            metrics.presentMarks(),
                            metrics.absentMarks(),
                            metrics.lateMarks()
                    );
                })
                .sorted(Comparator.comparing(AttendanceClassOverview::className, Comparator.nullsLast(String::compareToIgnoreCase)))
                .toList();
    }

    private List<AttendanceCalendarDay> buildStudentCalendar(List<AttendanceRecordEntity> records, LocalDate fromDate, LocalDate toDate) {
        Map<LocalDate, List<AttendanceRecordEntity>> byDate = records.stream().collect(Collectors.groupingBy(AttendanceRecordEntity::getAttendanceDate));
        List<AttendanceCalendarDay> days = new ArrayList<>();
        LocalDate cursor = fromDate;
        while (!cursor.isAfter(toDate)) {
            List<AttendanceRecordEntity> dayRecords = byDate.getOrDefault(cursor, List.of());
            long presentCount = dayRecords.stream().filter(record -> "PRESENT".equalsIgnoreCase(normalizeAttendanceStatus(record.getAttendanceStatus()))).count();
            long absentCount = dayRecords.stream().filter(record -> "ABSENT".equalsIgnoreCase(normalizeAttendanceStatus(record.getAttendanceStatus()))).count();
            long lateCount = dayRecords.stream().filter(record -> "LATE".equalsIgnoreCase(normalizeAttendanceStatus(record.getAttendanceStatus()))).count();
            days.add(new AttendanceCalendarDay(
                    cursor,
                    dayRecords.isEmpty() ? "NO_DATA" : aggregateDayStatus(dayRecords),
                    dayRecords.size(),
                    presentCount,
                    absentCount,
                    lateCount
            ));
            cursor = cursor.plusDays(1);
        }
        return days;
    }

    private List<AttendanceHeatmapPoint> buildStudentHeatmap(List<AttendanceCalendarDay> calendar, AttendancePolicyEntity policy) {
        return calendar.stream()
                .map(day -> {
                    long total = Math.max(day.periods(), 1);
                    long score = "NO_DATA".equalsIgnoreCase(day.status())
                            ? 0
                            : Math.round(((day.presentCount() * 100.0d) + (day.lateCount() * 75.0d)) / total);
                    return new AttendanceHeatmapPoint(day.date(), score, scoreColor(score, policy));
                })
                .toList();
    }

    private List<AttendanceHeatmapPoint> buildSchoolHeatmap(UUID schoolId, LocalDate fromDate, LocalDate toDate, AttendancePolicyEntity policy) {
        List<AttendanceRecordEntity> records = this.attendanceRecordRepository.findBySchoolIdAndAttendanceDateBetweenOrderByAttendanceDateAsc(schoolId, fromDate, toDate);
        Map<LocalDate, List<AttendanceRecordEntity>> byDate = records.stream().collect(Collectors.groupingBy(AttendanceRecordEntity::getAttendanceDate));
        List<AttendanceHeatmapPoint> items = new ArrayList<>();
        LocalDate cursor = fromDate;
        while (!cursor.isAfter(toDate)) {
            List<AttendanceRecordEntity> dayRecords = byDate.getOrDefault(cursor, List.of());
            AttendanceMetrics metrics = calculateMetrics(dayRecords);
            long score = dayRecords.isEmpty() ? 0 : Math.round(metrics.percentage());
            items.add(new AttendanceHeatmapPoint(cursor, score, scoreColor(score, policy)));
            cursor = cursor.plusDays(1);
        }
        return items;
    }

    private List<AttendanceDailyStatus> buildDailyStatusRows(List<AttendanceRecordEntity> records, UUID schoolId) {
        Map<UUID, SubjectEntity> subjectsById = this.subjectRepository.findBySchoolIdOrderBySubjectNameAsc(schoolId).stream()
                .collect(Collectors.toMap(SubjectEntity::getSubjectId, subject -> subject, (left, right) -> left));
        Map<UUID, SchoolUserEntity> usersById = this.schoolUserRepository.findBySchoolIdAndUserIdIn(
                schoolId,
                records.stream().map(AttendanceRecordEntity::getTeacherUserId).filter(Objects::nonNull).collect(Collectors.toSet())
        ).stream().collect(Collectors.toMap(SchoolUserEntity::getUserId, user -> user, (left, right) -> left));
        return records.stream()
                .map(record -> new AttendanceDailyStatus(
                        record.getAttendanceDate(),
                        normalizeAttendanceStatus(record.getAttendanceStatus()),
                        record.getPeriodNumber(),
                        subjectsById.containsKey(record.getSubjectId()) ? subjectsById.get(record.getSubjectId()).getSubjectName() : null,
                        record.getTeacherUserId() != null && usersById.containsKey(record.getTeacherUserId()) ? usersById.get(record.getTeacherUserId()).getFullName() : record.getMarkedBy()
                ))
                .toList();
    }

    private AttendanceMetrics calculateMetrics(Collection<AttendanceRecordEntity> records) {
        long totalMarks = records.size();
        long presentMarks = records.stream().filter(record -> "PRESENT".equalsIgnoreCase(normalizeAttendanceStatus(record.getAttendanceStatus()))).count();
        long absentMarks = records.stream().filter(record -> "ABSENT".equalsIgnoreCase(normalizeAttendanceStatus(record.getAttendanceStatus()))).count();
        long lateMarks = records.stream().filter(record -> "LATE".equalsIgnoreCase(normalizeAttendanceStatus(record.getAttendanceStatus()))).count();
        long excusedMarks = records.stream().filter(record -> "EXCUSED".equalsIgnoreCase(normalizeAttendanceStatus(record.getAttendanceStatus()))).count();
        double percentage = totalMarks == 0 ? 100.0d : ((presentMarks + lateMarks + excusedMarks) * 100.0d) / totalMarks;

        Map<LocalDate, List<AttendanceRecordEntity>> byDate = records.stream().collect(Collectors.groupingBy(AttendanceRecordEntity::getAttendanceDate));
        long presentDays = 0;
        long absentDays = 0;
        long lateDays = 0;
        long excusedDays = 0;
        for (List<AttendanceRecordEntity> dayRecords : byDate.values()) {
            switch (aggregateDayStatus(dayRecords)) {
                case "ABSENT" -> absentDays++;
                case "LATE" -> lateDays++;
                case "EXCUSED" -> excusedDays++;
                case "PRESENT" -> presentDays++;
                default -> { }
            }
        }
        return new AttendanceMetrics(roundTwo(percentage), totalMarks, presentMarks, absentMarks, lateMarks, excusedMarks, presentDays, absentDays, lateDays, excusedDays);
    }

    private String aggregateDayStatus(List<AttendanceRecordEntity> records) {
        boolean hasAbsent = records.stream().anyMatch(record -> "ABSENT".equalsIgnoreCase(normalizeAttendanceStatus(record.getAttendanceStatus())));
        boolean hasLate = records.stream().anyMatch(record -> "LATE".equalsIgnoreCase(normalizeAttendanceStatus(record.getAttendanceStatus())));
        boolean hasExcused = records.stream().anyMatch(record -> "EXCUSED".equalsIgnoreCase(normalizeAttendanceStatus(record.getAttendanceStatus())));
        boolean hasPresent = records.stream().anyMatch(record -> "PRESENT".equalsIgnoreCase(normalizeAttendanceStatus(record.getAttendanceStatus())));
        if (hasAbsent) {
            return "ABSENT";
        }
        if (hasLate) {
            return "LATE";
        }
        if (hasExcused && !hasPresent) {
            return "EXCUSED";
        }
        if (hasPresent || hasExcused) {
            return "PRESENT";
        }
        return "NO_DATA";
    }

    private DateWindow resolveWindow(String preset, LocalDate fromDate, LocalDate toDate) {
        String normalizedPreset = preset == null || preset.isBlank() ? "MONTHLY" : preset.trim().toUpperCase(Locale.ROOT);
        LocalDate today = LocalDate.now();
        return switch (normalizedPreset) {
            case "DAILY" -> new DateWindow("DAILY", today, today);
            case "WEEKLY" -> new DateWindow("WEEKLY", today.minusDays(6), today);
            case "MONTHLY" -> new DateWindow("MONTHLY", today.withDayOfMonth(1), today);
            case "CUSTOM" -> {
                if (fromDate == null || toDate == null) {
                    throw new IllegalArgumentException("Custom attendance range requires from and to dates.");
                }
                if (toDate.isBefore(fromDate)) {
                    throw new IllegalArgumentException("End date cannot be before start date.");
                }
                yield new DateWindow("CUSTOM", fromDate, toDate);
            }
            default -> throw new IllegalArgumentException("Unsupported attendance preset: " + preset);
        };
    }

    private AcademicClassEntity resolveStudentClass(UUID schoolId, UUID studentId) {
        StudentClassEnrollmentEntity enrollment = this.studentClassEnrollmentRepository.findBySchoolId(schoolId).stream()
                .filter(item -> item.getStudentUserId().equals(studentId))
                .findFirst()
                .orElse(null);
        if (enrollment == null) {
            return null;
        }
        return this.academicClassRepository.findById(enrollment.getClassId()).orElse(null);
    }

    private double calculatePredictedPercentage(AttendanceMetrics metrics) {
        if (metrics.totalMarks() == 0) {
            return 100.0d;
        }
        double decay = Math.min(20.0d, (metrics.absentMarks() * 0.9d) + (metrics.lateMarks() * 0.3d));
        return roundTwo(Math.max(0.0d, metrics.percentage() - decay));
    }

    private String buildRiskDrivers(AttendanceMetrics metrics) {
        List<String> drivers = new ArrayList<>();
        if (metrics.absentMarks() > 0) {
            drivers.add(metrics.absentMarks() + " absent periods");
        }
        if (metrics.lateMarks() > 0) {
            drivers.add(metrics.lateMarks() + " late periods");
        }
        if (metrics.totalMarks() > 0) {
            drivers.add(formatPercentage(metrics.percentage()) + "% current attendance");
        }
        return String.join(", ", drivers);
    }

    private String inferRiskFromPercentage(double percentage, double predictedPercentage, AttendancePolicyEntity policy) {
        return toWarningLevel(Math.min(percentage, predictedPercentage), policy);
    }

    private String toWarningLevel(double percentage, AttendancePolicyEntity policy) {
        if (percentage < safeInt(policy.getCriticalThreshold(), 65)) {
            return "CRITICAL";
        }
        if (percentage < safeInt(policy.getWarningThreshold(), 75)) {
            return "WARNING";
        }
        return "HEALTHY";
    }

    private String scoreColor(long score, AttendancePolicyEntity policy) {
        if (score < safeInt(policy.getCriticalThreshold(), 65)) {
            return "red";
        }
        if (score < safeInt(policy.getWarningThreshold(), 75)) {
            return "yellow";
        }
        return "green";
    }

    private List<String> resolveNotificationChannels(AttendancePolicyEntity policy) {
        java.util.LinkedHashSet<String> channels = new java.util.LinkedHashSet<>(splitList(policy.getEnabledChannels()));
        channels.add("IN_APP");
        return new ArrayList<>(channels);
    }

    private String buildCsvExport(List<AttendanceSessionEntity> sessions, Map<UUID, List<AttendanceRecordEntity>> recordsBySession, UUID schoolId) {
        List<AttendanceExportRow> rows = buildExportRows(sessions, recordsBySession, schoolId);
        StringBuilder csv = new StringBuilder();
        csv.append("Date,Class,Section,Subject,Period,Student,Roll,Status,Capture Source,Marked By,Session Status\n");
        for (AttendanceExportRow row : rows) {
            csv.append(escapeCsv(row.date())).append(',')
                    .append(escapeCsv(row.className())).append(',')
                    .append(escapeCsv(row.sectionName())).append(',')
                    .append(escapeCsv(row.subjectName())).append(',')
                    .append(escapeCsv(row.period())).append(',')
                    .append(escapeCsv(row.studentName())).append(',')
                    .append(escapeCsv(row.rollNumber())).append(',')
                    .append(escapeCsv(row.status())).append(',')
                    .append(escapeCsv(row.captureSource())).append(',')
                    .append(escapeCsv(row.markedBy())).append(',')
                    .append(escapeCsv(row.sessionStatus()))
                    .append('\n');
        }
        return csv.toString();
    }

    private byte[] buildXlsxExport(List<AttendanceSessionEntity> sessions, Map<UUID, List<AttendanceRecordEntity>> recordsBySession, UUID schoolId) {
        List<AttendanceExportRow> rows = buildExportRows(sessions, recordsBySession, schoolId);
        try (Workbook workbook = new XSSFWorkbook(); ByteArrayOutputStream output = new ByteArrayOutputStream()) {
            Sheet sheet = workbook.createSheet("Attendance");
            CellStyle headerStyle = workbook.createCellStyle();
            Font headerFont = workbook.createFont();
            headerFont.setBold(true);
            headerFont.setColor(IndexedColors.WHITE.getIndex());
            headerStyle.setFont(headerFont);
            headerStyle.setFillForegroundColor(IndexedColors.DARK_BLUE.getIndex());
            headerStyle.setFillPattern(FillPatternType.SOLID_FOREGROUND);

            List<String> headers = List.of("Date", "Class", "Section", "Subject", "Period", "Student", "Roll", "Status", "Capture Source", "Marked By", "Session Status");
            Row headerRow = sheet.createRow(0);
            for (int index = 0; index < headers.size(); index++) {
                Cell cell = headerRow.createCell(index);
                cell.setCellValue(headers.get(index));
                cell.setCellStyle(headerStyle);
            }

            int rowIndex = 1;
            for (AttendanceExportRow row : rows) {
                Row sheetRow = sheet.createRow(rowIndex++);
                sheetRow.createCell(0).setCellValue(row.date());
                sheetRow.createCell(1).setCellValue(row.className());
                sheetRow.createCell(2).setCellValue(row.sectionName());
                sheetRow.createCell(3).setCellValue(row.subjectName());
                sheetRow.createCell(4).setCellValue(row.period());
                sheetRow.createCell(5).setCellValue(row.studentName());
                sheetRow.createCell(6).setCellValue(row.rollNumber());
                sheetRow.createCell(7).setCellValue(row.status());
                sheetRow.createCell(8).setCellValue(row.captureSource());
                sheetRow.createCell(9).setCellValue(row.markedBy());
                sheetRow.createCell(10).setCellValue(row.sessionStatus());
            }

            for (int index = 0; index < headers.size(); index++) {
                sheet.autoSizeColumn(index);
            }
            workbook.write(output);
            return output.toByteArray();
        } catch (IOException ex) {
            throw new IllegalStateException("Failed to generate XLSX attendance export.", ex);
        }
    }

    private byte[] buildPdfExport(List<AttendanceSessionEntity> sessions, Map<UUID, List<AttendanceRecordEntity>> recordsBySession, UUID schoolId, LocalDate rangeStart, LocalDate rangeEnd) {
        List<AttendanceExportRow> rows = buildExportRows(sessions, recordsBySession, schoolId);
        try (ByteArrayOutputStream output = new ByteArrayOutputStream()) {
            Document document = new Document(PageSize.A4.rotate(), 24, 24, 24, 24);
            PdfWriter.getInstance(document, output);
            document.open();
            document.add(new Paragraph("Attendance Export", FontFactory.getFont(FontFactory.HELVETICA_BOLD, 16)));
            document.add(new Paragraph("Range: " + rangeStart + " to " + rangeEnd, FontFactory.getFont(FontFactory.HELVETICA, 10)));
            document.add(new Paragraph(" "));

            PdfPTable table = new PdfPTable(11);
            table.setWidthPercentage(100f);
            table.setHeaderRows(1);
            addPdfHeaderCell(table, "Date");
            addPdfHeaderCell(table, "Class");
            addPdfHeaderCell(table, "Section");
            addPdfHeaderCell(table, "Subject");
            addPdfHeaderCell(table, "Period");
            addPdfHeaderCell(table, "Student");
            addPdfHeaderCell(table, "Roll");
            addPdfHeaderCell(table, "Status");
            addPdfHeaderCell(table, "Capture");
            addPdfHeaderCell(table, "Marked By");
            addPdfHeaderCell(table, "Session");

            for (AttendanceExportRow row : rows) {
                addPdfValueCell(table, row.date());
                addPdfValueCell(table, row.className());
                addPdfValueCell(table, row.sectionName());
                addPdfValueCell(table, row.subjectName());
                addPdfValueCell(table, row.period());
                addPdfValueCell(table, row.studentName());
                addPdfValueCell(table, row.rollNumber());
                addPdfValueCell(table, row.status());
                addPdfValueCell(table, row.captureSource());
                addPdfValueCell(table, row.markedBy());
                addPdfValueCell(table, row.sessionStatus());
            }

            document.add(table);
            document.close();
            return output.toByteArray();
        } catch (DocumentException | IOException ex) {
            throw new IllegalStateException("Failed to generate PDF attendance export.", ex);
        }
    }

    private List<AttendanceExportRow> buildExportRows(List<AttendanceSessionEntity> sessions, Map<UUID, List<AttendanceRecordEntity>> recordsBySession, UUID schoolId) {
        Map<UUID, AcademicClassEntity> classesById = this.academicClassRepository.findBySchoolIdOrderByClassNameAscSectionNameAsc(schoolId).stream()
                .collect(Collectors.toMap(AcademicClassEntity::getClassId, classroom -> classroom, (left, right) -> left));
        Map<UUID, SubjectEntity> subjectsById = this.subjectRepository.findBySchoolIdOrderBySubjectNameAsc(schoolId).stream()
                .collect(Collectors.toMap(SubjectEntity::getSubjectId, subject -> subject, (left, right) -> left));
        Set<UUID> studentIds = recordsBySession.values().stream().flatMap(Collection::stream).map(AttendanceRecordEntity::getUserId).collect(Collectors.toSet());
        Map<UUID, SchoolUserEntity> usersById = this.schoolUserRepository.findBySchoolIdAndUserIdIn(schoolId, studentIds).stream()
                .collect(Collectors.toMap(SchoolUserEntity::getUserId, user -> user, (left, right) -> left));
        Map<UUID, StudentAdmissionEntity> admissionsById = this.studentAdmissionRepository.findBySchoolIdAndStudentUserIdIn(schoolId, studentIds).stream()
                .collect(Collectors.toMap(StudentAdmissionEntity::getStudentUserId, admission -> admission, (left, right) -> left));

        List<AttendanceExportRow> rows = new ArrayList<>();
        for (AttendanceSessionEntity session : sessions) {
            AcademicClassEntity classroom = classesById.get(session.getClassId());
            SubjectEntity subject = subjectsById.get(session.getSubjectId());
            for (AttendanceRecordEntity record : recordsBySession.getOrDefault(session.getSessionId(), List.of())) {
                SchoolUserEntity user = usersById.get(record.getUserId());
                StudentAdmissionEntity admission = admissionsById.get(record.getUserId());
                rows.add(new AttendanceExportRow(
                        session.getAttendanceDate() == null ? "" : session.getAttendanceDate().toString(),
                        classroom == null ? "" : safeString(classroom.getClassName()),
                        classroom == null ? "" : safeString(classroom.getSectionName()),
                        subject == null ? "" : safeString(subject.getSubjectName()),
                        session.getPeriodNumber() == null ? "" : session.getPeriodNumber().toString(),
                        user == null ? "" : safeString(user.getFullName()),
                        admission == null ? "" : safeString(admission.getRollNo()),
                        normalizeAttendanceStatus(record.getAttendanceStatus()),
                        safeString(record.getCaptureSource(), "MANUAL"),
                        safeString(record.getMarkedBy()),
                        safeString(session.getSessionStatus())
                ));
            }
        }
        return rows;
    }

    private void addPdfHeaderCell(PdfPTable table, String value) {
        PdfPCell cell = new PdfPCell(new Phrase(value, FontFactory.getFont(FontFactory.HELVETICA_BOLD, 9)));
        cell.setPadding(6f);
        table.addCell(cell);
    }

    private void addPdfValueCell(PdfPTable table, String value) {
        PdfPCell cell = new PdfPCell(new Phrase(value, FontFactory.getFont(FontFactory.HELVETICA, 8)));
        cell.setPadding(5f);
        table.addCell(cell);
    }

    private record AttendanceExportRow(
            String date,
            String className,
            String sectionName,
            String subjectName,
            String period,
            String studentName,
            String rollNumber,
            String status,
            String captureSource,
            String markedBy,
            String sessionStatus
    ) {}

    private UUID parseUuid(String rawValue, String message) {
        if (rawValue == null || rawValue.isBlank()) {
            throw new IllegalArgumentException(message);
        }
        try {
            return UUID.fromString(rawValue.trim());
        } catch (IllegalArgumentException ex) {
            throw new IllegalArgumentException(message);
        }
    }

    private Optional<SchoolUserEntity> resolveSchoolUser(UUID userId, UUID schoolId, String emailHeader) {
        Optional<SchoolUserEntity> directMatch = this.schoolUserRepository.findById(userId)
                .filter(user -> schoolId.equals(user.getSchoolId()));
        if (directMatch.isPresent()) {
            return directMatch;
        }

        String normalizedEmail = trimToNull(emailHeader);
        if (normalizedEmail == null) {
            return Optional.empty();
        }

        return this.schoolUserRepository.findBySchoolIdAndEmailIgnoreCase(schoolId, normalizedEmail)
                .or(() -> this.schoolUserRepository.findByEmailIgnoreCase(normalizedEmail)
                        .filter(user -> schoolId.equals(user.getSchoolId())));
    }

    private int safeInt(Integer value, int fallback) {
        return value == null ? fallback : value;
    }

    private String safeString(String value) {
        return value == null ? "" : value;
    }

    private String safeString(String value, String fallback) {
        return value == null || value.isBlank() ? fallback : value;
    }

    private List<String> splitList(String raw) {
        if (raw == null || raw.isBlank()) {
            return List.of();
        }
        return java.util.Arrays.stream(raw.split("[,;]"))
                .map(String::trim)
                .filter(item -> !item.isBlank())
                .distinct()
                .toList();
    }

    private String joinList(Collection<String> items) {
        return items == null ? "" : items.stream().filter(Objects::nonNull).map(String::trim).filter(item -> !item.isBlank()).distinct().collect(Collectors.joining(","));
    }

    private String normalizeAttendanceStatus(String rawStatus) {
        String status = safeString(rawStatus, "PRESENT").trim().toUpperCase(Locale.ROOT);
        return switch (status) {
            case "PRESENT" -> "PRESENT";
            case "ABSENT" -> "ABSENT";
            case "LATE" -> "LATE";
            case "EXCUSED", "LEAVE", "ON LEAVE", "EXCUSE" -> "EXCUSED";
            default -> "PRESENT";
        };
    }

    private String normalizeCaptureSource(String rawSource, String fallback) {
        String source = safeString(rawSource, fallback).trim().toUpperCase(Locale.ROOT);
        return switch (source) {
            case "MANUAL", "VOICE", "FACE", "BULK", "AUTO" -> source;
            default -> safeString(fallback, "MANUAL").trim().toUpperCase(Locale.ROOT);
        };
    }

    private String normalizeReasonCategory(String rawCategory) {
        String category = safeString(rawCategory).trim().toUpperCase(Locale.ROOT);
        return switch (category) {
            case "SICK", "LEAVE", "PERSONAL", "CUSTOM" -> category;
            default -> "CUSTOM";
        };
    }

    private String normalizeRoll(String roll) {
        return safeString(roll).replaceAll("[^0-9A-Za-z]", "").toUpperCase(Locale.ROOT);
    }

    private String getRollNumber(UUID schoolId, UUID studentId) {
        return this.studentAdmissionRepository.findBySchoolIdAndStudentUserId(schoolId, studentId)
                .map(StudentAdmissionEntity::getRollNo)
                .orElse(null);
    }

    private String getStudentName(UUID schoolId, UUID studentId) {
        return this.schoolUserRepository.findById(studentId).map(SchoolUserEntity::getFullName).orElse("Unknown Student");
    }

    private String rollSortKey(String rollNumber) {
        if (rollNumber == null || rollNumber.isBlank()) {
            return "ZZZZZZ";
        }
        String normalized = normalizeRoll(rollNumber);
        if (normalized.chars().allMatch(Character::isDigit)) {
            return String.format("%010d", Integer.parseInt(normalized));
        }
        return normalized;
    }

    private String escapeCsv(String value) {
        String raw = value == null ? "" : value;
        return "\"" + raw.replace("\"", "\"\"") + "\"";
    }

    private LocalTime parseTime(String rawValue) {
        if (rawValue == null || rawValue.isBlank()) {
            return LocalTime.MIDNIGHT;
        }
        try {
            return LocalTime.parse(rawValue.trim());
        } catch (DateTimeParseException ex) {
            try {
                return LocalTime.parse(rawValue.trim() + ":00");
            } catch (DateTimeParseException ignored) {
                return LocalTime.MIDNIGHT;
            }
        }
    }

    private double roundTwo(double value) {
        return Math.round(value * 100.0d) / 100.0d;
    }

    private String formatPercentage(double value) {
        return String.format(Locale.ROOT, "%.2f", value);
    }

    private String trimToNull(String value) {
        if (value == null) {
            return null;
        }
        String trimmed = value.trim();
        return trimmed.isEmpty() ? null : trimmed;
    }

    private record AttendanceMetrics(
            double percentage,
            long totalMarks,
            long presentMarks,
            long absentMarks,
            long lateMarks,
            long excusedMarks,
            long presentDays,
            long absentDays,
            long lateDays,
            long excusedDays
    ) {}

    private record DateWindow(String preset, LocalDate fromDate, LocalDate toDate) {}
}
