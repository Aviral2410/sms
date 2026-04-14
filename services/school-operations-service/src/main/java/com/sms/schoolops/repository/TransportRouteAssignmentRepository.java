package com.sms.schoolops.repository;

import com.sms.schoolops.domain.TransportRouteAssignmentEntity;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface TransportRouteAssignmentRepository extends JpaRepository<TransportRouteAssignmentEntity, UUID> {
    List<TransportRouteAssignmentEntity> findBySchoolIdAndServiceDateOrderByCreatedAtDesc(UUID schoolId, LocalDate serviceDate);
    Optional<TransportRouteAssignmentEntity> findByRouteIdAndServiceDateAndShiftType(UUID routeId, LocalDate serviceDate, String shiftType);
    List<TransportRouteAssignmentEntity> findBySchoolIdAndDriverUserIdAndServiceDate(UUID schoolId, UUID driverUserId, LocalDate serviceDate);
    List<TransportRouteAssignmentEntity> findBySchoolIdAndConductorUserIdAndServiceDate(UUID schoolId, UUID conductorUserId, LocalDate serviceDate);
}
