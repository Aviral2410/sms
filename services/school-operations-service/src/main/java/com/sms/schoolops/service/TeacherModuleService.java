package com.sms.schoolops.service;

import com.sms.common.exception.ForbiddenException;
import com.sms.schoolops.api.TeacherModuleDtos.*;
import com.sms.schoolops.domain.AcademicClassEntity;
import com.sms.schoolops.domain.ExamMarkEntity;
import com.sms.schoolops.domain.ForumAnswerEntity;
import com.sms.schoolops.domain.HomeworkItemEntity;
import com.sms.schoolops.domain.SchoolUserEntity;
import com.sms.schoolops.domain.StudentMonitoringReportEntity;
import com.sms.schoolops.domain.SubjectEntity;
import com.sms.schoolops.domain.TeacherMonthlyReportEntity;
import com.sms.schoolops.domain.TimetableSlotEntity;
import com.sms.schoolops.domain.VoiceNoteEntity;
import com.sms.schoolops.repository.AcademicClassRepository;
import com.sms.schoolops.repository.AttendanceRecordRepository;
import com.sms.schoolops.repository.ClassSubjectTeacherMappingRepository;
import com.sms.schoolops.repository.ExamMarkRepository;
import com.sms.schoolops.repository.ExamRepository;
import com.sms.schoolops.repository.ForumAnswerRepository;
import com.sms.schoolops.repository.HomeworkItemRepository;
import com.sms.schoolops.repository.SchoolUserRepository;
import com.sms.schoolops.repository.StudentHomeworkStatusRepository;
import com.sms.schoolops.repository.StudentMonitoringReportRepository;
import com.sms.schoolops.repository.SubjectRepository;
import com.sms.schoolops.repository.TeacherClassMappingRepository;
import com.sms.schoolops.repository.TeacherMonthlyReportRepository;
import com.sms.schoolops.repository.TeacherSubjectMappingRepository;
import com.sms.schoolops.repository.TimetableSlotRepository;
import com.sms.schoolops.repository.VoiceNoteRepository;
import com.sms.schoolops.security.PermissionActor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Instant;
import java.time.LocalDate;
import java.util.List;
import java.util.Locale;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
public class TeacherModuleService {

    private final SchoolUserRepository schoolUserRepository;
    private final TeacherClassMappingRepository teacherClassMappingRepository;
    private final TeacherSubjectMappingRepository teacherSubjectMappingRepository;
    private final ClassSubjectTeacherMappingRepository classSubjectTeacherMappingRepository;
    private final HomeworkItemRepository homeworkItemRepository;
    private final StudentHomeworkStatusRepository homeworkStatusRepository;
    private final ExamMarkRepository examMarkRepository;
    private final ExamRepository examRepository;
    private final AcademicClassRepository academicClassRepository;
    private final SubjectRepository subjectRepository;
    private final StudentMonitoringReportRepository behaviourRepository;
    private final TimetableSlotRepository timetableSlotRepository;
    private final VoiceNoteRepository voiceNoteRepository;
    private final ForumAnswerRepository forumAnswerRepository;
    private final TeacherMonthlyReportRepository teacherMonthlyReportRepository;
    private final AttendanceRecordRepository attendanceRecordRepository;

    public TeacherModuleService(
            SchoolUserRepository schoolUserRepository,
            TeacherClassMappingRepository teacherClassMappingRepository,
            TeacherSubjectMappingRepository teacherSubjectMappingRepository,
            ClassSubjectTeacherMappingRepository classSubjectTeacherMappingRepository,
            HomeworkItemRepository homeworkItemRepository,
            StudentHomeworkStatusRepository homeworkStatusRepository,
            ExamMarkRepository examMarkRepository,
            ExamRepository examRepository,
            AcademicClassRepository academicClassRepository,
            SubjectRepository subjectRepository,
            StudentMonitoringReportRepository behaviourRepository,
            TimetableSlotRepository timetableSlotRepository,
            VoiceNoteRepository voiceNoteRepository,
            ForumAnswerRepository forumAnswerRepository,
            TeacherMonthlyReportRepository teacherMonthlyReportRepository,
            AttendanceRecordRepository attendanceRecordRepository
    ) {
        this.schoolUserRepository = schoolUserRepository;
        this.teacherClassMappingRepository = teacherClassMappingRepository;
        this.teacherSubjectMappingRepository = teacherSubjectMappingRepository;
        this.classSubjectTeacherMappingRepository = classSubjectTeacherMappingRepository;
        this.homeworkItemRepository = homeworkItemRepository;
        this.homeworkStatusRepository = homeworkStatusRepository;
        this.examMarkRepository = examMarkRepository;
        this.examRepository = examRepository;
        this.academicClassRepository = academicClassRepository;
        this.subjectRepository = subjectRepository;
        this.behaviourRepository = behaviourRepository;
        this.timetableSlotRepository = timetableSlotRepository;
        this.voiceNoteRepository = voiceNoteRepository;
        this.forumAnswerRepository = forumAnswerRepository;
        this.teacherMonthlyReportRepository = teacherMonthlyReportRepository;
        this.attendanceRecordRepository = attendanceRecordRepository;
    }

