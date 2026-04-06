package com.sms.schoolops.repository;

import com.sms.schoolops.domain.SchoolUserDocumentEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface SchoolUserDocumentRepository extends JpaRepository<SchoolUserDocumentEntity, UUID> {
    List<SchoolUserDocumentEntity> findByUserIdOrderByCreatedAtDesc(UUID userId);
    List<SchoolUserDocumentEntity> findBySchoolIdOrderByCreatedAtDesc(UUID schoolId);
}
