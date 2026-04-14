package com.sms.auth.repository;

import com.sms.auth.domain.TenantDomainEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface TenantDomainRepository extends JpaRepository<TenantDomainEntity, UUID> {
    List<TenantDomainEntity> findByTenantId(UUID tenantId);
    Optional<TenantDomainEntity> findByHostIgnoreCase(String host);
    Optional<TenantDomainEntity> findByDomainIgnoreCase(String domain);
    Optional<TenantDomainEntity> findByTenantIdAndIsPrimaryTrue(UUID tenantId);
    Optional<TenantDomainEntity> findByTenantIdAndIsCanonicalTrue(UUID tenantId);
}
