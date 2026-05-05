package com.sms.onboarding.service;

import com.sms.onboarding.api.SchoolOnboardingRequest;
import com.sms.onboarding.api.OnboardingReviewAction;
import com.sms.onboarding.api.OnboardingReviewRequest;
import com.sms.onboarding.api.SchoolOnboardingResponse;
import com.sms.onboarding.api.SchoolStatusLookupResponse;
import com.sms.onboarding.domain.OnboardingStatus;
import com.sms.onboarding.domain.RequiredDocumentTemplateEntity;
import com.sms.onboarding.domain.SchoolOnboardingDocumentEntity;
import com.sms.onboarding.domain.SchoolOnboardingEntity;
import com.sms.onboarding.repository.RequiredDocumentTemplateJpaRepository;
import com.sms.onboarding.repository.SchoolOnboardingJpaRepository;
import com.sms.onboarding.event.MqttEventPublisher;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.client.RestClient;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.util.StringUtils;

import com.sms.onboarding.api.ProvisionSchoolRequest;
import com.sms.onboarding.api.ProvisionSchoolResponse;
import com.sms.onboarding.api.ActivationDetailsResponse;
import com.sms.onboarding.api.PublicSchoolProfileResponse;
import com.sms.onboarding.api.SchoolBrandingResponse;
import java.time.Instant;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.Arrays;
import java.util.stream.Collectors;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.web.multipart.MultipartFile;

@Service
public class SchoolOnboardingService {

    private static final Logger logger = LoggerFactory.getLogger(SchoolOnboardingService.class);

    private final SchoolOnboardingJpaRepository schoolOnboardingJpaRepository;
    private final RequiredDocumentTemplateJpaRepository requiredDocumentTemplateJpaRepository;
    private final MqttEventPublisher mqttEventPublisher;
    private final RestClient authRestClient;
    private final RestClient commRestClient;
    private final RestClient subscriptionRestClient;
    private final PublicMediaAssetService publicMediaAssetService;


    private final String authServiceUrl;
    private final String communicationServiceUrl;
    private final String subscriptionServiceUrl;

    private static String normalizeServiceUrl(String configured, String fallback) {
        if (!StringUtils.hasText(configured)) return fallback;
        if ("DEFAULT".equalsIgnoreCase(configured.trim())) return fallback;
        return configured.trim();
    }

    public SchoolOnboardingService(
            SchoolOnboardingJpaRepository schoolOnboardingJpaRepository,
            RequiredDocumentTemplateJpaRepository requiredDocumentTemplateJpaRepository,
            MqttEventPublisher mqttEventPublisher,
            PublicMediaAssetService publicMediaAssetService,
            RestClient.Builder restClientBuilder,
            @Value("${app.auth-service-url:DEFAULT}") String authServiceUrl,
            @Value("${app.communication-service-url:DEFAULT}") String communicationServiceUrl,
            @Value("${app.subscription-service-url:DEFAULT}") String subscriptionServiceUrl
    ) {
        this.schoolOnboardingJpaRepository = schoolOnboardingJpaRepository;
        this.requiredDocumentTemplateJpaRepository = requiredDocumentTemplateJpaRepository;
        this.mqttEventPublisher = mqttEventPublisher;
        this.publicMediaAssetService = publicMediaAssetService;
        this.authServiceUrl = normalizeServiceUrl(authServiceUrl, "http://localhost:8082");
        this.communicationServiceUrl = normalizeServiceUrl(communicationServiceUrl, "http://localhost:8089");
        this.subscriptionServiceUrl = normalizeServiceUrl(subscriptionServiceUrl, "http://localhost:8086");
        this.authRestClient = restClientBuilder.clone().baseUrl(this.authServiceUrl).build();
        this.commRestClient = restClientBuilder.clone().baseUrl(this.communicationServiceUrl).build();
        this.subscriptionRestClient = restClientBuilder.clone().baseUrl(this.subscriptionServiceUrl).build();
    }

