package com.sms.onboarding.api;

import com.sms.onboarding.service.SchoolOnboardingService;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.UUID;

@RestController
@RequestMapping("/api/v1/public/onboarding/branding")
public class PublicBrandingController {

    private final SchoolOnboardingService schoolOnboardingService;

    public PublicBrandingController(SchoolOnboardingService schoolOnboardingService) {
        this.schoolOnboardingService = schoolOnboardingService;
    }

    /**
     * Resolves branding details based on the X-Tenant-ID injected by the API Gateway.
     * This is used by the frontend to load theme/logo before the user logs in.
     */
    @GetMapping("/context")
    public SchoolBrandingResponse getBrandingContext(
            @RequestHeader(value = "X-Tenant-ID", required = false) String tenantIdStr
    ) {
        if (tenantIdStr == null || tenantIdStr.isBlank()) {
            throw new IllegalArgumentException("No tenant context found in request.");
        }
        return schoolOnboardingService.getBrandingByTenantId(UUID.fromString(tenantIdStr));
    }
}
