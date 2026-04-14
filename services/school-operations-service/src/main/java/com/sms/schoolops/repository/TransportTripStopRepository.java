package com.sms.schoolops.repository;

import com.sms.schoolops.domain.TransportTripStopEntity;
import java.util.List;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface TransportTripStopRepository extends JpaRepository<TransportTripStopEntity, UUID> {
    List<TransportTripStopEntity> findByTripIdOrderBySequenceOrderAsc(UUID tripId);
}
