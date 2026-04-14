package com.sms.onboarding.repository.cms;

import com.sms.onboarding.domain.cms.SchoolEnquiryEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.UUID;

public interface SchoolEnquiryRepository extends JpaRepository<SchoolEnquiryEntity, UUID> {
    List<SchoolEnquiryEntity> findByTenantIdOrderByCreatedAtDesc(UUID tenantId);
    List<SchoolEnquiryEntity> findByTenantIdAndStatusOrderByCreatedAtDesc(UUID tenantId, String status);
    List<SchoolEnquiryEntity> findByTenantIdAndTypeOrderByCreatedAtDesc(UUID tenantId, String type);
    List<SchoolEnquiryEntity> findByTenantIdAndStatusAndTypeOrderByCreatedAtDesc(UUID tenantId, String status, String type);
    long countByTenantIdAndStatus(UUID tenantId, String status);
}
