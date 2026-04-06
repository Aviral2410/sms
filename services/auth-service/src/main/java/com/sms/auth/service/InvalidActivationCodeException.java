package com.sms.auth.service;

public class InvalidActivationCodeException extends RuntimeException {

    public InvalidActivationCodeException() {
        super("Invalid or expired activation code.");
    }
}
