package com.sms.onboarding.api;

import com.sms.onboarding.service.SchoolOnboardingService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import com.sms.onboarding.api.PublicSchoolProfileResponse;
import java.util.List;
import java.util.UUID;

import org.springframework.web.server.ResponseStatusException;

@RestController
@RequestMapping("/api/v1/onboarding/schools")
public class SchoolOnboardingController {

    private final SchoolOnboardingService schoolOnboardingService;

    public SchoolOnboardingController(SchoolOnboardingService schoolOnboardingService) {
        this.schoolOnboardingService = schoolOnboardingService;
    }

    private void checkAdminRole(String role) {
        if (role == null || (!role.equals("PLATFORM_ADMIN") && !role.equals("SUPER_ADMIN"))) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Access denied: Requires Platform Admin role");
        }
    }

    @GetMapping
    public List<SchoolOnboardingResponse> listOnboardings(@RequestHeader(value = "X-User-Role", required = false) String role) {
        checkAdminRole(role);
        return schoolOnboardingService.listOnboardings();
    }

    @GetMapping("/public/{schoolCode}")
    public PublicSchoolProfileResponse getPublicProfile(@PathVariable String schoolCode) {
        return schoolOnboardingService.getPublicProfile(schoolCode);
    }

    @GetMapping("/{onboardingId}")
    public SchoolOnboardingResponse getOnboarding(
            @PathVariable UUID onboardingId,
            @RequestHeader(value = "X-User-Role", required = false) String role
    ) {
        checkAdminRole(role);
        return schoolOnboardingService.getOnboarding(onboardingId);
    }

    @GetMapping("/status")
    public SchoolStatusLookupResponse lookupStatus(
            @RequestParam String schoolCode,
            @RequestParam String adminEmail
    ) {
        return schoolOnboardingService.lookupStatus(schoolCode, adminEmail);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public SchoolOnboardingResponse createOnboarding(@Valid @RequestBody SchoolOnboardingRequest request) {
        return schoolOnboardingService.createOnboarding(request);
    }

    @PatchMapping("/{onboardingId}/review")
    public SchoolOnboardingResponse reviewOnboarding(
            @PathVariable UUID onboardingId,
            @Valid @RequestBody OnboardingReviewRequest request,
            @RequestHeader(value = "X-User-Role", required = false) String role
    ) {
        checkAdminRole(role);
        return schoolOnboardingService.reviewOnboarding(onboardingId, request);
    }

    @PostMapping("/{onboardingId}/activation-sent")
    public SchoolOnboardingResponse markActivationAsSent(
            @PathVariable UUID onboardingId,
            @RequestHeader(value = "X-User-Role", required = false) String role
    ) {
        checkAdminRole(role);
        return schoolOnboardingService.markActivationAsSent(onboardingId);
    }

    @PostMapping("/{onboardingId}/activation-email")
    @ResponseStatus(HttpStatus.ACCEPTED)
    public void sendActivationEmail(
            @PathVariable UUID onboardingId,
            @RequestHeader(value = "X-User-Role", required = false) String role
    ) {
        checkAdminRole(role);
        schoolOnboardingService.sendActivationEmail(onboardingId);
    }

    @DeleteMapping("/{onboardingId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deleteOnboarding(
            @PathVariable UUID onboardingId,
            @RequestHeader(value = "X-User-Role", required = false) String role
    ) {
        checkAdminRole(role);
        schoolOnboardingService.deleteOnboarding(onboardingId);
    }
}
