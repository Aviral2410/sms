package com.sms.onboarding.domain;

import jakarta.persistence.*;
import lombok.Data;
import java.time.Instant;
import java.util.UUID;

@Data
@Entity
@Table(name = "platform_settings", schema = "identity")
public class PlatformSettingsEntity {
    @Id
    private UUID settingsId;

    @Column(name = "theme_name")
    private String themeName;

    @Column(name = "accent_color")
    private String accentColor;

    @Column(name = "default_trial_days")
    private Integer defaultTrialDays;

    @Column(name = "maintenance_mode")
    private Boolean maintenanceMode;

    @Column(name = "platform_name")
    private String platformName;

    @Column(name = "contact_email")
    private String contactEmail;

    @Column(name = "glass_intensity")
    private Double glassIntensity;

    @Column(name = "border_radius")
    private String borderRadius;

    @Column(name = "auth_service_url")
    private String authServiceUrl;

    @Column(name = "communication_service_url")
    private String communicationServiceUrl;

    @Column(name = "released_feature_codes", columnDefinition = "TEXT")
    private String releasedFeatureCodes;

    @Column(name = "updated_at")
    private Instant updatedAt;

    @PreUpdate
    protected void onUpdate() {
        updatedAt = Instant.now();
    }
}
