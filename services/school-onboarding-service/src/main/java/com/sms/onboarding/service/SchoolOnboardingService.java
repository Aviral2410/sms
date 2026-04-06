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

import com.sms.onboarding.api.ProvisionSchoolRequest;
import com.sms.onboarding.api.ProvisionSchoolResponse;
import com.sms.onboarding.api.ActivationDetailsResponse;
import com.sms.onboarding.api.PublicSchoolProfileResponse;
import java.time.Instant;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.Arrays;
import java.util.stream.Collectors;

@Service
public class SchoolOnboardingService {

    private final SchoolOnboardingJpaRepository schoolOnboardingJpaRepository;
    private final RequiredDocumentTemplateJpaRepository requiredDocumentTemplateJpaRepository;
    private final MqttEventPublisher mqttEventPublisher;
    private final RestClient authRestClient;
    private final RestClient commRestClient;


    private final String authServiceUrl;
    private final String communicationServiceUrl;

    public SchoolOnboardingService(
            SchoolOnboardingJpaRepository schoolOnboardingJpaRepository,
            RequiredDocumentTemplateJpaRepository requiredDocumentTemplateJpaRepository,
            MqttEventPublisher mqttEventPublisher,
            RestClient.Builder restClientBuilder,
            @Value("${app.auth-service-url:DEFAULT}") String authServiceUrl,
            @Value("${app.communication-service-url:DEFAULT}") String communicationServiceUrl
    ) {
        this.schoolOnboardingJpaRepository = schoolOnboardingJpaRepository;
        this.requiredDocumentTemplateJpaRepository = requiredDocumentTemplateJpaRepository;
        this.mqttEventPublisher = mqttEventPublisher;
        this.authServiceUrl = authServiceUrl != null ? authServiceUrl : "http://auth-service:8081";
        this.communicationServiceUrl = communicationServiceUrl != null ? communicationServiceUrl : "http://communication-service:8089";
        this.authRestClient = restClientBuilder.clone().baseUrl(this.authServiceUrl).build();
        this.commRestClient = restClientBuilder.clone().baseUrl(this.communicationServiceUrl).build();
    }

    public List<SchoolOnboardingResponse> listOnboardings() {
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
                onboarding.getStatus() == OnboardingStatus.APPROVED && onboarding.getTenantId() != null,
                onboarding.getAdminEmail(),
                "/school"
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

        if (nextStatus == OnboardingStatus.APPROVED && onboarding.getTenantId() == null) {
            ProvisionSchoolResponse provisioned = authRestClient.post()
                    .uri("/api/v1/auth/internal/provision-school")
                    .header("X-User-Role", "PLATFORM_ADMIN")
                    .body(new ProvisionSchoolRequest(
                            onboarding.getSchoolName(),
                            onboarding.getSchoolCode(),
                            onboarding.getAdminEmail()
                    ))
                    .retrieve()
                    .body(ProvisionSchoolResponse.class);

            if (provisioned != null) {
                onboarding.setTenantId(provisioned.tenantId());
                onboarding.setSchoolId(provisioned.schoolId());
                onboarding.setActivatedAt(Instant.now());
                onboarding.setActivationCode(provisioned.activationCode());
                onboarding.setReviewComment(buildApprovalComment(request.comment(), provisioned));
            }
        }

        SchoolOnboardingResponse response = toResponse(schoolOnboardingJpaRepository.save(onboarding));
        
        // Broadcast for platform admin
        mqttEventPublisher.publish("platform/onboarding/updated", response);
        
        return response;
    }

    @Transactional
    public SchoolOnboardingResponse markActivationAsSent(UUID onboardingId) {
        if (onboardingId == null) throw new IllegalArgumentException("onboardingId cannot be null");
        SchoolOnboardingEntity onboarding = schoolOnboardingJpaRepository.findById(onboardingId)
                .orElseThrow(() -> new OnboardingNotFoundException(onboardingId));

        if (onboarding.getStatus() != OnboardingStatus.APPROVED) {
            throw new InvalidOnboardingTransitionException("Activation status can only be updated for approved schools.");
        }

        onboarding.setActivationSentAt(Instant.now());
        SchoolOnboardingResponse response = toResponse(schoolOnboardingJpaRepository.save(onboarding));
        
        // Broadcast for real-time refresh
        mqttEventPublisher.publish("platform/onboarding/updated", response);
        
        return response;
    }

