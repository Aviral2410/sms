package com.sms.onboarding.api;

import java.util.UUID;

public record SchoolBrandingResponse(
        UUID onboardingId,
        UUID schoolId,
        String schoolName,
        String schoolCode,
        String city,
        String state,
        String logoUrl
) {
}
