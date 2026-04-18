package com.sms.gateway.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.reactive.CorsWebFilter;
import org.springframework.web.cors.reactive.UrlBasedCorsConfigurationSource;
import org.springframework.security.config.annotation.web.reactive.EnableWebFluxSecurity;
import org.springframework.security.config.web.server.ServerHttpSecurity;
import org.springframework.security.oauth2.jwt.NimbusReactiveJwtDecoder;
import org.springframework.security.oauth2.jwt.ReactiveJwtDecoder;
import org.springframework.security.web.server.SecurityWebFilterChain;

import javax.crypto.spec.SecretKeySpec;
import java.util.List;

@Configuration
@EnableWebFluxSecurity
public class SecurityConfig {

    @Value("${app.jwt.secret}")
    private String jwtSecret;

    @Bean
    public SecurityWebFilterChain springSecurityFilterChain(ServerHttpSecurity http) {
        http
            .csrf(ServerHttpSecurity.CsrfSpec::disable)
            .authorizeExchange(exchanges -> exchanges
                // Public endpoints
                .pathMatchers(HttpMethod.OPTIONS).permitAll()
                .pathMatchers("/health").permitAll()
                .pathMatchers("/actuator/health/**").permitAll()
                .pathMatchers("/api/v1/auth/school/login").permitAll()
                .pathMatchers("/api/v1/auth/admin/login").permitAll()
                .pathMatchers("/api/v1/auth/school/activate").permitAll()
                .pathMatchers(HttpMethod.POST, "/api/v1/auth/public/join").permitAll()
                .pathMatchers(HttpMethod.POST, "/api/v1/auth/public/password/forgot").permitAll()
                .pathMatchers(HttpMethod.POST, "/api/v1/auth/public/password/verify-code").permitAll()
                .pathMatchers(HttpMethod.POST, "/api/v1/auth/public/password/reset").permitAll()
                .pathMatchers("/api/v1/onboarding/schools/status").permitAll()
                .pathMatchers("/api/v1/subscriptions/plans").permitAll()
                .pathMatchers("/api/v1/subscriptions/public/**").permitAll()
                .pathMatchers("/api/v1/public/**").permitAll()
                // POST /api/v1/onboarding/schools is public for registration
                .pathMatchers(HttpMethod.POST, "/api/v1/onboarding/schools").permitAll()
                // Public school profile
                .pathMatchers("/api/v1/onboarding/schools/public/**").permitAll()
                // All other requests require authentication
                .anyExchange().authenticated()
            )
            .oauth2ResourceServer(oauth2 -> oauth2
                .jwt(jwt -> jwt.jwtDecoder(jwtDecoder()))
            );

        return http.build();
    }

    @Bean
    public ReactiveJwtDecoder jwtDecoder() {
        // Shared secret key for JWT validation
        byte[] keyBytes = jwtSecret.getBytes();
        SecretKeySpec secretKey = new SecretKeySpec(keyBytes, "HmacSHA256");
        return NimbusReactiveJwtDecoder.withSecretKey(secretKey).build();
    }

    @Bean
    public CorsWebFilter corsWebFilter() {
        CorsConfiguration config = new CorsConfiguration();
        // Support local frontend access via Vite, NodePort, and direct gateway testing.
        config.setAllowedOriginPatterns(List.of(
                "http://localhost:*",
                "http://127.0.0.1:*"
        ));
        config.setAllowedMethods(List.of("GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"));
        config.setAllowedHeaders(List.of(
                "Authorization",
                "Content-Type",
                "X-Request-ID",
                "X-User-ID",
                "X-User-Role",
                "X-Tenant-ID",
                "X-School-ID",
                "X-User-Email"
        ));
        config.setAllowCredentials(true);
        config.setMaxAge(3600L);

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", config);
        return new CorsWebFilter(source);
    }
}
