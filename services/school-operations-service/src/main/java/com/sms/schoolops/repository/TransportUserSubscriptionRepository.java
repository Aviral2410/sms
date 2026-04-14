package com.sms.schoolops.repository;

import com.sms.schoolops.domain.TransportUserSubscriptionEntity;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface TransportUserSubscriptionRepository extends JpaRepository<TransportUserSubscriptionEntity, UUID> {
    List<TransportUserSubscriptionEntity> findBySchoolIdAndUserIdAndSubscriptionStatus(UUID schoolId, UUID userId, String subscriptionStatus);
    Optional<TransportUserSubscriptionEntity> findFirstBySchoolIdAndUserIdAndSubscriptionStatusOrderByCreatedAtDesc(UUID schoolId, UUID userId, String subscriptionStatus);
    List<TransportUserSubscriptionEntity> findBySchoolIdAndStudentUserIdAndSubscriptionStatus(UUID schoolId, UUID studentUserId, String subscriptionStatus);
    List<TransportUserSubscriptionEntity> findBySchoolIdAndRouteIdAndSubscriptionStatus(UUID schoolId, UUID routeId, String subscriptionStatus);
    List<TransportUserSubscriptionEntity> findBySchoolIdAndTripIdAndSubscriptionStatus(UUID schoolId, UUID tripId, String subscriptionStatus);
    List<TransportUserSubscriptionEntity> findBySchoolIdOrderByCreatedAtDesc(UUID schoolId);
}
