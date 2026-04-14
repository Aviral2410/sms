package com.sms.onboarding.repository.cms;

import com.sms.onboarding.domain.cms.SchoolAdmissionInfoEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;
import java.util.UUID;

public interface SchoolAdmissionInfoRepository extends JpaRepository<SchoolAdmissionInfoEntity, UUID> {
    Optional<SchoolAdmissionInfoEntity> findByTenantId(UUID tenantId);
    Optional<SchoolAdmissionInfoEntity> findByTenantIdAndIsPublishedTrue(UUID tenantId);
}
