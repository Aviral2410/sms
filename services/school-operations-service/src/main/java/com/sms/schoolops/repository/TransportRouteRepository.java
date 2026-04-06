package com.sms.schoolops.repository;

import com.sms.schoolops.domain.TransportRouteEntity;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface TransportRouteRepository extends JpaRepository<TransportRouteEntity, UUID> {
    List<TransportRouteEntity> findBySchoolIdOrderByCreatedAtDesc(UUID schoolId);
}
