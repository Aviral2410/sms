package com.sms.onboarding.repository.cms;

import com.sms.onboarding.domain.cms.SchoolInfrastructureItemEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.UUID;

public interface SchoolInfrastructureItemRepository extends JpaRepository<SchoolInfrastructureItemEntity, UUID> {
    List<SchoolInfrastructureItemEntity> findByTenantIdOrderByDisplayOrderAsc(UUID tenantId);
    List<SchoolInfrastructureItemEntity> findByTenantIdAndIsPublishedTrueOrderByDisplayOrderAsc(UUID tenantId);
}
