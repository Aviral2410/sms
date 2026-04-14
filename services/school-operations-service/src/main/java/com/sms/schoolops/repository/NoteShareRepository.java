package com.sms.schoolops.repository;

import com.sms.schoolops.domain.NoteShareEntity;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface NoteShareRepository extends JpaRepository<NoteShareEntity, UUID> {
    List<NoteShareEntity> findBySchoolIdOrderByCreatedAtDesc(UUID schoolId);
}
