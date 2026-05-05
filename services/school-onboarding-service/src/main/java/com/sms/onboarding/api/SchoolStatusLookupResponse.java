package com.sms.onboarding.api;

import com.sms.onboarding.domain.OnboardingStatus;

import java.util.UUID;
import java.time.Instant;

public record SchoolStatusLookupResponse(
        String schoolName,
        String schoolCode,
        OnboardingStatus status,
        String statusMessage,
        Instant reviewedAt,
        Instant createdAt,
        boolean activated,
        String loginEmail,
        String dashboardPath,
        UUID tenantId,
        UUID schoolId
) {
}
