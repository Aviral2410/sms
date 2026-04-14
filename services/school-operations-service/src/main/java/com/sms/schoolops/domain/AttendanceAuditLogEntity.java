package com.sms.schoolops.domain;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.time.Instant;
import java.util.UUID;

import org.hibernate.annotations.Filter;

@Entity
@Table(name = "attendance_audit_log", schema = "schoolops")
@Filter(name = "schoolFilter", condition = "school_id = :schoolId")
public class AttendanceAuditLogEntity {
    @Id
    @Column(name = "audit_log_id", nullable = false, updatable = false)
    private UUID auditLogId;

    @Column(name = "school_id", nullable = false)
    private UUID schoolId;

    @Column(name = "session_id", nullable = false)
    private UUID sessionId;

    @Column(name = "attendance_id")
    private UUID attendanceId;

    @Column(name = "student_user_id", nullable = false)
    private UUID studentUserId;

    @Column(name = "previous_status")
    private String previousStatus;

    @Column(name = "new_status", nullable = false)
    private String newStatus;

    @Column(name = "edit_reason")
    private String editReason;

    @Column(name = "changed_by", nullable = false)
    private String changedBy;

    @Column(name = "changed_role", nullable = false)
    private String changedRole;

    @Column(name = "created_at", nullable = false)
    private Instant createdAt;

    public UUID getAuditLogId() { return auditLogId; }
    public void setAuditLogId(UUID auditLogId) { this.auditLogId = auditLogId; }
    public UUID getSchoolId() { return schoolId; }
    public void setSchoolId(UUID schoolId) { this.schoolId = schoolId; }
    public UUID getSessionId() { return sessionId; }
    public void setSessionId(UUID sessionId) { this.sessionId = sessionId; }
    public UUID getAttendanceId() { return attendanceId; }
    public void setAttendanceId(UUID attendanceId) { this.attendanceId = attendanceId; }
    public UUID getStudentUserId() { return studentUserId; }
    public void setStudentUserId(UUID studentUserId) { this.studentUserId = studentUserId; }
    public String getPreviousStatus() { return previousStatus; }
    public void setPreviousStatus(String previousStatus) { this.previousStatus = previousStatus; }
    public String getNewStatus() { return newStatus; }
    public void setNewStatus(String newStatus) { this.newStatus = newStatus; }
    public String getEditReason() { return editReason; }
    public void setEditReason(String editReason) { this.editReason = editReason; }
    public String getChangedBy() { return changedBy; }
    public void setChangedBy(String changedBy) { this.changedBy = changedBy; }
    public String getChangedRole() { return changedRole; }
    public void setChangedRole(String changedRole) { this.changedRole = changedRole; }
    public Instant getCreatedAt() { return createdAt; }
    public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }
}
