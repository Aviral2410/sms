package com.sms.schoolops.service;

import com.sms.common.exception.ForbiddenException;
import com.sms.common.exception.NotFoundException;
import com.sms.schoolops.api.StudentModuleDtos.*;
import com.sms.schoolops.domain.*;
import com.sms.schoolops.repository.*;
import com.sms.schoolops.security.PermissionActor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.LocalDate;
import java.util.Collections;
import java.util.Comparator;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
public class StudentModuleService {

    private final SchoolUserRepository schoolUserRepository;
    private final StudentAdmissionRepository studentAdmissionRepository;
    private final StudentClassEnrollmentRepository enrollmentRepository;
    private final AcademicClassRepository academicClassRepository;
    private final ClassTeacherMappingRepository classTeacherMappingRepository;
    private final ClassSubjectTeacherMappingRepository subjectTeacherMappingRepository;
    private final SubjectRepository subjectRepository;
    private final TimetableSlotRepository timetableSlotRepository;
    private final AttendanceRecordRepository attendanceRecordRepository;
    private final HomeworkItemRepository homeworkItemRepository;
    private final StudentHomeworkStatusRepository homeworkStatusRepository;
    private final ExamMarkRepository examMarkRepository;
    private final ExamRepository examRepository;
    private final ExamResultRecordRepository examResultRecordRepository;
    private final StudentAbsenceReasonRepository studentAbsenceReasonRepository;
    private final VoiceNoteRepository voiceNoteRepository;
    private final LibraryReservationRepository libraryReservationRepository;
    private final LibraryResourceRepository libraryResourceRepository;
    private final ForumAnswerRepository forumAnswerRepository;
    private final FeeRecordRepository feeRecordRepository;

    public StudentModuleService(
            SchoolUserRepository schoolUserRepository,
            StudentAdmissionRepository studentAdmissionRepository,
            StudentClassEnrollmentRepository enrollmentRepository,
            AcademicClassRepository academicClassRepository,
            ClassTeacherMappingRepository classTeacherMappingRepository,
            ClassSubjectTeacherMappingRepository subjectTeacherMappingRepository,
            SubjectRepository subjectRepository,
            TimetableSlotRepository timetableSlotRepository,
            AttendanceRecordRepository attendanceRecordRepository,
            HomeworkItemRepository homeworkItemRepository,
            StudentHomeworkStatusRepository homeworkStatusRepository,
            ExamMarkRepository examMarkRepository,
            ExamRepository examRepository,
            ExamResultRecordRepository examResultRecordRepository,
            StudentAbsenceReasonRepository studentAbsenceReasonRepository,
            VoiceNoteRepository voiceNoteRepository,
            LibraryReservationRepository libraryReservationRepository,
            LibraryResourceRepository libraryResourceRepository,
            ForumAnswerRepository forumAnswerRepository,
            FeeRecordRepository feeRecordRepository
    ) {
        this.schoolUserRepository = schoolUserRepository;
        this.studentAdmissionRepository = studentAdmissionRepository;
        this.enrollmentRepository = enrollmentRepository;
        this.academicClassRepository = academicClassRepository;
        this.classTeacherMappingRepository = classTeacherMappingRepository;
        this.subjectTeacherMappingRepository = subjectTeacherMappingRepository;
        this.subjectRepository = subjectRepository;
        this.timetableSlotRepository = timetableSlotRepository;
        this.attendanceRecordRepository = attendanceRecordRepository;
        this.homeworkItemRepository = homeworkItemRepository;
        this.homeworkStatusRepository = homeworkStatusRepository;
        this.examMarkRepository = examMarkRepository;
        this.examRepository = examRepository;
        this.examResultRecordRepository = examResultRecordRepository;
        this.studentAbsenceReasonRepository = studentAbsenceReasonRepository;
        this.voiceNoteRepository = voiceNoteRepository;
        this.libraryReservationRepository = libraryReservationRepository;
        this.libraryResourceRepository = libraryResourceRepository;
        this.forumAnswerRepository = forumAnswerRepository;
        this.feeRecordRepository = feeRecordRepository;
    }

