package com.sms.onboarding.repository;

import com.sms.onboarding.domain.PlatformConfigEntity;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

/**
 * Repository for platform-level integration configuration.
 */
public interface PlatformConfigRepository extends JpaRepository<PlatformConfigEntity, UUID> {

    Optional<PlatformConfigEntity> findByServiceNameIgnoreCase(String serviceName);
}
