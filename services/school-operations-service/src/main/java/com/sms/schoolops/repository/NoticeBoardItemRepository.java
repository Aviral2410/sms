package com.sms.schoolops.repository;

import com.sms.schoolops.domain.NoticeBoardItemEntity;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface NoticeBoardItemRepository extends JpaRepository<NoticeBoardItemEntity, UUID> {
    List<NoticeBoardItemEntity> findBySchoolIdOrderByPublishedAtDesc(UUID schoolId);
}
