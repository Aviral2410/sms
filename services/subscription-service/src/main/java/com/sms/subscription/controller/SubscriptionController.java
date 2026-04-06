package com.sms.subscription.controller;

import com.sms.subscription.api.SubscriptionDtos.*;
import com.sms.subscription.domain.SubscriptionStatus;
import com.sms.subscription.service.SubscriptionService;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/subscriptions")
public class SubscriptionController {

    private final SubscriptionService subscriptionService;

    public SubscriptionController(SubscriptionService subscriptionService) {
        this.subscriptionService = subscriptionService;
    }

    @GetMapping("/plans")
    public List<SubscriptionPlanResponse> listPlans() {
        return subscriptionService.listPlans();
    }

    @GetMapping("/current")
    public TenantSubscriptionResponse getCurrentSubscription(@RequestParam UUID tenantId) {
        return subscriptionService.getTenantSubscription(tenantId);
    }

    @PostMapping("/update")
    public TenantSubscriptionResponse updateSubscription(@RequestParam UUID tenantId, @Valid @RequestBody SubscriptionUpdateRequest request) {
        return subscriptionService.updateSubscription(tenantId, request);
    }

    @GetMapping("/all")
    public List<TenantSubscriptionResponse> listAllSubscriptions() {
        return subscriptionService.listAllSubscriptions();
    }

    @GetMapping("/stats")
    public PlatformStatsResponse getPlatformStats() {
        return subscriptionService.getPlatformStats();
    }

    @PostMapping("/status")
    public TenantSubscriptionResponse updateStatus(@RequestParam UUID tenantId, @RequestParam SubscriptionStatus status) {
        SubscriptionUpdateRequest request = new SubscriptionUpdateRequest(null, status);
        // Note: We need to handle null planId in updateSubscription if we only want to update status
        return subscriptionService.updateSubscription(tenantId, request);
    }

    @GetMapping("/check-feature")
    public FeatureCheckResponse checkFeature(@RequestParam UUID tenantId, @RequestParam String featureCode) {
        return subscriptionService.checkFeatureAccess(tenantId, featureCode);
    }
}
