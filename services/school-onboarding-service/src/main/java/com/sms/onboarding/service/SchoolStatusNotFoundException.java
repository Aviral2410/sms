package com.sms.onboarding.service;

public class SchoolStatusNotFoundException extends RuntimeException {

    public SchoolStatusNotFoundException(String schoolCode, String adminEmail) {
        super("No onboarding request found for school code " + schoolCode + " and admin email " + adminEmail);
    }
}
