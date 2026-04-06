package com.sms.schoolops.repository;

import com.sms.schoolops.domain.DepartmentEntity;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface DepartmentRepository extends JpaRepository<DepartmentEntity, UUID> {
    List<DepartmentEntity> findBySchoolIdOrderByDepartmentNameAsc(UUID schoolId);
}
