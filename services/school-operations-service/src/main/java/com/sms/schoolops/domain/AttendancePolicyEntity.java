package com.sms.schoolops.domain;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.time.Instant;
import java.util.UUID;

import org.hibernate.annotations.Filter;

@Entity
@Table(name = "attendance_policy", schema = "schoolops")
@Filter(name = "schoolFilter", condition = "school_id = :schoolId")
public class AttendancePolicyEntity {
    @Id
    @Column(name = "policy_id", nullable = false, updatable = false)
    private UUID policyId;

    @Column(name = "school_id", nullable = false, unique = true)
    private UUID schoolId;

    @Column(name = "warning_threshold", nullable = false)
    private Integer warningThreshold;

    @Column(name = "critical_threshold", nullable = false)
    private Integer criticalThreshold;

    @Column(name = "enabled_channels", nullable = false, length = 500)
    private String enabledChannels;

    @Column(name = "auto_absent_enabled", nullable = false)
    private Boolean autoAbsentEnabled;

    @Column(name = "auto_absent_minutes", nullable = false)
    private Integer autoAbsentMinutes;

    @Column(name = "gps_enabled", nullable = false)
    private Boolean gpsEnabled;

    @Column(name = "gps_mode", nullable = false)
    private String gpsMode;

    @Column(name = "geofence_latitude")
    private Double geofenceLatitude;

    @Column(name = "geofence_longitude")
    private Double geofenceLongitude;

    @Column(name = "geofence_radius_meters")
    private Double geofenceRadiusMeters;

    @Column(name = "voice_enabled", nullable = false)
    private Boolean voiceEnabled;

    @Column(name = "face_enabled", nullable = false)
    private Boolean faceEnabled;

    @Column(name = "ai_prediction_enabled", nullable = false)
    private Boolean aiPredictionEnabled;

    @Column(name = "reminder_enabled", nullable = false)
    private Boolean reminderEnabled;

    @Column(name = "reminder_frequency", nullable = false)
    private String reminderFrequency;

    @Column(name = "face_confidence_threshold", nullable = false)
    private Double faceConfidenceThreshold;

    @Column(name = "created_at", nullable = false)
    private Instant createdAt;

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    public UUID getPolicyId() { return policyId; }
    public void setPolicyId(UUID policyId) { this.policyId = policyId; }
    public UUID getSchoolId() { return schoolId; }
    public void setSchoolId(UUID schoolId) { this.schoolId = schoolId; }
    public Integer getWarningThreshold() { return warningThreshold; }
    public void setWarningThreshold(Integer warningThreshold) { this.warningThreshold = warningThreshold; }
    public Integer getCriticalThreshold() { return criticalThreshold; }
    public void setCriticalThreshold(Integer criticalThreshold) { this.criticalThreshold = criticalThreshold; }
    public String getEnabledChannels() { return enabledChannels; }
    public void setEnabledChannels(String enabledChannels) { this.enabledChannels = enabledChannels; }
    public Boolean getAutoAbsentEnabled() { return autoAbsentEnabled; }
    public void setAutoAbsentEnabled(Boolean autoAbsentEnabled) { this.autoAbsentEnabled = autoAbsentEnabled; }
    public Integer getAutoAbsentMinutes() { return autoAbsentMinutes; }
    public void setAutoAbsentMinutes(Integer autoAbsentMinutes) { this.autoAbsentMinutes = autoAbsentMinutes; }
    public Boolean getGpsEnabled() { return gpsEnabled; }
    public void setGpsEnabled(Boolean gpsEnabled) { this.gpsEnabled = gpsEnabled; }
    public String getGpsMode() { return gpsMode; }
    public void setGpsMode(String gpsMode) { this.gpsMode = gpsMode; }
    public Double getGeofenceLatitude() { return geofenceLatitude; }
    public void setGeofenceLatitude(Double geofenceLatitude) { this.geofenceLatitude = geofenceLatitude; }
    public Double getGeofenceLongitude() { return geofenceLongitude; }
    public void setGeofenceLongitude(Double geofenceLongitude) { this.geofenceLongitude = geofenceLongitude; }
    public Double getGeofenceRadiusMeters() { return geofenceRadiusMeters; }
    public void setGeofenceRadiusMeters(Double geofenceRadiusMeters) { this.geofenceRadiusMeters = geofenceRadiusMeters; }
    public Boolean getVoiceEnabled() { return voiceEnabled; }
    public void setVoiceEnabled(Boolean voiceEnabled) { this.voiceEnabled = voiceEnabled; }
    public Boolean getFaceEnabled() { return faceEnabled; }
    public void setFaceEnabled(Boolean faceEnabled) { this.faceEnabled = faceEnabled; }
    public Boolean getAiPredictionEnabled() { return aiPredictionEnabled; }
    public void setAiPredictionEnabled(Boolean aiPredictionEnabled) { this.aiPredictionEnabled = aiPredictionEnabled; }
    public Boolean getReminderEnabled() { return reminderEnabled; }
    public void setReminderEnabled(Boolean reminderEnabled) { this.reminderEnabled = reminderEnabled; }
    public String getReminderFrequency() { return reminderFrequency; }
    public void setReminderFrequency(String reminderFrequency) { this.reminderFrequency = reminderFrequency; }
    public Double getFaceConfidenceThreshold() { return faceConfidenceThreshold; }
    public void setFaceConfidenceThreshold(Double faceConfidenceThreshold) { this.faceConfidenceThreshold = faceConfidenceThreshold; }
    public Instant getCreatedAt() { return createdAt; }
    public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }
    public Instant getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(Instant updatedAt) { this.updatedAt = updatedAt; }
}
