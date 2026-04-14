package com.sms.schoolops.domain;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "forum_flag", schema = "schoolops")
public class ForumFlagEntity {
    @Id
    @Column(name = "flag_id", nullable = false, updatable = false)
    private UUID flagId;
    @Column(name = "target_id", nullable = false)
    private UUID targetId; // Question or Answer ID
    @Column(name = "reporter_id", nullable = false)
    private UUID reporterId;
    @Column(name = "reason", nullable = false)
    private String reason;
    @Column(name = "created_at", nullable = false)
    private Instant createdAt;

    public UUID getFlagId() { return flagId; }
    public void setFlagId(UUID flagId) { this.flagId = flagId; }
    public UUID getTargetId() { return targetId; }
    public void setTargetId(UUID targetId) { this.targetId = targetId; }
    public UUID getReporterId() { return reporterId; }
    public void setReporterId(UUID reporterId) { this.reporterId = reporterId; }
    public String getReason() { return reason; }
    public void setReason(String reason) { this.reason = reason; }
    public Instant getCreatedAt() { return createdAt; }
    public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }
}
