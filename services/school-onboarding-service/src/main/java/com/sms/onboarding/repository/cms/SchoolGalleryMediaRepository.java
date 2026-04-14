package com.sms.onboarding.repository.cms;

import com.sms.onboarding.domain.cms.SchoolGalleryMediaEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.UUID;

public interface SchoolGalleryMediaRepository extends JpaRepository<SchoolGalleryMediaEntity, UUID> {
    List<SchoolGalleryMediaEntity> findByAlbumIdOrderBySortOrderAsc(UUID albumId);
    List<SchoolGalleryMediaEntity> findByAlbumIdAndIsPublishedTrueOrderBySortOrderAsc(UUID albumId);
    List<SchoolGalleryMediaEntity> findByTenantId(UUID tenantId);
}
