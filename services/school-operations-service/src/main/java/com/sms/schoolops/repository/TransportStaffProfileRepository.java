package com.sms.schoolops.repository;

import com.sms.schoolops.domain.TransportStaffProfileEntity;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface TransportStaffProfileRepository extends JpaRepository<TransportStaffProfileEntity, UUID> {
    List<TransportStaffProfileEntity> findBySchoolIdOrderByCreatedAtDesc(UUID schoolId);
    List<TransportStaffProfileEntity> findBySchoolIdAndStaffRoleOrderByCreatedAtDesc(UUID schoolId, String staffRole);
    Optional<TransportStaffProfileEntity> findByUserId(UUID userId);
}
