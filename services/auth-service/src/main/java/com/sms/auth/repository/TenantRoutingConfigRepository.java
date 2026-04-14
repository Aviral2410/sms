package com.sms.auth.repository;

import com.sms.auth.domain.TenantRoutingConfigEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;
import java.util.UUID;

public interface TenantRoutingConfigRepository extends JpaRepository<TenantRoutingConfigEntity, UUID> {
    Optional<TenantRoutingConfigEntity> findByTenantId(UUID tenantId);
}
