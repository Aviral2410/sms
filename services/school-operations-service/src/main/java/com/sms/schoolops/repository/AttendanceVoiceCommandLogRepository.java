package com.sms.schoolops.repository;

import com.sms.schoolops.domain.AttendanceVoiceCommandLogEntity;
import java.util.List;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface AttendanceVoiceCommandLogRepository extends JpaRepository<AttendanceVoiceCommandLogEntity, UUID> {
    List<AttendanceVoiceCommandLogEntity> findBySessionIdOrderByCreatedAtDesc(UUID sessionId);
}
