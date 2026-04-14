package com.sms.onboarding.api;

import java.util.UUID;

public record ActivationDetailsResponse(
    String schoolCode,
    String adminEmail,
    String activationCode,
    java.time.Instant expiresAt
) {}
