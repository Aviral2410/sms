package com.sms.onboarding.api;

import java.util.UUID;

public record ProvisionSchoolRequest(
    String schoolName,
    String schoolCode,
    String realmName,
    String contactEmail
) {}
