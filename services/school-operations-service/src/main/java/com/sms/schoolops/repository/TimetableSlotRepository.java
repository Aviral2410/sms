package com.sms.schoolops.repository;

import com.sms.schoolops.domain.TimetableSlotEntity;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface TimetableSlotRepository extends JpaRepository<TimetableSlotEntity, UUID> {
    List<TimetableSlotEntity> findBySchoolIdOrderByDayOfWeekAscStartTimeAsc(UUID schoolId);
    List<TimetableSlotEntity> findBySchoolIdAndClassId(UUID schoolId, UUID classId);
}
