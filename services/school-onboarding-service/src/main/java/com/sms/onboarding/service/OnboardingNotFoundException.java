package com.sms.onboarding.service;

import java.util.UUID;

public class OnboardingNotFoundException extends RuntimeException {

    public OnboardingNotFoundException(UUID onboardingId) {
        super("Onboarding record not found for id " + onboardingId);
    }
}
