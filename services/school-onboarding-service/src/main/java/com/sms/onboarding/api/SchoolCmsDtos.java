package com.sms.onboarding.api;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

public class SchoolCmsDtos {

    // ─── Profile ───────────────────────────────────────────────────────────────

    public record SchoolLandingProfileResponse(
            UUID id,
            UUID tenantId,
            String schoolName,
            String shortName,
            String tagline,
            String shortDescription,
            String aboutHtml,
            String objective,
            String mission,
            String vision,
            String history,
            String whyUs,
            String addressLine1,
            String addressLine2,
            String city,
            String state,
            String country,
            String pincode,
            Double latitude,
            Double longitude,
            String phone,
            String alternatePhone,
            String email,
            String website,
            String officeHours,
            Boolean isPublished,
            Instant updatedAt
    ) {}

    public record SchoolLandingProfileRequest(
            String schoolName,
            String shortName,
            String tagline,
            String shortDescription,
            String aboutHtml,
            String objective,
            String mission,
            String vision,
            String history,
            String whyUs,
            String addressLine1,
            String addressLine2,
            String city,
            String state,
            String country,
            String pincode,
            Double latitude,
            Double longitude,
            String phone,
            String alternatePhone,
            String email,
            String website,
            String officeHours,
            Boolean isPublished
    ) {}

    // ─── Leadership ────────────────────────────────────────────────────────────

    public record SchoolLeaderResponse(
            UUID id,
            String type,
            String name,
            String title,
            String bio,
            String message,
            UUID imageMediaId,
            Integer displayOrder,
            Boolean isPublished
    ) {}

    public record SchoolLeaderRequest(
            @NotBlank String type,
            @NotBlank String name,
            String title,
            String bio,
            String message,
            UUID imageMediaId,
            Integer displayOrder,
            Boolean isPublished
    ) {}

    // ─── Events ────────────────────────────────────────────────────────────────

    public record SchoolEventResponse(
            UUID id,
            String title,
            String slug,
            String description,
            Instant startAt,
            Instant endAt,
            String location,
            UUID bannerMediaId,
            String registrationUrl,
            Boolean isFeatured,
            Boolean isPublished,
            String status
    ) {}

    public record SchoolEventRequest(
            @NotBlank String title,
            String slug,
            String description,
            Instant startAt,
            Instant endAt,
            String location,
            UUID bannerMediaId,
            String registrationUrl,
            Boolean isFeatured,
            Boolean isPublished,
            String status
    ) {}

    // ─── Gallery ───────────────────────────────────────────────────────────────

    public record SchoolGalleryAlbumResponse(
            UUID id,
            String title,
            String description,
            UUID coverMediaId,
            UUID eventId,
            Boolean isPublished,
            Integer sortOrder,
            List<SchoolGalleryMediaResponse> mediaItems
    ) {}

    public record SchoolGalleryAlbumRequest(
            @NotBlank String title,
            String description,
            UUID coverMediaId,
            UUID eventId,
            Boolean isPublished,
            Integer sortOrder
    ) {}

    public record SchoolGalleryMediaResponse(
            UUID id,
            UUID mediaId,
            String mediaType,
            String caption,
            String altText,
            String tags,
            Instant takenAt,
            Boolean isPublished,
            Integer sortOrder
    ) {}

    public record SchoolGalleryMediaRequest(
            @NotNull UUID mediaId,
            @NotBlank String mediaType,
            String caption,
            String altText,
            String tags,
            Instant takenAt,
            Boolean isPublished,
            Integer sortOrder
    ) {}

    // ─── Testimonials ──────────────────────────────────────────────────────────

    public record SchoolTestimonialResponse(
            UUID id,
            String authorName,
            String relationshipType,
            String designation,
            String content,
            UUID imageMediaId,
            Integer rating,
            Integer displayOrder,
            Boolean isPublished
    ) {}

    public record SchoolTestimonialRequest(
            @NotBlank String authorName,
            String relationshipType,
            String designation,
            @NotBlank String content,
            UUID imageMediaId,
            Integer rating,
            Integer displayOrder,
            Boolean isPublished
    ) {}

    // ─── Achievements ──────────────────────────────────────────────────────────

    public record SchoolAchievementResponse(
            UUID id,
            String title,
            String description,
            String achievementYear,
            String category,
            UUID imageMediaId,
            Boolean isFeatured,
            Integer displayOrder,
            Boolean isPublished
    ) {}

    public record SchoolAchievementRequest(
            @NotBlank String title,
            String description,
            String achievementYear,
            String category,
            UUID imageMediaId,
            Boolean isFeatured,
            Integer displayOrder,
            Boolean isPublished
    ) {}

    // ─── Infrastructure ────────────────────────────────────────────────────────

    public record SchoolInfrastructureItemResponse(
            UUID id,
            String type,
            String title,
            String description,
            UUID imageMediaId,
            String icon,
            Integer displayOrder,
            Boolean isPublished
    ) {}

    public record SchoolInfrastructureItemRequest(
            String type,
            @NotBlank String title,
            String description,
            UUID imageMediaId,
            String icon,
            Integer displayOrder,
            Boolean isPublished
    ) {}

    // ─── Section Config ────────────────────────────────────────────────────────

    public record SchoolSectionConfigResponse(
            String sectionKey,
            Boolean isEnabled,
            Integer displayOrder,
            String titleOverride,
            String subtitleOverride,
            String configJson
    ) {}

    public record SchoolSectionConfigRequest(
            @NotBlank String sectionKey,
            Boolean isEnabled,
            Integer displayOrder,
            String titleOverride,
            String subtitleOverride,
            String configJson
    ) {}

