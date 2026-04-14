package com.sms.schoolops.domain;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

import org.hibernate.annotations.Filter;

@Entity
@Table(name = "transport_policy", schema = "schoolops")
@Filter(name = "schoolFilter", condition = "school_id = :schoolId")
public class TransportPolicyEntity {
    @Id
    @Column(name = "policy_id", nullable = false, updatable = false)
    private UUID policyId;

    @Column(name = "school_id", nullable = false, unique = true)
    private UUID schoolId;

    @Column(name = "speed_limit_kmph", nullable = false)
    private Integer speedLimitKmph;

    @Column(name = "overspeed_duration_seconds", nullable = false)
    private Integer overspeedDurationSeconds;

    @Column(name = "idle_threshold_minutes", nullable = false)
    private Integer idleThresholdMinutes;

    @Column(name = "idle_response_timeout_minutes", nullable = false)
    private Integer idleResponseTimeoutMinutes;

    @Column(name = "deviation_radius_meters", nullable = false)
    private BigDecimal deviationRadiusMeters;

    @Column(name = "gps_offline_timeout_minutes", nullable = false)
    private Integer gpsOfflineTimeoutMinutes;

    @Column(name = "pre_arrival_notification_minutes", nullable = false)
    private Integer preArrivalNotificationMinutes;

    @Column(name = "contact_sharing_policy", nullable = false)
    private String contactSharingPolicy;

    @Column(name = "missed_boarding_policy", nullable = false)
    private String missedBoardingPolicy;

    @Column(name = "school_geofence_latitude")
    private BigDecimal schoolGeofenceLatitude;

    @Column(name = "school_geofence_longitude")
    private BigDecimal schoolGeofenceLongitude;

    @Column(name = "school_geofence_radius_meters")
    private BigDecimal schoolGeofenceRadiusMeters;

    @Column(name = "depot_geofence_latitude")
    private BigDecimal depotGeofenceLatitude;

    @Column(name = "depot_geofence_longitude")
    private BigDecimal depotGeofenceLongitude;

    @Column(name = "depot_geofence_radius_meters")
    private BigDecimal depotGeofenceRadiusMeters;

    @Column(name = "holiday_suppression_enabled", nullable = false)
    private Boolean holidaySuppressionEnabled;

    @Column(name = "device_api_secret")
    private String deviceApiSecret;

    @Column(name = "created_at", nullable = false)
    private Instant createdAt;

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    public UUID getPolicyId() { return policyId; }
    public void setPolicyId(UUID policyId) { this.policyId = policyId; }
    public UUID getSchoolId() { return schoolId; }
    public void setSchoolId(UUID schoolId) { this.schoolId = schoolId; }
    public Integer getSpeedLimitKmph() { return speedLimitKmph; }
    public void setSpeedLimitKmph(Integer speedLimitKmph) { this.speedLimitKmph = speedLimitKmph; }
    public Integer getOverspeedDurationSeconds() { return overspeedDurationSeconds; }
    public void setOverspeedDurationSeconds(Integer overspeedDurationSeconds) { this.overspeedDurationSeconds = overspeedDurationSeconds; }
    public Integer getIdleThresholdMinutes() { return idleThresholdMinutes; }
    public void setIdleThresholdMinutes(Integer idleThresholdMinutes) { this.idleThresholdMinutes = idleThresholdMinutes; }
    public Integer getIdleResponseTimeoutMinutes() { return idleResponseTimeoutMinutes; }
    public void setIdleResponseTimeoutMinutes(Integer idleResponseTimeoutMinutes) { this.idleResponseTimeoutMinutes = idleResponseTimeoutMinutes; }
    public BigDecimal getDeviationRadiusMeters() { return deviationRadiusMeters; }
    public void setDeviationRadiusMeters(BigDecimal deviationRadiusMeters) { this.deviationRadiusMeters = deviationRadiusMeters; }
    public Integer getGpsOfflineTimeoutMinutes() { return gpsOfflineTimeoutMinutes; }
    public void setGpsOfflineTimeoutMinutes(Integer gpsOfflineTimeoutMinutes) { this.gpsOfflineTimeoutMinutes = gpsOfflineTimeoutMinutes; }
    public Integer getPreArrivalNotificationMinutes() { return preArrivalNotificationMinutes; }
    public void setPreArrivalNotificationMinutes(Integer preArrivalNotificationMinutes) { this.preArrivalNotificationMinutes = preArrivalNotificationMinutes; }
    public String getContactSharingPolicy() { return contactSharingPolicy; }
    public void setContactSharingPolicy(String contactSharingPolicy) { this.contactSharingPolicy = contactSharingPolicy; }
    public String getMissedBoardingPolicy() { return missedBoardingPolicy; }
    public void setMissedBoardingPolicy(String missedBoardingPolicy) { this.missedBoardingPolicy = missedBoardingPolicy; }
    public BigDecimal getSchoolGeofenceLatitude() { return schoolGeofenceLatitude; }
    public void setSchoolGeofenceLatitude(BigDecimal schoolGeofenceLatitude) { this.schoolGeofenceLatitude = schoolGeofenceLatitude; }
    public BigDecimal getSchoolGeofenceLongitude() { return schoolGeofenceLongitude; }
    public void setSchoolGeofenceLongitude(BigDecimal schoolGeofenceLongitude) { this.schoolGeofenceLongitude = schoolGeofenceLongitude; }
    public BigDecimal getSchoolGeofenceRadiusMeters() { return schoolGeofenceRadiusMeters; }
    public void setSchoolGeofenceRadiusMeters(BigDecimal schoolGeofenceRadiusMeters) { this.schoolGeofenceRadiusMeters = schoolGeofenceRadiusMeters; }
    public BigDecimal getDepotGeofenceLatitude() { return depotGeofenceLatitude; }
    public void setDepotGeofenceLatitude(BigDecimal depotGeofenceLatitude) { this.depotGeofenceLatitude = depotGeofenceLatitude; }
    public BigDecimal getDepotGeofenceLongitude() { return depotGeofenceLongitude; }
    public void setDepotGeofenceLongitude(BigDecimal depotGeofenceLongitude) { this.depotGeofenceLongitude = depotGeofenceLongitude; }
    public BigDecimal getDepotGeofenceRadiusMeters() { return depotGeofenceRadiusMeters; }
    public void setDepotGeofenceRadiusMeters(BigDecimal depotGeofenceRadiusMeters) { this.depotGeofenceRadiusMeters = depotGeofenceRadiusMeters; }
    public Boolean getHolidaySuppressionEnabled() { return holidaySuppressionEnabled; }
    public void setHolidaySuppressionEnabled(Boolean holidaySuppressionEnabled) { this.holidaySuppressionEnabled = holidaySuppressionEnabled; }
    public String getDeviceApiSecret() { return deviceApiSecret; }
    public void setDeviceApiSecret(String deviceApiSecret) { this.deviceApiSecret = deviceApiSecret; }
    public Instant getCreatedAt() { return createdAt; }
    public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }
    public Instant getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(Instant updatedAt) { this.updatedAt = updatedAt; }
}
