package com.sms.onboarding.repository.cms;

import com.sms.onboarding.domain.cms.SchoolTestimonialEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.UUID;

public interface SchoolTestimonialRepository extends JpaRepository<SchoolTestimonialEntity, UUID> {
    List<SchoolTestimonialEntity> findByTenantIdOrderByDisplayOrderAsc(UUID tenantId);
    List<SchoolTestimonialEntity> findByTenantIdAndIsPublishedTrueOrderByDisplayOrderAsc(UUID tenantId);
}
