package com.sms.schoolops.repository;

import com.sms.schoolops.domain.TransportOptimizationRunEntity;
import java.util.List;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface TransportOptimizationRunRepository extends JpaRepository<TransportOptimizationRunEntity, UUID> {
    List<TransportOptimizationRunEntity> findBySchoolIdOrderByCreatedAtDesc(UUID schoolId);
}
