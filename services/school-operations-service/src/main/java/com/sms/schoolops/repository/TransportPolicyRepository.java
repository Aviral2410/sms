package com.sms.schoolops.repository;

import com.sms.schoolops.domain.TransportPolicyEntity;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface TransportPolicyRepository extends JpaRepository<TransportPolicyEntity, UUID> {
    Optional<TransportPolicyEntity> findBySchoolId(UUID schoolId);
}