    public List<SchoolOnboardingResponse> listOnboardings(String query) {
        if (StringUtils.hasText(query)) {
            return schoolOnboardingJpaRepository.searchApproved(query.toLowerCase()).stream()
                    .map(this::toResponse)
                    .toList();
        }
        return schoolOnboardingJpaRepository.findAllByOrderByCreatedAtDesc().stream()
                .map(this::toResponse)
                .toList();
    }

    public SchoolOnboardingResponse getOnboarding(UUID onboardingId) {
        if (onboardingId == null) throw new IllegalArgumentException("onboardingId cannot be null");
        return schoolOnboardingJpaRepository.findById(onboardingId)
                .map(this::toResponse)
                .orElseThrow(() -> new OnboardingNotFoundException(onboardingId));
    }

    public SchoolStatusLookupResponse lookupStatus(String schoolCode, String adminEmail) {
        SchoolOnboardingEntity onboarding = schoolOnboardingJpaRepository
                .findBySchoolCodeIgnoreCaseAndAdminEmailIgnoreCase(schoolCode, adminEmail)
                .orElseThrow(() -> new SchoolStatusNotFoundException(schoolCode, adminEmail));

        return new SchoolStatusLookupResponse(
                onboarding.getSchoolName(),
                onboarding.getSchoolCode(),
                onboarding.getStatus(),
                buildSchoolStatusMessage(onboarding),
                onboarding.getReviewedAt(),
                onboarding.getCreatedAt(),
                onboarding.getActivatedAt() != null,
                onboarding.getAdminEmail(),
                "/school",
                onboarding.getTenantId(),
                onboarding.getSchoolId()
        );
    }

    @Transactional
    public SchoolOnboardingResponse createOnboarding(SchoolOnboardingRequest request) {
        List<RequiredDocumentTemplateEntity> templates = requiredDocumentTemplateJpaRepository.findByActiveTrueOrderByDisplayOrderAsc();

        SchoolOnboardingEntity onboarding = new SchoolOnboardingEntity();
        onboarding.setOnboardingId(UUID.randomUUID());
        onboarding.setSchoolName(request.schoolName());
        onboarding.setSchoolCode(request.schoolCode());
        onboarding.setBoardAffiliation(request.boardAffiliation());
        onboarding.setContactPhone(request.contactPhone());
        onboarding.setContactEmail(request.contactEmail());
        onboarding.setAddressLine(request.addressLine());
        onboarding.setCity(request.city());
        onboarding.setState(request.state());
        onboarding.setCountry(request.country());
        onboarding.setPostalCode(request.postalCode());
        onboarding.setSelectedPlanCode(normalizePlanCode(request.selectedPlanCode()));
        onboarding.setLogoUrl(blankToNull(request.logoUrl()));
        onboarding.setTagline(blankToNull(request.tagline()));
        onboarding.setLatitude(request.latitude());
        onboarding.setLongitude(request.longitude());
        onboarding.setHasBranches(request.hasBranches() != null ? request.hasBranches() : false);
        onboarding.setIsLandingPagePublic(false);

        // Realm Name mapping
        String realmName = request.realmName();
        if (!StringUtils.hasText(realmName)) {
            realmName = generateSlug(request.schoolCode());
        } else {
            realmName = generateSlug(realmName);
        }

        validateRealmName(realmName);
        onboarding.setRealmName(realmName);
        onboarding.setUsePlatformSubdomain(request.usePlatformSubdomain() != null ? request.usePlatformSubdomain() : true);
        onboarding.setCustomDomain(blankToNull(request.customDomain()));
        onboarding.setRoutingStatus("PENDING");

        onboarding.setAdminFirstName("Primary");
        onboarding.setAdminLastName("Contact");
        onboarding.setAdminEmail(request.contactEmail());
        onboarding.setStatus(OnboardingStatus.SUBMITTED);
        onboarding.setCreatedAt(Instant.now());

        List<SchoolOnboardingDocumentEntity> documents = templates.stream()
                .map(template -> {
                    SchoolOnboardingDocumentEntity document = new SchoolOnboardingDocumentEntity();
                    document.setOnboarding(onboarding);
                    document.setDocumentName(template.getDocumentName());
                    document.setDisplayOrder(template.getDisplayOrder());
                    return document;
                })
                .toList();
        onboarding.setRequiredDocuments(documents);
        SchoolOnboardingResponse response = toResponse(schoolOnboardingJpaRepository.save(onboarding));
        
        // Broadcast for platform admin
        mqttEventPublisher.publish("platform/onboarding/new", response);
        
        return response;
    }

