package com.sms.schoolops.repository;

import com.sms.schoolops.domain.TransportGpsPingEntity;
import java.util.List;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface TransportGpsPingRepository extends JpaRepository<TransportGpsPingEntity, UUID> {
    List<TransportGpsPingEntity> findByTripIdOrderByRecordedAtAsc(UUID tripId);
    List<TransportGpsPingEntity> findByTripIdOrderByRecordedAtDesc(UUID tripId);
}
