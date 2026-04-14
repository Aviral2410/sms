package com.sms.schoolops.repository;

import com.sms.schoolops.domain.AttendanceAlertEventEntity;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface AttendanceAlertEventRepository extends JpaRepository<AttendanceAlertEventEntity, UUID> {
    Optional<AttendanceAlertEventEntity> findFirstBySchoolIdAndStudentUserIdAndActiveTrueOrderByTriggeredAtDesc(UUID schoolId, UUID studentUserId);
    List<AttendanceAlertEventEntity> findBySchoolIdAndActiveTrueOrderByTriggeredAtDesc(UUID schoolId);
}
