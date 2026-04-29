package com.sms.auth.api;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;

public class PublicAuthDtos {

    public record ForgotPasswordRequest(
            @NotBlank String schoolCode,
            @Email @NotBlank String email
    ) {}

    public record ForgotPasswordResponse(
            String status,
            String message
    ) {}

    public record VerifyResetCodeRequest(
            @NotBlank String schoolCode,
            @Email @NotBlank String email,
            @NotBlank String code
    ) {}

    public record VerifyResetCodeResponse(
            String resetToken
    ) {}

    public record ResetPasswordRequest(
            @NotBlank String resetToken,
            @NotBlank String newPassword
    ) {}

    public record JoinSchoolPublicRequest(
            @NotBlank String schoolCode,
            @Email @NotBlank String adminEmail,
            @NotBlank String roleName,
            @NotBlank String fullName,
            @Email @NotBlank String email,
            @NotBlank String password,
            String guardianName,
            String guardianPhone
    ) {}

    public record JoinSchoolPublicResponse(
            String status,
            String message
    ) {}
}