    @Transactional
    public TeacherHomeworkResponse createHomework(PermissionActor actor, TeacherHomeworkRequest request) {
        requireTeacherAssignment(actor, request.classId(), request.subjectId());

        HomeworkItemEntity homework = new HomeworkItemEntity();
        homework.setHomeworkId(UUID.randomUUID());
        homework.setSchoolId(actor.schoolId());
        homework.setClassId(request.classId());
        homework.setSubjectId(request.subjectId());
        homework.setTeacherUserId(actor.userId());
        homework.setTitle(request.title());
        homework.setDescription(request.description());
        homework.setDueDate(request.dueDate());
        homework.setCreatedAt(Instant.now());

        homeworkItemRepository.save(homework);
        return toHomeworkResponse(homework);
    }

    @Transactional
    public void enterMarks(PermissionActor actor, MarksEntryRequest request) {
        boolean assigned = teacherSubjectMappingRepository.findBySchoolIdAndTeacherUserId(actor.schoolId(), actor.userId()).stream()
                .anyMatch(m -> m.getSubjectId().equals(request.subjectId()));

        if (!assigned && !actor.isSchoolAdmin()) {
            throw new ForbiddenException("You are not assigned to this subject.");
        }

        for (StudentMarkEntry entry : request.marks()) {
            ExamMarkEntity mark = examMarkRepository.findBySchoolIdAndExamIdAndStudentUserIdAndSubjectId(
                            actor.schoolId(), request.examId(), entry.studentUserId(), request.subjectId())
                    .orElseGet(() -> {
                        ExamMarkEntity m = new ExamMarkEntity();
                        m.setMarkId(UUID.randomUUID());
                        m.setSchoolId(actor.schoolId());
                        m.setExamId(request.examId());
                        m.setStudentUserId(entry.studentUserId());
                        m.setSubjectId(request.subjectId());
                        return m;
                    });

            if (entry.marksObtained() != null) {
                mark.setMarksObtained(java.math.BigDecimal.valueOf(entry.marksObtained()));
            }
            mark.setUpdatedAt(Instant.now());
            examMarkRepository.save(mark);
        }
    }

    @Transactional
    public void logBehaviourRemark(PermissionActor actor, BehaviourRemarkRequest request) {
        StudentMonitoringReportEntity report = new StudentMonitoringReportEntity();
        report.setReportId(UUID.randomUUID());
        report.setSchoolId(actor.schoolId());
        report.setStudentUserId(request.studentUserId());
        report.setReportMonth(LocalDate.now().getMonth().name());
        report.setAcademicYear(deriveAcademicYear(LocalDate.now()));
        report.setBehaviourNote(request.category() + ": " + request.remark());
        report.setCreatedAt(Instant.now());
        behaviourRepository.save(report);
    }

    public TeacherWorkspaceSummary getWorkspaceSummary(PermissionActor actor) {
        String dayOfWeek = LocalDate.now().getDayOfWeek().name();
        List<TimetableSlotEntity> todaySlots = timetableSlotRepository.findBySchoolIdAndTeacherUserId(actor.schoolId(), actor.userId()).stream()
                .filter(slot -> slot.getDayOfWeek().equalsIgnoreCase(dayOfWeek))
                .toList();

        List<UpcomingPeriod> upcoming = todaySlots.stream().map(slot -> {
            String className = academicClassRepository.findById(slot.getClassId()).map(AcademicClassEntity::getClassName).orElse("Unknown");
            String subjectName = subjectRepository.findById(slot.getSubjectId()).map(SubjectEntity::getSubjectName).orElse("Unknown");
            return new UpcomingPeriod(slot.getStartTime(), className, subjectName, slot.getRoomName());
        }).toList();

        Set<UUID> teacherHomeworkIds = homeworkItemRepository.findBySchoolIdOrderByDueDateDescCreatedAtDesc(actor.schoolId()).stream()
                .filter(homework -> actor.userId().equals(homework.getTeacherUserId()))
                .map(HomeworkItemEntity::getHomeworkId)
                .collect(Collectors.toSet());

        long pendingReviews = teacherHomeworkIds.isEmpty()
                ? 0L
                : homeworkStatusRepository.findAll().stream()
                .filter(status -> actor.schoolId().equals(status.getSchoolId()))
                .filter(status -> teacherHomeworkIds.contains(status.getHomeworkId()))
                .filter(status -> "COMPLETED".equalsIgnoreCase(status.getStatus()))
                .count();

        return new TeacherWorkspaceSummary(
                todaySlots.size(),
                (int) pendingReviews,
                upcoming
        );
    }

