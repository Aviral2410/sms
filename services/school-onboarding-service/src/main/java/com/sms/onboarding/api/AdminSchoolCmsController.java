package com.sms.onboarding.api;

import com.sms.common.tenant.TenantContext;
import com.sms.onboarding.api.SchoolCmsDtos.*;
import com.sms.onboarding.service.SchoolCmsService;
import com.sms.onboarding.service.SchoolEnquiryService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.UUID;

/**
 * Admin CMS controller providing full tenant-scoped CRUD for all CMS entities.
 * All endpoints require a valid TenantContext (set by auth interceptor via X-Tenant-ID header).
 */
@RestController
@RequestMapping("/api/v1/admin/cms")
public class AdminSchoolCmsController {

    private final SchoolCmsService cmsService;
    private final SchoolEnquiryService enquiryService;

    public AdminSchoolCmsController(SchoolCmsService cmsService, SchoolEnquiryService enquiryService) {
        this.cmsService = cmsService;
        this.enquiryService = enquiryService;
    }

    private UUID tenantId() {
        UUID id = TenantContext.getTenantId();
        if (id == null) throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Tenant context missing");
        return id;
    }

    // ─────────────────────────────────────────────────────────────────────────
    // DASHBOARD
    // ─────────────────────────────────────────────────────────────────────────

    @GetMapping("/dashboard-stats")
    public CmsDashboardStatsResponse getDashboardStats() {
        return cmsService.getDashboardStats(tenantId());
    }

    // ─────────────────────────────────────────────────────────────────────────
    // PROFILE
    // ─────────────────────────────────────────────────────────────────────────

    @GetMapping("/profile")
    public SchoolLandingProfileResponse getProfile() {
        return cmsService.getProfile(tenantId());
    }

    @PostMapping("/profile")
    public SchoolLandingProfileResponse saveProfile(@Valid @RequestBody SchoolLandingProfileRequest request) {
        return cmsService.saveProfile(tenantId(), request);
    }

