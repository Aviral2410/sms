package com.sms.schoolops.repository;

import com.sms.schoolops.domain.HomeworkItemEntity;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface HomeworkItemRepository extends JpaRepository<HomeworkItemEntity, UUID> {
    List<HomeworkItemEntity> findBySchoolIdOrderByDueDateDescCreatedAtDesc(UUID schoolId);
    List<HomeworkItemEntity> findBySchoolIdAndClassIdOrderByDueDateDesc(UUID schoolId, UUID classId);
}
