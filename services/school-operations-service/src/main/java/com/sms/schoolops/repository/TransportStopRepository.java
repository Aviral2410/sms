package com.sms.schoolops.repository;

import com.sms.schoolops.domain.TransportStopEntity;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface TransportStopRepository extends JpaRepository<TransportStopEntity, UUID> {
    List<TransportStopEntity> findByRouteIdOrderByStopOrderAsc(UUID routeId);
    List<TransportStopEntity> findBySchoolId(UUID schoolId);
}
