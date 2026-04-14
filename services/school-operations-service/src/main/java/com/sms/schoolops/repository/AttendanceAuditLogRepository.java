package com.sms.schoolops.repository;

import com.sms.schoolops.domain.AttendanceAuditLogEntity;
import java.util.List;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface AttendanceAuditLogRepository extends JpaRepository<AttendanceAuditLogEntity, UUID> {
    List<AttendanceAuditLogEntity> findBySessionIdOrderByCreatedAtDesc(UUID sessionId);
}
