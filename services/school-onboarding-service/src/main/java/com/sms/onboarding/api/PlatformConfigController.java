package com.sms.onboarding.api;

import com.sms.common.exception.ForbiddenException;
import com.sms.onboarding.api.PlatformConfigDtos.PlatformConfigResponse;
import com.sms.onboarding.api.PlatformConfigDtos.PlatformRuntimeConfigResponse;
import com.sms.onboarding.api.PlatformConfigDtos.UpsertPlatformConfigRequest;
import com.sms.onboarding.service.PlatformConfigService;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import java.util.List;
import java.util.Set;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * Exposes admin and internal endpoints for platform-managed third-party configuration.
 */
@RestController
@RequestMapping("/api/v1/platform/configs")
@Tag(name = "Platform Config", description = "Admin-managed third-party keys and runtime integration configuration.")
public class PlatformConfigController {

    private static final Set<String> PLATFORM_ROLES = Set.of("PLATFORM_ADMIN", "SUPER_ADMIN");

    private final PlatformConfigService service;

    public PlatformConfigController(PlatformConfigService service) {
        this.service = service;
    }

    @GetMapping
    public List<PlatformConfigResponse> listConfigs(@RequestHeader(value = "X-User-Role", required = false) String role) {
        requirePlatformRole(role);
        return this.service.listConfigs();
    }

    @PutMapping("/{serviceName}")
    public PlatformConfigResponse upsertConfig(
            @RequestHeader(value = "X-User-Role", required = false) String role,
            @PathVariable String serviceName,
            @Valid @RequestBody UpsertPlatformConfigRequest request
    ) {
        requirePlatformRole(role);
        return this.service.upsert(new UpsertPlatformConfigRequest(
                serviceName,
                request.secretValue(),
                request.apiBaseUrl(),
                request.enabled(),
                request.refreshRequired(),
                request.metadata()
        ));
    }

    @GetMapping("/runtime/{serviceName}")
    public PlatformRuntimeConfigResponse getRuntimeConfig(
            @PathVariable String serviceName,
            @RequestHeader("X-Internal-Api-Key") String internalApiKey
    ) {
        return this.service.getRuntimeConfig(serviceName, internalApiKey);
    }

    private static void requirePlatformRole(String role) {
        String normalized = role == null ? "" : role.trim().toUpperCase();
        if (!PLATFORM_ROLES.contains(normalized)) {
            throw new ForbiddenException("Access denied: Requires Platform Admin role.");
        }
    }
}
