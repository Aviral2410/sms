package com.sms.schoolops.repository;

import com.sms.schoolops.domain.StudentParentMappingEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.UUID;

public interface StudentParentMappingRepository extends JpaRepository<StudentParentMappingEntity, UUID> {
    List<StudentParentMappingEntity> findByStudentUserId(UUID studentUserId);
    List<StudentParentMappingEntity> findByParentUserId(UUID parentUserId);
    long countByStudentUserId(UUID studentUserId);
}
