package com.sms.schoolops.repository;

import com.sms.schoolops.domain.TransportTripEventEntity;
import java.util.List;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface TransportTripEventRepository extends JpaRepository<TransportTripEventEntity, UUID> {
    List<TransportTripEventEntity> findByTripIdOrderByCreatedAtDesc(UUID tripId);
}