    // ─── Social Links ──────────────────────────────────────────────────────────

    public record SchoolSocialLinkResponse(
            UUID id,
            String platform,
            String url,
            Integer displayOrder,
            Boolean isPublished
    ) {}

    public record SchoolSocialLinkRequest(
            @NotBlank String platform,
            @NotBlank String url,
            Integer displayOrder,
            Boolean isPublished
    ) {}

    // ─── Affiliation ───────────────────────────────────────────────────────────

    public record SchoolAffiliationInfoResponse(
            String boardName,
            String affiliationNumber,
            String complianceText,
            String recognitionDetails,
            Boolean isPublished
    ) {}

    public record SchoolAffiliationInfoRequest(
            @NotBlank String boardName,
            String affiliationNumber,
            String complianceText,
            String recognitionDetails,
            Boolean isPublished
    ) {}

    // ─── Branches ──────────────────────────────────────────────────────────────

    public record SchoolBranchResponse(
            UUID id,
            String branchName,
            String address,
            String city,
            String state,
            String pincode,
            Double latitude,
            Double longitude,
            String phone,
            String email,
            Boolean isPrimary,
            Boolean isPublished
    ) {}

    public record SchoolBranchRequest(
            @NotBlank String branchName,
            String address,
            String city,
            String state,
            String pincode,
            Double latitude,
            Double longitude,
            String phone,
            String email,
            Boolean isPrimary,
            Boolean isPublished
    ) {}

    // ─── Admissions ────────────────────────────────────────────────────────────

    public record SchoolAdmissionInfoResponse(
            UUID id,
            String overview,
            String process,
            String eligibility,
            UUID brochureMediaId,
            String contactName,
            String contactPhone,
            String contactEmail,
            Boolean isPublished
    ) {}

    public record SchoolAdmissionInfoRequest(
            String overview,
            String process,
            String eligibility,
            UUID brochureMediaId,
            String contactName,
            String contactPhone,
            String contactEmail,
            Boolean isPublished
    ) {}

    // ─── Fee Structure ─────────────────────────────────────────────────────────

    public record SchoolFeeStructureResponse(
            UUID id,
            String academicYear,
            String title,
            String description,
            String structuredDataJson,
            UUID attachmentMediaId,
            Boolean isPublished
    ) {}

    public record SchoolFeeStructureRequest(
            @NotBlank String academicYear,
            @NotBlank String title,
            String description,
            String structuredDataJson,
            UUID attachmentMediaId,
            Boolean isPublished
    ) {}

    // ─── Academic Content ──────────────────────────────────────────────────────

    public record SchoolAcademicContentResponse(
            UUID id,
            String curriculum,
            String coCurricular,
            String scholarshipInfo,
            String resultHighlights,
            String notices,
            String calendarData,
            Boolean isPublished
    ) {}

    public record SchoolAcademicContentRequest(
            String curriculum,
            String coCurricular,
            String scholarshipInfo,
            String resultHighlights,
            String notices,
            String calendarData,
            Boolean isPublished
    ) {}

    // ─── Enquiry ───────────────────────────────────────────────────────────────

    public record SchoolEnquiryRequest(
            String type,   // CONTACT, ADMISSION
            String studentName,
            String parentName,
            @NotBlank String phone,
            String email,
            String classInterested,
            String message,
            String source
    ) {}

    public record SchoolEnquiryResponse(
            UUID id,
            String type,
            String studentName,
            String parentName,
            String phone,
            String email,
            String classInterested,
            String message,
            String status,
            String source,
            Instant createdAt
    ) {}

    // ─── Newsletter ────────────────────────────────────────────────────────────

    public record NewsletterSubscribeRequest(
            @NotBlank @Email String email
    ) {}

    public record NewsletterSubscribeResponse(
            UUID id,
            String email,
            String status,
            Instant subscribedAt
    ) {}

    // ─── Landing Page ──────────────────────────────────────────────────────────

    public record SchoolLandingPageResponse(
            UUID tenantId,
            SchoolLandingProfileResponse profile,
            List<SchoolLeaderResponse> leaders,
            List<SchoolEventResponse> upcomingEvents,
            List<SchoolGalleryAlbumResponse> albums,
            List<SchoolTestimonialResponse> testimonials,
            List<SchoolAchievementResponse> achievements,
            List<SchoolInfrastructureItemResponse> infrastructure,
            List<SchoolSectionConfigResponse> sectionConfigs,
            List<SchoolSocialLinkResponse> socialLinks,
            SchoolAffiliationInfoResponse affiliation,
            List<SchoolBranchResponse> branches,
            SchoolAdmissionInfoResponse admissionInfo,
            List<SchoolFeeStructureResponse> feeStructures,
            SchoolAcademicContentResponse academicContent
    ) {}

    // ─── Dashboard Stats ───────────────────────────────────────────────────────

    public record CmsDashboardStatsResponse(
            int pendingEnquiries,
            int upcomingEvents,
            int unpublishedSections,
            int totalGalleryAlbums,
            int activeNewsletterSubscribers,
            boolean profilePublished,
            boolean admissionInfoPublished,
            boolean affiliationPublished,
            ContentCompletenessResponse completeness
    ) {}

    public record ContentCompletenessResponse(
            boolean hasProfile,
            boolean hasLeaders,
            boolean hasBranches,
            boolean hasEvents,
            boolean hasGallery,
            boolean hasTestimonials,
            boolean hasAchievements,
            boolean hasAdmissionInfo,
            boolean hasFeeStructure,
            int completionPercent
    ) {}
}