    @Transactional
    public SchoolOnboardingResponse reviewOnboarding(UUID onboardingId, OnboardingReviewRequest request) {
        if (onboardingId == null) throw new IllegalArgumentException("onboardingId cannot be null");
        SchoolOnboardingEntity onboarding = schoolOnboardingJpaRepository.findById(onboardingId)
                .orElseThrow(() -> new OnboardingNotFoundException(onboardingId));

        OnboardingStatus nextStatus = resolveNextStatus(onboarding.getStatus(), request.action());
        onboarding.setStatus(nextStatus);
        onboarding.setReviewedBy(request.reviewerName());
        onboarding.setReviewComment(request.comment());
        onboarding.setReviewedAt(Instant.now());

        if (nextStatus == OnboardingStatus.APPROVED) {
            if (onboarding.getTenantId() == null) {
                ProvisionSchoolResponse provisioned = authRestClient.post()
                        .uri("/api/v1/auth/internal/provision-school")
                        .header("X-User-Role", "PLATFORM_ADMIN")
                        .body(new ProvisionSchoolRequest(
                                onboarding.getSchoolName(),
                                onboarding.getSchoolCode(),
                                onboarding.getRealmName(),
                                onboarding.getAdminEmail()
                        ))
                        .retrieve()
                        .body(ProvisionSchoolResponse.class);

                if (provisioned != null) {
                    onboarding.setTenantId(provisioned.tenantId());
                    onboarding.setSchoolId(provisioned.schoolId());
                    onboarding.setActivationCode(provisioned.activationCode());
                    onboarding.setReviewComment(buildApprovalComment(request.comment(), provisioned));
                }
            }

            provisionSubscription(onboarding);
        }

        SchoolOnboardingResponse response = toResponse(schoolOnboardingJpaRepository.save(onboarding));
        
        // Broadcast for platform admin
        mqttEventPublisher.publish("platform/onboarding/updated", response);
        
        return response;
    }

    @Transactional
    public void markActivated(String schoolCode, String email) {
        SchoolOnboardingEntity onboarding = schoolOnboardingJpaRepository.findBySchoolCodeIgnoreCaseAndAdminEmailIgnoreCase(schoolCode, email)
                .orElseThrow(() -> new IllegalArgumentException("Onboarding record not found for " + schoolCode));

        if (onboarding.getActivatedAt() == null) {
            onboarding.setActivatedAt(Instant.now());
            schoolOnboardingJpaRepository.save(onboarding);
            mqttEventPublisher.publish("platform/onboarding/updated", toResponse(onboarding));
        }
    }

