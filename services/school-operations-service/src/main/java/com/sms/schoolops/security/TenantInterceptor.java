package com.sms.schoolops.security;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.stereotype.Component;
import org.springframework.web.servlet.HandlerInterceptor;

@Component
public class TenantInterceptor implements HandlerInterceptor {
    private static final String TENANT_HEADER = "X-Tenant-ID";
    private static final String TENANT_HEADER_LEGACY = "X-Tenant-Id";
    private static final String SCHOOL_HEADER = "X-School-ID";
    private static final String SCHOOL_HEADER_LEGACY = "X-School-Id";

    @Override
    public boolean preHandle(HttpServletRequest request, HttpServletResponse response, Object handler) {
        String tenantId = request.getHeader(TENANT_HEADER);
        if (tenantId == null || tenantId.isBlank()) {
            tenantId = request.getHeader(TENANT_HEADER_LEGACY);
        }
        if (tenantId != null && !tenantId.isBlank()) {
            TenantContext.setCurrentTenant(tenantId);
        }

        String schoolId = request.getHeader(SCHOOL_HEADER);
        if (schoolId == null || schoolId.isBlank()) {
            schoolId = request.getHeader(SCHOOL_HEADER_LEGACY);
        }
        if (schoolId != null && !schoolId.isBlank()) {
            SchoolContext.setCurrentSchoolId(schoolId);
        }
        return true;
    }

    @Override
    public void afterCompletion(HttpServletRequest request, HttpServletResponse response, Object handler, Exception ex) {
        TenantContext.clear();
        SchoolContext.clear();
    }
}
