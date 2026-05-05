package com.sms.onboarding.api;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.util.List;

public record UpdatePlatformSettingsRequest(
    @NotBlank String themeName,
    @NotBlank String accentColor,
    @NotNull Integer defaultTrialDays,
    @NotNull Boolean maintenanceMode,
    @NotBlank String platformName,
    @NotBlank String contactEmail,
    @NotNull Double glassIntensity,
    @NotBlank String borderRadius,
    @NotBlank String authServiceUrl,
    @NotBlank String communicationServiceUrl,
    List<String> releasedFeatureCodes
) {}
