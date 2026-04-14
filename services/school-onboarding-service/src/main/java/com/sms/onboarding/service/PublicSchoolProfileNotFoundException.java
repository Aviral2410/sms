package com.sms.onboarding.service;

public class PublicSchoolProfileNotFoundException extends RuntimeException {
    public PublicSchoolProfileNotFoundException(String schoolCode) {
        super("Public profile not found for school code: " + schoolCode);
    }
}
