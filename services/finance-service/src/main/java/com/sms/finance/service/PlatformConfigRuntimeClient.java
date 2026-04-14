package com.sms.finance.service;

import java.time.Duration;
import java.time.Instant;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;

/**
 * Resolves platform-managed integration settings with a last-known-good cache.
 */
@Service
public class PlatformConfigRuntimeClient {

    private static final Logger logger = LoggerFactory.getLogger(PlatformConfigRuntimeClient.class);
    private static final Duration TTL = Duration.ofMinutes(5);

    private final RestClient restClient;
    private final String internalApiKey;
    private final Map<String, CachedConfig> cache = new ConcurrentHashMap<>();

    public PlatformConfigRuntimeClient(
            RestClient.Builder restClientBuilder,
            @Value("${app.platform-config-service-url}") String platformConfigServiceUrl,
            @Value("${app.internal-api-key}") String internalApiKey
    ) {
        this.restClient = restClientBuilder.baseUrl(platformConfigServiceUrl).build();
        this.internalApiKey = internalApiKey;
    }

    /**
     * Retrieves runtime configuration, falling back to a stale cached value if the platform service is unavailable.
     */
    public RuntimePlatformConfig getRuntimeConfig(String serviceName) {
        String normalized = serviceName == null ? "" : serviceName.trim().toUpperCase();
        CachedConfig cached = this.cache.get(normalized);
        long now = System.currentTimeMillis();
        if (cached != null && cached.expiresAtEpochMs > now) {
            return cached.config();
        }

        try {
            RuntimePlatformConfig response = this.restClient.get()
                    .uri("/api/v1/platform/configs/runtime/{serviceName}", normalized)
                    .header("X-Internal-Api-Key", this.internalApiKey)
                    .accept(MediaType.APPLICATION_JSON)
                    .retrieve()
                    .body(RuntimePlatformConfig.class);
            if (response != null) {
                this.cache.put(normalized, new CachedConfig(response, now + TTL.toMillis()));
                return response;
            }
        } catch (Exception exception) {
            if (cached != null) {
                logger.warn("Falling back to cached platform config. serviceName={} error={}", normalized, exception.getMessage());
                return cached.config();
            }
            logger.warn("Platform config unavailable with no cache. serviceName={} error={}", normalized, exception.getMessage());
        }

        return RuntimePlatformConfig.disabled(normalized);
    }

    public record RuntimePlatformConfig(
            String serviceName,
            String secretValue,
            String apiBaseUrl,
            boolean enabled,
            boolean refreshRequired,
            Map<String, Object> metadata,
            Instant updatedAt
    ) {
        static RuntimePlatformConfig disabled(String serviceName) {
            return new RuntimePlatformConfig(serviceName, "", null, false, false, Map.of(), null);
        }

        boolean hasSecret() {
            return this.secretValue != null && !this.secretValue.isBlank();
        }
    }

    private record CachedConfig(RuntimePlatformConfig config, long expiresAtEpochMs) {
    }
}