    private void requireTeacherAssignment(PermissionActor actor, UUID classId, UUID subjectId) {
        if (actor.isSchoolAdmin()) {
            return;
        }

        boolean specificMatch = classSubjectTeacherMappingRepository.findBySchoolId(actor.schoolId()).stream()
                .anyMatch(m -> m.getClassId().equals(classId)
                        && m.getSubjectId().equals(subjectId)
                        && m.getTeacherUserId().equals(actor.userId()));

        if (!specificMatch) {
            throw new ForbiddenException("You are not assigned to this class and subject.");
        }
    }

    private TeacherHomeworkResponse toHomeworkResponse(HomeworkItemEntity h) {
        String className = academicClassRepository.findById(h.getClassId()).map(AcademicClassEntity::getClassName).orElse("Unknown");
        String subjectName = subjectRepository.findById(h.getSubjectId()).map(SubjectEntity::getSubjectName).orElse("Unknown");

        int submissionCount = (int) homeworkStatusRepository.findAll().stream()
                .filter(status -> h.getSchoolId().equals(status.getSchoolId()))
                .filter(status -> h.getHomeworkId().equals(status.getHomeworkId()))
                .filter(status -> "COMPLETED".equalsIgnoreCase(status.getStatus()))
                .count();

        return new TeacherHomeworkResponse(
                h.getHomeworkId(),
                className,
                subjectName,
                h.getTitle(),
                h.getDescription(),
                h.getDueDate(),
                submissionCount
        );
    }

    @Transactional
    public void sendCommunication(PermissionActor actor, TeacherCommunicationRequest request) {
        VoiceNoteEntity note = new VoiceNoteEntity();
        note.setVoiceNoteId(UUID.randomUUID());
        note.setSchoolId(actor.schoolId());
        note.setRelatedUserId(actor.userId());
        note.setAudience(request.studentUserId().toString());
        note.setTitle(request.subject());
        note.setTranscript(request.message());
        note.setCreatedAt(Instant.now());
        voiceNoteRepository.save(note);
    }

    @Transactional
    public void approveForumAnswer(PermissionActor actor, ForumAnswerApprovalRequest request) {
        ForumAnswerEntity answer = forumAnswerRepository.findById(request.answerId())
                .orElseThrow(() -> new com.sms.common.exception.NotFoundException("Answer not found"));

        answer.setIsCorrect(request.isCorrect());
        forumAnswerRepository.save(answer);
    }

    public TeacherBiometricComplianceResponse getTeacherBiometricCompliance(PermissionActor actor) {
        LocalDate today = LocalDate.now();
        String currentMonth = today.getMonth().name();

        TeacherMonthlyReportEntity report = teacherMonthlyReportRepository.findBySchoolIdOrderByCreatedAtDesc(actor.schoolId()).stream()
                .filter(r -> r.getTeacherUserId().equals(actor.userId()) && r.getReportMonth().equalsIgnoreCase(currentMonth))
                .findFirst()
                .orElse(null);

        if (report != null) {
            return new TeacherBiometricComplianceResponse(
                    report.getReportMonth(),
                    report.getAcademicYear(),
                    report.getAttendancePercentage(),
                    report.getBiometricCompliance(),
                    report.getPrincipalNote()
            );
        }

        List<com.sms.schoolops.domain.AttendanceRecordEntity> monthlyRecords = attendanceRecordRepository
                .findBySchoolIdAndTeacherUserIdOrderByAttendanceDateDescCreatedAtDesc(actor.schoolId(), actor.userId())
                .stream()
                .filter(record -> record.getAttendanceDate() != null)
                .filter(record -> record.getAttendanceDate().getYear() == today.getYear())
                .filter(record -> record.getAttendanceDate().getMonth() == today.getMonth())
                .toList();

        long total = monthlyRecords.size();
        long presentLike = monthlyRecords.stream()
                .filter(record -> {
                    String status = record.getAttendanceStatus();
                    if (status == null) {
                        return false;
                    }
                    String normalized = status.trim().toUpperCase(Locale.ROOT);
                    return "PRESENT".equals(normalized) || "LATE".equals(normalized) || "EXCUSED".equals(normalized);
                })
                .count();

        BigDecimal attendancePercentage = total == 0L
                ? BigDecimal.ZERO
                : BigDecimal.valueOf(presentLike)
                .multiply(BigDecimal.valueOf(100))
                .divide(BigDecimal.valueOf(total), 1, RoundingMode.HALF_UP);

        String compliance = attendancePercentage.compareTo(BigDecimal.valueOf(90)) >= 0
                ? "COMPLIANT"
                : "NON_COMPLIANT";

        String note = total == 0L
                ? "No attendance records available for the current month yet."
                : "Auto-computed from attendance records until monthly report is finalized.";

        return new TeacherBiometricComplianceResponse(
                currentMonth,
                deriveAcademicYear(today),
                attendancePercentage,
                compliance,
                note
        );
    }

    private String deriveAcademicYear(LocalDate date) {
        int year = date.getYear();
        int startYear = date.getMonthValue() >= 4 ? year : year - 1;
        int endYear = startYear + 1;
        return startYear + "-" + String.format(Locale.ROOT, "%02d", endYear % 100);
    }
}
