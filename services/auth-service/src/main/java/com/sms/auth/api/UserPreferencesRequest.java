package com.sms.auth.api;

public record UserPreferencesRequest(
        String theme,
        String activeTheme,
        String vibe,
        String accentColor,
        Double glassIntensity,
        String borderRadius
) {
}
