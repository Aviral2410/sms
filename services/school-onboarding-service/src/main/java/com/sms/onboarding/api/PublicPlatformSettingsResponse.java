package com.sms.onboarding.api;

import java.time.Instant;
import java.util.List;

public record PublicPlatformSettingsResponse(
        String platformName,
        String contactEmail,
        Boolean maintenanceMode,
        List<String> releasedFeatureCodes,
        Instant updatedAt
) {}
