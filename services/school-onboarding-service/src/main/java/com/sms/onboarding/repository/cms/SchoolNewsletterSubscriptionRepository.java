package com.sms.onboarding.repository.cms;

import com.sms.onboarding.domain.cms.SchoolNewsletterSubscriptionEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface SchoolNewsletterSubscriptionRepository extends JpaRepository<SchoolNewsletterSubscriptionEntity, UUID> {
    Optional<SchoolNewsletterSubscriptionEntity> findByTenantIdAndEmail(UUID tenantId, String email);
    List<SchoolNewsletterSubscriptionEntity> findByTenantIdAndStatus(UUID tenantId, String status);
    long countByTenantIdAndStatus(UUID tenantId, String status);
}
