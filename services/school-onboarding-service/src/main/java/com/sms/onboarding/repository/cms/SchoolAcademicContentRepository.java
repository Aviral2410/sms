package com.sms.onboarding.repository.cms;

import com.sms.onboarding.domain.cms.SchoolAcademicContentEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;
import java.util.UUID;

public interface SchoolAcademicContentRepository extends JpaRepository<SchoolAcademicContentEntity, UUID> {
    Optional<SchoolAcademicContentEntity> findByTenantId(UUID tenantId);
    Optional<SchoolAcademicContentEntity> findByTenantIdAndIsPublishedTrue(UUID tenantId);
}
