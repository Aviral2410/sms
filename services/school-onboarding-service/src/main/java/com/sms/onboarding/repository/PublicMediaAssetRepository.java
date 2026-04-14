package com.sms.onboarding.repository;

import com.sms.onboarding.domain.PublicMediaAssetEntity;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface PublicMediaAssetRepository extends JpaRepository<PublicMediaAssetEntity, UUID> {

    Optional<PublicMediaAssetEntity> findByAssetKey(String assetKey);
}
