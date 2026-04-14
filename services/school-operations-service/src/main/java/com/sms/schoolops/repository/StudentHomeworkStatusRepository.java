package com.sms.schoolops.repository;

import com.sms.schoolops.domain.StudentHomeworkStatusEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;
import java.util.UUID;
import java.util.List;

public interface StudentHomeworkStatusRepository extends JpaRepository<StudentHomeworkStatusEntity, UUID> {
    Optional<StudentHomeworkStatusEntity> findByHomeworkIdAndStudentUserId(UUID homeworkId, UUID studentUserId);
    List<StudentHomeworkStatusEntity> findByStudentUserIdAndSchoolId(UUID studentUserId, UUID schoolId);
}
