package com.sms.onboarding.api;

import com.sms.onboarding.domain.OnboardingStatus;

import java.time.Instant;

public record SchoolStatusLookupResponse(
        String schoolName,
        String schoolCode,
        OnboardingStatus status,
        String reviewComment,
        Instant reviewedAt,
        Instant createdAt,
        boolean loginEnabled,
        String loginEmail,
        String dashboardPath
) {
}