    public StudentProfileResponse getProfile(PermissionActor actor) {
        ensureStudentActor(actor, "access their student profile");

        SchoolUserEntity user = schoolUserRepository.findById(actor.userId())
                .orElseThrow(() -> new IllegalArgumentException("Student user not found."));

        StudentAdmissionEntity admission = studentAdmissionRepository.findBySchoolIdAndStudentUserId(actor.schoolId(), actor.userId())
                .orElseThrow(() -> new IllegalArgumentException("Student admission record not found."));

        StudentClassEnrollmentEntity enrollment = enrollmentRepository.findBySchoolId(actor.schoolId()).stream()
                .filter(e -> e.getStudentUserId().equals(actor.userId()))
                .findFirst().orElse(null);

        AcademicClassEntity classroom = enrollment != null ? academicClassRepository.findById(enrollment.getClassId()).orElse(null) : null;

        return new StudentProfileResponse(
                user.getUserId(),
                admission.getAdmissionNo(),
                admission.getRollNo(),
                user.getFullName(),
                user.getEmail(),
                user.getProfilePhotoUrl(),
                admission.getAddress(),
                admission.getGuardianName(),
                admission.getGuardianPhone(),
                admission.getAdmittedOn(),
                classroom != null ? classroom.getClassName() : null,
                classroom != null ? classroom.getSectionName() : null,
                admission.getAdmissionStatus() != null ? admission.getAdmissionStatus().name() : "ACTIVE"
        );
    }

    @Transactional
    public StudentProfileResponse updateProfile(PermissionActor actor, StudentProfileUpdateRequest request) {
        ensureStudentActor(actor, "update their student profile");

        SchoolUserEntity user = schoolUserRepository.findById(actor.userId())
                .orElseThrow(() -> new IllegalArgumentException("Student user not found."));

        StudentAdmissionEntity admission = studentAdmissionRepository.findBySchoolIdAndStudentUserId(actor.schoolId(), actor.userId())
                .orElseThrow(() -> new IllegalArgumentException("Student admission record not found."));

        if (request.profilePhotoUrl() != null) {
            user.setProfilePhotoUrl(request.profilePhotoUrl());
            schoolUserRepository.save(user);
        }

        if (request.address() != null) admission.setAddress(request.address());
        if (request.guardianName() != null) admission.setGuardianName(request.guardianName());
        if (request.guardianPhone() != null) admission.setGuardianPhone(request.guardianPhone());

        studentAdmissionRepository.save(admission);

        return getProfile(actor);
    }

