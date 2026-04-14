package com.sms.schoolops.repository;

import com.sms.schoolops.domain.TransportAlertEntity;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface TransportAlertRepository extends JpaRepository<TransportAlertEntity, UUID> {
    List<TransportAlertEntity> findBySchoolIdOrderByCreatedAtDesc(UUID schoolId);
    List<TransportAlertEntity> findByTripIdOrderByCreatedAtDesc(UUID tripId);
    Optional<TransportAlertEntity> findByDedupeKeyAndAlertStatus(String dedupeKey, String alertStatus);
}
