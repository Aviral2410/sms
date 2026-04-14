package com.sms.schoolops.repository;

import com.sms.schoolops.domain.LibraryResourceEntity;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface LibraryResourceRepository extends JpaRepository<LibraryResourceEntity, UUID> {
    List<LibraryResourceEntity> findBySchoolIdOrderByCreatedAtDesc(UUID schoolId);
    List<LibraryResourceEntity> findBySchoolIdAndSubject(UUID schoolId, String subject);
    List<LibraryResourceEntity> findBySchoolIdAndResourceType(UUID schoolId, String resourceType);
    List<LibraryResourceEntity> findBySchoolIdAndGradeLevel(UUID schoolId, String gradeLevel);
}
