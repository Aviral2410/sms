package com.sms.schoolops.repository;

import com.sms.schoolops.domain.ExamResultRecordEntity;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface ExamResultRecordRepository extends JpaRepository<ExamResultRecordEntity, UUID> {
    List<ExamResultRecordEntity> findBySchoolIdOrderByCreatedAtDesc(UUID schoolId);
}
