package com.sms.subscription.api;

import com.sms.subscription.domain.SubscriptionStatus;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

public class SubscriptionDtos {
    public record SubscriptionPlanResponse(
            UUID planId,
            String planName,
            String planCode,
            String description,
            BigDecimal monthlyPrice,
            int maxStudents,
            int maxParentsPerStudent,
            String features,
            Instant createdAt
    ) {}

    public record TenantSubscriptionResponse(
            UUID subscriptionId,
            UUID tenantId,
            UUID planId,
            String planName,
            SubscriptionStatus status,
            Instant startDate,
            Instant endDate,
            Instant trialEndDate
    ) {}

    public record SubscriptionUpdateRequest(
            @NotNull UUID planId,
            SubscriptionStatus status
    ) {}

    public record FeatureCheckResponse(
            boolean accessible,
            String message
    ) {}

    public record PlatformStatsResponse(
            long totalActiveSubscriptions,
            BigDecimal monthlyRecurringRevenue,
            long totalCapacityStudents,
            int planCount
    ) {}
}
