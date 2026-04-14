package com.sms.aiinteraction.security;

import java.util.Locale;

public enum UserRole {
    PLATFORM_ADMIN,
    SCHOOL_ADMIN,
    TEACHER,
    PARENT,
    STUDENT,
    STAFF,
    UNKNOWN;

    public static UserRole fromRaw(String value) {
        if (value == null || value.isBlank()) return UNKNOWN;
        String role = value.trim().toUpperCase(Locale.ROOT);
        return switch (role) {
            case "PLATFORM_ADMIN", "SUPER_ADMIN" -> PLATFORM_ADMIN;
            case "SCHOOL_ADMIN", "PRINCIPAL", "MANAGER", "TRANSPORT_MANAGER" -> SCHOOL_ADMIN;
            case "TEACHER" -> TEACHER;
            case "PARENT" -> PARENT;
            case "STUDENT" -> STUDENT;
            case "STAFF", "DRIVER", "CONDUCTOR" -> STAFF;
            default -> UNKNOWN;
        };
    }
}
