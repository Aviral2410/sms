package com.sms.schoolops.repository;

import com.sms.schoolops.domain.GradingSchemeEntity;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface GradingSchemeRepository extends JpaRepository<GradingSchemeEntity, UUID> {
    List<GradingSchemeEntity> findBySchoolIdOrderByCreatedAtDesc(UUID schoolId);
    Optional<GradingSchemeEntity> findBySchoolIdAndIsDefaultTrue(UUID schoolId);
}

