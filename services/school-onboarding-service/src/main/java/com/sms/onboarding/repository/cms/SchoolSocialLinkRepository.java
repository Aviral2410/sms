package com.sms.onboarding.repository.cms;

import com.sms.onboarding.domain.cms.SchoolSocialLinkEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.UUID;

public interface SchoolSocialLinkRepository extends JpaRepository<SchoolSocialLinkEntity, UUID> {
    List<SchoolSocialLinkEntity> findByTenantIdOrderByDisplayOrderAsc(UUID tenantId);
    List<SchoolSocialLinkEntity> findByTenantIdAndIsPublishedTrueOrderByDisplayOrderAsc(UUID tenantId);
}
