package com.sms.schoolops.repository;

import com.sms.schoolops.domain.DepartmentHodAssignmentEntity;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface DepartmentHodAssignmentRepository extends JpaRepository<DepartmentHodAssignmentEntity, UUID> {
    List<DepartmentHodAssignmentEntity> findBySchoolId(UUID schoolId);
}
