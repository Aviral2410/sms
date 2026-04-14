package com.sms.onboarding.service;

public class PlatformConfigNotFoundException extends RuntimeException {

    public PlatformConfigNotFoundException(String serviceName) {
        super("Platform config not found for service: " + serviceName);
    }
}
