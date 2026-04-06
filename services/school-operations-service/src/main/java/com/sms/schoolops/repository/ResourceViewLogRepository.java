package com.sms.schoolops.repository;

import com.sms.schoolops.domain.ResourceViewLogEntity;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

public interface ResourceViewLogRepository extends JpaRepository<ResourceViewLogEntity, UUID> {
    List<ResourceViewLogEntity> findBySchoolIdAndUserIdOrderByViewedAtDesc(UUID schoolId, UUID userId);
    List<ResourceViewLogEntity> findByResourceId(UUID resourceId);
    long countByResourceId(UUID resourceId);
}
