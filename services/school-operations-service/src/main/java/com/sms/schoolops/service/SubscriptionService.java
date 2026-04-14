package com.sms.schoolops.service;

import com.sms.common.exception.ServiceUnavailableException;
import java.net.URI;
import java.time.Duration;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.ResponseEntity;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.client.RestClientException;

@Service
public class SubscriptionService {

    private static final Logger logger = LoggerFactory.getLogger(SubscriptionService.class);
    private static final String TENANT_HEADER = "X-Tenant-ID";
    private static final Duration CACHE_TTL = Duration.ofMinutes(15);

    private final RestTemplate restTemplate;
    private final String subscriptionServiceUrl;
    private final ConcurrentHashMap<String, CacheEntry> featureCache = new ConcurrentHashMap<>();

    public SubscriptionService(RestTemplate restTemplate, 
                               @Value("${app.subscription-service-url}") String subscriptionServiceUrl) {
        this.restTemplate = restTemplate;
        this.subscriptionServiceUrl = subscriptionServiceUrl;
    }

    /**
     * Best-effort feature check for non-critical paths. Failures are logged and treated as "not accessible".
     */
    public boolean isFeatureAccessibleBestEffort(UUID tenantId, String featureCode) {
        try {
            FeatureCheckResponse response = checkFeature(tenantId, featureCode);
            boolean accessible = response != null && response.accessible();
            cacheDecision(tenantId, featureCode, accessible);
            return accessible;
        } catch (Exception e) {
            Boolean cached = getCachedDecision(tenantId, featureCode);
            if (cached != null) {
                logger.warn("Best-effort feature check failed, using cached decision. tenantId={} featureCode={} cachedAccessible={} error={}",
                        tenantId, featureCode, cached, e.getMessage());
                return cached;
            }
            logger.warn("Best-effort feature check failed. tenantId={} featureCode={} error={}", tenantId, featureCode, e.getMessage());
            return false;
        }
    }

    /**
     * Strict feature check for protected endpoints.
     * If we cannot verify entitlements, we fail with 503 instead of silently denying access.
     */
    public boolean isFeatureAccessibleStrict(UUID tenantId, String featureCode) {
        try {
            FeatureCheckResponse response = checkFeature(tenantId, featureCode);
            boolean accessible = response != null && response.accessible();
            cacheDecision(tenantId, featureCode, accessible);
            return accessible;
        } catch (RestClientException exception) {
            Boolean cached = getCachedDecision(tenantId, featureCode);
            if (cached != null) {
                logger.warn("Strict entitlement check failed, using cached decision. tenantId={} featureCode={} cachedAccessible={} error={}",
                        tenantId, featureCode, cached, exception.getMessage());
                return cached;
            }
            logger.error("Strict feature check failed (subscription service unavailable). tenantId={} featureCode={}",
                    tenantId, featureCode, exception);
            throw new ServiceUnavailableException("Unable to verify subscription entitlements. Please try again later.", exception);
        }
    }

    private FeatureCheckResponse checkFeature(UUID tenantId, String featureCode) {
        String url = subscriptionServiceUrl + "/api/v1/subscriptions/check-feature?featureCode=" + featureCode;
        HttpHeaders headers = new HttpHeaders();
        headers.set(TENANT_HEADER, tenantId.toString());
        HttpEntity<Void> entity = new HttpEntity<>(headers);

        ResponseEntity<FeatureCheckResponse> response = restTemplate.exchange(URI.create(url), HttpMethod.GET, entity, FeatureCheckResponse.class);
        return response.getBody();
    }

    private void cacheDecision(UUID tenantId, String featureCode, boolean accessible) {
        this.featureCache.put(cacheKey(tenantId, featureCode), new CacheEntry(accessible, System.currentTimeMillis() + CACHE_TTL.toMillis()));
    }

    private Boolean getCachedDecision(UUID tenantId, String featureCode) {
        CacheEntry cached = this.featureCache.get(cacheKey(tenantId, featureCode));
        if (cached == null || cached.expiresAtEpochMs() <= System.currentTimeMillis()) {
            return null;
        }
        return cached.accessible();
    }

    private String cacheKey(UUID tenantId, String featureCode) {
        return tenantId + "|" + featureCode;
    }

    public record FeatureCheckResponse(boolean accessible, String message) {}
    private record CacheEntry(boolean accessible, long expiresAtEpochMs) {}
}
