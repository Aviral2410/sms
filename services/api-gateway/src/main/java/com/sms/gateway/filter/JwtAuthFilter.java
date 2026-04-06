package com.sms.gateway.filter;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.cloud.gateway.filter.GatewayFilterChain;
import org.springframework.cloud.gateway.filter.GlobalFilter;
import org.springframework.core.Ordered;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;
import org.springframework.http.server.reactive.ServerHttpRequest;
import org.springframework.http.server.reactive.ServerHttpResponse;
import org.springframework.stereotype.Component;
import org.springframework.web.server.ServerWebExchange;
import reactor.core.publisher.Mono;

import java.security.Key;
import java.util.Set;

@Component
public class JwtAuthFilter implements GlobalFilter, Ordered {

    private static final Logger logger = LoggerFactory.getLogger(JwtAuthFilter.class);

    // Must match the secret key in auth-service
    private static final String SECRET_KEY_STRING = "very-secret-key-that-is-at-least-thirty-two-characters-long-for-security";
    private final Key key = Keys.hmacShaKeyFor(SECRET_KEY_STRING.getBytes());

    // Public endpoints that don't require a token
    private static final Set<String> PUBLIC_ENDPOINTS = Set.of(
            "/api/v1/auth/school/login",
            "/api/v1/auth/admin/login",
            "/api/v1/auth/school/activate",
            "/api/v1/auth/activation-details",
            "/api/v1/onboarding/schools/status",
            "/api/v1/subscriptions/plans");

    @Override
    public Mono<Void> filter(ServerWebExchange exchange, GatewayFilterChain chain) {
        ServerHttpRequest request = exchange.getRequest();
        String path = request.getURI().getPath();
        HttpMethod method = request.getMethod();

        if (isPublicEndpoint(path, method)) {
            return chain.filter(exchange);
        }

        if (!request.getHeaders().containsKey(HttpHeaders.AUTHORIZATION)) {
            logger.warn("No authorization header found for private route: {} {}", method, path);
            return onError(exchange, "No authorization header", HttpStatus.UNAUTHORIZED);
        }

        String authHeader = request.getHeaders().getFirst(HttpHeaders.AUTHORIZATION);
        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            logger.warn("Invalid authorization header format for route: {} {}", method, path);
            return onError(exchange, "Invalid authorization header", HttpStatus.UNAUTHORIZED);
        }

        String token = authHeader.substring(7);
        try {
            Claims claims = Jwts.parserBuilder()
                    .setSigningKey(key)
                    .build()
                    .parseClaimsJws(token)
                    .getBody();

            // Overwrite headers with validated claims from JWT
            // This prevents header spoofing from the client
            ServerHttpRequest modifiedRequest = request.mutate()
                    .header("X-User-ID", getClaim(claims, "userId"))
                    .header("X-User-Role", getClaim(claims, "role"))
                    .header("X-Tenant-ID", getClaim(claims, "tenantId"))
                    .header("X-School-ID", getClaim(claims, "schoolId"))
                    .build();

            return chain.filter(exchange.mutate().request(modifiedRequest).build());

        } catch (Exception e) {
            logger.error("Failed to parse/validate JWT token for route: {} {}. Error: {}", method, path,
                    e.getMessage());
            return onError(exchange, "Invalid token", HttpStatus.UNAUTHORIZED);
        }
    }

    private String getClaim(Claims claims, String key) {
        Object value = claims.get(key);
        return value != null ? value.toString() : null;
    }

    boolean isPublicEndpoint(String path, HttpMethod method) {
        // Always allow CORS preflight
        if (method == HttpMethod.OPTIONS) {
            return true;
        }

        String cleanPath = path.endsWith("/") ? path.substring(0, path.length() - 1) : path;

        // POST /api/v1/onboarding/schools is public for registration
        if (cleanPath.equals("/api/v1/onboarding/schools") && method == HttpMethod.POST) {
            return true;
        }

        // Only treat these as public on exact match.
        // Using prefix/startsWith here can accidentally expose protected routes like
        // `/api/v1/onboarding/schools/{id}/review`, which then hit services without
        // gateway-injected role/tenant headers and fail with 403.
        if (PUBLIC_ENDPOINTS.contains(cleanPath)) {
            return true;
        }

        // Public school profile endpoint
        return cleanPath.startsWith("/api/v1/onboarding/schools/public/");
    }

    private Mono<Void> onError(ServerWebExchange exchange, String err, HttpStatus status) {
        ServerHttpResponse response = exchange.getResponse();
        response.setStatusCode(status);
        return response.setComplete();
    }

    @Override
    public int getOrder() {
        return -100; // Run very early
    }
}
