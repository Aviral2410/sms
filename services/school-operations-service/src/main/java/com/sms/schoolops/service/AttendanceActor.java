package com.sms.schoolops.service;

import java.util.UUID;

public record AttendanceActor(
        UUID userId,
        UUID schoolId,
        UUID tenantId,
        String email,
        String roleName,
        String fullName
) {}