    public ClassroomDetailResponse getClassroom(PermissionActor actor) {
        ensureStudentActor(actor, "view classroom details");
        StudentClassEnrollmentEntity enrollment = enrollmentRepository.findBySchoolId(actor.schoolId()).stream()
                .filter(e -> e.getStudentUserId().equals(actor.userId()))
                .findFirst()
                .orElseThrow(() -> new ForbiddenException("You are not enrolled in any class."));

        AcademicClassEntity classroom = academicClassRepository.findById(enrollment.getClassId())
                .orElseThrow(() -> new IllegalArgumentException("Classroom not found."));

        SchoolUserEntity classTeacher = classTeacherMappingRepository.findBySchoolId(actor.schoolId()).stream()
                .filter(m -> m.getClassId().equals(classroom.getClassId()))
                .findFirst()
                .flatMap(m -> schoolUserRepository.findById(m.getTeacherUserId()))
                .orElse(null);

        List<SubjectTeacherResponse> subjects = subjectTeacherMappingRepository.findBySchoolId(actor.schoolId()).stream()
                .filter(m -> m.getClassId().equals(classroom.getClassId()))
                .map(m -> {
                    String subName = subjectRepository.findById(m.getSubjectId()).map(SubjectEntity::getSubjectName).orElse("Subject not mapped");
                    SchoolUserEntity teacher = schoolUserRepository.findById(m.getTeacherUserId()).orElse(null);
                    return new SubjectTeacherResponse(
                            m.getSubjectId(),
                            subName,
                            teacher != null ? teacher.getFullName() : "Teacher assignment pending",
                            teacher != null ? teacher.getEmail() : null
                    );
                })
                .toList();

        List<ClassmateResponse> classmates = enrollmentRepository.findBySchoolId(actor.schoolId()).stream()
                .filter(e -> e.getClassId().equals(classroom.getClassId()) && !e.getStudentUserId().equals(actor.userId()))
                .map(e -> {
                    SchoolUserEntity sUser = schoolUserRepository.findById(e.getStudentUserId()).orElse(null);
                    StudentAdmissionEntity sAdm = studentAdmissionRepository.findBySchoolIdAndStudentUserId(actor.schoolId(), e.getStudentUserId()).orElse(null);
                    return new ClassmateResponse(
                            e.getStudentUserId(),
                            sUser != null ? sUser.getFullName() : "Student record unavailable",
                            sAdm != null ? sAdm.getRollNo() : "",
                            sUser != null ? sUser.getProfilePhotoUrl() : ""
                    );
                })
                .toList();
        
        return new ClassroomDetailResponse(
                classroom.getClassId(),
                classroom.getClassName(),
                classroom.getSectionName(),
                classTeacher != null ? classTeacher.getFullName() : null,
                classTeacher != null ? classTeacher.getEmail() : null,
                subjects,
                classmates
        );
    }

    public StudentTimetableResponse getTimetable(PermissionActor actor) {
        ensureStudentActor(actor, "view their timetable");
        StudentClassEnrollmentEntity enrollment = enrollmentRepository.findBySchoolId(actor.schoolId()).stream()
                .filter(e -> e.getStudentUserId().equals(actor.userId()))
                .findFirst()
                .orElseThrow(() -> new ForbiddenException("You are not enrolled in any class."));

        List<TimetableSlotEntity> slots = timetableSlotRepository.findBySchoolIdAndClassId(actor.schoolId(), enrollment.getClassId());

        Map<String, List<TimetableSlotEntity>> grouped = slots.stream()
                .collect(Collectors.groupingBy(TimetableSlotEntity::getDayOfWeek));

        List<TimetableDaySchedule> dailySchedules = grouped.entrySet().stream()
                .map(entry -> {
                    List<TimetableSlotEntity> daySlots = entry.getValue().stream()
                            .sorted((a, b) -> {
                                String as = a.getStartTime();
                                String bs = b.getStartTime();
                                if (as == null && bs == null) return 0;
                                if (as == null) return 1;
                                if (bs == null) return -1;
                                return as.compareTo(bs);
                            })
                            .toList();

                    java.util.concurrent.atomic.AtomicInteger periodCounter = new java.util.concurrent.atomic.AtomicInteger(1);
                    List<TimetablePeriodResponse> periods = daySlots.stream()
                            .map(s -> {
                                String subName = subjectRepository.findById(s.getSubjectId()).map(SubjectEntity::getSubjectName).orElse("Subject details syncing");
                                String tName = schoolUserRepository.findById(s.getTeacherUserId()).map(SchoolUserEntity::getFullName).orElse("Teacher assignment pending");
                                return new TimetablePeriodResponse(
                                        periodCounter.getAndIncrement(),
                                        subName,
                                        tName,
                                        s.getRoomName(),
                                        s.getStartTime() != null ? s.getStartTime() : "",
                                        s.getEndTime() != null ? s.getEndTime() : ""
                                );
                            })
                            .toList();
                    return new TimetableDaySchedule(entry.getKey(), periods);
                })
                .sorted(Comparator.comparingInt(item -> weekdayOrder(item.dayOfWeek())))
                .toList();

        return new StudentTimetableResponse(dailySchedules);
    }

