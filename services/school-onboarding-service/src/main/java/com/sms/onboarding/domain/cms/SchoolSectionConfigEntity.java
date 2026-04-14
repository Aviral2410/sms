package com.sms.onboarding.domain.cms;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.Setter;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "school_section_config", schema = "onboarding")
@Getter
@Setter
public class SchoolSectionConfigEntity {

    @Id
    @Column(name = "id", nullable = false, updatable = false)
    private UUID id;

    @Column(name = "tenant_id", nullable = false)
    private UUID tenantId;

    @Column(name = "section_key", nullable = false)
    private String sectionKey; // about, events, gallery, etc.

    @Column(name = "is_enabled")
    private Boolean isEnabled = true;

    @Column(name = "display_order")
    private Integer displayOrder = 0;

    @Column(name = "title_override")
    private String titleOverride;

    @Column(name = "subtitle_override", columnDefinition = "TEXT")
    private String subtitleOverride;

    @Column(name = "config_json", columnDefinition = "TEXT")
    private String configJson;

    @Column(name = "updated_at")
    private Instant updatedAt = Instant.now();
}
