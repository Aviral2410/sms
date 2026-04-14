package com.sms.schoolops.repository;

import com.sms.schoolops.domain.TransportNotificationLogEntity;
import java.util.List;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface TransportNotificationLogRepository extends JpaRepository<TransportNotificationLogEntity, UUID> {
    List<TransportNotificationLogEntity> findByRecipientUserIdOrderByCreatedAtDesc(UUID recipientUserId);
    List<TransportNotificationLogEntity> findByStudentUserIdAndNotificationTypeOrderByCreatedAtDesc(UUID studentUserId, String notificationType);
}
