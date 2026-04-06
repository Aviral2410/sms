package com.sms.subscription.service;

import com.sms.subscription.api.SubscriptionDtos.*;
import com.sms.subscription.domain.*;
import com.sms.subscription.event.MqttEventPublisher;
import com.sms.subscription.repository.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
public class SubscriptionService {

    private final SubscriptionPlanRepository planRepository;
    private final TenantSubscriptionRepository subscriptionRepository;
    private final MqttEventPublisher mqttEventPublisher;

    public SubscriptionService(SubscriptionPlanRepository planRepository, 
                               TenantSubscriptionRepository subscriptionRepository,
                               MqttEventPublisher mqttEventPublisher) {
        this.planRepository = planRepository;
        this.subscriptionRepository = subscriptionRepository;
        this.mqttEventPublisher = mqttEventPublisher;
    }

    public List<SubscriptionPlanResponse> listPlans() {
        return planRepository.findAll().stream()
                .map(this::toPlanResponse)
                .toList();
    }

    public TenantSubscriptionResponse getTenantSubscription(UUID tenantId) {
        TenantSubscriptionEntity entity = subscriptionRepository.findByTenantId(tenantId)
                .orElse(createDefaultSubscription(tenantId));

        SubscriptionPlanEntity plan = planRepository.findById(entity.getPlanId()).orElse(null);
        String planName = plan != null ? plan.getPlanName() : "Unknown";

        return new TenantSubscriptionResponse(
                entity.getSubscriptionId(),
                entity.getTenantId(),
                entity.getPlanId(),
                planName,
                entity.getStatus(),
                entity.getStartDate(),
                entity.getEndDate(),
                entity.getTrialEndDate()
        );
    }

    @Transactional
    public TenantSubscriptionResponse updateSubscription(UUID tenantId, SubscriptionUpdateRequest request) {
        TenantSubscriptionEntity entity = subscriptionRepository.findByTenantId(tenantId)
                .orElse(createDefaultSubscription(tenantId));

        entity.setPlanId(request.planId());
        if (request.status() != null) {
            entity.setStatus(request.status());
        }
        subscriptionRepository.save(entity);

        TenantSubscriptionResponse response = getTenantSubscription(tenantId);
        mqttEventPublisher.publish("platform/subscriptions/updated", response);
        return response;
    }

    public List<TenantSubscriptionResponse> listAllSubscriptions() {
        List<SubscriptionPlanEntity> plans = planRepository.findAll();
        Map<UUID, String> planNames = plans.stream()
                .collect(Collectors.toMap(SubscriptionPlanEntity::getPlanId, SubscriptionPlanEntity::getPlanName));

        return subscriptionRepository.findAll().stream()
                .map(entity -> new TenantSubscriptionResponse(
                        entity.getSubscriptionId(),
                        entity.getTenantId(),
                        entity.getPlanId(),
                        planNames.getOrDefault(entity.getPlanId(), "Unknown"),
                        entity.getStatus(),
                        entity.getStartDate(),
                        entity.getEndDate(),
                        entity.getTrialEndDate()
                ))
                .toList();
    }

    public PlatformStatsResponse getPlatformStats() {
        List<TenantSubscriptionEntity> activeSubscriptions = subscriptionRepository.findAll().stream()
                .filter(s -> s.getStatus() == SubscriptionStatus.ACTIVE || s.getStatus() == SubscriptionStatus.TRIAL)
                .toList();

        List<SubscriptionPlanEntity> plans = planRepository.findAll();
        Map<UUID, SubscriptionPlanEntity> planMap = plans.stream()
                .collect(Collectors.toMap(SubscriptionPlanEntity::getPlanId, p -> p));

        BigDecimal mrr = activeSubscriptions.stream()
                .map(s -> planMap.get(s.getPlanId()) != null ? planMap.get(s.getPlanId()).getMonthlyPrice() : BigDecimal.ZERO)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        long capacity = activeSubscriptions.stream()
                .mapToLong(s -> planMap.get(s.getPlanId()) != null ? planMap.get(s.getPlanId()).getMaxStudents() : 0)
                .sum();

        return new PlatformStatsResponse(
                activeSubscriptions.size(),
                mrr,
                capacity,
                plans.size()
        );
    }

    public FeatureCheckResponse checkFeatureAccess(UUID tenantId, String featureCode) {
        TenantSubscriptionEntity subscription = subscriptionRepository.findByTenantId(tenantId).orElse(null);
        if (subscription == null || subscription.getStatus() != SubscriptionStatus.ACTIVE && subscription.getStatus() != SubscriptionStatus.TRIAL) {
            return new FeatureCheckResponse(false, "No active subscription found for this tenant.");
        }

        SubscriptionPlanEntity plan = planRepository.findById(subscription.getPlanId()).orElse(null);
        if (plan == null) {
            return new FeatureCheckResponse(false, "Assigned plan not found.");
        }

        // Feature gating logic: plan.getFeatures() contains accessible feature codes
        if (plan.getFeatures().contains("*") || plan.getFeatures().contains(featureCode)) {
            return new FeatureCheckResponse(true, "Feature accessible.");
        }

        return new FeatureCheckResponse(false, "Feature '" + featureCode + "' is not included in your '" + plan.getPlanName() + "' plan.");
    }

    private TenantSubscriptionEntity createDefaultSubscription(UUID tenantId) {
        // Find 'BASIC' plan as default
        SubscriptionPlanEntity basicPlan = planRepository.findByPlanCode("BASIC")
                .orElseThrow(() -> new IllegalStateException("Default BASIC plan not found in system."));

        TenantSubscriptionEntity entity = new TenantSubscriptionEntity();
        entity.setSubscriptionId(UUID.randomUUID());
        entity.setTenantId(tenantId);
        entity.setPlanId(basicPlan.getPlanId());
        entity.setStatus(SubscriptionStatus.TRIAL);
        entity.setStartDate(Instant.now());
        entity.setTrialEndDate(Instant.now().plus(java.time.Duration.ofDays(14)));
        return subscriptionRepository.save(entity);
    }

    private SubscriptionPlanResponse toPlanResponse(SubscriptionPlanEntity plan) {
        return new SubscriptionPlanResponse(
                plan.getPlanId(),
                plan.getPlanName(),
                plan.getPlanCode(),
                plan.getDescription(),
                plan.getMonthlyPrice(),
                plan.getMaxStudents(),
                plan.getMaxParentsPerStudent(),
                plan.getFeatures(),
                plan.getCreatedAt()
        );
    }
}
