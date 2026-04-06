package com.sms.schoolops.repository;

import com.sms.schoolops.domain.StudentClassEnrollmentEntity;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface StudentClassEnrollmentRepository extends JpaRepository<StudentClassEnrollmentEntity, UUID> {
    List<StudentClassEnrollmentEntity> findBySchoolId(UUID schoolId);
    List<StudentClassEnrollmentEntity> findBySchoolIdAndClassId(UUID schoolId, UUID classId);
}
