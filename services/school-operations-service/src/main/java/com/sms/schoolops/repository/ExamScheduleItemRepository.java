package com.sms.schoolops.repository;

import com.sms.schoolops.domain.ExamScheduleItemEntity;
import java.util.List;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ExamScheduleItemRepository extends JpaRepository<ExamScheduleItemEntity, UUID> {
    List<ExamScheduleItemEntity> findBySchoolIdAndExamIdOrderByExamDateAscStartTimeAsc(UUID schoolId, UUID examId);
}

