package com.sms.auth.api;

public record SchoolActivationResponse(
        String schoolCode,
        String email,
        String fullName,
        String status
) {
}