    public List<StudentHomeworkResponse> getHomework(PermissionActor actor) {
        ensureStudentActor(actor, "view homework");
        StudentClassEnrollmentEntity enrollment = enrollmentRepository.findBySchoolId(actor.schoolId()).stream()
                .filter(e -> e.getStudentUserId().equals(actor.userId()))
                .findFirst()
                .orElseThrow(() -> new ForbiddenException("You are not enrolled in any class."));

        List<HomeworkItemEntity> items = homeworkItemRepository.findBySchoolIdAndClassIdOrderByDueDateDesc(actor.schoolId(), enrollment.getClassId());

        return items.stream().map(h -> {
            String subName = h.getSubjectId() != null ? subjectRepository.findById(h.getSubjectId()).map(SubjectEntity::getSubjectName).orElse("Subject not mapped") : "General";
            String teacherName = schoolUserRepository.findById(h.getTeacherUserId()).map(SchoolUserEntity::getFullName).orElse("Teacher assignment pending");
            StudentHomeworkStatusEntity statusEntity = homeworkStatusRepository.findByHomeworkIdAndStudentUserId(h.getHomeworkId(), actor.userId()).orElse(null);
            String status = statusEntity != null ? statusEntity.getStatus() : "PENDING";
            
            return new StudentHomeworkResponse(
                    h.getHomeworkId(),
                    subName,
                    teacherName,
                    h.getTitle(),
                    h.getDescription(),
                    h.getDueDate(),
                    status,
                    statusEntity != null ? statusEntity.getNotes() : null,
                    null,
                    Collections.emptyList()
            );
        }).toList();
    }

    @Transactional
    public void submitAbsenceReason(PermissionActor actor, AbsenceReasonRequest request) {
        ensureStudentActor(actor, "submit absence reasons");
        AttendanceRecordEntity record = attendanceRecordRepository.findById(request.attendanceId())
                .orElseThrow(() -> new NotFoundException("Attendance record not found"));

        if (!record.getSchoolId().equals(actor.schoolId())) {
            throw new IllegalArgumentException("Attendance record does not belong to your school.");
        }
        if (!record.getUserId().equals(actor.userId())) {
            throw new com.sms.common.exception.ForbiddenException("You cannot provide evidence for another student's attendance.");
        }

        StudentAbsenceReasonEntity entity = studentAbsenceReasonRepository.findByAttendanceId(request.attendanceId())
                .orElseGet(() -> {
                    StudentAbsenceReasonEntity reason = new StudentAbsenceReasonEntity();
                    reason.setAbsenceReasonId(UUID.randomUUID());
                    reason.setSchoolId(actor.schoolId());
                    reason.setAttendanceId(request.attendanceId());
                    reason.setStudentUserId(actor.userId());
                    reason.setCreatedAt(Instant.now());
                    return reason;
                });
        entity.setCategory("OTHER");
        entity.setDescription(request.reason());
        entity.setReviewStatus("SUBMITTED");
        entity.setReviewedBy(null);
        entity.setReviewedAt(null);
        studentAbsenceReasonRepository.save(entity);
    }

    public List<StudentResultResponse> getResults(PermissionActor actor) {
        ensureStudentActor(actor, "view exam results");
        List<ExamResultRecordEntity> results = examResultRecordRepository.findBySchoolIdOrderByCreatedAtDesc(actor.schoolId()).stream()
                .filter(r -> r.getStudentUserId().equals(actor.userId()))
                .toList();

        Map<String, UUID> examIdsByKey = examRepository.findBySchoolIdOrderByCreatedAtDesc(actor.schoolId()).stream()
                .collect(Collectors.toMap(
                        exam -> exam.getExamName() + "::" + exam.getAcademicYear(),
                        ExamEntity::getExamId,
                        (existing, replacement) -> existing,
                        HashMap::new
                ));

        return results.stream().map(r -> {
            String subjectName = subjectRepository.findById(r.getSubjectId()).map(SubjectEntity::getSubjectName).orElse("Subject not mapped");
            UUID examId = examIdsByKey.get(r.getExamName() + "::" + r.getAcademicYear());
            return new StudentResultResponse(
                    examId,
                    r.getExamName(),
                    subjectName,
                    r.getMarksObtained(),
                    r.getMaxMarks(),
                    r.getGrade(),
                    r.getAcademicYear()
            );
        }).toList();
    }

