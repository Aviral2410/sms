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
@Table(name = "school_fee_structure", schema = "onboarding")
@Getter
@Setter
public class SchoolFeeStructureEntity {

    @Id
    @Column(name = "id", nullable = false, updatable = false)
    private UUID id;

    @Column(name = "tenant_id", nullable = false)
    private UUID tenantId;

    @Column(name = "academic_year", nullable = false)
    private String academicYear;

    @Column(name = "title", nullable = false)
    private String title;

    @Column(name = "description", columnDefinition = "TEXT")
    private String description;

    @Column(name = "structured_data_json", columnDefinition = "TEXT")
    private String structuredDataJson;

    @Column(name = "attachment_media_id")
    private UUID attachmentMediaId;

    @Column(name = "is_published")
    private Boolean isPublished = false;

    @Column(name = "created_at")
    private Instant createdAt = Instant.now();
}
