package com.sms.auth.api;

import jakarta.validation.constraints.Email;

public record UpdateUserRequest(
        String fullName,
        @Email String email,
        String theme,
        String activeTheme,
        String vibe,
        String accentColor,
        Double glassIntensity,
        String borderRadius
) {}
