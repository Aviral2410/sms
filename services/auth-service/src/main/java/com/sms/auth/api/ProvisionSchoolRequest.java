package com.sms.auth.api;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;

public record ProvisionSchoolRequest(
        @NotBlank String schoolName,
        @NotBlank String schoolCode,
        String realmName,
        @Email @NotBlank String contactEmail
) {
}
