package com.sms.schoolops.domain;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "reminder", schema = "schoolops")
public class ReminderEntity {
    @Id
    @Column(name = "reminder_id", nullable = false, updatable = false)
    private UUID reminderId;
    @Column(name = "school_id", nullable = false)
    private UUID schoolId;
    @Column(name = "reminder_type", nullable = false)
    private String reminderType;
    @Column(name = "target_user_id")
    private UUID targetUserId;
    @Column(name = "message", nullable = false)
    private String message;
    @Column(name = "due_at", nullable = false)
    private Instant dueAt;
    @Column(name = "reminder_status", nullable = false)
    private String reminderStatus;
    @Column(name = "created_at", nullable = false)
    private Instant createdAt;
    public UUID getReminderId() { return reminderId; }
    public void setReminderId(UUID reminderId) { this.reminderId = reminderId; }
    public UUID getSchoolId() { return schoolId; }
    public void setSchoolId(UUID schoolId) { this.schoolId = schoolId; }
    public String getReminderType() { return reminderType; }
    public void setReminderType(String reminderType) { this.reminderType = reminderType; }
    public UUID getTargetUserId() { return targetUserId; }
    public void setTargetUserId(UUID targetUserId) { this.targetUserId = targetUserId; }
    public String getMessage() { return message; }
    public void setMessage(String message) { this.message = message; }
    public Instant getDueAt() { return dueAt; }
    public void setDueAt(Instant dueAt) { this.dueAt = dueAt; }
    public String getReminderStatus() { return reminderStatus; }
    public void setReminderStatus(String reminderStatus) { this.reminderStatus = reminderStatus; }
    public Instant getCreatedAt() { return createdAt; }
    public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }
}
