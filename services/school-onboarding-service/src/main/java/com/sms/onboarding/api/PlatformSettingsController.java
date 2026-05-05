package com.sms.onboarding.api;

import com.sms.common.exception.ForbiddenException;
import com.sms.onboarding.service.PlatformSettingsService;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import java.util.Set;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/platform/settings")
@Tag(name = "Platform Settings", description = "Platform-wide visual and business configuration.")
public class PlatformSettingsController {
    private final PlatformSettingsService service;
    private static final Set<String> PLATFORM_ROLES = Set.of("PLATFORM_ADMIN", "SUPER_ADMIN");

    public PlatformSettingsController(PlatformSettingsService service) {
        this.service = service;
    }

    @GetMapping
    public PlatformSettingsResponse getSettings(@RequestHeader(value = "X-User-Role", required = false) String role) {
        requirePlatformRole(role);
        return service.getSettings();
    }

    @GetMapping("/public")
    public PublicPlatformSettingsResponse getPublicSettings() {
        return service.getPublicSettings();
    }

    @PatchMapping
    public PlatformSettingsResponse updateSettings(
            @RequestHeader(value = "X-User-Role", required = false) String role,
            @Valid @RequestBody UpdatePlatformSettingsRequest request
    ) {
        requirePlatformRole(role);
        return service.updateSettings(request);
    }

    private static void requirePlatformRole(String role) {
        String normalized = role == null ? "" : role.trim().toUpperCase();
        if (!PLATFORM_ROLES.contains(normalized)) {
            throw new ForbiddenException("Access denied: Requires Platform Admin role.");
        }
    }
}
