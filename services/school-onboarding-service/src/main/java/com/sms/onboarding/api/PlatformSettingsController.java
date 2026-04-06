package com.sms.onboarding.api;

import com.sms.onboarding.service.PlatformSettingsService;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/platform/settings")
public class PlatformSettingsController {
    private final PlatformSettingsService service;

    public PlatformSettingsController(PlatformSettingsService service) {
        this.service = service;
    }

    @GetMapping
    public PlatformSettingsResponse getSettings() {
        return service.getSettings();
    }

    @PatchMapping
    public PlatformSettingsResponse updateSettings(@Valid @RequestBody UpdatePlatformSettingsRequest request) {
        return service.updateSettings(request);
    }
}