    @Transactional
    public void sendActivationEmail(UUID onboardingId) {
        if (onboardingId == null) throw new IllegalArgumentException("onboardingId cannot be null");
        SchoolOnboardingEntity onboarding = schoolOnboardingJpaRepository.findById(onboardingId)
                .orElseThrow(() -> new OnboardingNotFoundException(onboardingId));

        if (onboarding.getStatus() != OnboardingStatus.APPROVED) {
            throw new InvalidOnboardingTransitionException("Activation email can only be sent for approved schools.");
        }

        if (onboarding.getTenantId() == null || onboarding.getSchoolId() == null) {
            throw new InvalidOnboardingTransitionException("Cannot send activation email before provisioning is complete.");
        }

        // Correct URL for auth-service activation details
        String url = "/api/v1/auth/admin/activation-details?schoolCode=" + onboarding.getSchoolCode() + "&email=" + onboarding.getAdminEmail();
        ActivationDetailsResponse details;
        try {
            details = authRestClient.get()
                    .uri(url)
                    .header("X-User-Role", "PLATFORM_ADMIN")
                    .retrieve()
                    .body(ActivationDetailsResponse.class);
        } catch (Exception ex) {
            logger.warn("Failed to fetch activation details from auth-service. onboardingId={} schoolCode={} adminEmail={} authServiceUrl={}",
                    onboarding.getOnboardingId(), onboarding.getSchoolCode(), onboarding.getAdminEmail(), authServiceUrl, ex);
            throw new IllegalStateException("Activation service unavailable.");
        }

        if (details == null || !StringUtils.hasText(details.activationCode())) {
            throw new InvalidOnboardingTransitionException("Activation details not found.");
        }

        try {
            // Communication service currently persists notifications and stubs actual delivery.
            commRestClient.post()
                    .uri("/api/v1/communication/notifications")
                    .header("X-Tenant-ID", onboarding.getTenantId().toString())
                    .header("X-School-ID", onboarding.getSchoolId().toString())
                    .body(Map.of(
                            "recipientId", onboarding.getSchoolId().toString(),
                            "schoolId", onboarding.getSchoolId().toString(),
                            "title", "School Approval & Account Activation",
                            "message", "Your school " + onboarding.getSchoolName() + " has been approved. Use code " + details.activationCode()
                                    + " to activate your admin account. Email: " + onboarding.getAdminEmail(),
                            "type", "SYSTEM_ALERT",
                            "channel", "EMAIL"
                    ))
                    .retrieve()
                    .toBodilessEntity();
        } catch (Exception e) {
            mqttEventPublisher.publish("platform/errors/onboarding", Map.of(
                    "service", "communication-service",
                    "action", "send-activation",
                    "onboardingId", onboarding.getOnboardingId(),
                    "error", "Failed to send activation email: " + e.getMessage(),
                    "targetUrl", communicationServiceUrl
            ));
            logger.warn("Failed to dispatch onboarding activation email. onboardingId={} schoolCode={} adminEmail={}",
                    onboarding.getOnboardingId(), onboarding.getSchoolCode(), onboarding.getAdminEmail(), e);
            throw new IllegalStateException("Failed to send activation email.");
        }

        onboarding.setActivationSentAt(Instant.now());
        schoolOnboardingJpaRepository.save(onboarding);
        mqttEventPublisher.publish("platform/onboarding/updated", toResponse(onboarding));
    }


    @Transactional
    public void deleteOnboarding(UUID onboardingId) {
        if (onboardingId == null) throw new IllegalArgumentException("onboardingId cannot be null");
        SchoolOnboardingEntity onboarding = schoolOnboardingJpaRepository.findById(onboardingId)
                .orElseThrow(() -> new OnboardingNotFoundException(onboardingId));

        schoolOnboardingJpaRepository.delete(onboarding);

        // Broadcast deletion event
        mqttEventPublisher.publish("platform/onboarding/deleted", java.util.Map.of("onboardingId", onboardingId.toString()));
    }

    private String buildApprovalComment(String existingComment, ProvisionSchoolResponse provisioned) {
        if (provisioned == null) return existingComment;
        String approvalNote = "Approved. School login is enabled for " + provisioned.loginEmail()
                + " at " + provisioned.dashboardPath() + ". Activation code: " + provisioned.activationCode();

        if (existingComment == null || existingComment.isBlank()) {
            return approvalNote;
        }
        return existingComment + " " + approvalNote;
    }

    private String buildSchoolStatusMessage(SchoolOnboardingEntity onboarding) {
        if (onboarding == null || onboarding.getStatus() == null) return "Unknown Status";
        return switch (onboarding.getStatus()) {
            case SUBMITTED -> "Your onboarding request has been submitted successfully and is waiting for platform review.";
            case UNDER_REVIEW -> "Your onboarding request is under review. The platform team will contact the primary school admin if anything else is needed.";
            case APPROVED -> "Your school has been approved. The primary school admin should use the first-time setup path from the common login area with credentials shared separately by the platform admin.";
            case REJECTED -> onboarding.getReviewComment() == null || onboarding.getReviewComment().isBlank()
                    ? "Your onboarding request was rejected. Please contact the platform team for the next steps."
                    : onboarding.getReviewComment();
            case DRAFT -> "Your onboarding request is still in draft state.";
        };
    }

