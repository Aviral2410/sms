package com.sms.schoolops.security;

import com.sms.common.exception.ForbiddenException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.util.UUID;
import org.springframework.stereotype.Component;
import org.springframework.web.servlet.HandlerInterceptor;

/**
 * Enforces that request-scoped identifiers provided as query params cannot override
 * the authenticated scope injected by the gateway.
 *
 * This is a defense-in-depth layer while endpoints are migrated to header-only scoping.
 */
@Component
public class ScopeEnforcementInterceptor implements HandlerInterceptor {
    private static final String SCHOOL_HEADER = "X-School-ID";
    private static final String TENANT_HEADER = "X-Tenant-ID";

    @Override
    public boolean preHandle(HttpServletRequest request, HttpServletResponse response, Object handler) {
        enforceUuidParamMatchesHeader(request, "schoolId", SCHOOL_HEADER, "Access denied for the requested school.");
        enforceUuidParamMatchesHeader(request, "tenantId", TENANT_HEADER, "Access denied for the requested tenant.");
        return true;
    }

    private void enforceUuidParamMatchesHeader(HttpServletRequest request, String paramName, String headerName, String forbiddenMessage) {
        String param = request.getParameter(paramName);
        if (param == null || param.isBlank()) {
            return;
        }

        String header = request.getHeader(headerName);
        if (header == null || header.isBlank()) {
            // If there's no header, we can't enforce; endpoints should still validate required scope.
            return;
        }

        UUID paramUuid = parseUuid(param, "Invalid " + paramName + " parameter.");
        UUID headerUuid = parseUuid(header, "Invalid " + headerName + " header.");

        if (!paramUuid.equals(headerUuid)) {
            throw new ForbiddenException(forbiddenMessage);
        }
    }

    private UUID parseUuid(String value, String message) {
        try {
            return UUID.fromString(value.trim());
        } catch (IllegalArgumentException ex) {
            throw new IllegalArgumentException(message);
        }
    }
}

