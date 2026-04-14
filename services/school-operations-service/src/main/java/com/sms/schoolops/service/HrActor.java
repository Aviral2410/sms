package com.sms.schoolops.service;

import java.util.UUID;

public record HrActor(
        UUID tenantId,
        UUID schoolId,
        UUID userId,
        String email,
        String roleName
) {}

