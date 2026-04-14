package com.sms.aiinteraction.security;

import java.util.UUID;

public record UserContext(
        UUID userId,
        UUID tenantId,
        UUID schoolId,
        String email,
        String rawRole,
        UserRole role,
        String authorization,
        String requestId
) {}
