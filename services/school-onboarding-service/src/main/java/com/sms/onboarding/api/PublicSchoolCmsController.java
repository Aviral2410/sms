package com.sms.onboarding.api;

import com.sms.onboarding.api.SchoolCmsDtos.*;
import com.sms.onboarding.service.SchoolCmsService;
import com.sms.onboarding.service.SchoolEnquiryService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * Public-facing CMS endpoints for school landing pages.
 * No authentication required. Only published content is returned.
 * All endpoints are scoped by schoolCode (e.g. /public/schools/bmps/...).
 */
@RestController
@RequestMapping("/api/v1/public/schools/{schoolCode}")
public class PublicSchoolCmsController {

    private final SchoolCmsService cmsService;
    private final SchoolEnquiryService enquiryService;

    public PublicSchoolCmsController(SchoolCmsService cmsService, SchoolEnquiryService enquiryService) {
        this.cmsService = cmsService;
        this.enquiryService = enquiryService;
    }

    // ─────────────────────────────────────────────────────────────────────────
    // FULL LANDING PAGE (aggregated)
    // ─────────────────────────────────────────────────────────────────────────

    /**
     * Returns a fully aggregated, publish-filtered landing page payload.
     * This is the primary endpoint for frontend landing page rendering.
     */
    @GetMapping("/landing-page")
    public SchoolLandingPageResponse getLandingPage(@PathVariable String schoolCode) {
        return cmsService.getLandingPage(schoolCode);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // INDIVIDUAL SECTION ENDPOINTS
    // ─────────────────────────────────────────────────────────────────────────

    @GetMapping("/profile")
    public SchoolLandingProfileResponse getProfile(@PathVariable String schoolCode) {
        return cmsService.getLandingPage(schoolCode).profile();
    }

    @GetMapping("/leaders")
    public List<SchoolLeaderResponse> getLeaders(@PathVariable String schoolCode) {
        return cmsService.getLandingPage(schoolCode).leaders();
    }

    @GetMapping("/events/upcoming")
    public List<SchoolEventResponse> getUpcomingEvents(@PathVariable String schoolCode) {
        return cmsService.getLandingPage(schoolCode).upcomingEvents();
    }

    @GetMapping("/gallery")
    public List<SchoolGalleryAlbumResponse> getGallery(@PathVariable String schoolCode) {
        return cmsService.getLandingPage(schoolCode).albums();
    }

    @GetMapping("/testimonials")
    public List<SchoolTestimonialResponse> getTestimonials(@PathVariable String schoolCode) {
        return cmsService.getLandingPage(schoolCode).testimonials();
    }

    @GetMapping("/achievements")
    public List<SchoolAchievementResponse> getAchievements(@PathVariable String schoolCode) {
        return cmsService.getLandingPage(schoolCode).achievements();
    }

    @GetMapping("/branches")
    public List<SchoolBranchResponse> getBranches(@PathVariable String schoolCode) {
        return cmsService.getLandingPage(schoolCode).branches();
    }

    @GetMapping("/fee-structure")
    public List<SchoolFeeStructureResponse> getFeeStructure(@PathVariable String schoolCode) {
        return cmsService.getLandingPage(schoolCode).feeStructures();
    }

    @GetMapping("/admission-info")
    public SchoolAdmissionInfoResponse getAdmissionInfo(@PathVariable String schoolCode) {
        return cmsService.getLandingPage(schoolCode).admissionInfo();
    }

    @GetMapping("/academic-content")
    public SchoolAcademicContentResponse getAcademicContent(@PathVariable String schoolCode) {
        return cmsService.getLandingPage(schoolCode).academicContent();
    }

    @GetMapping("/social-links")
    public List<SchoolSocialLinkResponse> getSocialLinks(@PathVariable String schoolCode) {
        return cmsService.getLandingPage(schoolCode).socialLinks();
    }

    @GetMapping("/affiliation")
    public SchoolAffiliationInfoResponse getAffiliation(@PathVariable String schoolCode) {
        return cmsService.getLandingPage(schoolCode).affiliation();
    }

    // ─────────────────────────────────────────────────────────────────────────
    // ACTIONS  (POST – no auth but rate-limited via gateway)
    // ─────────────────────────────────────────────────────────────────────────

    @PostMapping("/enquiries")
    @ResponseStatus(HttpStatus.CREATED)
    public SchoolEnquiryResponse submitEnquiry(
            @PathVariable String schoolCode,
            @Valid @RequestBody SchoolEnquiryRequest request) {
        return enquiryService.submitEnquiry(schoolCode, request);
    }

    @PostMapping("/newsletter-subscribe")
    @ResponseStatus(HttpStatus.CREATED)
    public NewsletterSubscribeResponse subscribe(
            @PathVariable String schoolCode,
            @Valid @RequestBody NewsletterSubscribeRequest request) {
        return cmsService.subscribe(schoolCode, request.email());
    }
}
