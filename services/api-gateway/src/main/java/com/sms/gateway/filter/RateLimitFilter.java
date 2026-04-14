package com.sms.gateway.filter;

import java.net.InetSocketAddress;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.atomic.AtomicInteger;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.cloud.gateway.filter.GatewayFilterChain;
import org.springframework.cloud.gateway.filter.GlobalFilter;
import org.springframework.core.Ordered;
import org.springframework.core.io.buffer.DataBuffer;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.server.reactive.ServerHttpRequest;
import org.springframework.http.server.reactive.ServerHttpResponse;
import org.springframework.stereotype.Component;
import org.springframework.data.redis.core.ReactiveStringRedisTemplate;
import org.springframework.web.server.ServerWebExchange;
import reactor.core.publisher.Mono;

/**
 * Fixed-window rate limiting for the most sensitive endpoints.
 *
 * Notes:
 * - Redis is used when available so counters survive across gateway instances.
 * - The in-memory fallback keeps local development working if Redis is unavailable.
 */
@Component
public class RateLimitFilter implements GlobalFilter, Ordered {
    private static final Logger logger = LoggerFactory.getLogger(RateLimitFilter.class);

    private static final String REQUEST_ID_HEADER = "X-Request-ID";

    // Fixed window.
    private static final Duration WINDOW = Duration.ofMinutes(1);

    private final ConcurrentHashMap<String, WindowCounter> counters = new ConcurrentHashMap<>();
    private final ReactiveStringRedisTemplate redisTemplate;

    public RateLimitFilter(ObjectProvider<ReactiveStringRedisTemplate> redisTemplateProvider) {
        this.redisTemplate = redisTemplateProvider.getIfAvailable();
    }

    @Override
    public Mono<Void> filter(ServerWebExchange exchange, GatewayFilterChain chain) {
        ServerHttpRequest request = exchange.getRequest();
        HttpMethod method = request.getMethod();
        String path = request.getURI().getPath();

        if (method == HttpMethod.OPTIONS || path == null) {
            return chain.filter(exchange);
        }

        Integer limit = limitFor(path, method);
        if (limit == null) {
            return chain.filter(exchange);
        }

        String ip = resolveClientIp(exchange);
        String key = ip + "|" + method.name() + "|" + path;
        long windowStart = (System.currentTimeMillis() / WINDOW.toMillis()) * WINDOW.toMillis();

        return incrementCounter(key, windowStart)
                .flatMap(currentCount -> {
                    int remaining = Math.max(0, limit - currentCount);
                    attachRateLimitHeaders(exchange.getResponse(), limit, remaining);

                    if (currentCount > limit) {
                        String requestId = request.getHeaders().getFirst(REQUEST_ID_HEADER);
                        logger.warn("Rate limited request. ip={} method={} path={} requestId={} count={} limit={}",
                                ip, method, path, requestId, currentCount, limit);
                        return onError(exchange, HttpStatus.TOO_MANY_REQUESTS, "Too many requests. Please try again later.");
                    }

                    return chain.filter(exchange);
                });
    }

    private Integer limitFor(String path, HttpMethod method) {
        // Auth endpoints: brute-force targets.
        if (method == HttpMethod.POST && "/api/v1/auth/admin/login".equals(path)) return 10;
        if (method == HttpMethod.POST && "/api/v1/auth/school/login".equals(path)) return 15;
        if (method == HttpMethod.POST && "/api/v1/auth/public/password/verify-code".equals(path)) return 20;
        if (method == HttpMethod.POST && "/api/v1/auth/public/password/forgot".equals(path)) return 10;
        if (method == HttpMethod.POST && "/api/v1/auth/public/password/reset".equals(path)) return 10;
        if (method == HttpMethod.POST && "/api/v1/auth/public/join".equals(path)) return 10;

        // Onboarding registration: also a spam vector.
        if (method == HttpMethod.POST && "/api/v1/onboarding/schools".equals(path)) return 10;

        return null;
    }

    private String resolveClientIp(ServerWebExchange exchange) {
        String xff = exchange.getRequest().getHeaders().getFirst("X-Forwarded-For");
        if (xff != null && !xff.isBlank()) {
            // First hop is original client.
            String first = xff.split(",")[0].trim();
            if (!first.isBlank()) return first;
        }

        InetSocketAddress remote = exchange.getRequest().getRemoteAddress();
        if (remote != null && remote.getAddress() != null) {
            return remote.getAddress().getHostAddress();
        }
        return "unknown";
    }

    private Mono<Integer> incrementCounter(String key, long windowStart) {
        if (this.redisTemplate == null) {
            return Mono.just(localCount(key, windowStart));
        }

        String redisKey = "rate-limit:" + windowStart + ":" + key;
        return this.redisTemplate.opsForValue().increment(redisKey)
                .flatMap(count -> {
                    if (count != null && count == 1L) {
                        return this.redisTemplate.expire(redisKey, WINDOW).thenReturn(count);
                    }
                    return Mono.just(count);
                })
                .map(Long::intValue)
                .onErrorResume(exception -> {
                    logger.warn("Redis rate limit unavailable, falling back to local counter. key={} error={}", redisKey, exception.getMessage());
                    return Mono.just(localCount(key, windowStart));
                });
    }

    private int localCount(String key, long windowStart) {
        WindowCounter counter = counters.compute(key, (k, existing) -> {
            if (existing == null || existing.windowStartEpochMs != windowStart) {
                return new WindowCounter(windowStart, new AtomicInteger(1));
            }
            existing.count.incrementAndGet();
            return existing;
        });
        return counter.count.get();
    }

    private void attachRateLimitHeaders(ServerHttpResponse response, int limit, int remaining) {
        response.getHeaders().set("X-RateLimit-Limit", String.valueOf(limit));
        response.getHeaders().set("X-RateLimit-Remaining", String.valueOf(remaining));
        response.getHeaders().set("X-RateLimit-Window-Seconds", String.valueOf(WINDOW.toSeconds()));
    }

    private Mono<Void> onError(ServerWebExchange exchange, HttpStatus status, String detail) {
        ServerHttpResponse response = exchange.getResponse();
        response.setStatusCode(status);
        response.getHeaders().setContentType(MediaType.APPLICATION_PROBLEM_JSON);

        String requestId = exchange.getRequest().getHeaders().getFirst(REQUEST_ID_HEADER);
        String title = status.getReasonPhrase();
        String body = "{\"title\":\"" + escapeJson(title) + "\","
                + "\"status\":" + status.value() + ","
                + "\"detail\":\"" + escapeJson(detail == null ? "" : detail) + "\""
                + (requestId == null || requestId.isBlank() ? "" : ",\"requestId\":\"" + escapeJson(requestId) + "\"")
                + "}";

        // A minimal Retry-After signal for callers.
        response.getHeaders().set("Retry-After", String.valueOf(WINDOW.toSeconds()));

        DataBuffer buffer = response.bufferFactory().wrap(body.getBytes(StandardCharsets.UTF_8));
        return response.writeWith(Mono.just(buffer));
    }

    private String escapeJson(String value) {
        return value.replace("\\", "\\\\").replace("\"", "\\\"");
    }

    @Override
    public int getOrder() {
        // Run after request-id (-200) but before JWT auth (-100).
        return -150;
    }

    private static final class WindowCounter {
        private final long windowStartEpochMs;
        private final AtomicInteger count;

        private WindowCounter(long windowStartEpochMs, AtomicInteger count) {
            this.windowStartEpochMs = windowStartEpochMs;
            this.count = count;
        }
    }
}
