package com.sms.schoolops.security;

import java.util.UUID;

/**
 * Unified representation of the authenticated user and their scope.
 */
public record PermissionActor(
        UUID userId,
        UUID schoolId,
        UUID tenantId,
        String email,
        String roleName,
        String fullName
) {
    public boolean isStudent() {
        return "STUDENT".equalsIgnoreCase(roleName);
    }

    public boolean isTeacher() {
        return "TEACHER".equalsIgnoreCase(roleName);
    }

    public boolean isSchoolAdmin() {
        return "SCHOOL_ADMIN".equalsIgnoreCase(roleName) || "PRINCIPAL".equalsIgnoreCase(roleName);
    }

    public boolean isParent() {
        return "PARENT".equalsIgnoreCase(roleName);
    }

    public boolean isSelf(UUID otherUserId) {
        return userId != null && userId.equals(otherUserId);
    }
}
