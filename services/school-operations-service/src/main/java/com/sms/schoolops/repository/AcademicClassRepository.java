package com.sms.schoolops.repository;

import com.sms.schoolops.domain.AcademicClassEntity;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface AcademicClassRepository extends JpaRepository<AcademicClassEntity, UUID> {
    List<AcademicClassEntity> findBySchoolIdOrderByClassNameAscSectionNameAsc(UUID schoolId);
}
