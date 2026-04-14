package com.sms.onboarding.api;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public record OnboardingReviewRequest(
        @NotNull OnboardingReviewAction action,
        @NotBlank String reviewerName,
        String comment
) {
}
