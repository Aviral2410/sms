package com.sms.onboarding.api;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

public final class PublicSiteContentDtos {

    private PublicSiteContentDtos() {
    }

    public record PublicSiteFeatureCard(
            String title,
            String description,
            String category,
            String imageUrl,
            String accentColor,
            Integer sortOrder,
            List<String> bullets
    ) {
    }

    public record PublicRoleBenefit(
            String roleKey,
            String roleLabel,
            String headline,
            String description,
            String accentColor,
            List<String> outcomes
    ) {
    }

    public record PublicSectionMedia(
            String sectionKey,
            String imageUrl,
            String fallbackImageUrl,
            String altText,
            String caption
    ) {
    }

    public record PublicTestimonial(
            String quote,
            String authorName,
            String authorRole,
            String organization,
            String avatarUrl,
            String accentColor,
            Integer sortOrder
    ) {
    }

    public record PublicMediaAssetResponse(
            UUID assetId,
            String assetKey,
            String fileName,
            String contentType,
            Long fileSize,
            String publicUrl,
            Instant updatedAt
    ) {
    }

    public record PublicSiteContentResponse(
            UUID contentId,
            String brandLabel,
            String heroEyebrow,
            String heroHeadline,
            String heroSubheadline,
            String visionTitle,
            String visionBody,
            String whyTitle,
            String whyBody,
            String pricingHeadline,
            String pricingBody,
            String contactHeadline,
            String contactBody,
            String supportHeadline,
            String supportBody,
            String founderTitle,
            String founderName,
            String founderRole,
            String founderMessageTitle,
            String founderMessageBody,
            String founderSignoff,
            String primaryCtaLabel,
            String primaryCtaUrl,
            String secondaryCtaLabel,
            String secondaryCtaUrl,
            List<PublicSiteFeatureCard> featureCards,
            List<PublicRoleBenefit> roleBenefits,
            List<PublicSectionMedia> mediaGallery,
            List<PublicTestimonial> testimonials,
            Instant updatedAt
    ) {
    }

    public record UpdatePublicSiteContentRequest(
            String brandLabel,
            String heroEyebrow,
            String heroHeadline,
            String heroSubheadline,
            String visionTitle,
            String visionBody,
            String whyTitle,
            String whyBody,
            String pricingHeadline,
            String pricingBody,
            String contactHeadline,
            String contactBody,
            String supportHeadline,
            String supportBody,
            String founderTitle,
            String founderName,
            String founderRole,
            String founderMessageTitle,
            String founderMessageBody,
            String founderSignoff,
            String primaryCtaLabel,
            String primaryCtaUrl,
            String secondaryCtaLabel,
            String secondaryCtaUrl,
            List<PublicSiteFeatureCard> featureCards,
            List<PublicRoleBenefit> roleBenefits,
            List<PublicSectionMedia> mediaGallery,
            List<PublicTestimonial> testimonials
    ) {
    }
}
