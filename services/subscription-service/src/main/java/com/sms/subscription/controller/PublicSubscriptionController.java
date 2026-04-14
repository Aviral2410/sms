package com.sms.subscription.controller;

import com.sms.subscription.api.SubscriptionDtos.PublicSubscriptionOverviewResponse;
import com.sms.subscription.api.SubscriptionDtos.SubscriptionPlanResponse;
import com.sms.subscription.service.SubscriptionService;
import java.util.List;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/subscriptions/public")
public class PublicSubscriptionController {

    private final SubscriptionService subscriptionService;

    public PublicSubscriptionController(SubscriptionService subscriptionService) {
        this.subscriptionService = subscriptionService;
    }

    @GetMapping("/plans")
    public List<SubscriptionPlanResponse> listPublicPlans() {
        return subscriptionService.listPlans();
    }

    @GetMapping("/overview")
    public PublicSubscriptionOverviewResponse getPublicOverview() {
        return subscriptionService.getPublicOverview();
    }
}
