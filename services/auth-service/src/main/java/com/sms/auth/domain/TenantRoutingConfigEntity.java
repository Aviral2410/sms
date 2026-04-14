package com.sms.auth.domain;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "tenant_routing_config", schema = "identity")
public class TenantRoutingConfigEntity {

    @Id
    @Column(name = "config_id", nullable = false, updatable = false)
    private UUID configId;

    @Column(name = "tenant_id", nullable = false, unique = true)
    private UUID tenantId;

    @Column(name = "preferred_host")
    private String preferredHost;

    @Column(name = "fallback_host")
    private String fallbackHost;

    @Column(name = "redirect_mode", nullable = false)
    private String redirectMode = "NONE";

    @Column(name = "enforce_https", nullable = false)
    private Boolean enforceHttps = true;

    @Column(name = "allow_multiple_hosts", nullable = false)
    private Boolean allowMultipleHosts = true;

    @Column(name = "host_match_strategy", nullable = false)
    private String hostMatchStrategy = "STRICT";

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt = Instant.now();

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt = Instant.now();

    public UUID getConfigId() { return configId; }
    public void setConfigId(UUID configId) { this.configId = configId; }

    public UUID getTenantId() { return tenantId; }
    public void setTenantId(UUID tenantId) { this.tenantId = tenantId; }

    public String getPreferredHost() { return preferredHost; }
    public void setPreferredHost(String preferredHost) { this.preferredHost = preferredHost; }

    public String getFallbackHost() { return fallbackHost; }
    public void setFallbackHost(String fallbackHost) { this.fallbackHost = fallbackHost; }

    public String getRedirectMode() { return redirectMode; }
    public void setRedirectMode(String redirectMode) { this.redirectMode = redirectMode; }

    public Boolean getEnforceHttps() { return enforceHttps; }
    public void setEnforceHttps(Boolean enforceHttps) { this.enforceHttps = enforceHttps; }

    public Boolean getAllowMultipleHosts() { return allowMultipleHosts; }
    public void setAllowMultipleHosts(Boolean allowMultipleHosts) { this.allowMultipleHosts = allowMultipleHosts; }

    public String getHostMatchStrategy() { return hostMatchStrategy; }
    public void setHostMatchStrategy(String hostMatchStrategy) { this.hostMatchStrategy = hostMatchStrategy; }

    public Instant getCreatedAt() { return createdAt; }
    public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }

    public Instant getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(Instant updatedAt) { this.updatedAt = updatedAt; }
}
