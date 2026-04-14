package com.sms.onboarding.repository;

import com.sms.onboarding.domain.PublicSiteContentEntity;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface PublicSiteContentRepository extends JpaRepository<PublicSiteContentEntity, UUID> {
}
