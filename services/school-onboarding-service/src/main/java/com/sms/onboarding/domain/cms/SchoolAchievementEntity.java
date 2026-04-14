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
@Table(name = "school_achievement", schema = "onboarding")
@Getter
@Setter
public class SchoolAchievementEntity {

    @Id
    @Column(name = "id", nullable = false, updatable = false)
    private UUID id;

    @Column(name = "tenant_id", nullable = false)
    private UUID tenantId;

    @Column(name = "title", nullable = false)
    private String title;

    @Column(name = "description", columnDefinition = "TEXT")
    private String description;

    @Column(name = "achievement_year")
    private String achievementYear;

    @Column(name = "category")
    private String category;

    @Column(name = "image_media_id")
    private UUID imageMediaId;

    @Column(name = "is_featured")
    private Boolean isFeatured = false;

    @Column(name = "display_order")
    private Integer displayOrder = 0;

    @Column(name = "is_published")
    private Boolean isPublished = false;

    @Column(name = "created_at")
    private Instant createdAt = Instant.now();
}
