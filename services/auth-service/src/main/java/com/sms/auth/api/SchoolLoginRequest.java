package com.sms.auth.api;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;

public record SchoolLoginRequest(
        @NotBlank String schoolCode,
        @Email @NotBlank String email,
        @NotBlank String password
) {
}
