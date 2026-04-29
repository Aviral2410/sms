package com.sms.schoolops.repository;

import com.sms.schoolops.domain.FeeRecordEntity;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface FeeRecordRepository extends JpaRepository<FeeRecordEntity, UUID> {
    List<FeeRecordEntity> findBySchoolIdOrderByDueDateDesc(UUID schoolId);
    List<FeeRecordEntity> findBySchoolIdAndStudentUserIdOrderByDueDateDesc(UUID schoolId, UUID studentUserId);
}
