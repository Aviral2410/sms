package com.sms.onboarding.service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.sms.onboarding.api.PlatformConfigDtos.PlatformConfigResponse;
import com.sms.onboarding.api.PlatformConfigDtos.PlatformRuntimeConfigResponse;
import com.sms.onboarding.api.PlatformConfigDtos.UpsertPlatformConfigRequest;
import com.sms.onboarding.domain.PlatformConfigEntity;
import com.sms.onboarding.event.MqttEventPublisher;
import com.sms.onboarding.repository.PlatformConfigRepository;
import java.time.Instant;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Owns CRUD, masking, and runtime decryption for platform-managed service configuration.
 */
@Service
public class PlatformConfigService {

    private final PlatformConfigRepository repository;
    private final SecretEncryptionService secretEncryptionService;
    private final ObjectMapper objectMapper;
    private final MqttEventPublisher mqttEventPublisher;
    private final String internalApiKey;

    public PlatformConfigService(
            PlatformConfigRepository repository,
            SecretEncryptionService secretEncryptionService,
            ObjectMapper objectMapper,
            MqttEventPublisher mqttEventPublisher,
            @Value("${app.internal-api-key}") String internalApiKey
    ) {
        this.repository = repository;
        this.secretEncryptionService = secretEncryptionService;
        this.objectMapper = objectMapper;
        this.mqttEventPublisher = mqttEventPublisher;
        this.internalApiKey = internalApiKey;
    }

    /**
     * Returns masked configuration for the platform admin console.
     */
    public List<PlatformConfigResponse> listConfigs() {
        return this.repository.findAll().stream()
                .sorted(Comparator.comparing(PlatformConfigEntity::getServiceName, String.CASE_INSENSITIVE_ORDER))
                .map(this::toMaskedResponse)
                .toList();
    }

    /**
     * Upserts a platform-managed configuration record.
     */
    @Transactional
    public PlatformConfigResponse upsert(UpsertPlatformConfigRequest request) {
        PlatformConfigEntity entity = this.repository.findByServiceNameIgnoreCase(request.serviceName())
                .orElseGet(() -> {
                    PlatformConfigEntity created = new PlatformConfigEntity();
                    created.setConfigId(UUID.randomUUID());
                    created.setServiceName(normalizeServiceName(request.serviceName()));
                    created.setUpdatedAt(Instant.now());
                    return created;
                });

        entity.setServiceName(normalizeServiceName(request.serviceName()));
        entity.setApiBaseUrl(trimToNull(request.apiBaseUrl()));
        entity.setEnabled(Boolean.TRUE.equals(request.enabled()));
        entity.setMetadataJson(writeMetadata(enrichMetadata(request.metadata(), Boolean.TRUE.equals(request.refreshRequired()))));
        if (request.secretValue() != null && !request.secretValue().isBlank()) {
            entity.setEncryptedApiKeySecret(this.secretEncryptionService.encrypt(request.secretValue().trim()));
        }

        PlatformConfigEntity saved = this.repository.save(entity);
        publishConfigRefresh(saved);
        return toMaskedResponse(saved);
    }

    /**
     * Returns the decrypted configuration used by internal services.
     */
    public PlatformRuntimeConfigResponse getRuntimeConfig(String serviceName, String providedInternalApiKey) {
        requireInternalAccess(providedInternalApiKey);
        PlatformConfigEntity entity = this.repository.findByServiceNameIgnoreCase(serviceName)
                .orElseThrow(() -> new PlatformConfigNotFoundException(serviceName));

        Map<String, Object> metadata = readMetadata(entity.getMetadataJson());
        return new PlatformRuntimeConfigResponse(
                entity.getServiceName(),
                this.secretEncryptionService.decrypt(entity.getEncryptedApiKeySecret()),
                entity.getApiBaseUrl(),
                Boolean.TRUE.equals(entity.getEnabled()),
                isRefreshRequired(metadata),
                metadata,
                entity.getUpdatedAt()
        );
    }

    private PlatformConfigResponse toMaskedResponse(PlatformConfigEntity entity) {
        Map<String, Object> metadata = readMetadata(entity.getMetadataJson());
        return new PlatformConfigResponse(
                entity.getConfigId(),
                entity.getServiceName(),
                maskSecret(entity.getEncryptedApiKeySecret()),
                entity.getEncryptedApiKeySecret() != null && !entity.getEncryptedApiKeySecret().isBlank(),
                entity.getApiBaseUrl(),
                Boolean.TRUE.equals(entity.getEnabled()),
                isRefreshRequired(metadata),
                metadata,
                entity.getUpdatedAt()
        );
    }

    private void requireInternalAccess(String providedInternalApiKey) {
        if (providedInternalApiKey == null || !providedInternalApiKey.equals(this.internalApiKey)) {
            throw new IllegalArgumentException("Invalid internal API key.");
        }
    }

    private void publishConfigRefresh(PlatformConfigEntity entity) {
        Map<String, Object> payload = new LinkedHashMap<>();
        payload.put("serviceName", entity.getServiceName());
        payload.put("updatedAt", entity.getUpdatedAt() == null ? Instant.now().toString() : entity.getUpdatedAt().toString());
        payload.put("enabled", Boolean.TRUE.equals(entity.getEnabled()));
        this.mqttEventPublisher.publish("platform/config-updated", payload);
    }

    private Map<String, Object> enrichMetadata(Map<String, Object> metadata, boolean refreshRequired) {
        LinkedHashMap<String, Object> merged = new LinkedHashMap<>();
        if (metadata != null) {
            merged.putAll(metadata);
        }
        merged.put("refreshRequired", refreshRequired);
        return merged;
    }

    private String writeMetadata(Map<String, Object> metadata) {
        try {
            return this.objectMapper.writeValueAsString(metadata == null ? Map.of() : metadata);
        } catch (JsonProcessingException exception) {
            throw new IllegalArgumentException("Invalid metadata payload.", exception);
        }
    }

    private Map<String, Object> readMetadata(String metadataJson) {
        if (metadataJson == null || metadataJson.isBlank()) {
            return Map.of();
        }

        try {
            return this.objectMapper.readValue(metadataJson, new TypeReference<>() {});
        } catch (JsonProcessingException exception) {
            throw new IllegalStateException("Stored platform config metadata is invalid.", exception);
        }
    }

    private boolean isRefreshRequired(Map<String, Object> metadata) {
        Object raw = metadata.get("refreshRequired");
        return raw instanceof Boolean bool ? bool : Boolean.parseBoolean(String.valueOf(raw));
    }

    private String maskSecret(String encryptedSecret) {
        String plainSecret = this.secretEncryptionService.decrypt(encryptedSecret);
        if (plainSecret.isBlank()) {
            return "";
        }
        if (plainSecret.length() <= 4) {
            return "*".repeat(plainSecret.length());
        }
        return "*".repeat(Math.max(0, plainSecret.length() - 4)) + plainSecret.substring(plainSecret.length() - 4);
    }

    private String normalizeServiceName(String serviceName) {
        return serviceName == null ? "" : serviceName.trim().toUpperCase();
    }

    private String trimToNull(String value) {
        if (value == null) {
            return null;
        }
        String trimmed = value.trim();
        return trimmed.isEmpty() ? null : trimmed;
    }
}
