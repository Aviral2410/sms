package com.sms.schoolops.security;

import com.sms.common.exception.ForbiddenException;
import com.sms.common.exception.ServiceUnavailableException;
import com.sms.schoolops.service.SubscriptionService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.time.Duration;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;
import org.springframework.web.servlet.HandlerInterceptor;

/**
 * Service-level entitlement enforcement (authoritative).
 *
 * The gateway also does coarse blocking, but this interceptor ensures direct calls to
 * the service still get 403 when the tenant is not entitled.
 *
 * Important: This relies on gateway-injected headers (X-Tenant-ID) and does not validate JWT.
 */
@Component
public class EntitlementInterceptor implements HandlerInterceptor {
    private static final Logger logger = LoggerFactory.getLogger(EntitlementInterceptor.class);

    private static final String TENANT_HEADER = "X-Tenant-ID";

    private final SubscriptionService subscriptionService;
    private final ConcurrentHashMap<String, CacheEntry> cache = new ConcurrentHashMap<>();
    private final Duration ttl = Duration.ofSeconds(30);

    public EntitlementInterceptor(SubscriptionService subscriptionService) {
        this.subscriptionService = subscriptionService;
    }

    @Override
    public boolean preHandle(HttpServletRequest request, HttpServletResponse response, Object handler) {
        String path = request.getRequestURI();
        String requiredFeature = requiredFeatureForPath(path);
        if (requiredFeature == null) {
            return true;
        }

        UUID tenantId = resolveTenantId(request);
        if (tenantId == null) {
            throw new ForbiddenException("Missing tenant context for entitlement check.");
        }

        String cacheKey = tenantId + "|" + requiredFeature;
        long now = System.currentTimeMillis();
        CacheEntry cached = cache.get(cacheKey);
        if (cached != null && cached.expiresAtEpochMs() > now) {
            if (!cached.allowed()) {
                throw forbiddenForFeature(requiredFeature);
            }
            return true;
        }

        boolean allowed;
        try {
            allowed = subscriptionService.isFeatureAccessibleStrict(tenantId, requiredFeature);
        } catch (ServiceUnavailableException ex) {
            // Preserve 503 mapping and error log from the exception handler.
            logger.error("Entitlement check failed (subscription service unavailable). path={} tenantId={} feature={}",
                    path, tenantId, requiredFeature, ex);
            throw ex;
        }

        cache.put(cacheKey, new CacheEntry(allowed, now + ttl.toMillis()));
        if (!allowed) {
            throw forbiddenForFeature(requiredFeature);
        }
        return true;
    }

    private UUID resolveTenantId(HttpServletRequest request) {
        String raw = request.getHeader(TENANT_HEADER);
        if (raw == null || raw.isBlank()) {
            raw = TenantContext.getCurrentTenant();
        }
        if (raw == null || raw.isBlank()) {
            return null;
        }
        try {
            return UUID.fromString(raw.trim());
        } catch (IllegalArgumentException ex) {
            return null;
        }
    }

    private String requiredFeatureForPath(String path) {
        if (path == null) return null;

        // Internal provisioning/support endpoints are role-gated separately.
        if (path.startsWith("/api/v1/school-ops/internal/")) return null;

        // Let module-specific services enforce premium/advanced entitlements for AI.
        if (path.startsWith("/api/v1/school-ops/ai")) return null;

        // Transport and attendance have their own feature codes.
        if (path.startsWith("/api/v1/school-ops/transport")) return "TRANSPORT_BASE";
        if (path.startsWith("/api/v1/school-ops/attendance")) return "ATTENDANCE";

        // Everything else in school-ops is part of core operations.
        if (path.startsWith("/api/v1/school-ops")) return "SCHOOL_OPS";

        return null;
    }

    private ForbiddenException forbiddenForFeature(String featureCode) {
        if ("SCHOOL_OPS".equals(featureCode)) {
            return new ForbiddenException("School operations are not enabled for the current subscription.");
        }
        if ("ATTENDANCE".equals(featureCode)) {
            return new ForbiddenException("Attendance is not enabled for the current subscription.");
        }
        if ("TRANSPORT_BASE".equals(featureCode)) {
            return new ForbiddenException("Transport is not enabled for the current subscription.");
        }
        return new ForbiddenException("Feature " + featureCode + " is not enabled for the current subscription.");
    }

    private record CacheEntry(boolean allowed, long expiresAtEpochMs) {}
}
