package com.sms.onboarding.repository.cms;

import com.sms.onboarding.domain.cms.SchoolLeaderEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.UUID;

public interface SchoolLeaderRepository extends JpaRepository<SchoolLeaderEntity, UUID> {
    List<SchoolLeaderEntity> findByTenantIdOrderByDisplayOrderAsc(UUID tenantId);
    List<SchoolLeaderEntity> findByTenantIdAndIsPublishedTrueOrderByDisplayOrderAsc(UUID tenantId);
}
