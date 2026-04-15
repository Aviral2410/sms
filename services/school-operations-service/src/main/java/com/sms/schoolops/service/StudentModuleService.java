package com.sms.schoolops.service;

import com.sms.common.exception.ForbiddenException;
import com.sms.schoolops.api.StudentModuleDtos.*;
import com.sms.schoolops.domain.*;
import com.sms.schoolops.repository.*;
import com.sms.schoolops.security.PermissionActor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.Collections;
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
    private final ForumAnswerRepository forumAnswerRepository;

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
            ForumAnswerRepository forumAnswerRepository
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
        this.forumAnswerRepository = forumAnswerRepository;
    }

    public StudentProfileResponse getProfile(PermissionActor actor) {
        if (!actor.isStudent()) {
            throw new ForbiddenException("Only students can access their student profile.");
        }

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
                classroom != null ? classroom.getClassName() : "N/A",
                classroom != null ? classroom.getSectionName() : "N/A",
                admission.getAdmissionStatus() != null ? admission.getAdmissionStatus().name() : "ACTIVE"
        );
    }

    @Transactional
    public StudentProfileResponse updateProfile(PermissionActor actor, StudentProfileUpdateRequest request) {
        if (!actor.isStudent()) {
            throw new ForbiddenException("Only students can update their student profile.");
        }

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
        StudentClassEnrollmentEntity enrollment = enrollmentRepository.findBySchoolId(actor.schoolId()).stream()
                .filter(e -> e.getStudentUserId().equals(actor.userId()))
                .findFirst()
                .orElseThrow(() -> new ForbiddenException("You are not enrolled in any class."));

        AcademicClassEntity classroom = academicClassRepository.findById(enrollment.getClassId())
                .orElseThrow(() -> new IllegalArgumentException("Classroom not found."));

        String classTeacherName = classTeacherMappingRepository.findBySchoolId(actor.schoolId()).stream()
                .filter(m -> m.getClassId().equals(classroom.getClassId()))
                .findFirst()
                .map(m -> schoolUserRepository.findById(m.getTeacherUserId()).map(SchoolUserEntity::getFullName).orElse("Unknown"))
                .orElse("Not Assigned");

        List<SubjectTeacherResponse> subjects = subjectTeacherMappingRepository.findBySchoolId(actor.schoolId()).stream()
                .filter(m -> m.getClassId().equals(classroom.getClassId()))
                .map(m -> {
                    String subName = subjectRepository.findById(m.getSubjectId()).map(SubjectEntity::getSubjectName).orElse("Unknown");
                    SchoolUserEntity teacher = schoolUserRepository.findById(m.getTeacherUserId()).orElse(null);
                    return new SubjectTeacherResponse(
                            m.getSubjectId(),
                            subName,
                            teacher != null ? teacher.getFullName() : "Unknown",
                            teacher != null ? teacher.getEmail() : ""
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
                            sUser != null ? sUser.getFullName() : "Unknown",
                            sAdm != null ? sAdm.getRollNo() : "",
                            sUser != null ? sUser.getProfilePhotoUrl() : ""
                    );
                })
                .toList();
        
        return new ClassroomDetailResponse(
                classroom.getClassId(),
                classroom.getClassName(),
                classroom.getSectionName(),
                classTeacherName,
                subjects,
                classmates
        );
    }

    public StudentTimetableResponse getTimetable(PermissionActor actor) {
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
                                String subName = subjectRepository.findById(s.getSubjectId()).map(SubjectEntity::getSubjectName).orElse("Unknown");
                                String tName = schoolUserRepository.findById(s.getTeacherUserId()).map(SchoolUserEntity::getFullName).orElse("Unknown");
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
                .toList();

        return new StudentTimetableResponse(dailySchedules);
    }

    public List<StudentHomeworkResponse> getHomework(PermissionActor actor) {
        StudentClassEnrollmentEntity enrollment = enrollmentRepository.findBySchoolId(actor.schoolId()).stream()
                .filter(e -> e.getStudentUserId().equals(actor.userId()))
                .findFirst()
                .orElseThrow(() -> new ForbiddenException("You are not enrolled in any class."));

        List<HomeworkItemEntity> items = homeworkItemRepository.findBySchoolIdAndClassIdOrderByDueDateDesc(actor.schoolId(), enrollment.getClassId());

        return items.stream().map(h -> {
            String subName = h.getSubjectId() != null ? subjectRepository.findById(h.getSubjectId()).map(SubjectEntity::getSubjectName).orElse("Unknown") : "General";
            String status = homeworkStatusRepository.findByHomeworkIdAndStudentUserId(h.getHomeworkId(), actor.userId())
                    .map(StudentHomeworkStatusEntity::getStatus)
                    .orElse("PENDING");
            
            return new StudentHomeworkResponse(
                    h.getHomeworkId(),
                    subName,
                    h.getTitle(),
                    h.getDescription(),
                    h.getDueDate(),
                    status,
                    "Not Available", // No teacher remarks on individual student status yet
                    Collections.emptyList()
            );
        }).toList();
    }

    @Transactional
    public void submitAbsenceReason(PermissionActor actor, AbsenceReasonRequest request) {
        AttendanceRecordEntity record = attendanceRecordRepository.findById(request.attendanceId())
                .orElseThrow(() -> new com.sms.common.exception.NotFoundException("Attendance record not found"));

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
        List<ExamResultRecordEntity> results = examResultRecordRepository.findBySchoolIdOrderByCreatedAtDesc(actor.schoolId()).stream()
                .filter(r -> r.getStudentUserId().equals(actor.userId()))
                .toList();

        return results.stream().map(r -> {
            String subjectName = subjectRepository.findById(r.getSubjectId()).map(SubjectEntity::getSubjectName).orElse("Unknown");
            return new StudentResultResponse(
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
        List<AttendanceRecordEntity> records = attendanceRecordRepository.findBySchoolIdAndUserIdAndAttendanceDateBetweenOrderByAttendanceDateAscCreatedAtAsc(
                actor.schoolId(), actor.userId(), java.time.LocalDate.now().minusMonths(6), java.time.LocalDate.now());

        long total = records.size();
        long present = records.stream().filter(r -> "PRESENT".equalsIgnoreCase(r.getAttendanceStatus())).count();
        long absent = records.stream().filter(r -> "ABSENT".equalsIgnoreCase(r.getAttendanceStatus())).count();
        long late = records.stream().filter(r -> "LATE".equalsIgnoreCase(r.getAttendanceStatus())).count();
        long excused = records.stream().filter(r -> "EXCUSED".equalsIgnoreCase(r.getAttendanceStatus())).count();

        double percentage = total == 0 ? 0 : (double) present / total * 100;

        return new StudentAttendanceAnalyticsResponse(
                percentage,
                (int) total,
                (int) present,
                (int) absent,
                (int) late,
                (int) excused,
                List.of(new AttendanceInsight("Consistency", "You have been consistent this month.", "STABLE"))
        );
    }

    // --- Communication ---
    @Transactional
    public void sendVoiceMessage(PermissionActor actor, StudentCommunicationRequest request) {
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
        // Enforce max 3 active reservations
        int activeCount = libraryReservationRepository.countBySchoolIdAndUserIdAndStatus(actor.schoolId(), actor.userId(), "ACTIVE");
        if (activeCount >= 3) {
            throw new ForbiddenException("You have reached the maximum number of active library reservations.");
        }

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
                "Resource Title", // Need a lookup to LibraryResourceEntity in real code
                reservation.getStatus(),
                reservation.getReservedAt(),
                reservation.getValidUntil()
        );
    }

    public StudentForumReputationResponse getForumReputation(PermissionActor actor) {
        // In real code, fetch ForumAnswerEntity by authorId
        long answerCount = forumAnswerRepository.countByAuthorId(actor.userId());
        long upvotes = 0; // Requires sum query or mapping

        String badge = "NOVICE";
        if (answerCount > 10) badge = "SCHOLAR";
        if (answerCount > 50) badge = "EXPERT";

        return new StudentForumReputationResponse(
                (int) upvotes,
                (int) answerCount,
                badge,
                50 // example next threshold
        );
    }
}
