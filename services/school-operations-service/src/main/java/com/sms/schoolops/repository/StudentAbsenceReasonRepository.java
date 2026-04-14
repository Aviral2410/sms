package com.sms.schoolops.repository;

import com.sms.schoolops.domain.StudentAbsenceReasonEntity;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface StudentAbsenceReasonRepository extends JpaRepository<StudentAbsenceReasonEntity, UUID> {
    Optional<StudentAbsenceReasonEntity> findByAttendanceId(UUID attendanceId);
    List<StudentAbsenceReasonEntity> findByStudentUserIdOrderByCreatedAtDesc(UUID studentUserId);
}