    @Transactional
    public void updateHomeworkStatus(PermissionActor actor, UUID homeworkId, HomeworkStatusUpdateRequest request) {
        ensureStudentActor(actor, "update homework status");
        StudentHomeworkStatusEntity status = homeworkStatusRepository.findByHomeworkIdAndStudentUserId(homeworkId, actor.userId())
                .orElseGet(() -> {
                    StudentHomeworkStatusEntity entity = new StudentHomeworkStatusEntity();
                    entity.setStatusId(UUID.randomUUID());
                    entity.setSchoolId(actor.schoolId());
                    entity.setHomeworkId(homeworkId);
                    entity.setStudentUserId(actor.userId());
                    return entity;
                });

        status.setStatus(request.status());
        status.setNotes(request.notes());
        status.setUpdatedAt(Instant.now());
        homeworkStatusRepository.save(status);
    }

    public StudentAttendanceAnalyticsResponse getAttendanceAnalytics(PermissionActor actor) {
        ensureStudentActor(actor, "view attendance analytics");
        LocalDate today = LocalDate.now();
        LocalDate sixMonthsAgo = today.minusMonths(6);
        LocalDate lastThirtyDays = today.minusDays(30);

        List<AttendanceRecordEntity> records = attendanceRecordRepository.findBySchoolIdAndUserIdAndAttendanceDateBetweenOrderByAttendanceDateAscCreatedAtAsc(
                actor.schoolId(), actor.userId(), sixMonthsAgo, today);

        long total = records.size();
        long present = records.stream().filter(r -> "PRESENT".equalsIgnoreCase(r.getAttendanceStatus())).count();
        long absent = records.stream().filter(r -> "ABSENT".equalsIgnoreCase(r.getAttendanceStatus())).count();
        long late = records.stream().filter(r -> "LATE".equalsIgnoreCase(r.getAttendanceStatus())).count();
        long excused = records.stream().filter(r -> "EXCUSED".equalsIgnoreCase(r.getAttendanceStatus())).count();

        long presentLike = present + late + excused;
        double percentage = total == 0 ? 0 : (presentLike * 100.0d) / total;

        List<AttendanceRecordEntity> recentRecords = records.stream()
                .filter(record -> !record.getAttendanceDate().isBefore(lastThirtyDays))
                .toList();
        long recentPresentLike = recentRecords.stream()
                .filter(record -> {
                    String status = safeUpper(record.getAttendanceStatus());
                    return "PRESENT".equals(status) || "LATE".equals(status) || "EXCUSED".equals(status);
                })
                .count();
        double recentPercentage = recentRecords.isEmpty() ? 0 : (recentPresentLike * 100.0d) / recentRecords.size();

        Map<UUID, StudentAbsenceReasonEntity> reasonsByAttendanceId = studentAbsenceReasonRepository.findByStudentUserIdOrderByCreatedAtDesc(actor.userId()).stream()
                .filter(reason -> actor.schoolId().equals(reason.getSchoolId()))
                .collect(Collectors.toMap(StudentAbsenceReasonEntity::getAttendanceId, reason -> reason, (latest, ignored) -> latest));

        List<AttendanceRecordSummary> recentAbsences = records.stream()
                .filter(record -> {
                    String status = safeUpper(record.getAttendanceStatus());
                    return "ABSENT".equals(status) || "EXCUSED".equals(status) || "LATE".equals(status);
                })
                .sorted(Comparator.comparing(AttendanceRecordEntity::getAttendanceDate).reversed())
                .limit(6)
                .map(record -> {
                    StudentAbsenceReasonEntity reason = reasonsByAttendanceId.get(record.getAttendanceId());
                    return new AttendanceRecordSummary(
                            record.getAttendanceId(),
                            record.getAttendanceDate(),
                            record.getAttendanceStatus(),
                            reason != null ? reason.getReviewStatus() : "NOT_SUBMITTED",
                            reason != null ? reason.getDescription() : null
                    );
                })
                .toList();

        List<AttendanceInsight> insights = buildAttendanceInsights(percentage, recentPercentage, absent, late, recentAbsences);

        return new StudentAttendanceAnalyticsResponse(
                percentage,
                (int) total,
                (int) present,
                (int) absent,
                (int) late,
                (int) excused,
                insights,
                recentAbsences
        );
    }

