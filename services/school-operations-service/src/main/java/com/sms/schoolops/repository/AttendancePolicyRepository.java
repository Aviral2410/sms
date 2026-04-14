package com.sms.schoolops.repository;

import com.sms.schoolops.domain.AttendancePolicyEntity;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface AttendancePolicyRepository extends JpaRepository<AttendancePolicyEntity, UUID> {
    Optional<AttendancePolicyEntity> findBySchoolId(UUID schoolId);
}
