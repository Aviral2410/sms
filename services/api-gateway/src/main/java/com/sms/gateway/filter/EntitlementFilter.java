package com.sms.gateway.filter;

import java.time.Duration;
import java.nio.charset.StandardCharsets;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.core.io.buffer.DataBuffer;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.cloud.gateway.filter.GatewayFilterChain;
import org.springframework.cloud.gateway.filter.GlobalFilter;
import org.springframework.core.Ordered;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.server.reactive.ServerHttpRequest;
import org.springframework.http.server.reactive.ServerHttpResponse;
import org.springframework.stereotype.Component;
import org.springframework.web.reactive.function.client.WebClient;
import org.springframework.web.server.ServerWebExchange;
import reactor.core.publisher.Mono;

/**
 * Coarse entitlement enforcement at the gateway for defense-in-depth.
 * Services still enforce entitlements authoritatively.
 */
@Component
public class EntitlementFilter implements GlobalFilter, Ordered {
    private static final Logger logger = LoggerFactory.getLogger(EntitlementFilter.class);

    private static final String TENANT_HEADER = "X-Tenant-ID";
    private static final String REQUEST_ID_HEADER = "X-Request-ID";

    private final WebClient webClient;
    private final Duration ttl = Duration.ofSeconds(30);

    private final ConcurrentHashMap<String, CacheEntry> cache = new ConcurrentHashMap<>();

    public EntitlementFilter(WebClient.Builder webClientBuilder,
                             @Value("${app.subscription-service-url}") String subscriptionServiceUrl) {
        this.webClient = webClientBuilder.baseUrl(subscriptionServiceUrl).build();
    }

    @Override
    public Mono<Void> filter(ServerWebExchange exchange, GatewayFilterChain chain) {
        ServerHttpRequest request = exchange.getRequest();
        String path = request.getURI().getPath();

        String requiredFeature = requiredFeatureForPath(path);
        if (requiredFeature == null) {
            return chain.filter(exchange);
        }

        String tenantId = request.getHeaders().getFirst(TENANT_HEADER);
        if (tenantId == null || tenantId.isBlank()) {
            logger.warn("Entitlement check skipped: missing tenant header. path={}", path);
            return onError(exchange, HttpStatus.FORBIDDEN, "Missing tenant context for entitlement check.");
        }

        String cacheKey = tenantId + "|" + requiredFeature;
        CacheEntry cached = cache.get(cacheKey);
        long now = System.currentTimeMillis();
        if (cached != null && cached.expiresAtEpochMs > now) {
            return cached.allowed ? chain.filter(exchange) : onError(exchange, HttpStatus.FORBIDDEN, "Feature is not enabled for the current subscription.");
        }

        String requestId = request.getHeaders().getFirst(REQUEST_ID_HEADER);

        return webClient.get()
                .uri(uriBuilder -> uriBuilder
                        .path("/api/v1/subscriptions/check-feature")
                        .queryParam("featureCode", requiredFeature)
                        .build())
                .header(TENANT_HEADER, tenantId)
                .headers(headers -> {
                    if (requestId != null && !requestId.isBlank()) {
                        headers.set(REQUEST_ID_HEADER, requestId);
                    }
                })
                .retrieve()
                .bodyToMono(FeatureCheckResponse.class)
                .timeout(Duration.ofSeconds(2))
                .flatMap(resp -> {
                    boolean allowed = resp != null && resp.accessible();
                    cache.put(cacheKey, new CacheEntry(allowed, now + ttl.toMillis()));
                    return allowed ? chain.filter(exchange) : onError(exchange, HttpStatus.FORBIDDEN, "Feature is not enabled for the current subscription.");
                })
                .onErrorResume(ex -> {
                    CacheEntry stale = cache.get(cacheKey);
                    if (stale != null) {
                        logger.warn("Entitlement check failed, using cached decision. path={} tenantId={} feature={} cachedAllowed={}",
                                path, tenantId, requiredFeature, stale.allowed(), ex);
                        return stale.allowed() ? chain.filter(exchange) : onError(exchange, HttpStatus.FORBIDDEN, "Feature is not enabled for the current subscription.");
                    }
                    logger.error("Entitlement check failed. path={} tenantId={} feature={}", path, tenantId, requiredFeature, ex);
                    return onError(exchange, HttpStatus.SERVICE_UNAVAILABLE, "Unable to verify subscription entitlements. Please try again later.");
                });
    }

    private String requiredFeatureForPath(String path) {
        if (path == null) return null;

        if (path.startsWith("/api/v1/communication")) return "SCHOOL_OPS";

        if (path.startsWith("/api/v1/school-ops/transport")) return "TRANSPORT_BASE";
        if (path.startsWith("/api/v1/school-ops/attendance")) return "ATTENDANCE";
        if (path.startsWith("/api/v1/school-ops/fees")) return "SCHOOL_OPS";
        if (path.startsWith("/api/v1/school-ops/hr")) return "SCHOOL_OPS";
        if (path.startsWith("/api/v1/school-ops/admissions")) return "SCHOOL_OPS";
        if (path.startsWith("/api/v1/school-ops/teacher-workspace")) return "SCHOOL_OPS";
        if (path.startsWith("/api/v1/school-ops/student-workspace")) return "SCHOOL_OPS";
        if (path.startsWith("/api/v1/school-ops/parent-workspace")) return "SCHOOL_OPS";
        if (path.startsWith("/api/v1/school-ops/me/")) return "SCHOOL_OPS";

        return null;
    }

    private Mono<Void> onError(ServerWebExchange exchange, HttpStatus status, String detail) {
        ServerHttpResponse response = exchange.getResponse();
        response.setStatusCode(status);

        response.getHeaders().setContentType(MediaType.APPLICATION_PROBLEM_JSON);
        String requestId = exchange.getRequest().getHeaders().getFirst(REQUEST_ID_HEADER);
        String title = status == HttpStatus.FORBIDDEN ? "Forbidden" : status.getReasonPhrase();

        String body = "{\"title\":\"" + escapeJson(title) + "\","
                + "\"status\":" + status.value() + ","
                + "\"detail\":\"" + escapeJson(detail == null ? "" : detail) + "\""
                + (requestId == null || requestId.isBlank() ? "" : ",\"requestId\":\"" + escapeJson(requestId) + "\"")
                + "}";

        DataBuffer buffer = response.bufferFactory().wrap(body.getBytes(StandardCharsets.UTF_8));
        return response.writeWith(Mono.just(buffer));
    }

    private String escapeJson(String value) {
        return value.replace("\\", "\\\\").replace("\"", "\\\"");
    }

    @Override
    public int getOrder() {
        // Run after JwtAuthFilter (-100) so tenant headers are present.
        return -90;
    }

    private record CacheEntry(boolean allowed, long expiresAtEpochMs) {}
    private record FeatureCheckResponse(boolean accessible, String message) {}
}
