package com.sms.onboarding.repository.cms;

import com.sms.onboarding.domain.cms.SchoolLandingProfileEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;
import java.util.UUID;

public interface SchoolLandingProfileRepository extends JpaRepository<SchoolLandingProfileEntity, UUID> {
    Optional<SchoolLandingProfileEntity> findByTenantId(UUID tenantId);
    Optional<SchoolLandingProfileEntity> findByTenantIdAndIsPublishedTrue(UUID tenantId);
}
