package com.sms.auth.api;

public record AdminLoginResponse(
        String userId,
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
