package com.sms.auth.domain;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.time.Instant;
import java.util.UUID;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

@Entity
@Table(name = "tenant_domain", schema = "identity")
public class TenantDomainEntity {

    @Id
    @Column(name = "domain_id", nullable = false, updatable = false)
    private UUID domainId;

    @Column(name = "tenant_id", nullable = false)
    private UUID tenantId;

    @Column(name = "domain", nullable = false, unique = true)
    private String domain;

    @Column(name = "host", nullable = false, unique = true)
    private String host;

    @Column(name = "domain_type", nullable = false)
    private String domainType;

    @Column(name = "is_primary", nullable = false)
    private Boolean isPrimary = false;

    @Column(name = "is_canonical", nullable = false)
    private Boolean isCanonical = false;

    @Column(name = "is_active", nullable = false)
    private Boolean isActive = false;

    @Column(name = "verification_status", nullable = false)
    private String verificationStatus = "PENDING";

    @Column(name = "verification_method", nullable = false)
    private String verificationMethod = "DNS_TXT";

    @Column(name = "verification_token")
    private String verificationToken;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "verification_details_json", columnDefinition = "JSONB")
    private String verificationDetailsJson;

    @Column(name = "ssl_mode", nullable = false)
    private String sslMode = "PLATFORM_MANAGED";

    @Column(name = "ssl_status")
    private String sslStatus = "PENDING";

    @Column(name = "dns_status")
    private String dnsStatus = "PENDING";

    @Column(name = "last_verified_at")
    private Instant lastVerifiedAt;

    @Column(name = "last_dns_check_at")
    private Instant lastDnsCheckAt;

    @Column(name = "last_ssl_check_at")
    private Instant lastSslCheckAt;

    @Column(name = "redirect_target_domain_id")
    private UUID redirectTargetDomainId;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt = Instant.now();

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt = Instant.now();

    public UUID getDomainId() { return domainId; }
    public void setDomainId(UUID domainId) { this.domainId = domainId; }

    public UUID getTenantId() { return tenantId; }
    public void setTenantId(UUID tenantId) { this.tenantId = tenantId; }

    public String getDomain() { return domain; }
    public void setDomain(String domain) { this.domain = domain; }

    public String getHost() { return host; }
    public void setHost(String host) { this.host = host; }

    public String getDomainType() { return domainType; }
    public void setDomainType(String domainType) { this.domainType = domainType; }

    public Boolean getIsPrimary() { return isPrimary; }
    public void setIsPrimary(Boolean primary) { isPrimary = primary; }

    public Boolean getIsCanonical() { return isCanonical; }
    public void setIsCanonical(Boolean canonical) { isCanonical = canonical; }

    public Boolean getIsActive() { return isActive; }
    public void setIsActive(Boolean active) { isActive = active; }

    public String getVerificationStatus() { return verificationStatus; }
    public void setVerificationStatus(String verificationStatus) { this.verificationStatus = verificationStatus; }

    public String getVerificationMethod() { return verificationMethod; }
    public void setVerificationMethod(String verificationMethod) { this.verificationMethod = verificationMethod; }

    public String getVerificationToken() { return verificationToken; }
    public void setVerificationToken(String verificationToken) { this.verificationToken = verificationToken; }

    public String getVerificationDetailsJson() { return verificationDetailsJson; }
    public void setVerificationDetailsJson(String verificationDetailsJson) { this.verificationDetailsJson = verificationDetailsJson; }

    public String getSslMode() { return sslMode; }
    public void setSslMode(String sslMode) { this.sslMode = sslMode; }

    public String getSslStatus() { return sslStatus; }
    public void setSslStatus(String sslStatus) { this.sslStatus = sslStatus; }

    public String getDnsStatus() { return dnsStatus; }
    public void setDnsStatus(String dnsStatus) { this.dnsStatus = dnsStatus; }

    public Instant getLastVerifiedAt() { return lastVerifiedAt; }
    public void setLastVerifiedAt(Instant lastVerifiedAt) { this.lastVerifiedAt = lastVerifiedAt; }

    public Instant getLastDnsCheckAt() { return lastDnsCheckAt; }
    public void setLastDnsCheckAt(Instant lastDnsCheckAt) { this.lastDnsCheckAt = lastDnsCheckAt; }

    public Instant getLastSslCheckAt() { return lastSslCheckAt; }
    public void setLastSslCheckAt(Instant lastSslCheckAt) { this.lastSslCheckAt = lastSslCheckAt; }

    public UUID getRedirectTargetDomainId() { return redirectTargetDomainId; }
    public void setRedirectTargetDomainId(UUID redirectTargetDomainId) { this.redirectTargetDomainId = redirectTargetDomainId; }

    public Instant getCreatedAt() { return createdAt; }
    public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }

    public Instant getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(Instant updatedAt) { this.updatedAt = updatedAt; }
}
