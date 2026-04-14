package com.sms.onboarding.repository.cms;

import com.sms.onboarding.domain.cms.SchoolAchievementEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.UUID;

public interface SchoolAchievementRepository extends JpaRepository<SchoolAchievementEntity, UUID> {
    List<SchoolAchievementEntity> findByTenantIdOrderByDisplayOrderAsc(UUID tenantId);
    List<SchoolAchievementEntity> findByTenantIdAndIsPublishedTrueOrderByDisplayOrderAsc(UUID tenantId);
}
