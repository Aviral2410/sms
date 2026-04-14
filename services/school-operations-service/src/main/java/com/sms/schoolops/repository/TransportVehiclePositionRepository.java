package com.sms.schoolops.repository;

import com.sms.schoolops.domain.TransportVehiclePositionEntity;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface TransportVehiclePositionRepository extends JpaRepository<TransportVehiclePositionEntity, UUID> {
    List<TransportVehiclePositionEntity> findByRouteIdOrderByRecordedAtDesc(UUID routeId);
    List<TransportVehiclePositionEntity> findBySchoolId(UUID schoolId);
}
