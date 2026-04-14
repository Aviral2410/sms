package com.sms.schoolops.repository;

import com.sms.schoolops.domain.TransportVehicleEntity;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface TransportVehicleRepository extends JpaRepository<TransportVehicleEntity, UUID> {
    List<TransportVehicleEntity> findBySchoolIdOrderByCreatedAtDesc(UUID schoolId);
    Optional<TransportVehicleEntity> findBySchoolIdAndGpsDeviceId(UUID schoolId, String gpsDeviceId);
}
