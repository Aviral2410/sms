package com.sms.onboarding.service;

import com.sms.onboarding.api.PlatformSettingsResponse;
import com.sms.onboarding.api.PublicPlatformSettingsResponse;
import com.sms.onboarding.api.UpdatePlatformSettingsRequest;
import com.sms.onboarding.domain.PlatformSettingsEntity;
import com.sms.onboarding.repository.PlatformSettingsRepository;
import java.util.Arrays;
import java.util.List;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class PlatformSettingsService {
    private final PlatformSettingsRepository repository;
    private static final java.util.UUID DEFAULT_SETTINGS_ID = java.util.UUID.fromString("00000000-0000-0000-0000-000000000000");

    public PlatformSettingsService(PlatformSettingsRepository repository) {
        this.repository = repository;
    }

    public PlatformSettingsResponse getSettings() {
        PlatformSettingsEntity entity = repository.findById(DEFAULT_SETTINGS_ID).orElse(null);
        if (entity == null) {
            // Important: GET should be a pure read (no DB writes). If no row exists yet,
            // serve defaults and let PATCH upsert when a platform admin changes settings.
            entity = buildDefaultSettingsEntity();
        }
        return mapToResponse(entity);
    }

    public PublicPlatformSettingsResponse getPublicSettings() {
        PlatformSettingsEntity entity = repository.findById(DEFAULT_SETTINGS_ID).orElse(null);
        if (entity == null) {
            entity = buildDefaultSettingsEntity();
        }
        return new PublicPlatformSettingsResponse(
                entity.getPlatformName(),
                entity.getContactEmail(),
                entity.getMaintenanceMode(),
                parseReleasedFeatureCodes(entity.getReleasedFeatureCodes()),
                entity.getUpdatedAt()
        );
    }

    @Transactional
    public PlatformSettingsResponse updateSettings(UpdatePlatformSettingsRequest request) {
        PlatformSettingsEntity entity = repository.findById(DEFAULT_SETTINGS_ID).orElse(null);
        if (entity == null) {
            entity = buildDefaultSettingsEntity();
        }
        
        entity.setThemeName(request.themeName());
        entity.setAccentColor(request.accentColor());
        entity.setDefaultTrialDays(request.defaultTrialDays());
        entity.setMaintenanceMode(request.maintenanceMode());
        entity.setPlatformName(request.platformName());
        entity.setContactEmail(request.contactEmail());
        entity.setGlassIntensity(request.glassIntensity());
        entity.setBorderRadius(request.borderRadius());
        entity.setAuthServiceUrl(request.authServiceUrl());
        entity.setCommunicationServiceUrl(request.communicationServiceUrl());
        entity.setReleasedFeatureCodes(joinReleasedFeatureCodes(request.releasedFeatureCodes()));
        
        return mapToResponse(repository.save(entity));
    }

    private PlatformSettingsEntity buildDefaultSettingsEntity() {
        PlatformSettingsEntity entity = new PlatformSettingsEntity();
        entity.setSettingsId(DEFAULT_SETTINGS_ID);
        entity.setThemeName("indigo-flow");
        entity.setAccentColor("#6366f1");
        entity.setDefaultTrialDays(14);
        entity.setMaintenanceMode(false);
        entity.setPlatformName("ElevateSmart");
        entity.setContactEmail("support@elevatesmart.ai");
        entity.setGlassIntensity(0.4);
        entity.setBorderRadius("24px");
        entity.setAuthServiceUrl("http://auth-service:8082");
        entity.setCommunicationServiceUrl("http://communication-service:8089");
        entity.setReleasedFeatureCodes("*");
        entity.setUpdatedAt(java.time.Instant.now());
        return entity;
    }

    private PlatformSettingsResponse mapToResponse(PlatformSettingsEntity entity) {
        return new PlatformSettingsResponse(
                entity.getSettingsId(),
                entity.getThemeName(),
                entity.getAccentColor(),
                entity.getDefaultTrialDays(),
                entity.getMaintenanceMode(),
                entity.getPlatformName(),
                entity.getContactEmail(),
                entity.getGlassIntensity(),
                entity.getBorderRadius(),
                entity.getAuthServiceUrl(),
                entity.getCommunicationServiceUrl(),
                parseReleasedFeatureCodes(entity.getReleasedFeatureCodes()),
                entity.getUpdatedAt()
        );
    }

    private List<String> parseReleasedFeatureCodes(String releasedFeatureCodes) {
        if (releasedFeatureCodes == null || releasedFeatureCodes.isBlank()) {
            return List.of("*");
        }
        return Arrays.stream(releasedFeatureCodes.split(","))
                .map(String::trim)
                .filter(code -> !code.isBlank())
                .distinct()
                .toList();
    }

    private String joinReleasedFeatureCodes(List<String> releasedFeatureCodes) {
        if (releasedFeatureCodes == null || releasedFeatureCodes.isEmpty()) {
            return "*";
        }
        return releasedFeatureCodes.stream()
                .map(String::trim)
                .filter(code -> !code.isBlank())
                .distinct()
                .reduce((left, right) -> left + "," + right)
                .orElse("*");
    }
}
