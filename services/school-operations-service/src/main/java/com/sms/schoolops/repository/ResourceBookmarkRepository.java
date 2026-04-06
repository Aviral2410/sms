package com.sms.schoolops.repository;

import com.sms.schoolops.domain.ResourceBookmarkEntity;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface ResourceBookmarkRepository extends JpaRepository<ResourceBookmarkEntity, UUID> {
    List<ResourceBookmarkEntity> findBySchoolIdAndUserId(UUID schoolId, UUID userId);
    List<ResourceBookmarkEntity> findBySchoolIdAndUserIdAndResourceId(UUID schoolId, UUID userId, UUID resourceId);
    void deleteBySchoolIdAndUserIdAndResourceId(UUID schoolId, UUID userId, UUID resourceId);
}