    private OnboardingStatus resolveNextStatus(OnboardingStatus currentStatus, OnboardingReviewAction action) {
        if (action == null) return currentStatus;
        return switch (action) {
            case START_REVIEW -> OnboardingStatus.UNDER_REVIEW;
            case APPROVE -> OnboardingStatus.APPROVED;
            case REJECT -> OnboardingStatus.REJECTED;
        };
    }

    private SchoolOnboardingResponse toResponse(SchoolOnboardingEntity onboarding) {
        return new SchoolOnboardingResponse(
                onboarding.getOnboardingId(),
                onboarding.getSchoolName(),
                onboarding.getSchoolCode(),
                onboarding.getRealmName(),
                onboarding.getStatus(),
                onboarding.getBoardAffiliation(),
                onboarding.getCity(),
                onboarding.getState(),
                onboarding.getAdminEmail(),
                onboarding.getReviewedBy(),
                onboarding.getReviewComment(),
                onboarding.getReviewedAt(),
                onboarding.getTenantId(),
                onboarding.getSchoolId(),
                onboarding.getActivatedAt(),
                onboarding.getActivationSentAt(),
                onboarding.getRequiredDocuments().stream()
                        .map(SchoolOnboardingDocumentEntity::getDocumentName)
                        .collect(Collectors.toList()),
                onboarding.getActivationCode(),
                onboarding.getSelectedPlanCode(),
                onboarding.getLogoUrl(),
                onboarding.getUsePlatformSubdomain(),
                onboarding.getCustomDomain(),
                onboarding.getRoutingStatus(),
                onboarding.getTagline(),
                onboarding.getLatitude(),
                onboarding.getLongitude(),
                onboarding.getHasBranches(),
                onboarding.getIsLandingPagePublic(),
                onboarding.getLogoMediaId(),
                onboarding.getBannerMediaId(),
                onboarding.getCreatedAt()
        );
    }

    private static final java.util.Set<String> RESERVED_REALMS = java.util.Set.of(
            "admin", "portal", "api", "system", "www", "support", "auth", "static", "mcp", "public", "onboarding"
    );

    private void validateRealmName(String realmName) {
        if (RESERVED_REALMS.contains(realmName.toLowerCase())) {
            throw new IllegalArgumentException("The realm name '" + realmName + "' is reserved for system use.");
        }
    }

    public SchoolBrandingResponse getBrandingByTenantId(UUID tenantId) {
        if (tenantId == null) throw new IllegalArgumentException("tenantId cannot be null");
        SchoolOnboardingEntity entity = schoolOnboardingJpaRepository.findByTenantId(tenantId)
                .orElseThrow(() -> new IllegalArgumentException("School not found for tenant: " + tenantId));
        return toBrandingResponse(entity);
    }

    public SchoolBrandingResponse getBranding(UUID schoolId) {
        SchoolOnboardingEntity entity = requireSchoolBranding(schoolId);
        return toBrandingResponse(entity);
    }

    @Transactional
    public SchoolBrandingResponse uploadSchoolLogo(UUID schoolId, MultipartFile file, String createdBy) {
        SchoolOnboardingEntity entity = requireSchoolBranding(schoolId);
        var uploaded = publicMediaAssetService.uploadAsset("school-logo-" + schoolId, file, createdBy);
        entity.setLogoUrl(uploaded.publicUrl());
        return toBrandingResponse(schoolOnboardingJpaRepository.save(entity));
    }

    public String uploadPublicLogo(String schoolCode, MultipartFile file) {
        String safeSchoolCode = StringUtils.hasText(schoolCode) ? schoolCode.trim().toLowerCase() : UUID.randomUUID().toString();
        return publicMediaAssetService.uploadAsset("school-logo-public-" + safeSchoolCode, file, "public-onboarding").publicUrl();
    }

