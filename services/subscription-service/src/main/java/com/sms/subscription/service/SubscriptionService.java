package com.sms.subscription.service;

import com.sms.common.exception.NotFoundException;
import com.sms.subscription.api.SubscriptionDtos.*;
import com.sms.subscription.domain.*;
import com.sms.subscription.event.MqttEventPublisher;
import com.sms.subscription.repository.*;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.Arrays;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
public class SubscriptionService {

    private static final Logger logger = LoggerFactory.getLogger(SubscriptionService.class);

    private final SubscriptionPlanRepository planRepository;
    private final TenantSubscriptionRepository subscriptionRepository;
    private final UpgradeRequestRepository upgradeRequestRepository;
    private final PublicSubscriptionAnalyticsRepository publicSubscriptionAnalyticsRepository;
    private final MqttEventPublisher mqttEventPublisher;

    public SubscriptionService(SubscriptionPlanRepository planRepository, 
                               TenantSubscriptionRepository subscriptionRepository,
                               UpgradeRequestRepository upgradeRequestRepository,
                               PublicSubscriptionAnalyticsRepository publicSubscriptionAnalyticsRepository,
                               MqttEventPublisher mqttEventPublisher) {
        this.planRepository = planRepository;
        this.subscriptionRepository = subscriptionRepository;
        this.upgradeRequestRepository = upgradeRequestRepository;
        this.publicSubscriptionAnalyticsRepository = publicSubscriptionAnalyticsRepository;
        this.mqttEventPublisher = mqttEventPublisher;
    }

    public List<SubscriptionPlanResponse> listPlans() {
        return planRepository.findAll().stream()
                .map(this::toPlanResponse)
                .toList();
    }

    @Transactional
    public SubscriptionPlanResponse updatePlan(UUID planId, SubscriptionPlanUpdateRequest request) {
        SubscriptionPlanEntity entity = planRepository.findById(planId)
                .orElseThrow(() -> new NotFoundException("Subscription plan not found."));

        if (StringUtils.hasText(request.planName())) {
            entity.setPlanName(request.planName().trim());
        }
        if (StringUtils.hasText(request.planCode())) {
            entity.setPlanCode(request.planCode().trim().toUpperCase(Locale.ROOT));
        }
        if (request.description() != null) {
            entity.setDescription(request.description().trim());
        }
        if (request.monthlyPrice() != null) {
            entity.setMonthlyPrice(request.monthlyPrice());
        }
        if (request.maxStudents() != null) {
            entity.setMaxStudents(request.maxStudents());
        }
        if (request.maxParentsPerStudent() != null) {
            entity.setMaxParentsPerStudent(request.maxParentsPerStudent());
        }
        if (request.featureCodes() != null) {
            entity.setFeatures(request.featureCodes().stream()
                    .map(String::trim)
                    .filter(code -> !code.isBlank())
                    .map(code -> code.toUpperCase(Locale.ROOT))
                    .collect(Collectors.joining(",")));
        }

        SubscriptionPlanEntity saved = planRepository.save(entity);
        mqttEventPublisher.publish("platform/subscriptions/plans/updated", toPlanResponse(saved));
        return toPlanResponse(saved);
    }

    public TenantSubscriptionResponse getTenantSubscription(UUID tenantId) {
        TenantSubscriptionEntity entity = subscriptionRepository.findByTenantId(tenantId)
                .orElseThrow(() -> new NotFoundException("No subscription found for this tenant."));

        SubscriptionPlanEntity plan = planRepository.findById(entity.getPlanId()).orElse(null);
        String planName = plan != null ? plan.getPlanName() : "Unknown";
        String planCode = plan != null ? plan.getPlanCode() : "FREE";
        List<String> featureCodes = plan == null ? List.of() : parseFeatures(plan.getFeatures());

        return new TenantSubscriptionResponse(
                entity.getSubscriptionId(),
                entity.getTenantId(),
                entity.getPlanId(),
                planName,
                planCode,
                featureCodes,
                entity.getStatus(),
                entity.getStartDate(),
                entity.getEndDate(),
                entity.getTrialEndDate()
        );
    }

