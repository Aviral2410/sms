package com.sms.subscription.repository;

import com.sms.subscription.domain.TenantSubscriptionEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;
import java.util.UUID;

public interface TenantSubscriptionRepository extends JpaRepository<TenantSubscriptionEntity, UUID> {
    Optional<TenantSubscriptionEntity> findByTenantId(UUID tenantId);
}
