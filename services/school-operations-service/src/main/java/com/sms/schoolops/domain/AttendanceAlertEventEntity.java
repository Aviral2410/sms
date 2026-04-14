package com.sms.schoolops.domain;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.time.Instant;
import java.util.UUID;

import org.hibernate.annotations.Filter;

@Entity
@Table(name = "attendance_alert_event", schema = "schoolops")
@Filter(name = "schoolFilter", condition = "school_id = :schoolId")
public class AttendanceAlertEventEntity {
    @Id
    @Column(name = "alert_event_id", nullable = false, updatable = false)
    private UUID alertEventId;

    @Column(name = "school_id", nullable = false)
    private UUID schoolId;

    @Column(name = "student_user_id", nullable = false)
    private UUID studentUserId;

    @Column(name = "class_id")
    private UUID classId;

    @Column(name = "alert_level", nullable = false)
    private String alertLevel;

    @Column(name = "attendance_percentage", nullable = false)
    private Double attendancePercentage;

    @Column(name = "active", nullable = false)
    private Boolean active;

    @Column(name = "triggered_at", nullable = false)
    private Instant triggeredAt;

    @Column(name = "resolved_at")
    private Instant resolvedAt;

    @Column(name = "channels_sent", length = 1000)
    private String channelsSent;

    @Column(name = "notification_summary", length = 4000)
    private String notificationSummary;

    public UUID getAlertEventId() { return alertEventId; }
    public void setAlertEventId(UUID alertEventId) { this.alertEventId = alertEventId; }
    public UUID getSchoolId() { return schoolId; }
    public void setSchoolId(UUID schoolId) { this.schoolId = schoolId; }
    public UUID getStudentUserId() { return studentUserId; }
    public void setStudentUserId(UUID studentUserId) { this.studentUserId = studentUserId; }
    public UUID getClassId() { return classId; }
    public void setClassId(UUID classId) { this.classId = classId; }
    public String getAlertLevel() { return alertLevel; }
    public void setAlertLevel(String alertLevel) { this.alertLevel = alertLevel; }
    public Double getAttendancePercentage() { return attendancePercentage; }
    public void setAttendancePercentage(Double attendancePercentage) { this.attendancePercentage = attendancePercentage; }
    public Boolean getActive() { return active; }
    public void setActive(Boolean active) { this.active = active; }
    public Instant getTriggeredAt() { return triggeredAt; }
    public void setTriggeredAt(Instant triggeredAt) { this.triggeredAt = triggeredAt; }
    public Instant getResolvedAt() { return resolvedAt; }
    public void setResolvedAt(Instant resolvedAt) { this.resolvedAt = resolvedAt; }
    public String getChannelsSent() { return channelsSent; }
    public void setChannelsSent(String channelsSent) { this.channelsSent = channelsSent; }
    public String getNotificationSummary() { return notificationSummary; }
    public void setNotificationSummary(String notificationSummary) { this.notificationSummary = notificationSummary; }
}
