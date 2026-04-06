package com.sms.onboarding.service;

public class InvalidOnboardingTransitionException extends RuntimeException {

    public InvalidOnboardingTransitionException(String message) {
        super(message);
    }
}
