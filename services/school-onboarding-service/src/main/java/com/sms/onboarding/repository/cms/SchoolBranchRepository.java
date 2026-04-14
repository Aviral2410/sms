package com.sms.onboarding.repository.cms;

import com.sms.onboarding.domain.cms.SchoolBranchEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.UUID;

public interface SchoolBranchRepository extends JpaRepository<SchoolBranchEntity, UUID> {
    List<SchoolBranchEntity> findByTenantIdOrderByIsPrimaryDescBranchNameAsc(UUID tenantId);
    List<SchoolBranchEntity> findByTenantIdAndIsPublishedTrueOrderByIsPrimaryDescBranchNameAsc(UUID tenantId);
}
