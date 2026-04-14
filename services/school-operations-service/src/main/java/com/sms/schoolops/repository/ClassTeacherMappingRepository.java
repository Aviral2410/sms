package com.sms.schoolops.repository;

import com.sms.schoolops.domain.ClassTeacherMappingEntity;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface ClassTeacherMappingRepository extends JpaRepository<ClassTeacherMappingEntity, UUID> {
    List<ClassTeacherMappingEntity> findBySchoolId(UUID schoolId);
}
