package com.sms.common.tenant;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.UUID;

@Component
public class TenantContextFilter extends OncePerRequestFilter {

    private static final Logger log = LoggerFactory.getLogger(TenantContextFilter.class);

    /**
     * Canonical tenant header injected by the gateway.
     * We still accept the legacy mixed-case variant for backward compatibility.
     */
    private static final String TENANT_HEADER = "X-Tenant-ID";
    private static final String TENANT_HEADER_LEGACY = "X-Tenant-Id";

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
            throws ServletException, IOException {

        String tenantIdHeader = request.getHeader(TENANT_HEADER);
        if (!StringUtils.hasText(tenantIdHeader)) {
            tenantIdHeader = request.getHeader(TENANT_HEADER_LEGACY);
        }

        if (StringUtils.hasText(tenantIdHeader)) {
            try {
                UUID tenantId = UUID.fromString(tenantIdHeader);
                TenantContext.setTenantId(tenantId);
            } catch (IllegalArgumentException e) {
                // Invalid UUID, ignore or log
                log.warn("Invalid tenant header value: {}", tenantIdHeader);
            }
        }

        try {
            filterChain.doFilter(request, response);
        } finally {
            TenantContext.clear();
        }
    }
}
