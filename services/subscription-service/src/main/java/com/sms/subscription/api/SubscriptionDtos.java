package com.sms.subscription.api;

import com.sms.subscription.domain.SubscriptionStatus;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;
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
            List<String> featureCodes,
            String features,
            Instant createdAt
    ) {}

    public record TenantSubscriptionResponse(
            UUID subscriptionId,
            UUID tenantId,
            UUID planId,
            String planName,
            String planCode,
            List<String> featureCodes,
            SubscriptionStatus status,
            Instant startDate,
            Instant endDate,
            Instant trialEndDate
    ) {}

    public record SubscriptionUpdateRequest(
            UUID planId,
            String planCode,
            SubscriptionStatus status
    ) {}

    public record SubscriptionPlanUpdateRequest(
            String planName,
            String planCode,
            String description,
            BigDecimal monthlyPrice,
            Integer maxStudents,
            Integer maxParentsPerStudent,
            List<String> featureCodes
    ) {}

    public record SubscriptionInitializeRequest(
            UUID planId,
            String planCode
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

    public record PublicSubscriptionOverviewResponse(
            long activeInstitutions,
            long payingInstitutions,
            long totalLearnerCapacity,
            int availablePlans,
            long connectedSchools,
            long totalUsers,
            List<PublicAttachedSchool> attachedSchools,
            List<String> attachedSchoolNames
    ) {}

    public record PublicAttachedSchool(
            String schoolName,
            String schoolCode,
            String logoUrl
    ) {}

    public record UpgradeRequestSubmit(
            @NotNull UUID requestedPlanId,
            String requestNotes
    ) {}

    public record UpgradeRequestResponse(
            UUID requestId,
            UUID tenantId,
            UUID requestedPlanId,
            String status,
            String requestNotes,
            Instant createdAt
    ) {}
}
