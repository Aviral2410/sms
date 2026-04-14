package com.sms.schoolops.domain;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

import java.time.Instant;
import java.util.UUID;

import jakarta.persistence.UniqueConstraint;
import org.hibernate.annotations.Filter;

@Entity
@Table(
    name = "school_user", 
    schema = "schoolops",
    uniqueConstraints = {
        @UniqueConstraint(columnNames = {"tenant_id", "email"})
    }
)
@Filter(name = "schoolFilter", condition = "school_id = :schoolId")
public class SchoolUserEntity {
    @Id
    @Column(name = "user_id", nullable = false, updatable = false)
    private UUID userId;
    @Column(name = "tenant_id", nullable = false)
    private UUID tenantId;
    @Column(name = "school_id", nullable = false)
    private UUID schoolId;
    @Column(name = "school_code", nullable = false)
    private String schoolCode;
    @Column(name = "full_name", nullable = false)
    private String fullName;
    @Column(name = "email", nullable = false)
    private String email;
    @Column(name = "role_name", nullable = false)
    private String roleName;
    @Column(name = "active", nullable = false)
    private Boolean active;
    @Column(name = "created_at", nullable = false)
    private Instant createdAt;

    @Column(name = "theme")
    private String theme;

    @Column(name = "active_theme")
    private String activeTheme;

    @Column(name = "vibe")
    private String vibe;

    @Column(name = "accent_color")
    private String accentColor;

    @Column(name = "glass_intensity")
    private Double glassIntensity;

    @Column(name = "border_radius")
    private String borderRadius;

    @Column(name = "profile_photo_url")
    private String profilePhotoUrl;

    public UUID getUserId() { return userId; }
    public void setUserId(UUID userId) { this.userId = userId; }
    public UUID getTenantId() { return tenantId; }
    public void setTenantId(UUID tenantId) { this.tenantId = tenantId; }
    public UUID getSchoolId() { return schoolId; }
    public void setSchoolId(UUID schoolId) { this.schoolId = schoolId; }
    public String getSchoolCode() { return schoolCode; }
    public void setSchoolCode(String schoolCode) { this.schoolCode = schoolCode; }
    public String getFullName() { return fullName; }
    public void setFullName(String fullName) { this.fullName = fullName; }
    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }
    public String getRoleName() { return roleName; }
    public void setRoleName(String roleName) { this.roleName = roleName; }
    public Boolean getActive() { return active; }
    public void setActive(Boolean active) { this.active = active; }
    public Instant getCreatedAt() { return createdAt; }
    public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }

    public String getTheme() { return theme; }
    public void setTheme(String theme) { this.theme = theme; }

    public String getActiveTheme() { return activeTheme; }
    public void setActiveTheme(String activeTheme) { this.activeTheme = activeTheme; }

    public String getVibe() { return vibe; }
    public void setVibe(String vibe) { this.vibe = vibe; }

    public String getAccentColor() { return accentColor; }
    public void setAccentColor(String accentColor) { this.accentColor = accentColor; }

    public Double getGlassIntensity() { return glassIntensity; }
    public void setGlassIntensity(Double glassIntensity) { this.glassIntensity = glassIntensity; }

    public String getBorderRadius() { return borderRadius; }
    public void setBorderRadius(String borderRadius) { this.borderRadius = borderRadius; }

    public String getProfilePhotoUrl() { return profilePhotoUrl; }
    public void setProfilePhotoUrl(String profilePhotoUrl) { this.profilePhotoUrl = profilePhotoUrl; }
}
