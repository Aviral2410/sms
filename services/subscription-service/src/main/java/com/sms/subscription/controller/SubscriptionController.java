package com.sms.subscription.controller;

import com.sms.common.exception.ForbiddenException;
import com.sms.subscription.api.SubscriptionDtos.*;
import com.sms.subscription.domain.SubscriptionStatus;
import com.sms.subscription.service.SubscriptionService;
import jakarta.validation.Valid;
import java.util.Set;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/subscriptions")
public class SubscriptionController {

    private final SubscriptionService subscriptionService;
    private static final Set<String> PLATFORM_ROLES = Set.of("PLATFORM_ADMIN", "SUPER_ADMIN");

    public SubscriptionController(SubscriptionService subscriptionService) {
        this.subscriptionService = subscriptionService;
    }

    @GetMapping("/plans")
    public List<SubscriptionPlanResponse> listPlans() {
        return subscriptionService.listPlans();
    }

    @PatchMapping("/plans/{planId}")
    public SubscriptionPlanResponse updatePlan(
            @RequestHeader(value = "X-User-Role", required = false) String role,
            @PathVariable UUID planId,
            @Valid @RequestBody SubscriptionPlanUpdateRequest request
    ) {
        requirePlatformRole(role);
        return subscriptionService.updatePlan(planId, request);
    }

    @GetMapping("/current")
    public TenantSubscriptionResponse getCurrentSubscription(@RequestHeader("X-Tenant-ID") UUID tenantId) {
        return subscriptionService.getTenantSubscription(tenantId);
    }

    @PostMapping("/update")
    public TenantSubscriptionResponse updateSubscription(
            @RequestHeader(value = "X-User-Role", required = false) String role,
            @RequestParam UUID tenantId,
            @Valid @RequestBody SubscriptionUpdateRequest request
    ) {
        requirePlatformRole(role);
        return subscriptionService.updateSubscription(tenantId, request);
    }

    @GetMapping("/all")
    public List<TenantSubscriptionResponse> listAllSubscriptions(@RequestHeader(value = "X-User-Role", required = false) String role) {
        requirePlatformRole(role);
        return subscriptionService.listAllSubscriptions();
    }

    @GetMapping("/stats")
    public PlatformStatsResponse getPlatformStats(@RequestHeader(value = "X-User-Role", required = false) String role) {
        requirePlatformRole(role);
        return subscriptionService.getPlatformStats();
    }

    @PostMapping("/status")
    public TenantSubscriptionResponse updateStatus(
            @RequestHeader(value = "X-User-Role", required = false) String role,
            @RequestParam UUID tenantId,
            @RequestParam SubscriptionStatus status
    ) {
        requirePlatformRole(role);
        SubscriptionUpdateRequest request = new SubscriptionUpdateRequest(null, null, status);
        return subscriptionService.updateSubscription(tenantId, request);
    }

    @GetMapping("/check-feature")
    public FeatureCheckResponse checkFeature(@RequestHeader("X-Tenant-ID") UUID tenantId, @RequestParam String featureCode) {
        return subscriptionService.checkFeatureAccess(tenantId, featureCode);
    }

    @PostMapping("/request-upgrade")
    public UpgradeRequestResponse requestUpgrade(@RequestHeader("X-Tenant-ID") UUID tenantId, @Valid @RequestBody UpgradeRequestSubmit request) {
        return subscriptionService.submitUpgradeRequest(tenantId, request);
    }

    @PostMapping("/initialize")
    public TenantSubscriptionResponse initialize(
            @RequestHeader(value = "X-User-Role", required = false) String role,
            @RequestParam UUID tenantId,
            @Valid @RequestBody(required = false) SubscriptionInitializeRequest request
    ) {
        requirePlatformRole(role);
        SubscriptionInitializeRequest body = request == null ? new SubscriptionInitializeRequest(null, null) : request;
        return subscriptionService.initializeSubscription(tenantId, body);
    }

    private static void requirePlatformRole(String role) {
        String normalized = role == null ? "" : role.trim().toUpperCase();
        if (!PLATFORM_ROLES.contains(normalized)) {
            throw new ForbiddenException("Access denied: Requires Platform Admin role.");
        }
    }
}
