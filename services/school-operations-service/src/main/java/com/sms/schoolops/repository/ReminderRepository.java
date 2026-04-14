package com.sms.schoolops.repository;

import com.sms.schoolops.domain.ReminderEntity;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface ReminderRepository extends JpaRepository<ReminderEntity, UUID> {
    List<ReminderEntity> findBySchoolIdOrderByDueAtAsc(UUID schoolId);
}
