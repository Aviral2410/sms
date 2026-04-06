package com.sms.communication.repository;

import com.sms.communication.domain.AnnouncementEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Collection;
import java.util.List;
import java.util.UUID;

@Repository
public interface AnnouncementRepository extends JpaRepository<AnnouncementEntity, UUID> {
    List<AnnouncementEntity> findBySchoolIdOrderByCreatedAtDesc(UUID schoolId);
    
    List<AnnouncementEntity> findBySchoolIdAndTargetAudienceInOrderByCreatedAtDesc(UUID schoolId, Collection<String> audiences);
    
    List<AnnouncementEntity> findBySchoolIdAndTargetClassIdOrderByCreatedAtDesc(UUID schoolId, UUID targetClassId);
    
    @org.springframework.data.jpa.repository.Query("SELECT a FROM AnnouncementEntity a WHERE a.schoolId = :schoolId AND (a.targetAudience IN :audiences OR a.targetClassId = :targetClassId) ORDER BY a.createdAt DESC")
    List<AnnouncementEntity> findFiltered(UUID schoolId, Collection<String> audiences, UUID targetClassId);
}



