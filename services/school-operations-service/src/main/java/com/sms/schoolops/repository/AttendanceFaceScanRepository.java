package com.sms.schoolops.repository;

import com.sms.schoolops.domain.AttendanceFaceScanEntity;
import java.util.List;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface AttendanceFaceScanRepository extends JpaRepository<AttendanceFaceScanEntity, UUID> {
    List<AttendanceFaceScanEntity> findBySessionIdOrderByCreatedAtDesc(UUID sessionId);
}
