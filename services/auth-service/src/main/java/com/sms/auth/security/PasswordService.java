package com.sms.auth.security;

import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

@Component
public class PasswordService {
    private final PasswordEncoder encoder = new BCryptPasswordEncoder();

    public String hash(String rawPassword) {
        if (rawPassword == null) {
            throw new IllegalArgumentException("Password cannot be null");
        }
        if (rawPassword.isBlank()) {
            throw new IllegalArgumentException("Password cannot be blank");
        }
        return encoder.encode(rawPassword);
    }

    public boolean matches(String rawPassword, String storedValue) {
        if (rawPassword == null || storedValue == null) return false;
        if (isBcryptHash(storedValue)) {
            return encoder.matches(rawPassword, storedValue);
        }
        return storedValue.equals(rawPassword);
    }

    public boolean isBcryptHash(String value) {
        if (value == null) return false;
        // BCrypt hashes start with $2a$, $2b$, or $2y$
        return value.startsWith("$2a$") || value.startsWith("$2b$") || value.startsWith("$2y$");
    }
}