    public PublicSchoolProfileResponse getPublicProfile(String schoolCode) {
        SchoolOnboardingEntity entity = schoolOnboardingJpaRepository.findBySchoolCodeIgnoreCase(schoolCode)
                .orElse(null);

        if (entity == null) {
            throw new PublicSchoolProfileNotFoundException(schoolCode);
        }

        return new PublicSchoolProfileResponse(
                entity.getOnboardingId(),
                entity.getSchoolId(),
                entity.getSchoolName(),
                entity.getSchoolCode(),
                entity.getCity(),
                entity.getState(),
                entity.getLogoUrl(),
                entity.getVision() != null ? entity.getVision() : "Elevating education through technology.",
                entity.getMission() != null ? entity.getMission() : "Our mission is to empower learners everywhere.",
                entity.getAchievements() != null ? Arrays.asList(entity.getAchievements().split("\\|")) : List.of("Excellence in Academic Research", "National Sports Finalist"),
                parseHouses(entity.getHouses())
        );
    }

    private List<PublicSchoolProfileResponse.HouseInfo> parseHouses(String housesStr) {
        if (housesStr == null || housesStr.isBlank()) {
            return List.of(
                new PublicSchoolProfileResponse.HouseInfo("Phoenix", "#f87171", "Rise from Ashes", "Sparkles"),
                new PublicSchoolProfileResponse.HouseInfo("Atlantis", "#60a5fa", "Strength in Depths", "Palmtree")
            );
        }
        // Simple format: Name:Color:Motto:Icon|Name2:Color2:Motto2:Icon2
        return Arrays.stream(housesStr.split("\\|"))
                .map(h -> {
                    String[] pts = h.split(":");
                    return new PublicSchoolProfileResponse.HouseInfo(
                        pts.length > 0 ? pts[0] : "House",
                        pts.length > 1 ? pts[1] : "#cbd5e1",
                        pts.length > 2 ? pts[2] : "Virtue",
                        pts.length > 3 ? pts[3] : "Shield"
                    );
                }).toList();
    }

    private void provisionSubscription(SchoolOnboardingEntity onboarding) {
        if (onboarding.getTenantId() == null) {
            throw new IllegalStateException("School subscription cannot be provisioned before the tenant is created.");
        }

        subscriptionRestClient.post()
                .uri(uriBuilder -> uriBuilder
                        .path("/api/v1/subscriptions/initialize")
                        .queryParam("tenantId", onboarding.getTenantId())
                        .build())
                // Internal service-to-service call: mark as platform action.
                .header("X-User-Role", "PLATFORM_ADMIN")
                .body(Map.of("planCode", normalizePlanCode(onboarding.getSelectedPlanCode())))
                .retrieve()
                .toBodilessEntity();
    }

    private String normalizePlanCode(String planCode) {
        if (!StringUtils.hasText(planCode)) {
            return "BASIC";
        }
        return switch (planCode.trim().toUpperCase()) {
            case "FREE", "BASIC", "PREMIUM" -> planCode.trim().toUpperCase();
            default -> "BASIC";
        };
    }

    private SchoolOnboardingEntity requireSchoolBranding(UUID schoolId) {
        if (schoolId == null) {
            throw new IllegalArgumentException("schoolId is required.");
        }
        return schoolOnboardingJpaRepository.findBySchoolId(schoolId)
                .orElseThrow(() -> new IllegalArgumentException("School branding record not found."));
    }

    private SchoolBrandingResponse toBrandingResponse(SchoolOnboardingEntity entity) {
        return new SchoolBrandingResponse(
                entity.getOnboardingId(),
                entity.getSchoolId(),
                entity.getSchoolName(),
                entity.getSchoolCode(),
                entity.getCity(),
                entity.getState(),
                entity.getLogoUrl()
        );
    }

    private String blankToNull(String value) {
        if (!StringUtils.hasText(value)) {
            return null;
        }
        return value.trim();
    }

    private String generateSlug(String input) {
        if (!StringUtils.hasText(input)) {
            return UUID.randomUUID().toString();
        }

        String slug = input.trim().toLowerCase();
        slug = slug.replaceAll("[^a-z0-9]+", "-");
        slug = slug.replaceAll("^-+|-+$", "");

        if (!StringUtils.hasText(slug)) {
            return UUID.randomUUID().toString();
        }
        return slug;
    }
}
