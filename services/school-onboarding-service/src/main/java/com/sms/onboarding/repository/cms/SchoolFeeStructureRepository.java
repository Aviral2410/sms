package com.sms.onboarding.repository.cms;

import com.sms.onboarding.domain.cms.SchoolFeeStructureEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.UUID;

public interface SchoolFeeStructureRepository extends JpaRepository<SchoolFeeStructureEntity, UUID> {
    List<SchoolFeeStructureEntity> findByTenantIdOrderByAcademicYearDesc(UUID tenantId);
    List<SchoolFeeStructureEntity> findByTenantIdAndIsPublishedTrueOrderByAcademicYearDesc(UUID tenantId);
}
