package com.sms.schoolops.repository;

import com.sms.schoolops.domain.ClassSubjectTeacherMappingEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface ClassSubjectTeacherMappingRepository extends JpaRepository<ClassSubjectTeacherMappingEntity, UUID> {
    List<ClassSubjectTeacherMappingEntity> findBySchoolId(UUID schoolId);
    List<ClassSubjectTeacherMappingEntity> findBySchoolIdAndClassId(UUID schoolId, UUID classId);
}
