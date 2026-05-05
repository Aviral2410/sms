package com.sms.onboarding.api;

import java.time.Instant;
import java.util.UUID;

public record PlatformSettingsResponse(
    UUID settingsId,
    String themeName,
    String accentColor,
    Integer defaultTrialDays,
    Boolean maintenanceMode,
    String platformName,
    String contactEmail,
    Double glassIntensity,
    String borderRadius,
    String authServiceUrl,
    String communicationServiceUrl,
    Instant updatedAt
) {}