    // --- Communication ---
    @Transactional
    public void sendVoiceMessage(PermissionActor actor, StudentCommunicationRequest request) {
        ensureStudentActor(actor, "send student communication");
        // Find recipient based on audience
        UUID recipientId = null;
        if ("CLASS_TEACHER".equalsIgnoreCase(request.audience())) {
            StudentClassEnrollmentEntity enrollment = enrollmentRepository.findBySchoolId(actor.schoolId()).stream()
                    .filter(e -> e.getStudentUserId().equals(actor.userId()))
                    .findFirst()
                    .orElseThrow(() -> new ForbiddenException("You are not enrolled in any class."));
            
            ClassTeacherMappingEntity ct = classTeacherMappingRepository.findBySchoolId(actor.schoolId()).stream()
                    .filter(m -> m.getClassId().equals(enrollment.getClassId()))
                    .findFirst()
                    .orElseThrow(() -> new IllegalArgumentException("No class teacher assigned."));
            recipientId = ct.getTeacherUserId();
        } else if ("PRINCIPAL".equalsIgnoreCase(request.audience())) {
            SchoolUserEntity principal = schoolUserRepository.findBySchoolIdOrderByRoleNameAscFullNameAsc(actor.schoolId()).stream()
                    .filter(u -> "PRINCIPAL".equalsIgnoreCase(u.getRoleName()))
                    .findFirst()
                    .orElseThrow(() -> new IllegalArgumentException("Principal not found."));
            recipientId = principal.getUserId();
        } else {
            throw new IllegalArgumentException("Invalid audience.");
        }

        VoiceNoteEntity note = new VoiceNoteEntity();
        note.setVoiceNoteId(UUID.randomUUID());
        note.setSchoolId(actor.schoolId());
        note.setRelatedUserId(actor.userId()); // the sender
        note.setAudience(recipientId.toString()); // the recipient
        note.setTitle(request.subject());
        note.setTranscript(request.message());
        note.setCreatedAt(Instant.now());
        voiceNoteRepository.save(note);
    }

    // --- Library & Forum ---
    @Transactional
    public LibraryReservationResponse reserveLibraryResource(PermissionActor actor, LibraryReservationRequest request) {
        ensureStudentActor(actor, "reserve library resources");
        // Enforce max 3 active reservations
        int activeCount = libraryReservationRepository.countBySchoolIdAndUserIdAndStatus(actor.schoolId(), actor.userId(), "ACTIVE");
        if (activeCount >= 3) {
            throw new ForbiddenException("You have reached the maximum number of active library reservations.");
        }

        LibraryResourceEntity resource = libraryResourceRepository.findById(request.resourceId())
                .filter(item -> actor.schoolId().equals(item.getSchoolId()))
                .orElseThrow(() -> new NotFoundException("Library resource not found."));

        LibraryReservationEntity reservation = new LibraryReservationEntity();
        reservation.setReservationId(UUID.randomUUID());
        reservation.setSchoolId(actor.schoolId());
        reservation.setResourceId(request.resourceId());
        reservation.setUserId(actor.userId());
        reservation.setStatus("ACTIVE");
        reservation.setReservedAt(Instant.now());
        reservation.setValidUntil(Instant.now().plus(java.time.Duration.ofDays(7)));
        libraryReservationRepository.save(reservation);

        return new LibraryReservationResponse(
                reservation.getReservationId(),
                reservation.getResourceId(),
                resource.getTitle(),
                reservation.getStatus(),
                reservation.getReservedAt(),
                reservation.getValidUntil()
        );
    }

