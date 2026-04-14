package com.sms.schoolops.repository;

import com.sms.schoolops.domain.GradingBandEntity;
import java.util.List;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface GradingBandRepository extends JpaRepository<GradingBandEntity, UUID> {
    List<GradingBandEntity> findBySchoolIdAndSchemeIdOrderBySortOrderAsc(UUID schoolId, UUID schemeId);
}

