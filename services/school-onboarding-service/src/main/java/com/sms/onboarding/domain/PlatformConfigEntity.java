package com.sms.onboarding.domain;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;
import java.time.Instant;
import java.util.UUID;
import lombok.Data;

/**
 * Stores platform-managed third-party integration settings.
 *
 * <p>Secrets are encrypted before persistence and only exposed in masked form to platform admins.</p>
 */
@Data
@Entity
@Table(name = "platform_config", schema = "identity")
public class PlatformConfigEntity {

    @Id
    @Column(name = "config_id", nullable = false, updatable = false)
    private UUID configId;

    @Column(name = "service_name", nullable = false, unique = true)
    private String serviceName;

    @Column(name = "api_key_secret")
    private String encryptedApiKeySecret;

    @Column(name = "api_base_url")
    private String apiBaseUrl;

    @Column(name = "is_enabled", nullable = false)
    private Boolean enabled = Boolean.TRUE;

    @Column(name = "metadata", columnDefinition = "jsonb")
    private String metadataJson;

    @Column(name = "updated_at")
    private Instant updatedAt;

    @PrePersist
    @PreUpdate
    void touch() {
        this.updatedAt = Instant.now();
    }
}
