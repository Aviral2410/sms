package com.sms.subscription.security;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.util.Set;
import org.springframework.stereotype.Component;
import org.springframework.web.servlet.HandlerInterceptor;

@Component
public class TenantInterceptor implements HandlerInterceptor {
    private static final String TENANT_HEADER = "X-Tenant-ID";
    private static final String ROLE_HEADER = "X-User-Role";
    private static final Set<String> PLATFORM_ROLES = Set.of("PLATFORM_ADMIN", "SUPER_ADMIN");

    @Override
    public boolean preHandle(HttpServletRequest request, HttpServletResponse response, Object handler) {
        // Platform endpoints should NOT be tenant-filtered; they operate across tenants.
        String role = request.getHeader(ROLE_HEADER);
        if (role != null && PLATFORM_ROLES.contains(role.trim().toUpperCase())) {
            return true;
        }

        String tenantId = request.getHeader(TENANT_HEADER);
        if (tenantId != null) {
            TenantContext.setCurrentTenant(tenantId);
        }
        return true;
    }

    @Override
    public void afterCompletion(HttpServletRequest request, HttpServletResponse response, Object handler, Exception ex) {
        TenantContext.clear();
    }
}
