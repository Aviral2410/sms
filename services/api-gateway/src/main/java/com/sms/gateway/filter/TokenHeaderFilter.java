package com.sms.gateway.filter;

import org.springframework.cloud.gateway.filter.GatewayFilterChain;
import org.springframework.cloud.gateway.filter.GlobalFilter;
import org.springframework.core.Ordered;
import org.springframework.http.server.reactive.ServerHttpRequest;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.ReactiveSecurityContextHolder;
import org.springframework.security.core.context.SecurityContext;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationToken;
import org.springframework.stereotype.Component;
import org.springframework.web.server.ServerWebExchange;
import reactor.core.publisher.Mono;

@Component
public class TokenHeaderFilter implements GlobalFilter, Ordered {

    @Override
    public Mono<Void> filter(ServerWebExchange exchange, GatewayFilterChain chain) {
        return ReactiveSecurityContextHolder.getContext()
            .map(SecurityContext::getAuthentication)
            .filter(Authentication::isAuthenticated)
            .filter(auth -> auth instanceof JwtAuthenticationToken)
            .cast(JwtAuthenticationToken.class)
            .map(JwtAuthenticationToken::getToken)
            .flatMap(jwt -> {
                ServerHttpRequest request = exchange.getRequest();
                ServerHttpRequest.Builder builder = request.mutate();
                
                // Extract and inject claims as headers
                injectHeader(builder, jwt, "userId", "X-User-ID");
                injectHeader(builder, jwt, "role", "X-User-Role");
                injectHeader(builder, jwt, "tenantId", "X-Tenant-ID");
                injectHeader(builder, jwt, "schoolId", "X-School-ID");
                injectSubjectHeader(builder, jwt, "X-User-Email");

                return chain.filter(exchange.mutate().request(builder.build()).build());
            })
            .switchIfEmpty(chain.filter(exchange));
    }

    private void injectHeader(ServerHttpRequest.Builder builder, Jwt jwt, String claimKey, String headerName) {
        Object value = jwt.getClaim(claimKey);
        if (value != null) {
            builder.header(headerName, value.toString());
        }
    }

    private void injectSubjectHeader(ServerHttpRequest.Builder builder, Jwt jwt, String headerName) {
        String subject = jwt.getSubject();
        if (subject != null && !subject.isBlank()) {
            builder.header(headerName, subject);
        }
    }

    @Override
    public int getOrder() {
        // Run AFTER security filters (which have order around -100 to 0)
        // But BEFORE other business filters.
        return 0; 
    }
}
