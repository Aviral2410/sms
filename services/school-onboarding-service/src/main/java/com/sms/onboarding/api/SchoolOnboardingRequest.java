package com.sms.onboarding.api;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;

public record SchoolOnboardingRequest(
        @NotBlank String schoolName,
        @NotBlank String schoolCode,
        @NotBlank String boardAffiliation,
        @NotBlank String contactPhone,
        @Email @NotBlank String contactEmail,
        @NotBlank String addressLine,
        @NotBlank String city,
        @NotBlank String state,
        @NotBlank String country,
        @NotBlank String postalCode
) {
}