    @PatchMapping("/profile/publish")
    public SchoolLandingProfileResponse publishProfile(@RequestParam boolean publish) {
        return cmsService.publishProfile(tenantId(), publish);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // LEADERS
    // ─────────────────────────────────────────────────────────────────────────

    @GetMapping("/leaders")
    public List<SchoolLeaderResponse> listLeaders() {
        return cmsService.listLeaders(tenantId());
    }

    @PostMapping("/leaders")
    @ResponseStatus(HttpStatus.CREATED)
    public SchoolLeaderResponse createLeader(@Valid @RequestBody SchoolLeaderRequest request) {
        return cmsService.createLeader(tenantId(), request);
    }

    @PutMapping("/leaders/{id}")
    public SchoolLeaderResponse updateLeader(@PathVariable UUID id, @Valid @RequestBody SchoolLeaderRequest request) {
        return cmsService.updateLeader(tenantId(), id, request);
    }

    @DeleteMapping("/leaders/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deleteLeader(@PathVariable UUID id) {
        cmsService.deleteLeader(tenantId(), id);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // EVENTS
    // ─────────────────────────────────────────────────────────────────────────

    @GetMapping("/events")
    public List<SchoolEventResponse> listEvents() {
        return cmsService.listEvents(tenantId());
    }

    @GetMapping("/events/upcoming")
    public List<SchoolEventResponse> upcomingEvents() {
        return cmsService.getUpcomingEvents(tenantId());
    }

    @GetMapping("/events/archived")
    public List<SchoolEventResponse> archivedEvents() {
        return cmsService.getArchivedEvents(tenantId());
    }

    @GetMapping("/events/featured")
    public SchoolEventResponse featuredEvent() {
        return cmsService.getFeaturedEvent(tenantId());
    }

    @PostMapping("/events")
    @ResponseStatus(HttpStatus.CREATED)
    public SchoolEventResponse createEvent(@Valid @RequestBody SchoolEventRequest request) {
        return cmsService.createEvent(tenantId(), request);
    }

    @PutMapping("/events/{id}")
    public SchoolEventResponse updateEvent(@PathVariable UUID id, @Valid @RequestBody SchoolEventRequest request) {
        return cmsService.updateEvent(tenantId(), id, request);
    }

    @DeleteMapping("/events/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deleteEvent(@PathVariable UUID id) {
        cmsService.deleteEvent(tenantId(), id);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // GALLERY
    // ─────────────────────────────────────────────────────────────────────────

    @GetMapping("/gallery/albums")
    public List<SchoolGalleryAlbumResponse> listAlbums() {
        return cmsService.listAlbums(tenantId());
    }

    @PostMapping("/gallery/albums")
    @ResponseStatus(HttpStatus.CREATED)
    public SchoolGalleryAlbumResponse createAlbum(@Valid @RequestBody SchoolGalleryAlbumRequest request) {
        return cmsService.createAlbum(tenantId(), request);
    }

    @PutMapping("/gallery/albums/{id}")
    public SchoolGalleryAlbumResponse updateAlbum(@PathVariable UUID id, @Valid @RequestBody SchoolGalleryAlbumRequest request) {
        return cmsService.updateAlbum(tenantId(), id, request);
    }

    @DeleteMapping("/gallery/albums/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deleteAlbum(@PathVariable UUID id) {
        cmsService.deleteAlbum(tenantId(), id);
    }

    @PostMapping("/gallery/albums/{albumId}/media")
    @ResponseStatus(HttpStatus.CREATED)
    public SchoolGalleryMediaResponse addMediaToAlbum(
            @PathVariable UUID albumId,
            @Valid @RequestBody SchoolGalleryMediaRequest request) {
        return cmsService.addMediaToAlbum(tenantId(), albumId, request);
    }

    @DeleteMapping("/gallery/media/{mediaItemId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deleteGalleryMedia(@PathVariable UUID mediaItemId) {
        cmsService.deleteGalleryMedia(tenantId(), mediaItemId);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // TESTIMONIALS
    // ─────────────────────────────────────────────────────────────────────────

    @GetMapping("/testimonials")
    public List<SchoolTestimonialResponse> listTestimonials() {
        return cmsService.listTestimonials(tenantId());
    }

    @PostMapping("/testimonials")
    @ResponseStatus(HttpStatus.CREATED)
    public SchoolTestimonialResponse createTestimonial(@Valid @RequestBody SchoolTestimonialRequest request) {
        return cmsService.createTestimonial(tenantId(), request);
    }

    @PutMapping("/testimonials/{id}")
    public SchoolTestimonialResponse updateTestimonial(@PathVariable UUID id, @Valid @RequestBody SchoolTestimonialRequest request) {
        return cmsService.updateTestimonial(tenantId(), id, request);
    }

    @DeleteMapping("/testimonials/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deleteTestimonial(@PathVariable UUID id) {
        cmsService.deleteTestimonial(tenantId(), id);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // ACHIEVEMENTS
    // ─────────────────────────────────────────────────────────────────────────

    @GetMapping("/achievements")
    public List<SchoolAchievementResponse> listAchievements() {
        return cmsService.listAchievements(tenantId());
    }

    @PostMapping("/achievements")
    @ResponseStatus(HttpStatus.CREATED)
    public SchoolAchievementResponse createAchievement(@Valid @RequestBody SchoolAchievementRequest request) {
        return cmsService.createAchievement(tenantId(), request);
    }

    @PutMapping("/achievements/{id}")
    public SchoolAchievementResponse updateAchievement(@PathVariable UUID id, @Valid @RequestBody SchoolAchievementRequest request) {
        return cmsService.updateAchievement(tenantId(), id, request);
    }

    @DeleteMapping("/achievements/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deleteAchievement(@PathVariable UUID id) {
        cmsService.deleteAchievement(tenantId(), id);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // INFRASTRUCTURE
    // ─────────────────────────────────────────────────────────────────────────

    @GetMapping("/infrastructure")
    public List<SchoolInfrastructureItemResponse> listInfrastructure() {
        return cmsService.listInfrastructure(tenantId());
    }

    @PostMapping("/infrastructure")
    @ResponseStatus(HttpStatus.CREATED)
    public SchoolInfrastructureItemResponse createInfrastructure(@Valid @RequestBody SchoolInfrastructureItemRequest request) {
        return cmsService.createInfrastructure(tenantId(), request);
    }

    @PutMapping("/infrastructure/{id}")
    public SchoolInfrastructureItemResponse updateInfrastructure(@PathVariable UUID id, @Valid @RequestBody SchoolInfrastructureItemRequest request) {
        return cmsService.updateInfrastructure(tenantId(), id, request);
    }

    @DeleteMapping("/infrastructure/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deleteInfrastructure(@PathVariable UUID id) {
        cmsService.deleteInfrastructure(tenantId(), id);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // SOCIAL LINKS
    // ─────────────────────────────────────────────────────────────────────────

    @GetMapping("/social-links")
    public List<SchoolSocialLinkResponse> listSocialLinks() {
        return cmsService.listSocialLinks(tenantId());
    }

    @PostMapping("/social-links")
    @ResponseStatus(HttpStatus.CREATED)
    public SchoolSocialLinkResponse createSocialLink(@Valid @RequestBody SchoolSocialLinkRequest request) {
        return cmsService.createSocialLink(tenantId(), request);
    }

    @PutMapping("/social-links/{id}")
    public SchoolSocialLinkResponse updateSocialLink(@PathVariable UUID id, @Valid @RequestBody SchoolSocialLinkRequest request) {
        return cmsService.updateSocialLink(tenantId(), id, request);
    }

    @DeleteMapping("/social-links/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deleteSocialLink(@PathVariable UUID id) {
        cmsService.deleteSocialLink(tenantId(), id);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // AFFILIATION INFO
    // ─────────────────────────────────────────────────────────────────────────

    @GetMapping("/affiliation")
    public SchoolAffiliationInfoResponse getAffiliation() {
        return cmsService.getAffiliation(tenantId());
    }

    @PostMapping("/affiliation")
    public SchoolAffiliationInfoResponse saveAffiliation(@Valid @RequestBody SchoolAffiliationInfoRequest request) {
        return cmsService.saveAffiliation(tenantId(), request);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // BRANCHES
    // ─────────────────────────────────────────────────────────────────────────

    @GetMapping("/branches")
    public List<SchoolBranchResponse> listBranches() {
        return cmsService.listBranches(tenantId());
    }

    @PostMapping("/branches")
    @ResponseStatus(HttpStatus.CREATED)
    public SchoolBranchResponse createBranch(@Valid @RequestBody SchoolBranchRequest request) {
        return cmsService.createBranch(tenantId(), request);
    }

    @PutMapping("/branches/{id}")
    public SchoolBranchResponse updateBranch(@PathVariable UUID id, @Valid @RequestBody SchoolBranchRequest request) {
        return cmsService.updateBranch(tenantId(), id, request);
    }

    @DeleteMapping("/branches/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deleteBranch(@PathVariable UUID id) {
        cmsService.deleteBranch(tenantId(), id);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // ADMISSION INFO
    // ─────────────────────────────────────────────────────────────────────────

    @GetMapping("/admission-info")
    public SchoolAdmissionInfoResponse getAdmissionInfo() {
        return cmsService.getAdmissionInfo(tenantId());
    }

    @PostMapping("/admission-info")
    public SchoolAdmissionInfoResponse saveAdmissionInfo(@Valid @RequestBody SchoolAdmissionInfoRequest request) {
        return cmsService.saveAdmissionInfo(tenantId(), request);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // FEE STRUCTURE
    // ─────────────────────────────────────────────────────────────────────────

    @GetMapping("/fee-structures")
    public List<SchoolFeeStructureResponse> listFeeStructures() {
        return cmsService.listFeeStructures(tenantId());
    }

    @PostMapping("/fee-structures")
    @ResponseStatus(HttpStatus.CREATED)
    public SchoolFeeStructureResponse createFeeStructure(@Valid @RequestBody SchoolFeeStructureRequest request) {
        return cmsService.createFeeStructure(tenantId(), request);
    }

    @PutMapping("/fee-structures/{id}")
    public SchoolFeeStructureResponse updateFeeStructure(@PathVariable UUID id, @Valid @RequestBody SchoolFeeStructureRequest request) {
        return cmsService.updateFeeStructure(tenantId(), id, request);
    }

    @DeleteMapping("/fee-structures/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deleteFeeStructure(@PathVariable UUID id) {
        cmsService.deleteFeeStructure(tenantId(), id);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // ACADEMIC CONTENT
    // ─────────────────────────────────────────────────────────────────────────

    @GetMapping("/academic-content")
    public SchoolAcademicContentResponse getAcademicContent() {
        return cmsService.getAcademicContent(tenantId());
    }

    @PostMapping("/academic-content")
    public SchoolAcademicContentResponse saveAcademicContent(@Valid @RequestBody SchoolAcademicContentRequest request) {
        return cmsService.saveAcademicContent(tenantId(), request);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // SECTION CONFIG
    // ─────────────────────────────────────────────────────────────────────────

    @GetMapping("/section-config")
    public List<SchoolSectionConfigResponse> listSectionConfigs() {
        return cmsService.listSectionConfigs(tenantId());
    }

    @PostMapping("/section-config")
    public SchoolSectionConfigResponse saveSectionConfig(@Valid @RequestBody SchoolSectionConfigRequest request) {
        return cmsService.saveSectionConfig(tenantId(), request);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // ENQUIRIES
    // ─────────────────────────────────────────────────────────────────────────

    @GetMapping("/enquiries")
    public List<SchoolEnquiryResponse> getEnquiries(
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String type) {
        return enquiryService.getEnquiries(tenantId(), status, type);
    }

    @PatchMapping("/enquiries/{id}/status")
    public void updateEnquiryStatus(@PathVariable UUID id, @RequestParam String status) {
        enquiryService.updateStatus(tenantId(), id, status);
    }
}
