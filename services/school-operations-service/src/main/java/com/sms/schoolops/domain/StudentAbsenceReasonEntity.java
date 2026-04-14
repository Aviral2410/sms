package com.sms.schoolops.domain;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.time.Instant;
import java.util.UUID;

import org.hibernate.annotations.Filter;

@Entity
@Table(name = "student_absence_reason", schema = "schoolops")
@Filter(name = "schoolFilter", condition = "school_id = :schoolId")
public class StudentAbsenceReasonEntity {
    @Id
    @Column(name = "absence_reason_id", nullable = false, updatable = false)
    private UUID absenceReasonId;

    @Column(name = "school_id", nullable = false)
    private UUID schoolId;

    @Column(name = "attendance_id", nullable = false)
    private UUID attendanceId;

    @Column(name = "student_user_id", nullable = false)
    private UUID studentUserId;

    @Column(name = "category", nullable = false)
    private String category;

    @Column(name = "description")
    private String description;

    @Column(name = "review_status", nullable = false)
    private String reviewStatus;

    @Column(name = "reviewed_by")
    private String reviewedBy;

    @Column(name = "reviewed_at")
    private Instant reviewedAt;

    @Column(name = "created_at", nullable = false)
    private Instant createdAt;

    public UUID getAbsenceReasonId() { return absenceReasonId; }
    public void setAbsenceReasonId(UUID absenceReasonId) { this.absenceReasonId = absenceReasonId; }
    public UUID getSchoolId() { return schoolId; }
    public void setSchoolId(UUID schoolId) { this.schoolId = schoolId; }
    public UUID getAttendanceId() { return attendanceId; }
    public void setAttendanceId(UUID attendanceId) { this.attendanceId = attendanceId; }
    public UUID getStudentUserId() { return studentUserId; }
    public void setStudentUserId(UUID studentUserId) { this.studentUserId = studentUserId; }
    public String getCategory() { return category; }
    public void setCategory(String category) { this.category = category; }
    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }
    public String getReviewStatus() { return reviewStatus; }
    public void setReviewStatus(String reviewStatus) { this.reviewStatus = reviewStatus; }
    public String getReviewedBy() { return reviewedBy; }
    public void setReviewedBy(String reviewedBy) { this.reviewedBy = reviewedBy; }
    public Instant getReviewedAt() { return reviewedAt; }
    public void setReviewedAt(Instant reviewedAt) { this.reviewedAt = reviewedAt; }
    public Instant getCreatedAt() { return createdAt; }
    public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }
}
