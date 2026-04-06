package com.sms.schoolops.domain;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "resource_view_log", schema = "schoolops")
public class ResourceViewLogEntity {
    @Id
    @Column(name = "log_id", nullable = false, updatable = false)
    private UUID logId;
    @Column(name = "school_id", nullable = false)
    private UUID schoolId;
    @Column(name = "user_id", nullable = false)
    private UUID userId;
    @Column(name = "resource_id", nullable = false)
    private UUID resourceId;
    @Column(name = "viewed_at", nullable = false)
    private Instant viewedAt;

    public UUID getLogId() { return logId; }
    public void setLogId(UUID logId) { this.logId = logId; }
    public UUID getSchoolId() { return schoolId; }
    public void setSchoolId(UUID schoolId) { this.schoolId = schoolId; }
    public UUID getUserId() { return userId; }
    public void setUserId(UUID userId) { this.userId = userId; }
    public UUID getResourceId() { return resourceId; }
    public void setResourceId(UUID resourceId) { this.resourceId = resourceId; }
    public Instant getViewedAt() { return viewedAt; }
    public void setViewedAt(Instant viewedAt) { this.viewedAt = viewedAt; }
}
