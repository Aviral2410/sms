package com.sms.communication.domain;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.time.Instant;
import java.util.UUID;
import org.hibernate.annotations.Filter;

@Entity
@Table(name = "announcement_ack", schema = "communication")
@Filter(name = "schoolFilter", condition = "school_id = :schoolId")
public class AnnouncementAckEntity {
    @Id
    @Column(name = "ack_id", nullable = false, updatable = false)
    private UUID ackId;

    @Column(name = "school_id", nullable = false)
    private UUID schoolId;

    @Column(name = "announcement_id", nullable = false)
    private UUID announcementId;

    @Column(name = "user_id", nullable = false)
    private UUID userId;

    @Column(name = "acknowledged_at", nullable = false)
    private Instant acknowledgedAt;

    public UUID getAckId() { return ackId; }
    public void setAckId(UUID ackId) { this.ackId = ackId; }

    public UUID getSchoolId() { return schoolId; }
    public void setSchoolId(UUID schoolId) { this.schoolId = schoolId; }

    public UUID getAnnouncementId() { return announcementId; }
    public void setAnnouncementId(UUID announcementId) { this.announcementId = announcementId; }

    public UUID getUserId() { return userId; }
    public void setUserId(UUID userId) { this.userId = userId; }

    public Instant getAcknowledgedAt() { return acknowledgedAt; }
    public void setAcknowledgedAt(Instant acknowledgedAt) { this.acknowledgedAt = acknowledgedAt; }
}

