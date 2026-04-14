package com.sms.schoolops.repository;

import com.sms.schoolops.domain.VoiceNoteEntity;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface VoiceNoteRepository extends JpaRepository<VoiceNoteEntity, UUID> {
    List<VoiceNoteEntity> findBySchoolIdOrderByCreatedAtDesc(UUID schoolId);
}
