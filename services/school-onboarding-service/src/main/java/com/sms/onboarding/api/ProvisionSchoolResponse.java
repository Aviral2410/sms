package com.sms.onboarding.api;

import java.util.UUID;

public record ProvisionSchoolResponse(
    UUID tenantId,
    UUID schoolId,
    String adminEmail,
    String schoolCode,
    String activationCode,
    String loginEmail,
    String dashboardPath
) {}
