package com.sms.onboarding.domain;

import jakarta.persistence.CascadeType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.Id;
import jakarta.persistence.OneToMany;
import jakarta.persistence.OrderBy;
import jakarta.persistence.Table;
import jakarta.persistence.Version;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Entity
@Table(name = "school_onboarding", schema = "onboarding")
public class SchoolOnboardingEntity {

    @Id
    @Column(name = "onboarding_id", nullable = false, updatable = false)
    private UUID onboardingId;

    @Column(name = "school_name", nullable = false)
    private String schoolName;

    @Column(name = "school_code", nullable = false, unique = true)
    private String schoolCode;

    @Column(name = "board_affiliation", nullable = false)
    private String boardAffiliation;

    @Column(name = "contact_phone", nullable = false)
    private String contactPhone;

    @Column(name = "contact_email", nullable = false)
    private String contactEmail;

    @Column(name = "address_line", nullable = false)
    private String addressLine;

    @Column(name = "city", nullable = false)
    private String city;

    @Column(name = "state", nullable = false)
    private String state;

    @Column(name = "country", nullable = false)
    private String country;

    @Column(name = "postal_code", nullable = false)
    private String postalCode;

    @Column(name = "admin_first_name", nullable = false)
    private String adminFirstName;

    @Column(name = "admin_last_name", nullable = false)
    private String adminLastName;

