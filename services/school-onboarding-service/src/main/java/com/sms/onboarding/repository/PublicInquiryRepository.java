package com.sms.onboarding.repository;

import com.sms.onboarding.domain.PublicInquiryEntity;
import java.util.List;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface PublicInquiryRepository extends JpaRepository<PublicInquiryEntity, UUID> {
    List<PublicInquiryEntity> findAllByOrderByCreatedAtDesc();
    long countByStatusIgnoreCase(String status);
}
