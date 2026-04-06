package com.sms.schoolops.domain;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "resource_bookmark", schema = "schoolops")
public class ResourceBookmarkEntity {
    @Id
    @Column(name = "bookmark_id", nullable = false, updatable = false)
    private UUID bookmarkId;
    @Column(name = "school_id", nullable = false)
    private UUID schoolId;
    @Column(name = "user_id", nullable = false)
    private UUID userId;
    @Column(name = "resource_id", nullable = false)
    private UUID resourceId;
    @Column(name = "created_at", nullable = false)
    private Instant createdAt;

    public UUID getBookmarkId() { return bookmarkId; }
    public void setBookmarkId(UUID bookmarkId) { this.bookmarkId = bookmarkId; }
    public UUID getSchoolId() { return schoolId; }
    public void setSchoolId(UUID schoolId) { this.schoolId = schoolId; }
    public UUID getUserId() { return userId; }
    public void setUserId(UUID userId) { this.userId = userId; }
    public UUID getResourceId() { return resourceId; }
    public void setResourceId(UUID resourceId) { this.resourceId = resourceId; }
    public Instant getCreatedAt() { return createdAt; }
    public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }
}