    @Column(name = "admin_email", nullable = false)
    private String adminEmail;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false)
    private OnboardingStatus status;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @Column(name = "reviewed_by")
    private String reviewedBy;

    @Column(name = "review_comment")
    private String reviewComment;

    @Column(name = "reviewed_at")
    private Instant reviewedAt;

    @Column(name = "tenant_id")
    private UUID tenantId;

    @Column(name = "school_id")
    private UUID schoolId;

    @Column(name = "activated_at")
    private Instant activatedAt;

    @Column(name = "activation_sent_at")
    private Instant activationSentAt;

    @Column(name = "activation_code")
    private String activationCode;

    @Column(name = "selected_plan_code", nullable = false)
    private String selectedPlanCode;

    @Column(name = "logo_url")
    private String logoUrl;

    @Column(name = "vision", length = 2000)
    private String vision;

    @Column(name = "mission", length = 2000)
    private String mission;

    @Column(name = "achievements", length = 3000)
    private String achievements;

    @Column(name = "realm_name", unique = true)
    private String realmName;

    @Column(name = "use_platform_subdomain")
    private Boolean usePlatformSubdomain = true;

    @Column(name = "custom_domain")
    private String customDomain;

    @Column(name = "tagline")
    private String tagline;

    @Column(name = "logo_media_id")
    private UUID logoMediaId;

    @Column(name = "banner_media_id")
    private UUID bannerMediaId;

    @Column(name = "latitude")
    private Double latitude;

    @Column(name = "longitude")
    private Double longitude;

    @Column(name = "has_branches")
    private Boolean hasBranches = false;

    @Column(name = "is_landing_page_public")
    private Boolean isLandingPagePublic = false;

    @Column(name = "routing_status")
    private String routingStatus;

    @Column(name = "houses", length = 3000)
    private String houses;

    @Version
    private Long version;

    @OneToMany(mappedBy = "onboarding", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
    @OrderBy("displayOrder ASC")
    private List<SchoolOnboardingDocumentEntity> requiredDocuments = new ArrayList<>();

    public UUID getOnboardingId() {
        return onboardingId;
    }

    public void setOnboardingId(UUID onboardingId) {
        this.onboardingId = onboardingId;
    }

    public String getSchoolName() {
        return schoolName;
    }

    public void setSchoolName(String schoolName) {
        this.schoolName = schoolName;
    }

    public String getSchoolCode() {
        return schoolCode;
    }

    public void setSchoolCode(String schoolCode) {
        this.schoolCode = schoolCode;
    }

    public String getBoardAffiliation() {
        return boardAffiliation;
    }

    public void setBoardAffiliation(String boardAffiliation) {
        this.boardAffiliation = boardAffiliation;
    }

    public String getContactPhone() {
        return contactPhone;
    }

    public void setContactPhone(String contactPhone) {
        this.contactPhone = contactPhone;
    }

    public String getContactEmail() {
        return contactEmail;
    }

    public void setContactEmail(String contactEmail) {
        this.contactEmail = contactEmail;
    }

    public String getAddressLine() {
        return addressLine;
    }

    public void setAddressLine(String addressLine) {
        this.addressLine = addressLine;
    }

    public String getCity() {
        return city;
    }

    public void setCity(String city) {
        this.city = city;
    }

    public String getState() {
        return state;
    }

    public void setState(String state) {
        this.state = state;
    }

    public String getCountry() {
        return country;
    }

    public void setCountry(String country) {
        this.country = country;
    }

    public String getPostalCode() {
        return postalCode;
    }

    public void setPostalCode(String postalCode) {
        this.postalCode = postalCode;
    }

    public String getAdminFirstName() {
        return adminFirstName;
    }

    public void setAdminFirstName(String adminFirstName) {
        this.adminFirstName = adminFirstName;
    }

    public String getAdminLastName() {
        return adminLastName;
    }

    public void setAdminLastName(String adminLastName) {
        this.adminLastName = adminLastName;
    }

    public String getAdminEmail() {
        return adminEmail;
    }

    public void setAdminEmail(String adminEmail) {
        this.adminEmail = adminEmail;
    }

    public OnboardingStatus getStatus() {
        return status;
    }

    public void setStatus(OnboardingStatus status) {
        this.status = status;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(Instant createdAt) {
        this.createdAt = createdAt;
    }

    public String getReviewedBy() {
        return reviewedBy;
    }

    public void setReviewedBy(String reviewedBy) {
        this.reviewedBy = reviewedBy;
    }

    public String getReviewComment() {
        return reviewComment;
    }

    public void setReviewComment(String reviewComment) {
        this.reviewComment = reviewComment;
    }

    public Instant getReviewedAt() {
        return reviewedAt;
    }

    public void setReviewedAt(Instant reviewedAt) {
        this.reviewedAt = reviewedAt;
    }

    public UUID getTenantId() {
        return tenantId;
    }

    public void setTenantId(UUID tenantId) {
        this.tenantId = tenantId;
    }

    public UUID getSchoolId() {
        return schoolId;
    }

    public void setSchoolId(UUID schoolId) {
        this.schoolId = schoolId;
    }

    public Instant getActivatedAt() {
        return activatedAt;
    }

    public void setActivatedAt(Instant activatedAt) {
        this.activatedAt = activatedAt;
    }

    public Instant getActivationSentAt() {
        return activationSentAt;
    }

    public void setActivationSentAt(Instant activationSentAt) {
        this.activationSentAt = activationSentAt;
    }

    public String getActivationCode() {
        return activationCode;
    }

    public void setActivationCode(String activationCode) {
        this.activationCode = activationCode;
    }

    public String getSelectedPlanCode() {
        return selectedPlanCode;
    }

    public void setSelectedPlanCode(String selectedPlanCode) {
        this.selectedPlanCode = selectedPlanCode;
    }

    public String getLogoUrl() {
        return logoUrl;
    }

    public void setLogoUrl(String logoUrl) {
        this.logoUrl = logoUrl;
    }

    public List<SchoolOnboardingDocumentEntity> getRequiredDocuments() {
        return requiredDocuments;
    }

    public void setRequiredDocuments(List<SchoolOnboardingDocumentEntity> requiredDocuments) {
        this.requiredDocuments = new ArrayList<>(requiredDocuments);
    }

    public String getVision() {
        return vision;
    }

    public void setVision(String vision) {
        this.vision = vision;
    }

    public String getMission() {
        return mission;
    }

    public void setMission(String mission) {
        this.mission = mission;
    }

    public String getAchievements() {
        return achievements;
    }

    public void setAchievements(String achievements) {
        this.achievements = achievements;
    }

    public String getHouses() {
        return houses;
    }

    public void setHouses(String houses) {
        this.houses = houses;
    }

    public String getRealmName() {
        return realmName;
    }

    public void setRealmName(String realmName) {
        this.realmName = realmName;
    }

    public Boolean getUsePlatformSubdomain() {
        return usePlatformSubdomain;
    }

    public void setUsePlatformSubdomain(Boolean usePlatformSubdomain) {
        this.usePlatformSubdomain = usePlatformSubdomain;
    }

    public String getTagline() {
        return tagline;
    }

    public void setTagline(String tagline) {
        this.tagline = tagline;
    }

    public UUID getLogoMediaId() {
        return logoMediaId;
    }

    public void setLogoMediaId(UUID logoMediaId) {
        this.logoMediaId = logoMediaId;
    }

    public UUID getBannerMediaId() {
        return bannerMediaId;
    }

    public void setBannerMediaId(UUID bannerMediaId) {
        this.bannerMediaId = bannerMediaId;
    }

    public Double getLatitude() {
        return latitude;
    }

    public void setLatitude(Double latitude) {
        this.latitude = latitude;
    }

    public Double getLongitude() {
        return longitude;
    }

    public void setLongitude(Double longitude) {
        this.longitude = longitude;
    }

    public Boolean getHasBranches() {
        return hasBranches;
    }

    public void setHasBranches(Boolean hasBranches) {
        this.hasBranches = hasBranches;
    }

    public Boolean getIsLandingPagePublic() {
        return isLandingPagePublic;
    }

    public void setIsLandingPagePublic(Boolean isLandingPagePublic) {
        this.isLandingPagePublic = isLandingPagePublic;
    }

    public String getCustomDomain() {
        return customDomain;
    }

    public void setCustomDomain(String customDomain) {
        this.customDomain = customDomain;
    }

    public String getRoutingStatus() {
        return routingStatus;
    }

    public void setRoutingStatus(String routingStatus) {
        this.routingStatus = routingStatus;
    }
}
