package com.sms.onboarding.api;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.time.Instant;
import java.util.Map;
import java.util.UUID;

/**
 * DTOs for platform-managed third-party configuration.
 */
public final class PlatformConfigDtos {

    private PlatformConfigDtos() {
    }

    /**
     * Masked configuration returned to platform admins.
     */
    public record PlatformConfigResponse(
            UUID configId,
            String serviceName,
            String maskedSecret,
            boolean secretConfigured,
            String apiBaseUrl,
            boolean enabled,
            boolean refreshRequired,
            Map<String, Object> metadata,
            Instant updatedAt
    ) {
    }

    /**
     * Upsert payload used by the admin UI.
     */
    public record UpsertPlatformConfigRequest(
            @NotBlank String serviceName,
            String secretValue,
            String apiBaseUrl,
            @NotNull Boolean enabled,
            Boolean refreshRequired,
            Map<String, Object> metadata
    ) {
    }

    /**
     * Runtime view used by internal services that need the decrypted secret.
     */
    public record PlatformRuntimeConfigResponse(
            String serviceName,
            String secretValue,
            String apiBaseUrl,
            boolean enabled,
            boolean refreshRequired,
            Map<String, Object> metadata,
            Instant updatedAt
    ) {
    }
}
