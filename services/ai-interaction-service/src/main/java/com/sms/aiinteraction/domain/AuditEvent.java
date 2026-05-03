package com.sms.aiinteraction.domain;

import jakarta.persistence.*;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "audit_events", schema = "aiinteraction")
public class AuditEvent {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(nullable = false)
    private Instant timestamp;

    @Column(nullable = false)
    private String eventType;

    @Column(nullable = false)
    private String userId;

    private UUID schoolId;

    @Column(columnDefinition = "TEXT")
    private String payload;

    @Column(nullable = false)
    private String status;

    public AuditEvent() {
    }

    public AuditEvent(UUID id, Instant timestamp, String eventType, String userId, UUID schoolId, String payload, String status) {
        this.id = id;
        this.timestamp = timestamp;
        this.eventType = eventType;
        this.userId = userId;
        this.schoolId = schoolId;
        this.payload = payload;
        this.status = status;
    }

    public static AuditEventBuilder builder() {
        return new AuditEventBuilder();
    }

    public UUID getId() {
        return id;
    }

    public void setId(UUID id) {
        this.id = id;
    }

    public Instant getTimestamp() {
        return timestamp;
    }

    public void setTimestamp(Instant timestamp) {
        this.timestamp = timestamp;
    }

    public String getEventType() {
        return eventType;
    }

    public void setEventType(String eventType) {
        this.eventType = eventType;
    }

    public String getUserId() {
        return userId;
    }

    public void setUserId(String userId) {
        this.userId = userId;
    }

    public UUID getSchoolId() {
        return schoolId;
    }

    public void setSchoolId(UUID schoolId) {
        this.schoolId = schoolId;
    }

    public String getPayload() {
        return payload;
    }

    public void setPayload(String payload) {
        this.payload = payload;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public static class AuditEventBuilder {
        private UUID id;
        private Instant timestamp;
        private String eventType;
        private String userId;
        private UUID schoolId;
        private String payload;
        private String status;

        AuditEventBuilder() {
        }

        public AuditEventBuilder id(UUID id) {
            this.id = id;
            return this;
        }

        public AuditEventBuilder timestamp(Instant timestamp) {
            this.timestamp = timestamp;
            return this;
        }

        public AuditEventBuilder eventType(String eventType) {
            this.eventType = eventType;
            return this;
        }

        public AuditEventBuilder userId(String userId) {
            this.userId = userId;
            return this;
        }

        public AuditEventBuilder schoolId(UUID schoolId) {
            this.schoolId = schoolId;
            return this;
        }

        public AuditEventBuilder payload(String payload) {
            this.payload = payload;
            return this;
        }

        public AuditEventBuilder status(String status) {
            this.status = status;
            return this;
        }

        public AuditEvent build() {
            return new AuditEvent(id, timestamp, eventType, userId, schoolId, payload, status);
        }
    }
}
