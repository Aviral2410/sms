package com.sms.gateway.filter;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.cloud.gateway.filter.GatewayFilterChain;
import org.springframework.cloud.gateway.filter.GlobalFilter;
import org.springframework.core.Ordered;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.server.reactive.ServerHttpRequest;
import org.springframework.stereotype.Component;
import org.springframework.web.reactive.function.client.WebClient;
import org.springframework.web.server.ServerWebExchange;
import reactor.core.publisher.Mono;

import java.util.Map;
import java.util.Set;
import java.util.concurrent.ConcurrentHashMap;

@Component
public class TenantResolutionFilter implements GlobalFilter, Ordered {

    private static final Logger logger = LoggerFactory.getLogger(TenantResolutionFilter.class);

    @Value("${app.platform-domain:platform.com}")
    private String platformDomain;

    @Value("${app.auth-service-url:http://localhost:8082}")
    private String authServiceUrl;

    private final WebClient webClient;
    
    // Simple cache to avoid hitting auth-service for every request
    // In production, use Redis
    private final Map<String, Map> hostCache = new ConcurrentHashMap<>();

    private static final Set<String> RESERVED_SUBDOMAINS = Set.of(
            "admin", "portal", "api", "system", "www", "support", "auth", "static", "mcp"
    );

    public TenantResolutionFilter(WebClient.Builder webClientBuilder) {
        this.webClient = webClientBuilder.build();
    }

    @Override
    public Mono<Void> filter(ServerWebExchange exchange, GatewayFilterChain chain) {
        ServerHttpRequest request = exchange.getRequest();
        String host = request.getHeaders().getFirst(HttpHeaders.HOST);

        if (host == null || host.isBlank()) {
            return chain.filter(exchange);
        }

        // 1. Check for Reserved Subdomains (Bypass)
        String subdomain = extractSubdomain(host);
        if (subdomain != null && RESERVED_SUBDOMAINS.contains(subdomain.toLowerCase())) {
            logger.debug("Reserved subdomain detected: {}. Bypassing tenant resolution.", subdomain);
            return chain.filter(exchange);
        }

        // 2. Resolve Tenant
        return resolveTenant(host)
                .flatMap(response -> {
                    if (response.containsKey("redirectUrl")) {
                        String redirectUrl = response.get("redirectUrl").toString();
                        String originalPath = request.getURI().getPath();
                        String query = request.getURI().getQuery();
                        String newUrl = "https://" + redirectUrl + originalPath + (query != null ? "?" + query : "");
                        
                        logger.info("Redirecting host {} to canonical host {}", host, redirectUrl);
                        exchange.getResponse().setStatusCode(HttpStatus.MOVED_PERMANENTLY);
                        exchange.getResponse().getHeaders().set(HttpHeaders.LOCATION, newUrl);
                        return exchange.getResponse().setComplete();
                    }

                    if (response.containsKey("tenantId")) {
                        String tenantId = response.get("tenantId").toString();
                        logger.debug("Resolved host {} to tenant {}", host, tenantId);
                        ServerHttpRequest modifiedRequest = request.mutate()
                                .header("X-Tenant-ID", tenantId)
                                .build();
                        return chain.filter(exchange.mutate().request(modifiedRequest).build());
                    }
                    return chain.filter(exchange);
                })
                .onErrorResume(e -> {
                    logger.error("Error resolving tenant for host {}: {}", host, e.getMessage());
                    return chain.filter(exchange);
                });
    }

    private String extractSubdomain(String host) {
        String[] parts = host.split("\\.");
        if (parts.length >= 3) {
            // Check if the domain matches platformDomain
            if (host.toLowerCase().endsWith("." + platformDomain.toLowerCase())) {
                return parts[0];
            }
        }
        return null;
    }

    private Mono<Map> resolveTenant(String host) {
        if (hostCache.containsKey(host)) {
            return Mono.just(hostCache.get(host));
        }

        return webClient.get()
                .uri(authServiceUrl + "/public/tenant/resolve?host=" + host)
                .retrieve()
                .bodyToMono(Map.class)
                .doOnNext(response -> {
                    if (response != null && !response.containsKey("error")) {
                        hostCache.put(host, response);
                    }
                })
                .defaultIfEmpty(java.util.Collections.emptyMap());
    }

    @Override
    public int getOrder() {
        return -200; // Run before JwtAuthFilter (-100)
    }
}
