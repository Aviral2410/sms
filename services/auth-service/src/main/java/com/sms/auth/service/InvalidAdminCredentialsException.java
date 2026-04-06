package com.sms.auth.service;

public class InvalidAdminCredentialsException extends RuntimeException {

    public InvalidAdminCredentialsException() {
        super("Invalid credentials.");
    }
}
