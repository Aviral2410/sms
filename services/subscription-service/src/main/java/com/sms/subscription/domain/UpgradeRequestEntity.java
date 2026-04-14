package com.sms.subscription.domain;

import jakarta.persistence.*;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "upgrade_requests", schema = "subscription")
public class UpgradeRequestEntity {

    @Id
    private UUID requestId;

    @Column(nullable = false)
    private UUID tenantId;

    @Column(nullable = false)
    private UUID requestedPlanId;

    @Column(nullable = false)
    private String status; // PENDING, APPROVED, REJECTED

    private String requestNotes;

    @Column(nullable = false)
    private Instant createdAt;

    private Instant updatedAt;

    public UUID getRequestId() {
        return requestId;
    }

    public void setRequestId(UUID requestId) {
        this.requestId = requestId;
    }

    public UUID getTenantId() {
        return tenantId;
    }

    public void setTenantId(UUID tenantId) {
        this.tenantId = tenantId;
    }

    public UUID getRequestedPlanId() {
        return requestedPlanId;
    }

    public void setRequestedPlanId(UUID requestedPlanId) {
        this.requestedPlanId = requestedPlanId;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public String getRequestNotes() {
        return requestNotes;
    }

    public void setRequestNotes(String requestNotes) {
        this.requestNotes = requestNotes;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(Instant createdAt) {
        this.createdAt = createdAt;
    }

    public Instant getUpdatedAt() {
        return updatedAt;
    }

    public void setUpdatedAt(Instant updatedAt) {
        this.updatedAt = updatedAt;
    }
}