    @Transactional
    public void sendActivationEmail(UUID onboardingId) {
        if (onboardingId == null) throw new IllegalArgumentException("onboardingId cannot be null");
        SchoolOnboardingEntity onboarding = schoolOnboardingJpaRepository.findById(onboardingId)
                .orElseThrow(() -> new OnboardingNotFoundException(onboardingId));

        if (onboarding.getStatus() != OnboardingStatus.APPROVED) {
            throw new InvalidOnboardingTransitionException("Activation email can only be sent for approved schools.");
        }

        try {
            // Correct URL for auth-service activation details
            String url = "/api/v1/auth/admin/activation-details?schoolCode=" + onboarding.getSchoolCode() + "&email=" + onboarding.getAdminEmail();
            ActivationDetailsResponse details = authRestClient.get()
                    .uri(url)
                    .header("X-User-Role", "PLATFORM_ADMIN")
                    .retrieve()
                    .body(ActivationDetailsResponse.class);
            
            if (details != null) {
                // Use the tenantId of the school for the communication context
                String schoolTenantId = onboarding.getTenantId() != null ? onboarding.getTenantId().toString() : "platform";
                
                commRestClient.post()
                        .uri("/api/v1/communication/notifications")
                        .header("X-Tenant-Id", schoolTenantId)
                        .body(Map.of(
                                "recipientId", onboarding.getOnboardingId().toString(), // Mapping to onboardingId as placeholder UUID
                                "schoolId", onboarding.getSchoolId() != null ? onboarding.getSchoolId().toString() : schoolTenantId,
                                "title", "School Approval & Account Activation",
                                "message", "Your school " + onboarding.getSchoolName() + " has been approved. Use code " + details.activationCode() + " to activate your admin account. Email: " + onboarding.getAdminEmail(),
                                "type", "SYSTEM_ALERT",
                                "channel", "EMAIL"
                        ))
                        .retrieve()
                        .toBodilessEntity();

                onboarding.setActivationSentAt(Instant.now());
                schoolOnboardingJpaRepository.save(onboarding);
            }
        } catch (Exception e) {
            mqttEventPublisher.publish("platform/errors/onboarding", Map.of(
                    "service", "communication-service",
                    "action", "send-activation",
                    "onboardingId", onboarding.getOnboardingId(),
                    "error", "Failed to send activation email: " + e.getMessage(),
                    "targetUrl", communicationServiceUrl
            ));
            System.err.println("Communication failure: " + e.getMessage());
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
                onboarding.getCreatedAt()
        );
    }

    public PublicSchoolProfileResponse getPublicProfile(String schoolCode) {
        SchoolOnboardingEntity entity = schoolOnboardingJpaRepository.findBySchoolCodeIgnoreCase(schoolCode)
                .orElse(null);

        if (entity == null) {
            // Seed a default for BMPS if it doesn't exist, for testing
            if ("BMPS".equalsIgnoreCase(schoolCode)) {
                return seedMockBmps();
            }
            throw new RuntimeException("School not found: " + schoolCode);
        }

        return new PublicSchoolProfileResponse(
                entity.getOnboardingId(),
                entity.getSchoolName(),
                entity.getSchoolCode(),
                entity.getCity(),
                entity.getState(),
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

    private PublicSchoolProfileResponse seedMockBmps() {
        return new PublicSchoolProfileResponse(
            UUID.randomUUID(),
            "Bright Minds Public School",
            "BMPS",
            "Bangalore",
            "Karnataka",
            "To cultivate innovative thinkers and compassionate leaders through excellence in education.",
            "Providing a tech-forward, holistic learning environment that empowers students to exceed global standards.",
            List.of("National Sports Award 2025", "Top 10 STEM Institutions", "Eco-Campus Certification"),
            List.of(
                new PublicSchoolProfileResponse.HouseInfo("Phoenix", "#f87171", "Rise from Ashes", "Sparkles"),
                new PublicSchoolProfileResponse.HouseInfo("Atlantis", "#60a5fa", "Strength in Depths", "Palmtree"),
                new PublicSchoolProfileResponse.HouseInfo("Zenith", "#34d399", "Peak of Excellence", "GraduationCap"),
                new PublicSchoolProfileResponse.HouseInfo("Solar", "#fbbf24", "Light the Way", "ShieldCheck")
            )
        );
    }
}
