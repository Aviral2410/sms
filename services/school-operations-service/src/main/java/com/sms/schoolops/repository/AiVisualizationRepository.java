package com.sms.schoolops.repository;

import com.sms.schoolops.domain.AiVisualizationEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.UUID;

public interface AiVisualizationRepository extends JpaRepository<AiVisualizationEntity, UUID> {
    List<AiVisualizationEntity> findBySchoolIdAndUserIdOrderByCreatedAtDesc(UUID schoolId, UUID userId);
}
