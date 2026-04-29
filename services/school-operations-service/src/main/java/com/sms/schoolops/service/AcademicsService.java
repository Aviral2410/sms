package com.sms.schoolops.service;

import com.sms.schoolops.api.SchoolOperationsDtos.*;
import com.sms.schoolops.domain.ExamEntity;
import com.sms.schoolops.domain.ExamMarkEntity;
import com.sms.schoolops.domain.ExamScheduleItemEntity;
import com.sms.schoolops.domain.GradingBandEntity;
import com.sms.schoolops.domain.GradingSchemeEntity;
import com.sms.schoolops.domain.SubjectEntity;
import com.sms.schoolops.repository.ExamMarkRepository;
import com.sms.schoolops.repository.ExamRepository;
import com.sms.schoolops.repository.ExamScheduleItemRepository;
import com.sms.schoolops.repository.GradingBandRepository;
import com.sms.schoolops.repository.GradingSchemeRepository;
import com.sms.schoolops.repository.SubjectRepository;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Instant;
import java.util.Comparator;
import java.util.List;
import java.util.Locale;
import java.util.Optional;
import java.util.UUID;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class AcademicsService {

    private static final Logger logger = LoggerFactory.getLogger(AcademicsService.class);

    private final ExamRepository examRepository;
    private final ExamScheduleItemRepository examScheduleItemRepository;
    private final ExamMarkRepository examMarkRepository;
    private final GradingSchemeRepository gradingSchemeRepository;
    private final GradingBandRepository gradingBandRepository;
    private final SubjectRepository subjectRepository;

    public AcademicsService(
            ExamRepository examRepository,
            ExamScheduleItemRepository examScheduleItemRepository,
            ExamMarkRepository examMarkRepository,
            GradingSchemeRepository gradingSchemeRepository,
            GradingBandRepository gradingBandRepository,
            SubjectRepository subjectRepository
    ) {
        this.examRepository = examRepository;
        this.examScheduleItemRepository = examScheduleItemRepository;
        this.examMarkRepository = examMarkRepository;
        this.gradingSchemeRepository = gradingSchemeRepository;
        this.gradingBandRepository = gradingBandRepository;
        this.subjectRepository = subjectRepository;
    }

    public List<ExamResponse> listExams(UUID schoolId) {
        return examRepository.findBySchoolIdOrderByCreatedAtDesc(schoolId).stream()
                .map(this::toExamResponse)
                .toList();
    }

    @Transactional
    public ExamResponse createExam(ExamCreateRequest request, UUID createdByUserId) {
        ExamEntity entity = new ExamEntity();
        entity.setExamId(UUID.randomUUID());
        entity.setSchoolId(request.schoolId());
        entity.setExamName(safeTrim(request.examName()));
        entity.setAcademicYear(safeTrim(request.academicYear()));
        entity.setTerm(safeTrimNullable(request.term()));
        entity.setStartDate(request.startDate());
        entity.setEndDate(request.endDate());
        entity.setStatus("DRAFT");
        entity.setCreatedByUserId(createdByUserId);
        entity.setCreatedAt(Instant.now());
        entity.setPublishedAt(null);
        examRepository.save(entity);
        return toExamResponse(entity);
    }

    @Transactional
    public ExamResponse publishExam(UUID schoolId, UUID examId) {
        ExamEntity exam = examRepository.findById(examId)
                .orElseThrow(() -> new IllegalArgumentException("Exam not found."));
        if (!schoolId.equals(exam.getSchoolId())) {
            throw new IllegalArgumentException("Exam does not belong to this school.");
        }

        exam.setStatus("PUBLISHED");
        exam.setPublishedAt(Instant.now());
        examRepository.save(exam);
        return toExamResponse(exam);
    }

    public List<ExamScheduleItemResponse> listSchedule(UUID schoolId, UUID examId) {
        return examScheduleItemRepository.findBySchoolIdAndExamIdOrderByExamDateAscStartTimeAsc(schoolId, examId).stream()
                .map(this::toScheduleResponse)
                .toList();
    }

    @Transactional
    public ExamScheduleItemResponse addScheduleItem(UUID examId, ExamScheduleItemCreateRequest request) {
        ExamEntity exam = examRepository.findById(examId)
                .orElseThrow(() -> new IllegalArgumentException("Exam not found."));
        if (!request.schoolId().equals(exam.getSchoolId())) {
            throw new IllegalArgumentException("Exam does not belong to this school.");
        }

        ExamScheduleItemEntity entity = new ExamScheduleItemEntity();
        entity.setScheduleItemId(UUID.randomUUID());
        entity.setSchoolId(request.schoolId());
        entity.setExamId(examId);
        entity.setClassId(request.classId());
        entity.setSubjectId(request.subjectId());
        entity.setExamDate(request.examDate());
        entity.setStartTime(safeTrimNullable(request.startTime()));
        entity.setEndTime(safeTrimNullable(request.endTime()));
        entity.setRoomName(safeTrimNullable(request.roomName()));
        entity.setMaxMarks(request.maxMarks());
        entity.setPassMarks(request.passMarks());
        entity.setCreatedAt(Instant.now());
        examScheduleItemRepository.save(entity);

        if ("DRAFT".equalsIgnoreCase(exam.getStatus())) {
            exam.setStatus("SCHEDULED");
            examRepository.save(exam);
        }

        return toScheduleResponse(entity);
    }

    @Transactional
    public ExamMarkResponse upsertMark(UUID examId, ExamMarkUpsertRequest request, UUID enteredByUserId) {
        ExamEntity exam = examRepository.findById(examId)
                .orElseThrow(() -> new IllegalArgumentException("Exam not found."));
        if (!request.schoolId().equals(exam.getSchoolId())) {
            throw new IllegalArgumentException("Exam does not belong to this school.");
        }

        Optional<ExamMarkEntity> existingOpt = examMarkRepository.findBySchoolIdAndExamIdAndStudentUserIdAndSubjectId(
                request.schoolId(), examId, request.studentUserId(), request.subjectId());

        ExamMarkEntity entity = existingOpt.orElseGet(ExamMarkEntity::new);
        boolean isNew = entity.getMarkId() == null;

        if (isNew) {
            entity.setMarkId(UUID.randomUUID());
            entity.setSchoolId(request.schoolId());
            entity.setExamId(examId);
            entity.setStudentUserId(request.studentUserId());
            entity.setSubjectId(request.subjectId());
            entity.setCreatedAt(Instant.now());
        }

        entity.setScheduleItemId(request.scheduleItemId());
        entity.setMarksObtained(request.marksObtained());
        entity.setMaxMarks(request.maxMarks());
        entity.setEnteredByUserId(enteredByUserId);
        entity.setUpdatedAt(isNew ? null : Instant.now());

        String grade = safeTrimNullable(request.grade());
        if (grade == null || grade.isBlank()) {
            grade = computeGrade(request.schoolId(), request.marksObtained(), request.maxMarks());
        }
        entity.setGrade(grade);

        examMarkRepository.save(entity);
        return toMarkResponse(entity);
    }

    public StudentReportCardResponse getStudentReportCard(UUID schoolId, UUID examId, UUID studentUserId) {
        ExamEntity exam = examRepository.findById(examId)
                .orElseThrow(() -> new IllegalArgumentException("Exam not found."));
        if (!schoolId.equals(exam.getSchoolId())) {
            throw new IllegalArgumentException("Exam does not belong to this school.");
        }

        List<ExamMarkEntity> marks = examMarkRepository
                .findBySchoolIdAndExamIdAndStudentUserIdOrderBySubjectIdAsc(schoolId, examId, studentUserId);

        BigDecimal totalObtained = marks.stream()
                .map(ExamMarkEntity::getMarksObtained)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        BigDecimal totalMax = marks.stream()
                .map(ExamMarkEntity::getMaxMarks)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        BigDecimal overallPct = BigDecimal.ZERO;
        if (totalMax.compareTo(BigDecimal.ZERO) > 0) {
            overallPct = totalObtained.multiply(BigDecimal.valueOf(100))
                    .divide(totalMax, 2, RoundingMode.HALF_UP);
        }

        String overallGrade = computeGrade(schoolId, totalObtained, totalMax);

        List<ReportCardEntry> entries = marks.stream()
                .map(m -> new ReportCardEntry(
                        m.getSubjectId(),
                        subjectRepository.findById(m.getSubjectId()).map(SubjectEntity::getSubjectName).orElse("Unknown Subject"),
                        m.getMarksObtained(),
                        m.getMaxMarks(),
                        computePct(m.getMarksObtained(), m.getMaxMarks()),
                        m.getGrade()
                ))
                .toList();

        return new StudentReportCardResponse(
                examId,
                schoolId,
                studentUserId,
                exam.getExamName(),
                exam.getAcademicYear(),
                exam.getTerm(),
                totalObtained,
                totalMax,
                overallPct,
                overallGrade,
                entries
        );
    }

    private String computeGrade(UUID schoolId, BigDecimal obtained, BigDecimal max) {
        BigDecimal pct = computePct(obtained, max);

        try {
            Optional<GradingSchemeEntity> schemeOpt = gradingSchemeRepository.findBySchoolIdAndIsDefaultTrue(schoolId);
            if (schemeOpt.isPresent()) {
                List<GradingBandEntity> bands = gradingBandRepository
                        .findBySchoolIdAndSchemeIdOrderBySortOrderAsc(schoolId, schemeOpt.get().getSchemeId());
                for (GradingBandEntity band : bands) {
                    if (pct.compareTo(band.getMinPercentage()) >= 0 && pct.compareTo(band.getMaxPercentage()) <= 0) {
                        return band.getGrade();
                    }
                }
            }
        } catch (Exception ex) {
            logger.warn("Failed to compute grade via grading scheme. schoolId={} pct={}", schoolId, pct, ex);
        }

        // Default fallback mapping.
        if (pct.compareTo(BigDecimal.valueOf(90)) >= 0) return "A+";
        if (pct.compareTo(BigDecimal.valueOf(80)) >= 0) return "A";
        if (pct.compareTo(BigDecimal.valueOf(70)) >= 0) return "B";
        if (pct.compareTo(BigDecimal.valueOf(60)) >= 0) return "C";
        if (pct.compareTo(BigDecimal.valueOf(50)) >= 0) return "D";
        return "F";
    }

    private static BigDecimal computePct(BigDecimal obtained, BigDecimal max) {
        if (obtained == null || max == null || max.compareTo(BigDecimal.ZERO) <= 0) {
            return BigDecimal.ZERO;
        }
        return obtained.multiply(BigDecimal.valueOf(100)).divide(max, 2, RoundingMode.HALF_UP);
    }

    private ExamResponse toExamResponse(ExamEntity entity) {
        return new ExamResponse(
                entity.getExamId(),
                entity.getSchoolId(),
                entity.getExamName(),
                entity.getAcademicYear(),
                entity.getTerm(),
                entity.getStartDate(),
                entity.getEndDate(),
                entity.getStatus(),
                entity.getCreatedAt(),
                entity.getPublishedAt()
        );
    }

    private ExamScheduleItemResponse toScheduleResponse(ExamScheduleItemEntity entity) {
        return new ExamScheduleItemResponse(
                entity.getScheduleItemId(),
                entity.getSchoolId(),
                entity.getExamId(),
                entity.getClassId(),
                entity.getSubjectId(),
                entity.getExamDate(),
                entity.getStartTime(),
                entity.getEndTime(),
                entity.getRoomName(),
                entity.getMaxMarks(),
                entity.getPassMarks(),
                entity.getCreatedAt()
        );
    }

    private ExamMarkResponse toMarkResponse(ExamMarkEntity entity) {
        return new ExamMarkResponse(
                entity.getMarkId(),
                entity.getSchoolId(),
                entity.getExamId(),
                entity.getScheduleItemId(),
                entity.getStudentUserId(),
                entity.getSubjectId(),
                entity.getMarksObtained(),
                entity.getMaxMarks(),
                entity.getGrade(),
                entity.getCreatedAt(),
                entity.getUpdatedAt()
        );
    }

    private static String safeTrim(String value) {
        String trimmed = value == null ? "" : value.trim();
        if (trimmed.isBlank()) {
            throw new IllegalArgumentException("Value cannot be blank.");
        }
        return trimmed;
    }

    private static String safeTrimNullable(String value) {
        if (value == null) return null;
        String trimmed = value.trim();
        return trimmed.isBlank() ? null : trimmed;
    }
}
