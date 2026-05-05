package com.sms.gateway.filter;

import org.junit.jupiter.api.Test;
import org.springframework.http.HttpMethod;

import static org.junit.jupiter.api.Assertions.*;

class JwtAuthFilterPublicEndpointsTest {

    private final JwtAuthFilter filter = new JwtAuthFilter();

    @Test
    void optionsIsAlwaysPublic() {
        assertTrue(filter.isPublicEndpoint("/api/v1/school-ops/departments", HttpMethod.OPTIONS));
    }

    @Test
    void onboardingRegistrationPostIsPublic() {
        assertTrue(filter.isPublicEndpoint("/api/v1/onboarding/schools", HttpMethod.POST));
        assertTrue(filter.isPublicEndpoint("/api/v1/onboarding/schools/", HttpMethod.POST));
    }

    @Test
    void onboardingListGetIsProtected() {
        assertFalse(filter.isPublicEndpoint("/api/v1/onboarding/schools", HttpMethod.GET));
    }

    @Test
    void onboardingAdminActionsAreProtected() {
        assertFalse(filter.isPublicEndpoint("/api/v1/onboarding/schools/00000000-0000-0000-0000-000000000000/review", HttpMethod.PATCH));
        assertFalse(filter.isPublicEndpoint("/api/v1/onboarding/schools/00000000-0000-0000-0000-000000000000", HttpMethod.GET));
        assertFalse(filter.isPublicEndpoint("/api/v1/onboarding/schools/00000000-0000-0000-0000-000000000000", HttpMethod.DELETE));
        assertFalse(filter.isPublicEndpoint("/api/v1/onboarding/schools/00000000-0000-0000-0000-000000000000/activation-sent", HttpMethod.POST));
        assertFalse(filter.isPublicEndpoint("/api/v1/onboarding/schools/00000000-0000-0000-0000-000000000000/activation-email", HttpMethod.POST));
    }

    @Test
    void onboardingStatusAndPublicProfileArePublic() {
        assertTrue(filter.isPublicEndpoint("/api/v1/onboarding/schools/status", HttpMethod.GET));
        assertTrue(filter.isPublicEndpoint("/api/v1/onboarding/schools/public/SPS-001", HttpMethod.GET));
    }

    @Test
    void authEndpointsArePublic() {
        assertTrue(filter.isPublicEndpoint("/api/v1/auth/admin/login", HttpMethod.POST));
        assertTrue(filter.isPublicEndpoint("/api/v1/auth/school/login", HttpMethod.POST));
        assertTrue(filter.isPublicEndpoint("/api/v1/auth/school/activate", HttpMethod.POST));
        // Activation details should be PROTECTED (requires Platform Admin role)
        assertFalse(filter.isPublicEndpoint("/api/v1/auth/admin/activation-details", HttpMethod.GET));
    }
}

