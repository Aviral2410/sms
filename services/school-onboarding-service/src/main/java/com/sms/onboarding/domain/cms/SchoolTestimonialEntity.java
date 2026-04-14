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
@Table(name = "school_testimonial", schema = "onboarding")
@Getter
@Setter
public class SchoolTestimonialEntity {

    @Id
    @Column(name = "id", nullable = false, updatable = false)
    private UUID id;

    @Column(name = "tenant_id", nullable = false)
    private UUID tenantId;

    @Column(name = "author_name", nullable = false)
    private String authorName;

    @Column(name = "relationship_type")
    private String relationshipType; // Parent, Alumni, Student, Teacher

    @Column(name = "designation")
    private String designation;

    @Column(name = "content", nullable = false, columnDefinition = "TEXT")
    private String content;

    @Column(name = "image_media_id")
    private UUID imageMediaId;

    @Column(name = "rating")
    private Integer rating;

    @Column(name = "display_order")
    private Integer displayOrder = 0;

    @Column(name = "is_published")
    private Boolean isPublished = false;

    @Column(name = "created_at")
    private Instant createdAt = Instant.now();
}
