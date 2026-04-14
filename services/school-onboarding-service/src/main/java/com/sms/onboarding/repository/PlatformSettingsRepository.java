package com.sms.onboarding.repository;

import com.sms.onboarding.domain.PlatformSettingsEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.UUID;

public interface PlatformSettingsRepository extends JpaRepository<PlatformSettingsEntity, UUID> {
}
