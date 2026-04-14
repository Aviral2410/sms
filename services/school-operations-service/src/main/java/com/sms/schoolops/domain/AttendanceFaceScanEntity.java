package com.sms.schoolops.domain;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.time.Instant;
import java.util.UUID;

import org.hibernate.annotations.Filter;

@Entity
@Table(name = "attendance_face_scan", schema = "schoolops")
@Filter(name = "schoolFilter", condition = "school_id = :schoolId")
public class AttendanceFaceScanEntity {
    @Id
    @Column(name = "face_scan_id", nullable = false, updatable = false)
    private UUID faceScanId;

    @Column(name = "school_id", nullable = false)
    private UUID schoolId;

    @Column(name = "session_id", nullable = false)
    private UUID sessionId;

    @Column(name = "matched_student_user_id")
    private UUID matchedStudentUserId;

    @Column(name = "confidence")
    private Double confidence;

    @Column(name = "capture_reference", length = 1000)
    private String captureReference;

    @Column(name = "review_outcome", nullable = false)
    private String reviewOutcome;

    @Column(name = "provider_status", nullable = false)
    private String providerStatus;

    @Column(name = "created_at", nullable = false)
    private Instant createdAt;

    public UUID getFaceScanId() { return faceScanId; }
    public void setFaceScanId(UUID faceScanId) { this.faceScanId = faceScanId; }
    public UUID getSchoolId() { return schoolId; }
    public void setSchoolId(UUID schoolId) { this.schoolId = schoolId; }
    public UUID getSessionId() { return sessionId; }
    public void setSessionId(UUID sessionId) { this.sessionId = sessionId; }
    public UUID getMatchedStudentUserId() { return matchedStudentUserId; }
    public void setMatchedStudentUserId(UUID matchedStudentUserId) { this.matchedStudentUserId = matchedStudentUserId; }
    public Double getConfidence() { return confidence; }
    public void setConfidence(Double confidence) { this.confidence = confidence; }
    public String getCaptureReference() { return captureReference; }
    public void setCaptureReference(String captureReference) { this.captureReference = captureReference; }
    public String getReviewOutcome() { return reviewOutcome; }
    public void setReviewOutcome(String reviewOutcome) { this.reviewOutcome = reviewOutcome; }
    public String getProviderStatus() { return providerStatus; }
    public void setProviderStatus(String providerStatus) { this.providerStatus = providerStatus; }
    public Instant getCreatedAt() { return createdAt; }
    public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }
}
