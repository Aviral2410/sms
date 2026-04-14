package com.sms.onboarding.repository.cms;

import com.sms.onboarding.domain.cms.SchoolGalleryAlbumEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.UUID;

public interface SchoolGalleryAlbumRepository extends JpaRepository<SchoolGalleryAlbumEntity, UUID> {
    List<SchoolGalleryAlbumEntity> findByTenantIdOrderBySortOrderAsc(UUID tenantId);
    List<SchoolGalleryAlbumEntity> findByTenantIdAndIsPublishedTrueOrderBySortOrderAsc(UUID tenantId);
}
