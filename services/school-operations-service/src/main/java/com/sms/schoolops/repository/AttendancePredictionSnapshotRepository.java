package com.sms.schoolops.repository;

import com.sms.schoolops.domain.AttendancePredictionSnapshotEntity;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface AttendancePredictionSnapshotRepository extends JpaRepository<AttendancePredictionSnapshotEntity, UUID> {
    Optional<AttendancePredictionSnapshotEntity> findFirstBySchoolIdAndStudentUserIdOrderByGeneratedAtDesc(UUID schoolId, UUID studentUserId);
    List<AttendancePredictionSnapshotEntity> findBySchoolIdAndSnapshotDateOrderByGeneratedAtDesc(UUID schoolId, LocalDate snapshotDate);
}
