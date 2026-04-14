package com.sms.schoolops.repository;

import com.sms.schoolops.domain.TransportPickupLogEntity;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

public interface TransportPickupLogRepository extends JpaRepository<TransportPickupLogEntity, UUID> {
    List<TransportPickupLogEntity> findBySchoolIdAndTripDate(UUID schoolId, LocalDate tripDate);
    List<TransportPickupLogEntity> findByRouteIdAndTripDate(UUID routeId, LocalDate tripDate);
}