    public StudentForumReputationResponse getForumReputation(PermissionActor actor) {
        ensureStudentActor(actor, "view forum reputation");
        List<ForumAnswerEntity> answers = forumAnswerRepository.findAll().stream()
                .filter(answer -> actor.userId().equals(answer.getAuthorId()))
                .toList();
        long answerCount = answers.size();
        long upvotes = answers.stream()
                .map(ForumAnswerEntity::getUpvotes)
                .filter(java.util.Objects::nonNull)
                .mapToLong(Integer::longValue)
                .sum();

        String badge = "NOVICE";
        int nextThreshold = 10;
        if (upvotes >= 50 || answerCount >= 25) {
            badge = "EXPERT";
            nextThreshold = 100;
        } else if (upvotes >= 15 || answerCount >= 10) {
            badge = "SCHOLAR";
            nextThreshold = 50;
        }

        return new StudentForumReputationResponse(
                (int) upvotes,
                (int) answerCount,
                badge,
                nextThreshold
        );
    }

    public List<StudentFeeRecordResponse> getFeeRecords(PermissionActor actor) {
        ensureStudentActor(actor, "view fee records");
        return feeRecordRepository.findBySchoolIdAndStudentUserIdOrderByDueDateDesc(actor.schoolId(), actor.userId()).stream()
                .map(record -> new StudentFeeRecordResponse(
                        record.getFeeRecordId(),
                        record.getStudentUserId(),
                        record.getFeeCategory(),
                        record.getAmountDue(),
                        record.getAmountPaid(),
                        record.getDueDate(),
                        record.getPaymentStatus(),
                        record.getCreatedAt()
                ))
                .toList();
    }

    private List<AttendanceInsight> buildAttendanceInsights(
            double overallPercentage,
            double recentPercentage,
            long absentCount,
            long lateCount,
            List<AttendanceRecordSummary> recentAbsences
    ) {
        AttendanceInsight momentum = new AttendanceInsight(
                "Attendance momentum",
                String.format("Your last 30 days are at %.1f%% attendance versus %.1f%% across the last 6 months.", recentPercentage, overallPercentage),
                recentPercentage > overallPercentage + 2 ? "UP" : recentPercentage + 2 < overallPercentage ? "DOWN" : "STABLE"
        );

        AttendanceInsight absences = new AttendanceInsight(
                "Absence follow-up",
                absentCount == 0
                        ? "No absences were recorded in the current review window."
                        : recentAbsences.stream().anyMatch(item -> "NOT_SUBMITTED".equalsIgnoreCase(item.reasonStatus()))
                        ? "You still have absences without a submitted reason. Add the reason from the cards below."
                        : "All recent absences already have supporting notes submitted for review.",
                absentCount == 0 ? "STABLE" : "DOWN"
        );

        AttendanceInsight punctuality = new AttendanceInsight(
                "Punctuality",
                lateCount == 0
                        ? "Great job staying on time for your classes."
                        : "Late arrivals are being tracked. Aim to reduce them to protect your overall attendance trend.",
                lateCount == 0 ? "UP" : "DOWN"
        );

        return List.of(momentum, absences, punctuality);
    }

    private int weekdayOrder(String dayOfWeek) {
        return switch (safeUpper(dayOfWeek)) {
            case "MONDAY" -> 1;
            case "TUESDAY" -> 2;
            case "WEDNESDAY" -> 3;
            case "THURSDAY" -> 4;
            case "FRIDAY" -> 5;
            case "SATURDAY" -> 6;
            case "SUNDAY" -> 7;
            default -> 99;
        };
    }

    private String safeUpper(String value) {
        return value == null ? "" : value.trim().toUpperCase(java.util.Locale.ROOT);
    }

    private void ensureStudentActor(PermissionActor actor, String action) {
        if (!actor.isStudent()) {
            throw new ForbiddenException("Only students can " + action + ".");
        }
    }
}
