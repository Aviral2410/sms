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
@Table(name = "school_social_link", schema = "onboarding")
@Getter
@Setter
public class SchoolSocialLinkEntity {

    @Id
    @Column(name = "id", nullable = false, updatable = false)
    private UUID id;

    @Column(name = "tenant_id", nullable = false)
    private UUID tenantId;

    @Column(name = "platform", nullable = false)
    private String platform; // FACEBOOK, TWITTER, INSTAGRAM, LINKEDIN, YOUTUBE

    @Column(name = "url", nullable = false, columnDefinition = "TEXT")
    private String url;

    @Column(name = "display_order")
    private Integer displayOrder = 0;

    @Column(name = "is_published")
    private Boolean isPublished = false;

    @Column(name = "created_at")
    private Instant createdAt = Instant.now();
}
