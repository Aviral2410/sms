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
@Table(name = "school_gallery_media", schema = "onboarding")
@Getter
@Setter
public class SchoolGalleryMediaEntity {

    @Id
    @Column(name = "id", nullable = false, updatable = false)
    private UUID id;

    @Column(name = "tenant_id", nullable = false)
    private UUID tenantId;

    @Column(name = "album_id", nullable = false)
    private UUID albumId;

    @Column(name = "media_id", nullable = false)
    private UUID mediaId;

    @Column(name = "media_type", nullable = false)
    private String mediaType; // IMAGE, VIDEO

    @Column(name = "caption", columnDefinition = "TEXT")
    private String caption;

    @Column(name = "alt_text", columnDefinition = "TEXT")
    private String altText;

    @Column(name = "tags")
    private String tags;

    @Column(name = "taken_at")
    private Instant takenAt;

    @Column(name = "is_published")
    private Boolean isPublished = false;

    @Column(name = "sort_order")
    private Integer sortOrder = 0;

    @Column(name = "created_at")
    private Instant createdAt = Instant.now();
}