    @Transactional
    public TenantSubscriptionResponse updateSubscription(UUID tenantId, SubscriptionUpdateRequest request) {
        boolean created = false;
        TenantSubscriptionEntity entity = subscriptionRepository.findByTenantId(tenantId).orElse(null);
        if (entity == null) {
            created = true;
            entity = createTrialSubscription(tenantId, null);
        }

        UUID nextPlanId = resolvePlanId(request, entity.getPlanId());
        if (!nextPlanId.equals(entity.getPlanId())) {
            logger.info("Updating subscription plan. tenantId={} fromPlanId={} toPlanId={}", tenantId, entity.getPlanId(), nextPlanId);
        }
        entity.setPlanId(nextPlanId);
        if (request.status() != null) {
            SubscriptionStatus before = entity.getStatus();
            SubscriptionStatus after = request.status();
            if (before != after) {
                logger.info("Updating subscription status. tenantId={} fromStatus={} toStatus={}", tenantId, before, after);
            }
            entity.setStatus(after);

            // Normalize lifecycle timestamps for consistent downstream behavior.
            // Active-ish states should not carry an endDate.
            if (after == SubscriptionStatus.ACTIVE || after == SubscriptionStatus.TRIAL || after == SubscriptionStatus.PENDING_PAYMENT) {
                entity.setEndDate(null);
                if (after == SubscriptionStatus.ACTIVE) {
                    entity.setTrialEndDate(null);
                }
            } else {
                if (entity.getEndDate() == null) {
                    entity.setEndDate(Instant.now());
                }
            }
        }
        subscriptionRepository.save(entity);

        TenantSubscriptionResponse response = getTenantSubscription(tenantId);
        if (created) {
            logger.info("Created subscription during update. tenantId={} subscriptionId={} status={} planId={}", tenantId, response.subscriptionId(), response.status(), response.planId());
        }
        mqttEventPublisher.publish("platform/subscriptions/updated", response);
        return response;
    }

    @Transactional
    public TenantSubscriptionResponse initializeSubscription(UUID tenantId, SubscriptionInitializeRequest request) {
        TenantSubscriptionEntity entity = subscriptionRepository.findByTenantId(tenantId).orElse(null);

        // Default to BASIC trial if nothing else is specified.
        UUID fallbackPlanId = planRepository.findByPlanCode("BASIC")
                .orElseThrow(() -> new IllegalStateException("Default BASIC plan not found in system."))
                .getPlanId();

        SubscriptionUpdateRequest asUpdate = new SubscriptionUpdateRequest(request.planId(), request.planCode(), null);

        if (entity == null) {
            UUID initialPlanId = (request.planId() == null && !StringUtils.hasText(request.planCode()))
                    ? fallbackPlanId
                    : resolvePlanId(asUpdate, fallbackPlanId);
            logger.info("Initializing trial subscription. tenantId={} planId={}", tenantId, initialPlanId);
            entity = createTrialSubscription(tenantId, initialPlanId);
        } else {
            if (request.planId() != null || StringUtils.hasText(request.planCode())) {
                UUID nextPlanId = resolvePlanId(asUpdate, entity.getPlanId());
                if (!nextPlanId.equals(entity.getPlanId())) {
                    logger.info("Re-initializing subscription (updating plan). tenantId={} fromPlanId={} toPlanId={}", tenantId, entity.getPlanId(), nextPlanId);
                    entity.setPlanId(nextPlanId);
                }
            }
            // Do not force status changes here; onboarding/admin can use /update if needed.
            subscriptionRepository.save(entity);
        }

        TenantSubscriptionResponse response = getTenantSubscription(tenantId);
        mqttEventPublisher.publish("platform/subscriptions/updated", response);
        return response;
    }

    public List<TenantSubscriptionResponse> listAllSubscriptions() {
        List<SubscriptionPlanEntity> plans = planRepository.findAll();
        Map<UUID, SubscriptionPlanEntity> planMap = plans.stream()
                .collect(Collectors.toMap(SubscriptionPlanEntity::getPlanId, plan -> plan));

        return subscriptionRepository.findAll().stream()
                .map(entity -> {
                    SubscriptionPlanEntity plan = planMap.get(entity.getPlanId());
                    return new TenantSubscriptionResponse(
                            entity.getSubscriptionId(),
                            entity.getTenantId(),
                            entity.getPlanId(),
                            plan == null ? "Unknown" : plan.getPlanName(),
                            plan == null ? "FREE" : plan.getPlanCode(),
                            plan == null ? List.of() : parseFeatures(plan.getFeatures()),
                            entity.getStatus(),
                            entity.getStartDate(),
                            entity.getEndDate(),
                            entity.getTrialEndDate()
                    );
                })
                .toList();
    }

