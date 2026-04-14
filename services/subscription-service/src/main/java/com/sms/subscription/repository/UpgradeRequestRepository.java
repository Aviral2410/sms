package com.sms.subscription.repository;

import com.sms.subscription.domain.UpgradeRequestEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface UpgradeRequestRepository extends JpaRepository<UpgradeRequestEntity, UUID> {
    List<UpgradeRequestEntity> findByTenantIdOrderByCreatedAtDesc(UUID tenantId);
    List<UpgradeRequestEntity> findByStatus(String status);
}
