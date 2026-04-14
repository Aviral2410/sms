package com.sms.aiinteraction.security;

import jakarta.servlet.http.HttpServletRequest;
import java.util.UUID;
import org.springframework.stereotype.Component;

@Component
public class UserContextResolver {

    public UserContext resolve(HttpServletRequest request) {
        String authorization = request.getHeader("Authorization");
        if (authorization == null || authorization.isBlank()) {
            throw new IllegalArgumentException("Missing Authorization header.");
        }

        String rawRole = requiredHeader(request, "X-User-Role");
        UserRole role = UserRole.fromRaw(rawRole);
        UUID userId = parseUuid(requiredHeader(request, "X-User-ID"));
        UUID tenantId = parseOptionalUuid(request.getHeader("X-Tenant-ID"));
        UUID schoolId = parseOptionalUuid(request.getHeader("X-School-ID"));
        String email = requiredHeader(request, "X-User-Email");
        String requestId = request.getHeader("X-Request-ID");
        if (requestId == null || requestId.isBlank()) {
            requestId = UUID.randomUUID().toString();
        }

        if (tenantId == null || schoolId == null) {
            if (role == UserRole.PLATFORM_ADMIN) {
                UUID zero = new UUID(0L, 0L);
                if (tenantId == null) tenantId = zero;
                if (schoolId == null) schoolId = zero;
            } else {
                throw new IllegalArgumentException("Missing tenant or school scope headers.");
            }
        }

        return new UserContext(
                userId,
                tenantId,
                schoolId,
                email,
                rawRole,
                role,
                authorization,
                requestId
        );
    }

    private String requiredHeader(HttpServletRequest request, String key) {
        String value = request.getHeader(key);
        if (value == null || value.isBlank()) {
            throw new IllegalArgumentException("Missing " + key + " header.");
        }
        return value.trim();
    }

    private UUID parseUuid(String value) {
        try {
            return UUID.fromString(value);
        } catch (IllegalArgumentException ex) {
            throw new IllegalArgumentException("Invalid UUID header value: " + value);
        }
    }

    private UUID parseOptionalUuid(String value) {
        if (value == null || value.isBlank()) return null;
        try {
            return UUID.fromString(value.trim());
        } catch (IllegalArgumentException ex) {
            throw new IllegalArgumentException("Invalid UUID header value: " + value);
        }
    }
}
