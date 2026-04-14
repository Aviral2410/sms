package com.sms.onboarding.service;

public record ProvisionSchoolRequest(
        String schoolName,
        String schoolCode,
        String contactEmail
) {
}
