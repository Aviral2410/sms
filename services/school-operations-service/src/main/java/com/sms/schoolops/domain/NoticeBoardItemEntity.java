package com.sms.schoolops.domain;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "notice_board_item", schema = "schoolops")
public class NoticeBoardItemEntity {
    @Id
    @Column(name = "notice_id", nullable = false, updatable = false)
    private UUID noticeId;
    @Column(name = "school_id", nullable = false)
    private UUID schoolId;
    @Column(name = "title", nullable = false)
    private String title;
    @Column(name = "message", nullable = false)
    private String message;
    @Column(name = "audience", nullable = false)
    private String audience;
    @Column(name = "published_at", nullable = false)
    private Instant publishedAt;
    @Column(name = "created_at", nullable = false)
    private Instant createdAt;
    public UUID getNoticeId() { return noticeId; }
    public void setNoticeId(UUID noticeId) { this.noticeId = noticeId; }
    public UUID getSchoolId() { return schoolId; }
    public void setSchoolId(UUID schoolId) { this.schoolId = schoolId; }
    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }
    public String getMessage() { return message; }
    public void setMessage(String message) { this.message = message; }
    public String getAudience() { return audience; }
    public void setAudience(String audience) { this.audience = audience; }
    public Instant getPublishedAt() { return publishedAt; }
    public void setPublishedAt(Instant publishedAt) { this.publishedAt = publishedAt; }
    public Instant getCreatedAt() { return createdAt; }
    public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }
}
