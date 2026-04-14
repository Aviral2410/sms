package com.sms.auth.service;

public class ActivationDetailsNotFoundException extends RuntimeException {

    public ActivationDetailsNotFoundException(String schoolCode, String email) {
        super("No active activation code found for school " + schoolCode + " and email " + email + ".");
    }
}
