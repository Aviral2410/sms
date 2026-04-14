package com.sms.auth.api;

import java.util.UUID;

public record ProvisionSchoolResponse(
        UUID tenantId,
        UUID schoolId,
        String schoolName,
        String schoolCode,
        String loginEmail,
        String activationCode,
        String dashboardPath
) {
}
