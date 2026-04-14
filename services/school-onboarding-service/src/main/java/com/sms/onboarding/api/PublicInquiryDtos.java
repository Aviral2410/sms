package com.sms.onboarding.api;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import java.time.Instant;
import java.util.UUID;

public final class PublicInquiryDtos {

    private PublicInquiryDtos() {
    }

    public record PublicInquiryRequest(
            @NotBlank String fullName,
            @Email @NotBlank String email,
            String organization,
            String schoolName,
            String phone,
            @NotBlank String subject,
            @NotBlank String message
    ) {
    }

    public record PublicInquiryResponse(
            UUID inquiryId,
            String inquiryType,
            String status,
            Instant createdAt
    ) {
    }

    public record PlatformPublicInquiryResponse(
            UUID inquiryId,
            String inquiryType,
            String status,
            String fullName,
            String email,
            String organization,
            String schoolName,
            String phone,
            String subject,
            String message,
            Instant createdAt
    ) {
    }

    public record UpdatePublicInquiryStatusRequest(
            @NotBlank String status
    ) {
    }
}
