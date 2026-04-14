package com.sms.auth.api;

import java.util.UUID;

public record SchoolLoginResponse(
        UUID userId,
        UUID tenantId,
        UUID schoolId,
        String schoolName,
        String schoolCode,
        String email,
        String fullName,
        String role,
        String theme,
        String activeTheme,
        String vibe,
        String accentColor,
        Double glassIntensity,
        String borderRadius,
        String token
) {
}
