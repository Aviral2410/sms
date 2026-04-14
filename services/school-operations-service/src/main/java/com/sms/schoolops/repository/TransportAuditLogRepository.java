package com.sms.schoolops.repository;

import com.sms.schoolops.domain.TransportAuditLogEntity;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface TransportAuditLogRepository extends JpaRepository<TransportAuditLogEntity, UUID> {
}
