package com.sms.auth.domain;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

import java.math.BigDecimal;

import com.sms.common.domain.BaseTenantEntity;

@Entity
@Table(name = "admin_account", schema = "identity")
public class AdminAccountEntity extends BaseTenantEntity {

    @Id
    @Column(name = "email", nullable = false, updatable = false)
    private String email;

    @Column(name = "password", nullable = false)
    private String password;

    @Column(name = "full_name", nullable = false)
    private String fullName;

    @Column(name = "role_name", nullable = false)
    private String roleName;

    @Column(name = "active", nullable = false)
    private Boolean active;

    @Column(name = "theme")
    private String theme;

    @Column(name = "active_theme")
    private String activeTheme;

    @Column(name = "vibe")
    private String vibe;

    @Column(name = "accent_color")
    private String accentColor;

    @Column(name = "glass_intensity")
    private BigDecimal glassIntensity;

    @Column(name = "border_radius")
    private String borderRadius;

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public String getPassword() {
        return password;
    }

    public void setPassword(String password) {
        this.password = password;
    }

    public String getFullName() {
        return fullName;
    }

    public void setFullName(String fullName) {
        this.fullName = fullName;
    }

    public String getRoleName() {
        return roleName;
    }

    public void setRoleName(String roleName) {
        this.roleName = roleName;
    }

    public Boolean getActive() {
        return active;
    }

    public void setActive(Boolean active) {
        this.active = active;
    }

    public String getTheme() { return theme; }
    public void setTheme(String theme) { this.theme = theme; }

    public String getActiveTheme() { return activeTheme; }
    public void setActiveTheme(String activeTheme) { this.activeTheme = activeTheme; }

    public String getVibe() { return vibe; }
    public void setVibe(String vibe) { this.vibe = vibe; }

    public String getAccentColor() { return accentColor; }
    public void setAccentColor(String accentColor) { this.accentColor = accentColor; }

    public BigDecimal getGlassIntensity() { return glassIntensity; }
    public void setGlassIntensity(BigDecimal glassIntensity) { this.glassIntensity = glassIntensity; }

    public String getBorderRadius() { return borderRadius; }
    public void setBorderRadius(String borderRadius) { this.borderRadius = borderRadius; }
}
