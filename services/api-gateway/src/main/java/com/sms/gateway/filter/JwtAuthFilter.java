package com.sms.gateway.filter;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import jakarta.annotation.PostConstruct;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.cloud.gateway.filter.GatewayFilterChain;
import org.springframework.cloud.gateway.filter.GlobalFilter;
import org.springframework.core.Ordered;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.server.reactive.ServerHttpRequest;
import org.springframework.http.server.reactive.ServerHttpResponse;
import org.springframework.stereotype.Component;
import org.springframework.web.server.ServerWebExchange;
import reactor.core.publisher.Mono;

import java.nio.charset.StandardCharsets;
import java.security.Key;
import java.util.Set;

@Component
public class JwtAuthFilter implements GlobalFilter, Ordered {

    private static final Logger logger = LoggerFactory.getLogger(JwtAuthFilter.class);

    @Value("${app.jwt.secret}")
    private String jwtSecret;

    private Key key;

    @PostConstruct
    public void init() {
        if (jwtSecret == null || jwtSecret.isEmpty()) {
            logger.error("JWT Secret is not configured! Authentication will fail.");
            return;
        }
        this.key = Keys.hmacShaKeyFor(jwtSecret.getBytes());
    }

    // Public endpoints that don't require a token
    private static final Set<String> PUBLIC_ENDPOINTS = Set.of(
            "/api/v1/auth/school/login",
            "/api/v1/auth/admin/login",
            "/api/v1/auth/school/activate",
            "/api/v1/auth/public/join",
            "/api/v1/auth/public/password/forgot",
            "/api/v1/auth/public/password/verify-code",
            "/api/v1/auth/public/password/reset",
            "/api/v1/onboarding/schools/status",
            "/api/v1/subscriptions/plans",
            "/api/v1/ai-interaction/chat",
            "/api/v1/ai-interaction/tools",
            "/api/v1/ai-interaction/chats",
            "/api/v1/ai-interaction/actions/confirm",
            "/api/v1/ai-interaction/chat/stream");

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

            // Tenant Boundary Check: Compare pre-resolved X-Tenant-ID with claims
            String hostResolvedTenantId = request.getHeaders().getFirst("X-Tenant-ID");
            String tokenTenantId = getClaim(claims, "tenantId");

            if (hostResolvedTenantId != null && tokenTenantId != null && !hostResolvedTenantId.equals(tokenTenantId)) {
                logger.warn("Tenant mismatch detected! Host resolved: {}, Token: {}. Rejecting request.", 
                        hostResolvedTenantId, tokenTenantId);
                return onError(exchange, "Tenant session mismatch", HttpStatus.FORBIDDEN);
            }

            // Overwrite headers with validated claims from JWT
            // This prevents header spoofing from the client
            ServerHttpRequest.Builder builder = request.mutate();
            injectHeader(builder, claims, "userId", "X-User-ID");
            injectHeader(builder, claims, "role", "X-User-Role");
            injectHeader(builder, claims, "tenantId", "X-Tenant-ID");
            injectHeader(builder, claims, "schoolId", "X-School-ID");
            if (claims.getSubject() != null && !claims.getSubject().isBlank()) {
                builder.header("X-User-Email", claims.getSubject());
            }

            ServerHttpRequest modifiedRequest = builder.build();

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

    private void injectHeader(ServerHttpRequest.Builder builder, Claims claims, String claimKey, String headerName) {
        String value = getClaim(claims, claimKey);
        if (value != null && !value.isBlank()) {
            builder.header(headerName, value);
        }
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

        if (cleanPath.startsWith("/api/v1/ai-interaction/workspaces/")) {
            return true;
        }

        if (cleanPath.startsWith("/api/v1/ai-interaction/chats/")) {
            return true;
        }

        // Public school profile endpoint
        return cleanPath.startsWith("/api/v1/onboarding/schools/public/")
                || cleanPath.startsWith("/api/v1/public/")
                || cleanPath.startsWith("/api/v1/subscriptions/public/");
    }

    private Mono<Void> onError(ServerWebExchange exchange, String err, HttpStatus status) {
        ServerHttpResponse response = exchange.getResponse();
        response.setStatusCode(status);
        response.getHeaders().setContentType(MediaType.APPLICATION_PROBLEM_JSON);
        String requestId = exchange.getRequest().getHeaders().getFirst("X-Request-ID");
        String body = "{\"title\":\"" + escapeJson(status.getReasonPhrase()) + "\","
                + "\"status\":" + status.value() + ","
                + "\"detail\":\"" + escapeJson(err) + "\""
                + (requestId == null || requestId.isBlank() ? "" : ",\"requestId\":\"" + escapeJson(requestId) + "\"")
                + "}";
        return response.writeWith(Mono.just(response.bufferFactory().wrap(body.getBytes(StandardCharsets.UTF_8))));
    }

    private String escapeJson(String value) {
        return value == null ? "" : value.replace("\\", "\\\\").replace("\"", "\\\"");
    }

    @Override
    public int getOrder() {
        return -100; // Run very early
    }
}
