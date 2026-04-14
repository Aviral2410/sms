package com.sms.communication.repository;

import com.sms.communication.domain.AnnouncementAckEntity;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

@Repository
public interface AnnouncementAckRepository extends JpaRepository<AnnouncementAckEntity, UUID> {
    Optional<AnnouncementAckEntity> findBySchoolIdAndAnnouncementIdAndUserId(UUID schoolId, UUID announcementId, UUID userId);

    @Query("select count(a) from AnnouncementAckEntity a where a.schoolId = :schoolId and a.announcementId = :announcementId")
    long countBySchoolIdAndAnnouncementId(UUID schoolId, UUID announcementId);

    List<AnnouncementAckEntity> findBySchoolIdAndAnnouncementIdOrderByAcknowledgedAtDesc(UUID schoolId, UUID announcementId);
}

