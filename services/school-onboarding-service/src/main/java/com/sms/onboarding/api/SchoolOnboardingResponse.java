package com.sms.onboarding.api;

import com.sms.onboarding.domain.OnboardingStatus;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

public record SchoolOnboardingResponse(
        UUID onboardingId,
        String schoolName,
        String schoolCode,
        String realmName,
        OnboardingStatus status,
        String boardAffiliation,
        String city,
        String state,
        String adminEmail,
        String reviewedBy,
        String reviewComment,
        Instant reviewedAt,
        UUID tenantId,
        UUID schoolId,
        Instant activatedAt,
        Instant activationSentAt,
        List<String> requiredDocuments,
        String activationCode,
        String selectedPlanCode,
        String logoUrl,
        Boolean usePlatformSubdomain,
        String customDomain,
        String routingStatus,
        String tagline,
        Double latitude,
        Double longitude,
        Boolean hasBranches,
        Boolean isLandingPagePublic,
        UUID logoMediaId,
        UUID bannerMediaId,
        Instant createdAt
) {
}
