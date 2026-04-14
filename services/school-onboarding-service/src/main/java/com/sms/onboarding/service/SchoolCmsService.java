package com.sms.onboarding.service;

import com.sms.onboarding.api.SchoolCmsDtos.*;
import com.sms.onboarding.domain.cms.*;
import com.sms.onboarding.repository.cms.*;
import com.sms.onboarding.repository.SchoolOnboardingJpaRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

@Service
public class SchoolCmsService {

    private final SchoolLandingProfileRepository profileRepository;
    private final SchoolLeaderRepository leaderRepository;
    private final SchoolEventRepository eventRepository;
    private final SchoolGalleryAlbumRepository albumRepository;
    private final SchoolGalleryMediaRepository galleryMediaRepository;
    private final SchoolTestimonialRepository testimonialRepository;
    private final SchoolAchievementRepository achievementRepository;
    private final SchoolInfrastructureItemRepository infraRepository;
    private final SchoolSectionConfigRepository sectionConfigRepository;
    private final SchoolSocialLinkRepository socialLinkRepository;
    private final SchoolAffiliationInfoRepository affiliationRepository;
    private final SchoolBranchRepository branchRepository;
    private final SchoolAcademicContentRepository academicContentRepository;
    private final SchoolAdmissionInfoRepository admissionInfoRepository;
    private final SchoolFeeStructureRepository feeStructureRepository;
    private final SchoolNewsletterSubscriptionRepository newsletterRepository;
    private final SchoolEnquiryRepository enquiryRepository;
    private final SchoolOnboardingJpaRepository onboardingRepository;

    public SchoolCmsService(
            SchoolLandingProfileRepository profileRepository,
            SchoolLeaderRepository leaderRepository,
            SchoolEventRepository eventRepository,
            SchoolGalleryAlbumRepository albumRepository,
            SchoolGalleryMediaRepository galleryMediaRepository,
            SchoolTestimonialRepository testimonialRepository,
            SchoolAchievementRepository achievementRepository,
            SchoolInfrastructureItemRepository infraRepository,
            SchoolSectionConfigRepository sectionConfigRepository,
            SchoolSocialLinkRepository socialLinkRepository,
            SchoolAffiliationInfoRepository affiliationRepository,
            SchoolBranchRepository branchRepository,
            SchoolAcademicContentRepository academicContentRepository,
            SchoolAdmissionInfoRepository admissionInfoRepository,
            SchoolFeeStructureRepository feeStructureRepository,
            SchoolNewsletterSubscriptionRepository newsletterRepository,
            SchoolEnquiryRepository enquiryRepository,
            SchoolOnboardingJpaRepository onboardingRepository
    ) {
        this.profileRepository = profileRepository;
        this.leaderRepository = leaderRepository;
        this.eventRepository = eventRepository;
        this.albumRepository = albumRepository;
        this.galleryMediaRepository = galleryMediaRepository;
        this.testimonialRepository = testimonialRepository;
        this.achievementRepository = achievementRepository;
        this.infraRepository = infraRepository;
        this.sectionConfigRepository = sectionConfigRepository;
        this.socialLinkRepository = socialLinkRepository;
        this.affiliationRepository = affiliationRepository;
        this.branchRepository = branchRepository;
        this.academicContentRepository = academicContentRepository;
        this.admissionInfoRepository = admissionInfoRepository;
        this.feeStructureRepository = feeStructureRepository;
        this.newsletterRepository = newsletterRepository;
        this.enquiryRepository = enquiryRepository;
        this.onboardingRepository = onboardingRepository;
    }

    // ─────────────────────────────────────────────────────────────────────────
    // PUBLIC API
    // ─────────────────────────────────────────────────────────────────────────

