package com.sms.schoolops.repository;

import com.sms.schoolops.domain.TeacherSubjectMappingEntity;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface TeacherSubjectMappingRepository extends JpaRepository<TeacherSubjectMappingEntity, UUID> {
    List<TeacherSubjectMappingEntity> findBySchoolId(UUID schoolId);
}
