package com.sms.onboarding.repository.cms;

import com.sms.onboarding.domain.cms.SchoolAffiliationInfoEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;
import java.util.UUID;

public interface SchoolAffiliationInfoRepository extends JpaRepository<SchoolAffiliationInfoEntity, UUID> {
    Optional<SchoolAffiliationInfoEntity> findByTenantId(UUID tenantId);
    Optional<SchoolAffiliationInfoEntity> findByTenantIdAndIsPublishedTrue(UUID tenantId);
}
