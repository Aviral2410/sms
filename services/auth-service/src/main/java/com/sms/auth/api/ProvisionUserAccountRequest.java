package com.sms.auth.api;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.util.UUID;

public record ProvisionUserAccountRequest(
        @NotNull UUID tenantId,
        @NotNull UUID schoolId,
        @NotBlank String schoolCode,
        @NotBlank String schoolName,
        @Email @NotBlank String email,
        @NotBlank String fullName,
        @NotBlank String roleName,
        String accessKey
) {
}
