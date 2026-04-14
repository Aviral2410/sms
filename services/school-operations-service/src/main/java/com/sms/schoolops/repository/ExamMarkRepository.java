package com.sms.schoolops.repository;

import com.sms.schoolops.domain.ExamMarkEntity;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ExamMarkRepository extends JpaRepository<ExamMarkEntity, UUID> {
    Optional<ExamMarkEntity> findBySchoolIdAndExamIdAndStudentUserIdAndSubjectId(UUID schoolId, UUID examId, UUID studentUserId, UUID subjectId);
    List<ExamMarkEntity> findBySchoolIdAndExamIdAndStudentUserIdOrderBySubjectIdAsc(UUID schoolId, UUID examId, UUID studentUserId);
    List<ExamMarkEntity> findBySchoolIdAndExamId(UUID schoolId, UUID examId);
}

