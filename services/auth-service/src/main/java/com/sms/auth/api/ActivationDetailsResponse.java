package com.sms.auth.api;

import java.time.Instant;

public record ActivationDetailsResponse(
        String schoolCode,
        String email,
        String activationCode,
        Instant expiresAt
) {
}
