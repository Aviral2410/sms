package com.sms.schoolops.repository;

import com.sms.schoolops.domain.StudentAdmissionEntity;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface StudentAdmissionRepository extends JpaRepository<StudentAdmissionEntity, UUID> {
    List<StudentAdmissionEntity> findBySchoolIdOrderByCreatedAtDesc(UUID schoolId);
    java.util.Optional<StudentAdmissionEntity> findBySchoolIdAndStudentUserId(UUID schoolId, UUID studentUserId);
    List<StudentAdmissionEntity> findBySchoolIdAndStudentUserIdIn(UUID schoolId, java.util.Collection<UUID> studentUserIds);
    long countBySchoolIdAndAdmissionNoStartingWith(UUID schoolId, String admissionNoPrefix);
    boolean existsBySchoolIdAndAdmissionNo(UUID schoolId, String admissionNo);
}
