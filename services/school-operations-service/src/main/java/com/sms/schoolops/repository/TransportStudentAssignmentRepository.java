package com.sms.schoolops.repository;

import com.sms.schoolops.domain.TransportStudentAssignmentEntity;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface TransportStudentAssignmentRepository extends JpaRepository<TransportStudentAssignmentEntity, UUID> {
    List<TransportStudentAssignmentEntity> findBySchoolId(UUID schoolId);
    List<TransportStudentAssignmentEntity> findByRouteId(UUID routeId);
    Optional<TransportStudentAssignmentEntity> findByStudentUserId(UUID studentUserId);
}
