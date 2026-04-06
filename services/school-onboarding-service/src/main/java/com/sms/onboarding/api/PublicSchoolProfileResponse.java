package com.sms.onboarding.api;

import java.util.List;
import java.util.UUID;

public record PublicSchoolProfileResponse(
    UUID onboardingId,
    String schoolName,
    String schoolCode,
    String city,
    String state,
    String vision,
    String mission,
    List<String> achievements,
    List<HouseInfo> houses
) {
    public record HouseInfo(String name, String color, String motto, String icon) {}
}
