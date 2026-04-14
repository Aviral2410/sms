package com.sms.communication.security;

import com.sms.common.exception.ForbiddenException;
import com.sms.communication.service.SubscriptionServiceClient;
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
 * Gateway also does coarse blocking, but this prevents bypass when calling the service directly.
 */
@Component
public class EntitlementInterceptor implements HandlerInterceptor {
    private static final Logger logger = LoggerFactory.getLogger(EntitlementInterceptor.class);

    private static final Duration TTL = Duration.ofSeconds(30);
    private final ConcurrentHashMap<String, CacheEntry> cache = new ConcurrentHashMap<>();

    private final SubscriptionServiceClient subscriptionServiceClient;

    public EntitlementInterceptor(SubscriptionServiceClient subscriptionServiceClient) {
        this.subscriptionServiceClient = subscriptionServiceClient;
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

        long now = System.currentTimeMillis();
        String cacheKey = tenantId + "|" + requiredFeature;
        CacheEntry cached = cache.get(cacheKey);
        if (cached != null && cached.expiresAtEpochMs() > now) {
            if (!cached.allowed()) {
                throw forbiddenForFeature(requiredFeature);
            }
            return true;
        }

        boolean allowed = subscriptionServiceClient.isFeatureAccessibleStrict(tenantId, requiredFeature);
        cache.put(cacheKey, new CacheEntry(allowed, now + TTL.toMillis()));

        if (!allowed) {
            logger.warn("Entitlement denied. path={} tenantId={} feature={}", path, tenantId, requiredFeature);
            throw forbiddenForFeature(requiredFeature);
        }

        return true;
    }

    private UUID resolveTenantId(HttpServletRequest request) {
        String raw = request.getHeader("X-Tenant-ID");
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
        if (!path.startsWith("/api/v1/communication")) return null;
        return "SCHOOL_OPS";
    }

    private ForbiddenException forbiddenForFeature(String featureCode) {
        if ("SCHOOL_OPS".equals(featureCode)) {
            return new ForbiddenException("Communication is not enabled for the current subscription.");
        }
        return new ForbiddenException("Feature " + featureCode + " is not enabled for the current subscription.");
    }

    private record CacheEntry(boolean allowed, long expiresAtEpochMs) {}
}

