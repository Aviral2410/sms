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

@Data
@Entity
@Table(name = "public_site_content", schema = "identity")
public class PublicSiteContentEntity {

    @Id
    @Column(name = "content_id")
    private UUID contentId;

    @Column(name = "brand_label")
    private String brandLabel;

    @Column(name = "hero_eyebrow")
    private String heroEyebrow;

    @Column(name = "hero_headline")
    private String heroHeadline;

    @Column(name = "hero_subheadline", columnDefinition = "TEXT")
    private String heroSubheadline;

    @Column(name = "vision_title")
    private String visionTitle;

    @Column(name = "vision_body", columnDefinition = "TEXT")
    private String visionBody;

    @Column(name = "why_title")
    private String whyTitle;

    @Column(name = "why_body", columnDefinition = "TEXT")
    private String whyBody;

    @Column(name = "pricing_headline")
    private String pricingHeadline;

    @Column(name = "pricing_body", columnDefinition = "TEXT")
    private String pricingBody;

    @Column(name = "contact_headline")
    private String contactHeadline;

    @Column(name = "contact_body", columnDefinition = "TEXT")
    private String contactBody;

    @Column(name = "support_headline")
    private String supportHeadline;

    @Column(name = "support_body", columnDefinition = "TEXT")
    private String supportBody;

    @Column(name = "founder_title")
    private String founderTitle;

    @Column(name = "founder_name")
    private String founderName;

    @Column(name = "founder_role")
    private String founderRole;

    @Column(name = "founder_message_title")
    private String founderMessageTitle;

    @Column(name = "founder_message_body", columnDefinition = "TEXT")
    private String founderMessageBody;

    @Column(name = "founder_signoff")
    private String founderSignoff;

    @Column(name = "primary_cta_label")
    private String primaryCtaLabel;

    @Column(name = "primary_cta_url")
    private String primaryCtaUrl;

    @Column(name = "secondary_cta_label")
    private String secondaryCtaLabel;

    @Column(name = "secondary_cta_url")
    private String secondaryCtaUrl;

    @Column(name = "feature_cards_json", columnDefinition = "TEXT")
    private String featureCardsJson;

    @Column(name = "role_benefits_json", columnDefinition = "TEXT")
    private String roleBenefitsJson;

    @Column(name = "media_gallery_json", columnDefinition = "TEXT")
    private String mediaGalleryJson;

    @Column(name = "testimonials_json", columnDefinition = "TEXT")
    private String testimonialsJson;

    @Column(name = "updated_at")
    private Instant updatedAt;

    @PrePersist
    @PreUpdate
    protected void touch() {
        updatedAt = Instant.now();
    }
}
