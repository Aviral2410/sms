package com.sms.schoolops.repository;

import com.sms.schoolops.domain.TransportVehicleDocumentEntity;
import java.util.List;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface TransportVehicleDocumentRepository extends JpaRepository<TransportVehicleDocumentEntity, UUID> {
    List<TransportVehicleDocumentEntity> findByVehicleIdOrderByCreatedAtDesc(UUID vehicleId);
}