    public UpgradeRequestResponse submitUpgradeRequest(UUID tenantId, UpgradeRequestSubmit request) {
        UpgradeRequestEntity entity = new UpgradeRequestEntity();
        entity.setRequestId(UUID.randomUUID());
        entity.setTenantId(tenantId);
        entity.setRequestedPlanId(request.requestedPlanId());
        entity.setStatus("PENDING");
        entity.setRequestNotes(request.requestNotes());
        entity.setCreatedAt(Instant.now());
        
        upgradeRequestRepository.save(entity);
        
        return new UpgradeRequestResponse(
                entity.getRequestId(),
                entity.getTenantId(),
                entity.getRequestedPlanId(),
                entity.getStatus(),
                entity.getRequestNotes(),
                entity.getCreatedAt()
        );
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

    public PublicSubscriptionOverviewResponse getPublicOverview() {
        List<TenantSubscriptionEntity> subscriptions = subscriptionRepository.findAll();
        List<SubscriptionPlanEntity> plans = planRepository.findAll();
        Map<UUID, SubscriptionPlanEntity> planMap = plans.stream()
                .collect(Collectors.toMap(SubscriptionPlanEntity::getPlanId, p -> p));

        long activeInstitutions = subscriptions.stream()
                .filter(s -> s.getStatus() == SubscriptionStatus.ACTIVE || s.getStatus() == SubscriptionStatus.TRIAL)
                .count();

        long payingInstitutions = subscriptions.stream()
                .filter(s -> s.getStatus() == SubscriptionStatus.ACTIVE)
                .count();

        long totalLearnerCapacity = subscriptions.stream()
                .filter(s -> s.getStatus() == SubscriptionStatus.ACTIVE || s.getStatus() == SubscriptionStatus.TRIAL)
                .mapToLong(s -> planMap.get(s.getPlanId()) != null ? planMap.get(s.getPlanId()).getMaxStudents() : 0)
                .sum();

        long connectedSchools = publicSubscriptionAnalyticsRepository.countConnectedSchools();
        long totalUsers = publicSubscriptionAnalyticsRepository.countTotalUsers();
        List<PublicAttachedSchool> attachedSchools = publicSubscriptionAnalyticsRepository.findAttachedSchools(8);
        List<String> attachedSchoolNames = publicSubscriptionAnalyticsRepository.findAttachedSchoolNames(8);

        return new PublicSubscriptionOverviewResponse(
                activeInstitutions,
                payingInstitutions,
                totalLearnerCapacity,
                plans.size(),
                connectedSchools,
                totalUsers,
                attachedSchools,
                attachedSchoolNames
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

        List<String> featureCodes = parseFeatures(plan.getFeatures());
        if (featureCodes.contains("*") || featureCodes.contains(featureCode)) {
            return new FeatureCheckResponse(true, "Feature accessible.");
        }

        return new FeatureCheckResponse(false, "Feature '" + featureCode + "' is not included in your '" + plan.getPlanName() + "' plan.");
    }

    private UUID resolvePlanId(SubscriptionUpdateRequest request, UUID currentPlanId) {
        if (request.planId() != null) {
            SubscriptionPlanEntity plan = planRepository.findById(request.planId())
                    .orElseThrow(() -> new IllegalArgumentException("Subscription plan not found for planId: " + request.planId()));
            return plan.getPlanId();
        }

        if (StringUtils.hasText(request.planCode())) {
            String normalizedPlanCode = request.planCode().trim().toUpperCase(Locale.ROOT);
            SubscriptionPlanEntity plan = planRepository.findByPlanCode(normalizedPlanCode)
                    .orElseThrow(() -> new IllegalArgumentException("Subscription plan not found for planCode: " + request.planCode()));
            return plan.getPlanId();
        }

        if (request.status() != null) {
            return currentPlanId;
        }

        throw new IllegalArgumentException("Subscription update requires either planId, planCode, or status.");
    }

    private TenantSubscriptionEntity createDefaultSubscription(UUID tenantId) {
        return createTrialSubscription(tenantId, null);
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
                parseFeatures(plan.getFeatures()),
                plan.getFeatures(),
                plan.getCreatedAt()
        );
    }

    private TenantSubscriptionEntity createTrialSubscription(UUID tenantId, UUID planId) {
        UUID effectivePlanId = planId;
        if (effectivePlanId == null) {
            effectivePlanId = planRepository.findByPlanCode("BASIC")
                    .orElseThrow(() -> new IllegalStateException("Default BASIC plan not found in system."))
                    .getPlanId();
        }

        TenantSubscriptionEntity entity = new TenantSubscriptionEntity();
        entity.setSubscriptionId(UUID.randomUUID());
        entity.setTenantId(tenantId);
        entity.setPlanId(effectivePlanId);
        entity.setStatus(SubscriptionStatus.TRIAL);
        entity.setStartDate(Instant.now());
        entity.setTrialEndDate(Instant.now().plus(java.time.Duration.ofDays(14)));
        return subscriptionRepository.save(entity);
    }

    private List<String> parseFeatures(String features) {
        if (features == null || features.isBlank()) {
            return List.of();
        }
        if (features.contains("*")) {
            return List.of("*");
        }
        return Arrays.stream(features.split(","))
                .map(String::trim)
                .filter(value -> !value.isBlank())
                .toList();
    }
}
