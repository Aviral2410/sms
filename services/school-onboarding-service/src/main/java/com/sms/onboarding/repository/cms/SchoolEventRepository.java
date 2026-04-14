package com.sms.onboarding.repository.cms;

import com.sms.onboarding.domain.cms.SchoolEventEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface SchoolEventRepository extends JpaRepository<SchoolEventEntity, UUID> {
    List<SchoolEventEntity> findByTenantIdOrderByStartAtDesc(UUID tenantId);
    List<SchoolEventEntity> findByTenantIdAndIsPublishedTrueOrderByStartAtDesc(UUID tenantId);
    List<SchoolEventEntity> findByTenantIdAndIsPublishedTrueAndStartAtAfterOrderByStartAtAsc(UUID tenantId, Instant after);
    List<SchoolEventEntity> findByTenantIdAndStartAtBeforeOrderByStartAtDesc(UUID tenantId, Instant before);
    Optional<SchoolEventEntity> findFirstByTenantIdAndIsFeaturedTrueAndIsPublishedTrueOrderByStartAtAsc(UUID tenantId);
}
