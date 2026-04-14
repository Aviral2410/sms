package com.sms.schoolops.repository;

import com.sms.schoolops.domain.ExamEntity;
import java.util.List;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ExamRepository extends JpaRepository<ExamEntity, UUID> {
    List<ExamEntity> findBySchoolIdOrderByCreatedAtDesc(UUID schoolId);
}

