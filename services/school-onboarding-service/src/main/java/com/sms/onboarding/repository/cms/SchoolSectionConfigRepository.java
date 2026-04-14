package com.sms.onboarding.repository.cms;

import com.sms.onboarding.domain.cms.SchoolSectionConfigEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface SchoolSectionConfigRepository extends JpaRepository<SchoolSectionConfigEntity, UUID> {
    List<SchoolSectionConfigEntity> findByTenantIdOrderByDisplayOrderAsc(UUID tenantId);
    Optional<SchoolSectionConfigEntity> findByTenantIdAndSectionKey(UUID tenantId, String sectionKey);
}
