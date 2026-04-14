package com.sms.aiinteraction.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ObjectNode;
import com.sms.aiinteraction.api.AiInteractionDtos;
import com.sms.aiinteraction.security.UserContext;
import com.sms.aiinteraction.security.UserRole;
import com.sms.common.exception.ForbiddenException;
import java.time.Duration;
import java.util.LinkedHashMap;
import java.util.Locale;
import java.util.Map;
import java.util.Optional;
import java.util.Set;
import java.util.concurrent.ConcurrentHashMap;
import org.springframework.stereotype.Service;

@Service
public class RateLimitPolicyService {
    private static final String POLICY_CACHE_KEY = "ai:config:tool-rate-limits:v1";
    private static final Set<String> PLAN_CODES = Set.of("FREE", "BASIC", "PREMIUM");

    private final CacheService cacheService;
    private final GatewayApiClient gatewayApiClient;
    private final ObjectMapper objectMapper;
    private final Map<String, CachedPlan> planByTenant = new ConcurrentHashMap<>();

    public RateLimitPolicyService(
            CacheService cacheService,
            GatewayApiClient gatewayApiClient,
            ObjectMapper objectMapper
    ) {
        this.cacheService = cacheService;
        this.gatewayApiClient = gatewayApiClient;
        this.objectMapper = objectMapper;
    }

    public int resolveLimit(UserContext user, String toolName, boolean requiresConfirmation) {
        String plan = resolvePlanCode(user);
        Map<String, Map<String, Integer>> policies = currentPolicies();
        Map<String, Integer> planRules = policies.getOrDefault(plan, defaultPolicyForPlan(plan));
        int fallback = requiresConfirmation ? 20 : 120;
        Integer limit = planRules.get(toolName);
        return limit == null ? fallback : Math.max(1, limit);
    }

    public AiInteractionDtos.RateLimitPolicyResponse readPolicy(UserContext user) {
        ensurePlatformAdmin(user);
        return new AiInteractionDtos.RateLimitPolicyResponse("v1", currentPolicies());
    }

    public AiInteractionDtos.RateLimitPolicyResponse updatePolicy(UserContext user, AiInteractionDtos.PlanToolRateLimits request) {
        ensurePlatformAdmin(user);
        if (request == null || request.limits() == null || request.limits().isEmpty()) {
            throw new IllegalArgumentException("limits payload is required.");
        }

        Map<String, Map<String, Integer>> normalized = normalizePolicy(request.limits());
        ObjectNode node = objectMapper.createObjectNode();
        node.set("limits", objectMapper.valueToTree(normalized));
        cacheService.put(POLICY_CACHE_KEY, node, Duration.ofDays(30));
        return new AiInteractionDtos.RateLimitPolicyResponse("v1", normalized);
    }

    private Map<String, Map<String, Integer>> currentPolicies() {
        Optional<JsonNode> cached = cacheService.get(POLICY_CACHE_KEY);
        if (cached.isPresent() && cached.get().path("limits").isObject()) {
            try {
                @SuppressWarnings("unchecked")
                Map<String, Map<String, Integer>> map = objectMapper.convertValue(
                        cached.get().path("limits"),
                        Map.class
                );
                return normalizePolicy(map);
            } catch (Exception ignored) {
                // fallback to defaults below
            }
        }
        return defaults();
    }

    private String resolvePlanCode(UserContext user) {
        CachedPlan existing = planByTenant.get(user.tenantId().toString());
        long now = System.currentTimeMillis();
        if (existing != null && existing.expiresAtEpochMs > now) {
            return existing.planCode;
        }

        try {
            JsonNode current = gatewayApiClient.get(
                    "/api/v1/subscriptions/current",
                    Map.of(),
                    user.authorization()
            );
            String raw = current.path("planCode").asText("FREE");
            String normalized = normalizePlan(raw);
            planByTenant.put(user.tenantId().toString(), new CachedPlan(normalized, now + Duration.ofMinutes(1).toMillis()));
            return normalized;
        } catch (Exception ex) {
            return "FREE";
        }
    }

    private Map<String, Map<String, Integer>> defaults() {
        Map<String, Map<String, Integer>> out = new LinkedHashMap<>();
        out.put("FREE", defaultPolicyForPlan("FREE"));
        out.put("BASIC", defaultPolicyForPlan("BASIC"));
        out.put("PREMIUM", defaultPolicyForPlan("PREMIUM"));
        return out;
    }

    private Map<String, Integer> defaultPolicyForPlan(String planCode) {
        return switch (planCode) {
            case "FREE" -> Map.of(
                    "getAttendanceReport", 40,
                    "getAnnouncements", 40,
                    "getHomeworkSummary", 30,
                    "getExamResultsSummary", 30,
                    "getTransportOverview", 20,
                    "getFeeDefaulters", 20,
                    "getStudentPerformance", 30,
                    "sendNotification", 5
            );
            case "BASIC" -> Map.of(
                    "getAttendanceReport", 90,
                    "getAnnouncements", 90,
                    "getHomeworkSummary", 70,
                    "getExamResultsSummary", 70,
                    "getTransportOverview", 50,
                    "getFeeDefaulters", 40,
                    "getStudentPerformance", 70,
                    "sendNotification", 15
            );
            case "PREMIUM" -> Map.of(
                    "getAttendanceReport", 200,
                    "getAnnouncements", 200,
                    "getHomeworkSummary", 150,
                    "getExamResultsSummary", 150,
                    "getTransportOverview", 120,
                    "getFeeDefaulters", 100,
                    "getStudentPerformance", 150,
                    "sendNotification", 30
            );
            default -> Map.of();
        };
    }

    private Map<String, Map<String, Integer>> normalizePolicy(Map<String, Map<String, Integer>> raw) {
        Map<String, Map<String, Integer>> normalized = new LinkedHashMap<>();
        for (String plan : PLAN_CODES) {
            Map<String, Integer> defaults = defaultPolicyForPlan(plan);
            Map<String, Integer> merged = new LinkedHashMap<>(defaults);
            Map<String, Integer> incoming = raw.get(plan);
            if (incoming != null) {
                for (Map.Entry<String, Integer> e : incoming.entrySet()) {
                    if (e.getValue() == null || e.getValue() < 1 || e.getValue() > 10000) {
                        throw new IllegalArgumentException("Invalid limit for " + plan + "." + e.getKey());
                    }
                    merged.put(e.getKey(), e.getValue());
                }
            }
            normalized.put(plan, merged);
        }
        return normalized;
    }

    private String normalizePlan(String raw) {
        if (raw == null || raw.isBlank()) return "FREE";
        String upper = raw.trim().toUpperCase(Locale.ROOT);
        return PLAN_CODES.contains(upper) ? upper : "FREE";
    }

    private void ensurePlatformAdmin(UserContext user) {
        if (user.role() != UserRole.PLATFORM_ADMIN) {
            throw new ForbiddenException("Only Platform Admin can manage AI rate-limit policies.");
        }
    }

    private record CachedPlan(String planCode, long expiresAtEpochMs) {}
}
