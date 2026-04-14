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
@Table(name = "school_affiliation_info", schema = "onboarding")
@Getter
@Setter
public class SchoolAffiliationInfoEntity {

    @Id
    @Column(name = "id", nullable = false, updatable = false)
    private UUID id;

    @Column(name = "tenant_id", nullable = false)
    private UUID tenantId;

    @Column(name = "board_name", nullable = false)
    private String boardName;

    @Column(name = "affiliation_number")
    private String affiliationNumber;

    @Column(name = "compliance_text", columnDefinition = "TEXT")
    private String complianceText;

    @Column(name = "recognition_details", columnDefinition = "TEXT")
    private String recognitionDetails;

    @Column(name = "is_published")
    private Boolean isPublished = false;

    @Column(name = "created_at")
    private Instant createdAt = Instant.now();
}
