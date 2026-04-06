package com.sms.onboarding.repository;

import com.sms.onboarding.domain.SchoolOnboardingEntity;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

import org.springframework.lang.NonNull;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface SchoolOnboardingJpaRepository extends JpaRepository<SchoolOnboardingEntity, UUID> {

    @EntityGraph(attributePaths = "requiredDocuments")
    List<SchoolOnboardingEntity> findAllByOrderByCreatedAtDesc();

    @Override
    @EntityGraph(attributePaths = "requiredDocuments")
    Optional<SchoolOnboardingEntity> findById(@NonNull UUID onboardingId);

    Optional<SchoolOnboardingEntity> findBySchoolCodeIgnoreCaseAndAdminEmailIgnoreCase(String schoolCode, String adminEmail);

    Optional<SchoolOnboardingEntity> findBySchoolCodeIgnoreCase(String schoolCode);
}
