package com.sms.schoolops.repository;

import com.sms.schoolops.domain.TeacherClassMappingEntity;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface TeacherClassMappingRepository extends JpaRepository<TeacherClassMappingEntity, UUID> {
    List<TeacherClassMappingEntity> findBySchoolId(UUID schoolId);
    List<TeacherClassMappingEntity> findBySchoolIdAndTeacherUserId(UUID schoolId, UUID teacherUserId);
}