    @Transactional(readOnly = true)
    public SchoolLandingPageResponse getLandingPage(String schoolCode) {
        var onboarding = onboardingRepository.findBySchoolCodeIgnoreCase(schoolCode)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "School not found: " + schoolCode));

        UUID tenantId = onboarding.getTenantId();
        if (tenantId == null) {
            throw new ResponseStatusException(HttpStatus.UNPROCESSABLE_ENTITY, "School not yet activated.");
        }

        return new SchoolLandingPageResponse(
                tenantId,
                profileRepository.findByTenantIdAndIsPublishedTrue(tenantId).map(this::mapToProfileResponse).orElse(null),
                leaderRepository.findByTenantIdAndIsPublishedTrueOrderByDisplayOrderAsc(tenantId).stream().map(this::mapToLeaderResponse).toList(),
                eventRepository.findByTenantIdAndIsPublishedTrueAndStartAtAfterOrderByStartAtAsc(tenantId, Instant.now()).stream().map(this::mapToEventResponse).toList(),
                albumRepository.findByTenantIdAndIsPublishedTrueOrderBySortOrderAsc(tenantId).stream().map(this::mapToAlbumResponse).toList(),
                testimonialRepository.findByTenantIdAndIsPublishedTrueOrderByDisplayOrderAsc(tenantId).stream().map(this::mapToTestimonialResponse).toList(),
                achievementRepository.findByTenantIdAndIsPublishedTrueOrderByDisplayOrderAsc(tenantId).stream().map(this::mapToAchievementResponse).toList(),
                infraRepository.findByTenantIdAndIsPublishedTrueOrderByDisplayOrderAsc(tenantId).stream().map(this::mapToInfraResponse).toList(),
                sectionConfigRepository.findByTenantIdOrderByDisplayOrderAsc(tenantId).stream().map(this::mapToSectionConfigResponse).toList(),
                socialLinkRepository.findByTenantIdAndIsPublishedTrueOrderByDisplayOrderAsc(tenantId).stream().map(this::mapToSocialLinkResponse).toList(),
                affiliationRepository.findByTenantIdAndIsPublishedTrue(tenantId).map(this::mapToAffiliationResponse).orElse(null),
                branchRepository.findByTenantIdAndIsPublishedTrueOrderByIsPrimaryDescBranchNameAsc(tenantId).stream().map(this::mapToBranchResponse).toList(),
                admissionInfoRepository.findByTenantIdAndIsPublishedTrue(tenantId).map(this::mapToAdmissionResponse).orElse(null),
                feeStructureRepository.findByTenantIdAndIsPublishedTrueOrderByAcademicYearDesc(tenantId).stream().map(this::mapToFeeStructureResponse).toList(),
                academicContentRepository.findByTenantIdAndIsPublishedTrue(tenantId).map(this::mapToAcademicContentResponse).orElse(null)
        );
    }

    // ─────────────────────────────────────────────────────────────────────────
    // PROFILE
    // ─────────────────────────────────────────────────────────────────────────

    @Transactional(readOnly = true)
    public SchoolLandingProfileResponse getProfile(UUID tenantId) {
        return profileRepository.findByTenantId(tenantId)
                .map(this::mapToProfileResponse)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Profile not found"));
    }

    @Transactional
    public SchoolLandingProfileResponse saveProfile(UUID tenantId, SchoolLandingProfileRequest request) {
        var entity = profileRepository.findByTenantId(tenantId)
                .orElse(newProfileEntity(tenantId));
        applyProfileRequest(entity, request);
        entity.setUpdatedAt(Instant.now());
        return mapToProfileResponse(profileRepository.save(entity));
    }

    @Transactional
    public SchoolLandingProfileResponse publishProfile(UUID tenantId, boolean publish) {
        var entity = profileRepository.findByTenantId(tenantId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Profile not found"));
        entity.setIsPublished(publish);
        entity.setUpdatedAt(Instant.now());
        return mapToProfileResponse(profileRepository.save(entity));
    }

    // ─────────────────────────────────────────────────────────────────────────
    // LEADERS
    // ─────────────────────────────────────────────────────────────────────────

    @Transactional(readOnly = true)
    public List<SchoolLeaderResponse> listLeaders(UUID tenantId) {
        return leaderRepository.findByTenantIdOrderByDisplayOrderAsc(tenantId).stream()
                .map(this::mapToLeaderResponse).toList();
    }

    @Transactional
    public SchoolLeaderResponse createLeader(UUID tenantId, SchoolLeaderRequest request) {
        var entity = new SchoolLeaderEntity();
        entity.setId(UUID.randomUUID());
        entity.setTenantId(tenantId);
        applyLeaderRequest(entity, request);
        return mapToLeaderResponse(leaderRepository.save(entity));
    }

    @Transactional
    public SchoolLeaderResponse updateLeader(UUID tenantId, UUID id, SchoolLeaderRequest request) {
        var entity = leaderRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Leader not found"));
        assertTenantOwnership(entity.getTenantId(), tenantId);
        applyLeaderRequest(entity, request);
        return mapToLeaderResponse(leaderRepository.save(entity));
    }

    @Transactional
    public void deleteLeader(UUID tenantId, UUID id) {
        var entity = leaderRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Leader not found"));
        assertTenantOwnership(entity.getTenantId(), tenantId);
        leaderRepository.delete(entity);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // EVENTS
    // ─────────────────────────────────────────────────────────────────────────

    @Transactional(readOnly = true)
    public List<SchoolEventResponse> listEvents(UUID tenantId) {
        return eventRepository.findByTenantIdOrderByStartAtDesc(tenantId).stream()
                .map(this::mapToEventResponse).toList();
    }

    @Transactional(readOnly = true)
    public List<SchoolEventResponse> getUpcomingEvents(UUID tenantId) {
        return eventRepository.findByTenantIdAndIsPublishedTrueAndStartAtAfterOrderByStartAtAsc(tenantId, Instant.now())
                .stream().map(this::mapToEventResponse).toList();
    }

    @Transactional(readOnly = true)
    public List<SchoolEventResponse> getArchivedEvents(UUID tenantId) {
        return eventRepository.findByTenantIdAndStartAtBeforeOrderByStartAtDesc(tenantId, Instant.now())
                .stream().map(this::mapToEventResponse).toList();
    }

    @Transactional(readOnly = true)
    public SchoolEventResponse getFeaturedEvent(UUID tenantId) {
        return eventRepository.findFirstByTenantIdAndIsFeaturedTrueAndIsPublishedTrueOrderByStartAtAsc(tenantId)
                .map(this::mapToEventResponse)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "No featured event found"));
    }

    @Transactional
    public SchoolEventResponse createEvent(UUID tenantId, SchoolEventRequest request) {
        var entity = new SchoolEventEntity();
        entity.setId(UUID.randomUUID());
        entity.setTenantId(tenantId);
        applyEventRequest(entity, request);
        return mapToEventResponse(eventRepository.save(entity));
    }

    @Transactional
    public SchoolEventResponse updateEvent(UUID tenantId, UUID id, SchoolEventRequest request) {
        var entity = eventRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Event not found"));
        assertTenantOwnership(entity.getTenantId(), tenantId);
        applyEventRequest(entity, request);
        return mapToEventResponse(eventRepository.save(entity));
    }

    @Transactional
    public void deleteEvent(UUID tenantId, UUID id) {
        var entity = eventRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Event not found"));
        assertTenantOwnership(entity.getTenantId(), tenantId);
        eventRepository.delete(entity);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // GALLERY
    // ─────────────────────────────────────────────────────────────────────────

    @Transactional(readOnly = true)
    public List<SchoolGalleryAlbumResponse> listAlbums(UUID tenantId) {
        return albumRepository.findByTenantIdOrderBySortOrderAsc(tenantId).stream()
                .map(this::mapToAlbumResponse).toList();
    }

    @Transactional
    public SchoolGalleryAlbumResponse createAlbum(UUID tenantId, SchoolGalleryAlbumRequest request) {
        var entity = new SchoolGalleryAlbumEntity();
        entity.setId(UUID.randomUUID());
        entity.setTenantId(tenantId);
        applyAlbumRequest(entity, request);
        return mapToAlbumResponse(albumRepository.save(entity));
    }

    @Transactional
    public SchoolGalleryAlbumResponse updateAlbum(UUID tenantId, UUID id, SchoolGalleryAlbumRequest request) {
        var entity = albumRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Album not found"));
        assertTenantOwnership(entity.getTenantId(), tenantId);
        applyAlbumRequest(entity, request);
        return mapToAlbumResponse(albumRepository.save(entity));
    }

    @Transactional
    public void deleteAlbum(UUID tenantId, UUID id) {
        var entity = albumRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Album not found"));
        assertTenantOwnership(entity.getTenantId(), tenantId);
        albumRepository.delete(entity);
    }

    @Transactional
    public SchoolGalleryMediaResponse addMediaToAlbum(UUID tenantId, UUID albumId, SchoolGalleryMediaRequest request) {
        var album = albumRepository.findById(albumId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Album not found"));
        assertTenantOwnership(album.getTenantId(), tenantId);

        var entity = new SchoolGalleryMediaEntity();
        entity.setId(UUID.randomUUID());
        entity.setTenantId(tenantId);
        entity.setAlbumId(albumId);
        applyGalleryMediaRequest(entity, request);
        return mapToGalleryMediaResponse(galleryMediaRepository.save(entity));
    }

    @Transactional
    public void deleteGalleryMedia(UUID tenantId, UUID mediaItemId) {
        var entity = galleryMediaRepository.findById(mediaItemId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Media item not found"));
        assertTenantOwnership(entity.getTenantId(), tenantId);
        galleryMediaRepository.delete(entity);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // TESTIMONIALS
    // ─────────────────────────────────────────────────────────────────────────

    @Transactional(readOnly = true)
    public List<SchoolTestimonialResponse> listTestimonials(UUID tenantId) {
        return testimonialRepository.findByTenantIdOrderByDisplayOrderAsc(tenantId).stream()
                .map(this::mapToTestimonialResponse).toList();
    }

    @Transactional
    public SchoolTestimonialResponse createTestimonial(UUID tenantId, SchoolTestimonialRequest request) {
        var entity = new SchoolTestimonialEntity();
        entity.setId(UUID.randomUUID());
        entity.setTenantId(tenantId);
        applyTestimonialRequest(entity, request);
        return mapToTestimonialResponse(testimonialRepository.save(entity));
    }

    @Transactional
    public SchoolTestimonialResponse updateTestimonial(UUID tenantId, UUID id, SchoolTestimonialRequest request) {
        var entity = testimonialRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Testimonial not found"));
        assertTenantOwnership(entity.getTenantId(), tenantId);
        applyTestimonialRequest(entity, request);
        return mapToTestimonialResponse(testimonialRepository.save(entity));
    }

    @Transactional
    public void deleteTestimonial(UUID tenantId, UUID id) {
        var entity = testimonialRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Testimonial not found"));
        assertTenantOwnership(entity.getTenantId(), tenantId);
        testimonialRepository.delete(entity);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // ACHIEVEMENTS
    // ─────────────────────────────────────────────────────────────────────────

    @Transactional(readOnly = true)
    public List<SchoolAchievementResponse> listAchievements(UUID tenantId) {
        return achievementRepository.findByTenantIdOrderByDisplayOrderAsc(tenantId).stream()
                .map(this::mapToAchievementResponse).toList();
    }

    @Transactional
    public SchoolAchievementResponse createAchievement(UUID tenantId, SchoolAchievementRequest request) {
        var entity = new SchoolAchievementEntity();
        entity.setId(UUID.randomUUID());
        entity.setTenantId(tenantId);
        applyAchievementRequest(entity, request);
        return mapToAchievementResponse(achievementRepository.save(entity));
    }

    @Transactional
    public SchoolAchievementResponse updateAchievement(UUID tenantId, UUID id, SchoolAchievementRequest request) {
        var entity = achievementRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Achievement not found"));
        assertTenantOwnership(entity.getTenantId(), tenantId);
        applyAchievementRequest(entity, request);
        return mapToAchievementResponse(achievementRepository.save(entity));
    }

    @Transactional
    public void deleteAchievement(UUID tenantId, UUID id) {
        var entity = achievementRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Achievement not found"));
        assertTenantOwnership(entity.getTenantId(), tenantId);
        achievementRepository.delete(entity);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // INFRASTRUCTURE
    // ─────────────────────────────────────────────────────────────────────────

    @Transactional(readOnly = true)
    public List<SchoolInfrastructureItemResponse> listInfrastructure(UUID tenantId) {
        return infraRepository.findByTenantIdOrderByDisplayOrderAsc(tenantId).stream()
                .map(this::mapToInfraResponse).toList();
    }

    @Transactional
    public SchoolInfrastructureItemResponse createInfrastructure(UUID tenantId, SchoolInfrastructureItemRequest request) {
        var entity = new SchoolInfrastructureItemEntity();
        entity.setId(UUID.randomUUID());
        entity.setTenantId(tenantId);
        applyInfraRequest(entity, request);
        return mapToInfraResponse(infraRepository.save(entity));
    }

    @Transactional
    public SchoolInfrastructureItemResponse updateInfrastructure(UUID tenantId, UUID id, SchoolInfrastructureItemRequest request) {
        var entity = infraRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Infrastructure item not found"));
        assertTenantOwnership(entity.getTenantId(), tenantId);
        applyInfraRequest(entity, request);
        return mapToInfraResponse(infraRepository.save(entity));
    }

    @Transactional
    public void deleteInfrastructure(UUID tenantId, UUID id) {
        var entity = infraRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Infrastructure item not found"));
        assertTenantOwnership(entity.getTenantId(), tenantId);
        infraRepository.delete(entity);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // SOCIAL LINKS
    // ─────────────────────────────────────────────────────────────────────────

    @Transactional(readOnly = true)
    public List<SchoolSocialLinkResponse> listSocialLinks(UUID tenantId) {
        return socialLinkRepository.findByTenantIdOrderByDisplayOrderAsc(tenantId).stream()
                .map(this::mapToSocialLinkResponse).toList();
    }

    @Transactional
    public SchoolSocialLinkResponse createSocialLink(UUID tenantId, SchoolSocialLinkRequest request) {
        var entity = new SchoolSocialLinkEntity();
        entity.setId(UUID.randomUUID());
        entity.setTenantId(tenantId);
        entity.setPlatform(request.platform());
        entity.setUrl(request.url());
        entity.setDisplayOrder(request.displayOrder() != null ? request.displayOrder() : 0);
        entity.setIsPublished(Boolean.TRUE.equals(request.isPublished()));
        return mapToSocialLinkResponse(socialLinkRepository.save(entity));
    }

    @Transactional
    public SchoolSocialLinkResponse updateSocialLink(UUID tenantId, UUID id, SchoolSocialLinkRequest request) {
        var entity = socialLinkRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Social link not found"));
        assertTenantOwnership(entity.getTenantId(), tenantId);
        entity.setPlatform(request.platform());
        entity.setUrl(request.url());
        entity.setDisplayOrder(request.displayOrder() != null ? request.displayOrder() : 0);
        entity.setIsPublished(Boolean.TRUE.equals(request.isPublished()));
        return mapToSocialLinkResponse(socialLinkRepository.save(entity));
    }

    @Transactional
    public void deleteSocialLink(UUID tenantId, UUID id) {
        var entity = socialLinkRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Social link not found"));
        assertTenantOwnership(entity.getTenantId(), tenantId);
        socialLinkRepository.delete(entity);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // AFFILIATION
    // ─────────────────────────────────────────────────────────────────────────

    @Transactional(readOnly = true)
    public SchoolAffiliationInfoResponse getAffiliation(UUID tenantId) {
        return affiliationRepository.findByTenantId(tenantId)
                .map(this::mapToAffiliationResponse)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Affiliation not found"));
    }

    @Transactional
    public SchoolAffiliationInfoResponse saveAffiliation(UUID tenantId, SchoolAffiliationInfoRequest request) {
        var entity = affiliationRepository.findByTenantId(tenantId)
                .orElse(newAffiliationEntity(tenantId));
        entity.setBoardName(request.boardName());
        entity.setAffiliationNumber(request.affiliationNumber());
        entity.setComplianceText(request.complianceText());
        entity.setRecognitionDetails(request.recognitionDetails());
        entity.setIsPublished(Boolean.TRUE.equals(request.isPublished()));
        return mapToAffiliationResponse(affiliationRepository.save(entity));
    }

    // ─────────────────────────────────────────────────────────────────────────
    // BRANCHES
    // ─────────────────────────────────────────────────────────────────────────

    @Transactional(readOnly = true)
    public List<SchoolBranchResponse> listBranches(UUID tenantId) {
        return branchRepository.findByTenantIdOrderByIsPrimaryDescBranchNameAsc(tenantId).stream()
                .map(this::mapToBranchResponse).toList();
    }

    @Transactional
    public SchoolBranchResponse createBranch(UUID tenantId, SchoolBranchRequest request) {
        var entity = new SchoolBranchEntity();
        entity.setId(UUID.randomUUID());
        entity.setTenantId(tenantId);
        applyBranchRequest(entity, request);
        return mapToBranchResponse(branchRepository.save(entity));
    }

    @Transactional
    public SchoolBranchResponse updateBranch(UUID tenantId, UUID id, SchoolBranchRequest request) {
        var entity = branchRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Branch not found"));
        assertTenantOwnership(entity.getTenantId(), tenantId);
        applyBranchRequest(entity, request);
        return mapToBranchResponse(branchRepository.save(entity));
    }

    @Transactional
    public void deleteBranch(UUID tenantId, UUID id) {
        var entity = branchRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Branch not found"));
        assertTenantOwnership(entity.getTenantId(), tenantId);
        branchRepository.delete(entity);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // ADMISSION INFO
    // ─────────────────────────────────────────────────────────────────────────

    @Transactional(readOnly = true)
    public SchoolAdmissionInfoResponse getAdmissionInfo(UUID tenantId) {
        return admissionInfoRepository.findByTenantId(tenantId)
                .map(this::mapToAdmissionResponse)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Admission info not found"));
    }

    @Transactional
    public SchoolAdmissionInfoResponse saveAdmissionInfo(UUID tenantId, SchoolAdmissionInfoRequest request) {
        var entity = admissionInfoRepository.findByTenantId(tenantId)
                .orElse(newAdmissionInfoEntity(tenantId));
        entity.setOverview(request.overview());
        entity.setProcess(request.process());
        entity.setEligibility(request.eligibility());
        entity.setBrochureMediaId(request.brochureMediaId());
        entity.setContactName(request.contactName());
        entity.setContactPhone(request.contactPhone());
        entity.setContactEmail(request.contactEmail());
        entity.setIsPublished(Boolean.TRUE.equals(request.isPublished()));
        return mapToAdmissionResponse(admissionInfoRepository.save(entity));
    }

    // ─────────────────────────────────────────────────────────────────────────
    // FEE STRUCTURE
    // ─────────────────────────────────────────────────────────────────────────

    @Transactional(readOnly = true)
    public List<SchoolFeeStructureResponse> listFeeStructures(UUID tenantId) {
        return feeStructureRepository.findByTenantIdOrderByAcademicYearDesc(tenantId).stream()
                .map(this::mapToFeeStructureResponse).toList();
    }

    @Transactional
    public SchoolFeeStructureResponse createFeeStructure(UUID tenantId, SchoolFeeStructureRequest request) {
        var entity = new SchoolFeeStructureEntity();
        entity.setId(UUID.randomUUID());
        entity.setTenantId(tenantId);
        applyFeeStructureRequest(entity, request);
        return mapToFeeStructureResponse(feeStructureRepository.save(entity));
    }

    @Transactional
    public SchoolFeeStructureResponse updateFeeStructure(UUID tenantId, UUID id, SchoolFeeStructureRequest request) {
        var entity = feeStructureRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Fee structure not found"));
        assertTenantOwnership(entity.getTenantId(), tenantId);
        applyFeeStructureRequest(entity, request);
        return mapToFeeStructureResponse(feeStructureRepository.save(entity));
    }

    @Transactional
    public void deleteFeeStructure(UUID tenantId, UUID id) {
        var entity = feeStructureRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Fee structure not found"));
        assertTenantOwnership(entity.getTenantId(), tenantId);
        feeStructureRepository.delete(entity);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // ACADEMIC CONTENT
    // ─────────────────────────────────────────────────────────────────────────

    @Transactional(readOnly = true)
    public SchoolAcademicContentResponse getAcademicContent(UUID tenantId) {
        return academicContentRepository.findByTenantId(tenantId)
                .map(this::mapToAcademicContentResponse)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Academic content not found"));
    }

    @Transactional
    public SchoolAcademicContentResponse saveAcademicContent(UUID tenantId, SchoolAcademicContentRequest request) {
        var entity = academicContentRepository.findByTenantId(tenantId)
                .orElse(newAcademicContentEntity(tenantId));
        entity.setCurriculum(request.curriculum());
        entity.setCoCurricular(request.coCurricular());
        entity.setScholarshipInfo(request.scholarshipInfo());
        entity.setResultHighlights(request.resultHighlights());
        entity.setNotices(request.notices());
        entity.setCalendarData(request.calendarData());
        entity.setIsPublished(Boolean.TRUE.equals(request.isPublished()));
        entity.setUpdatedAt(Instant.now());
        return mapToAcademicContentResponse(academicContentRepository.save(entity));
    }

    // ─────────────────────────────────────────────────────────────────────────
    // SECTION CONFIG
    // ─────────────────────────────────────────────────────────────────────────

    @Transactional(readOnly = true)
    public List<SchoolSectionConfigResponse> listSectionConfigs(UUID tenantId) {
        return sectionConfigRepository.findByTenantIdOrderByDisplayOrderAsc(tenantId).stream()
                .map(this::mapToSectionConfigResponse).toList();
    }

    @Transactional
    public SchoolSectionConfigResponse saveSectionConfig(UUID tenantId, SchoolSectionConfigRequest request) {
        var entity = sectionConfigRepository
                .findByTenantIdAndSectionKey(tenantId, request.sectionKey())
                .orElse(newSectionConfigEntity(tenantId, request.sectionKey()));
        entity.setIsEnabled(Boolean.TRUE.equals(request.isEnabled()));
        entity.setDisplayOrder(request.displayOrder() != null ? request.displayOrder() : 0);
        entity.setTitleOverride(request.titleOverride());
        entity.setSubtitleOverride(request.subtitleOverride());
        entity.setConfigJson(request.configJson());
        entity.setUpdatedAt(Instant.now());
        return mapToSectionConfigResponse(sectionConfigRepository.save(entity));
    }

    // ─────────────────────────────────────────────────────────────────────────
    // NEWSLETTER
    // ─────────────────────────────────────────────────────────────────────────

    @Transactional
    public NewsletterSubscribeResponse subscribe(String schoolCode, String email) {
        var onboarding = onboardingRepository.findBySchoolCodeIgnoreCase(schoolCode)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "School not found"));

        UUID tenantId = onboarding.getTenantId();
        if (tenantId == null) throw new ResponseStatusException(HttpStatus.UNPROCESSABLE_ENTITY, "School not activated");

        var existing = newsletterRepository.findByTenantIdAndEmail(tenantId, email.toLowerCase());
        if (existing.isPresent()) {
            var sub = existing.get();
            if ("ACTIVE".equals(sub.getStatus())) {
                return mapToNewsletterResponse(sub);
            }
            sub.setStatus("ACTIVE");
            sub.setSubscribedAt(Instant.now());
            return mapToNewsletterResponse(newsletterRepository.save(sub));
        }

        var entity = new SchoolNewsletterSubscriptionEntity();
        entity.setId(UUID.randomUUID());
        entity.setTenantId(tenantId);
        entity.setEmail(email.toLowerCase());
        entity.setStatus("ACTIVE");
        entity.setSubscribedAt(Instant.now());
        return mapToNewsletterResponse(newsletterRepository.save(entity));
    }

    // ─────────────────────────────────────────────────────────────────────────
    // DASHBOARD STATS
    // ─────────────────────────────────────────────────────────────────────────

    @Transactional(readOnly = true)
    public CmsDashboardStatsResponse getDashboardStats(UUID tenantId) {
        int pendingEnquiries = (int) enquiryCountByStatus(tenantId, "NEW");
        int upcomingEvents = eventRepository
                .findByTenantIdAndIsPublishedTrueAndStartAtAfterOrderByStartAtAsc(tenantId, Instant.now()).size();
        int unpublishedSections = (int) sectionConfigRepository.findByTenantIdOrderByDisplayOrderAsc(tenantId)
                .stream().filter(s -> !Boolean.TRUE.equals(s.getIsEnabled())).count();
        int totalAlbums = (int) albumRepository.findByTenantIdOrderBySortOrderAsc(tenantId).size();
        long newsletterCount = newsletterRepository.countByTenantIdAndStatus(tenantId, "ACTIVE");

        boolean profilePublished = profileRepository.findByTenantIdAndIsPublishedTrue(tenantId).isPresent();
        boolean admissionPublished = admissionInfoRepository.findByTenantIdAndIsPublishedTrue(tenantId).isPresent();
        boolean affiliationPublished = affiliationRepository.findByTenantIdAndIsPublishedTrue(tenantId).isPresent();

        // Content completeness
        boolean hasProfile = profileRepository.findByTenantId(tenantId).isPresent();
        boolean hasLeaders = !leaderRepository.findByTenantIdOrderByDisplayOrderAsc(tenantId).isEmpty();
        boolean hasBranches = !branchRepository.findByTenantIdOrderByIsPrimaryDescBranchNameAsc(tenantId).isEmpty();
        boolean hasEvents = !eventRepository.findByTenantIdOrderByStartAtDesc(tenantId).isEmpty();
        boolean hasGallery = !albumRepository.findByTenantIdOrderBySortOrderAsc(tenantId).isEmpty();
        boolean hasTestimonials = !testimonialRepository.findByTenantIdOrderByDisplayOrderAsc(tenantId).isEmpty();
        boolean hasAchievements = !achievementRepository.findByTenantIdOrderByDisplayOrderAsc(tenantId).isEmpty();
        boolean hasAdmission = admissionInfoRepository.findByTenantId(tenantId).isPresent();
        boolean hasFees = !feeStructureRepository.findByTenantIdOrderByAcademicYearDesc(tenantId).isEmpty();

        int completedSections = 0;
        int totalSections = 9;
        if (hasProfile) completedSections++;
        if (hasLeaders) completedSections++;
        if (hasBranches) completedSections++;
        if (hasEvents) completedSections++;
        if (hasGallery) completedSections++;
        if (hasTestimonials) completedSections++;
        if (hasAchievements) completedSections++;
        if (hasAdmission) completedSections++;
        if (hasFees) completedSections++;

        int completionPercent = (int) Math.round((completedSections / (double) totalSections) * 100);

        return new CmsDashboardStatsResponse(
                pendingEnquiries,
                upcomingEvents,
                unpublishedSections,
                totalAlbums,
                (int) newsletterCount,
                profilePublished,
                admissionPublished,
                affiliationPublished,
                new ContentCompletenessResponse(
                        hasProfile, hasLeaders, hasBranches, hasEvents, hasGallery,
                        hasTestimonials, hasAchievements, hasAdmission, hasFees, completionPercent
                )
        );
    }

    // ─────────────────────────────────────────────────────────────────────────
    // HELPERS / PRIVATE
    // ─────────────────────────────────────────────────────────────────────────

    private long enquiryCountByStatus(UUID tenantId, String status) {
        return enquiryRepository.countByTenantIdAndStatus(tenantId, status);
    }

    private void assertTenantOwnership(UUID entityTenantId, UUID requestTenantId) {
        if (!entityTenantId.equals(requestTenantId)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Access denied: tenant mismatch");
        }
    }

    // ─── Apply helpers ────────────────────────────────────────────────────────

    private void applyProfileRequest(SchoolLandingProfileEntity e, SchoolLandingProfileRequest r) {
        if (r.schoolName() != null) e.setSchoolName(r.schoolName());
        if (r.shortName() != null) e.setShortName(r.shortName());
        if (r.tagline() != null) e.setTagline(r.tagline());
        if (r.shortDescription() != null) e.setShortDescription(r.shortDescription());
        if (r.aboutHtml() != null) e.setAboutHtml(r.aboutHtml());
        if (r.objective() != null) e.setObjective(r.objective());
        if (r.mission() != null) e.setMission(r.mission());
        if (r.vision() != null) e.setVision(r.vision());
        if (r.history() != null) e.setHistory(r.history());
        if (r.whyUs() != null) e.setWhyUs(r.whyUs());
        if (r.addressLine1() != null) e.setAddressLine1(r.addressLine1());
        if (r.addressLine2() != null) e.setAddressLine2(r.addressLine2());
        if (r.city() != null) e.setCity(r.city());
        if (r.state() != null) e.setState(r.state());
        if (r.country() != null) e.setCountry(r.country());
        if (r.pincode() != null) e.setPincode(r.pincode());
        if (r.latitude() != null) e.setLatitude(r.latitude());
        if (r.longitude() != null) e.setLongitude(r.longitude());
        if (r.phone() != null) e.setPhone(r.phone());
        if (r.alternatePhone() != null) e.setAlternatePhone(r.alternatePhone());
        if (r.email() != null) e.setEmail(r.email());
        if (r.website() != null) e.setWebsite(r.website());
        if (r.officeHours() != null) e.setOfficeHours(r.officeHours());
        if (r.isPublished() != null) e.setIsPublished(r.isPublished());
    }

    private void applyLeaderRequest(SchoolLeaderEntity e, SchoolLeaderRequest r) {
        e.setType(r.type());
        e.setName(r.name());
        e.setTitle(r.title());
        e.setBio(r.bio());
        e.setMessage(r.message());
        e.setImageMediaId(r.imageMediaId());
        e.setDisplayOrder(r.displayOrder() != null ? r.displayOrder() : 0);
        e.setIsPublished(Boolean.TRUE.equals(r.isPublished()));
    }

    private void applyEventRequest(SchoolEventEntity e, SchoolEventRequest r) {
        e.setTitle(r.title());
        e.setSlug(r.slug());
        e.setDescription(r.description());
        e.setStartAt(r.startAt());
        e.setEndAt(r.endAt());
        e.setLocation(r.location());
        e.setBannerMediaId(r.bannerMediaId());
        e.setRegistrationUrl(r.registrationUrl());
        e.setIsFeatured(Boolean.TRUE.equals(r.isFeatured()));
        e.setIsPublished(Boolean.TRUE.equals(r.isPublished()));
        e.setStatus(r.status() != null ? r.status() : "UPCOMING");
    }

    private void applyAlbumRequest(SchoolGalleryAlbumEntity e, SchoolGalleryAlbumRequest r) {
        e.setTitle(r.title());
        e.setDescription(r.description());
        e.setCoverMediaId(r.coverMediaId());
        e.setEventId(r.eventId());
        e.setIsPublished(Boolean.TRUE.equals(r.isPublished()));
        e.setSortOrder(r.sortOrder() != null ? r.sortOrder() : 0);
    }

    private void applyGalleryMediaRequest(SchoolGalleryMediaEntity e, SchoolGalleryMediaRequest r) {
        e.setMediaId(r.mediaId());
        e.setMediaType(r.mediaType());
        e.setCaption(r.caption());
        e.setAltText(r.altText());
        e.setTags(r.tags());
        e.setTakenAt(r.takenAt());
        e.setIsPublished(Boolean.TRUE.equals(r.isPublished()));
        e.setSortOrder(r.sortOrder() != null ? r.sortOrder() : 0);
    }

    private void applyTestimonialRequest(SchoolTestimonialEntity e, SchoolTestimonialRequest r) {
        e.setAuthorName(r.authorName());
        e.setRelationshipType(r.relationshipType());
        e.setDesignation(r.designation());
        e.setContent(r.content());
        e.setImageMediaId(r.imageMediaId());
        e.setRating(r.rating());
        e.setDisplayOrder(r.displayOrder() != null ? r.displayOrder() : 0);
        e.setIsPublished(Boolean.TRUE.equals(r.isPublished()));
    }

    private void applyAchievementRequest(SchoolAchievementEntity e, SchoolAchievementRequest r) {
        e.setTitle(r.title());
        e.setDescription(r.description());
        e.setAchievementYear(r.achievementYear());
        e.setCategory(r.category());
        e.setImageMediaId(r.imageMediaId());
        e.setIsFeatured(Boolean.TRUE.equals(r.isFeatured()));
        e.setDisplayOrder(r.displayOrder() != null ? r.displayOrder() : 0);
        e.setIsPublished(Boolean.TRUE.equals(r.isPublished()));
    }

    private void applyInfraRequest(SchoolInfrastructureItemEntity e, SchoolInfrastructureItemRequest r) {
        e.setType(r.type());
        e.setTitle(r.title());
        e.setDescription(r.description());
        e.setImageMediaId(r.imageMediaId());
        e.setIcon(r.icon());
        e.setDisplayOrder(r.displayOrder() != null ? r.displayOrder() : 0);
        e.setIsPublished(Boolean.TRUE.equals(r.isPublished()));
    }

    private void applyBranchRequest(SchoolBranchEntity e, SchoolBranchRequest r) {
        e.setBranchName(r.branchName());
        e.setAddress(r.address());
        e.setCity(r.city());
        e.setState(r.state());
        e.setPincode(r.pincode());
        e.setLatitude(r.latitude());
        e.setLongitude(r.longitude());
        e.setPhone(r.phone());
        e.setEmail(r.email());
        e.setIsPrimary(Boolean.TRUE.equals(r.isPrimary()));
        e.setIsPublished(Boolean.TRUE.equals(r.isPublished()));
    }

    private void applyFeeStructureRequest(SchoolFeeStructureEntity e, SchoolFeeStructureRequest r) {
        e.setAcademicYear(r.academicYear());
        e.setTitle(r.title());
        e.setDescription(r.description());
        e.setStructuredDataJson(r.structuredDataJson());
        e.setAttachmentMediaId(r.attachmentMediaId());
        e.setIsPublished(Boolean.TRUE.equals(r.isPublished()));
    }

    // ─── New entity factories ─────────────────────────────────────────────────

    private SchoolLandingProfileEntity newProfileEntity(UUID tenantId) {
        var e = new SchoolLandingProfileEntity();
        e.setId(UUID.randomUUID());
        e.setTenantId(tenantId);
        return e;
    }

    private SchoolAffiliationInfoEntity newAffiliationEntity(UUID tenantId) {
        var e = new SchoolAffiliationInfoEntity();
        e.setId(UUID.randomUUID());
        e.setTenantId(tenantId);
        return e;
    }

    private SchoolAdmissionInfoEntity newAdmissionInfoEntity(UUID tenantId) {
        var e = new SchoolAdmissionInfoEntity();
        e.setId(UUID.randomUUID());
        e.setTenantId(tenantId);
        return e;
    }

    private SchoolAcademicContentEntity newAcademicContentEntity(UUID tenantId) {
        var e = new SchoolAcademicContentEntity();
        e.setId(UUID.randomUUID());
        e.setTenantId(tenantId);
        return e;
    }

    private SchoolSectionConfigEntity newSectionConfigEntity(UUID tenantId, String sectionKey) {
        var e = new SchoolSectionConfigEntity();
        e.setId(UUID.randomUUID());
        e.setTenantId(tenantId);
        e.setSectionKey(sectionKey);
        return e;
    }

    // ─── Mappers ──────────────────────────────────────────────────────────────

    private SchoolLandingProfileResponse mapToProfileResponse(SchoolLandingProfileEntity e) {
        return new SchoolLandingProfileResponse(
                e.getId(), e.getTenantId(), e.getSchoolName(), e.getShortName(), e.getTagline(),
                e.getShortDescription(), e.getAboutHtml(), e.getObjective(), e.getMission(), e.getVision(),
                e.getHistory(), e.getWhyUs(), e.getAddressLine1(), e.getAddressLine2(), e.getCity(),
                e.getState(), e.getCountry(), e.getPincode(), e.getLatitude(), e.getLongitude(),
                e.getPhone(), e.getAlternatePhone(), e.getEmail(), e.getWebsite(), e.getOfficeHours(),
                e.getIsPublished(), e.getUpdatedAt()
        );
    }

    private SchoolLeaderResponse mapToLeaderResponse(SchoolLeaderEntity e) {
        return new SchoolLeaderResponse(e.getId(), e.getType(), e.getName(), e.getTitle(),
                e.getBio(), e.getMessage(), e.getImageMediaId(), e.getDisplayOrder(), e.getIsPublished());
    }

    private SchoolEventResponse mapToEventResponse(SchoolEventEntity e) {
        return new SchoolEventResponse(e.getId(), e.getTitle(), e.getSlug(), e.getDescription(),
                e.getStartAt(), e.getEndAt(), e.getLocation(), e.getBannerMediaId(),
                e.getRegistrationUrl(), e.getIsFeatured(), e.getIsPublished(), e.getStatus());
    }

    private SchoolGalleryAlbumResponse mapToAlbumResponse(SchoolGalleryAlbumEntity e) {
        var items = galleryMediaRepository.findByAlbumIdAndIsPublishedTrueOrderBySortOrderAsc(e.getId())
                .stream().map(this::mapToGalleryMediaResponse).toList();
        return new SchoolGalleryAlbumResponse(e.getId(), e.getTitle(), e.getDescription(),
                e.getCoverMediaId(), e.getEventId(), e.getIsPublished(), e.getSortOrder(), items);
    }

    private SchoolGalleryMediaResponse mapToGalleryMediaResponse(SchoolGalleryMediaEntity e) {
        return new SchoolGalleryMediaResponse(e.getId(), e.getMediaId(), e.getMediaType(),
                e.getCaption(), e.getAltText(), e.getTags(), e.getTakenAt(), e.getIsPublished(), e.getSortOrder());
    }

    private SchoolTestimonialResponse mapToTestimonialResponse(SchoolTestimonialEntity e) {
        return new SchoolTestimonialResponse(e.getId(), e.getAuthorName(), e.getRelationshipType(),
                e.getDesignation(), e.getContent(), e.getImageMediaId(), e.getRating(),
                e.getDisplayOrder(), e.getIsPublished());
    }

    private SchoolAchievementResponse mapToAchievementResponse(SchoolAchievementEntity e) {
        return new SchoolAchievementResponse(e.getId(), e.getTitle(), e.getDescription(),
                e.getAchievementYear(), e.getCategory(), e.getImageMediaId(), e.getIsFeatured(),
                e.getDisplayOrder(), e.getIsPublished());
    }

    private SchoolInfrastructureItemResponse mapToInfraResponse(SchoolInfrastructureItemEntity e) {
        return new SchoolInfrastructureItemResponse(e.getId(), e.getType(), e.getTitle(),
                e.getDescription(), e.getImageMediaId(), e.getIcon(), e.getDisplayOrder(), e.getIsPublished());
    }

    private SchoolSectionConfigResponse mapToSectionConfigResponse(SchoolSectionConfigEntity e) {
        return new SchoolSectionConfigResponse(e.getSectionKey(), e.getIsEnabled(), e.getDisplayOrder(),
                e.getTitleOverride(), e.getSubtitleOverride(), e.getConfigJson());
    }

    private SchoolSocialLinkResponse mapToSocialLinkResponse(SchoolSocialLinkEntity e) {
        return new SchoolSocialLinkResponse(e.getId(), e.getPlatform(), e.getUrl(), e.getDisplayOrder(), e.getIsPublished());
    }

    private SchoolAffiliationInfoResponse mapToAffiliationResponse(SchoolAffiliationInfoEntity e) {
        return new SchoolAffiliationInfoResponse(e.getBoardName(), e.getAffiliationNumber(),
                e.getComplianceText(), e.getRecognitionDetails(), e.getIsPublished());
    }

    private SchoolBranchResponse mapToBranchResponse(SchoolBranchEntity e) {
        return new SchoolBranchResponse(e.getId(), e.getBranchName(), e.getAddress(), e.getCity(),
                e.getState(), e.getPincode(), e.getLatitude(), e.getLongitude(),
                e.getPhone(), e.getEmail(), e.getIsPrimary(), e.getIsPublished());
    }

    private SchoolAdmissionInfoResponse mapToAdmissionResponse(SchoolAdmissionInfoEntity e) {
        return new SchoolAdmissionInfoResponse(e.getId(), e.getOverview(), e.getProcess(),
                e.getEligibility(), e.getBrochureMediaId(), e.getContactName(),
                e.getContactPhone(), e.getContactEmail(), e.getIsPublished());
    }

    private SchoolFeeStructureResponse mapToFeeStructureResponse(SchoolFeeStructureEntity e) {
        return new SchoolFeeStructureResponse(e.getId(), e.getAcademicYear(), e.getTitle(),
                e.getDescription(), e.getStructuredDataJson(), e.getAttachmentMediaId(), e.getIsPublished());
    }

    private SchoolAcademicContentResponse mapToAcademicContentResponse(SchoolAcademicContentEntity e) {
        return new SchoolAcademicContentResponse(e.getId(), e.getCurriculum(), e.getCoCurricular(),
                e.getScholarshipInfo(), e.getResultHighlights(), e.getNotices(), e.getCalendarData(), e.getIsPublished());
    }

    private NewsletterSubscribeResponse mapToNewsletterResponse(SchoolNewsletterSubscriptionEntity e) {
        return new NewsletterSubscribeResponse(e.getId(), e.getEmail(), e.getStatus(), e.getSubscribedAt());
    }
}
