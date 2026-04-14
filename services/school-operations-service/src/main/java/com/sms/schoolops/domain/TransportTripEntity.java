package com.sms.schoolops.domain;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;

import org.hibernate.annotations.Filter;

@Entity
@Table(name = "transport_trip", schema = "schoolops")
@Filter(name = "schoolFilter", condition = "school_id = :schoolId")
public class TransportTripEntity {
    @Id
    @Column(name = "trip_id", nullable = false, updatable = false)
    private UUID tripId;

    @Column(name = "school_id", nullable = false)
    private UUID schoolId;

    @Column(name = "route_assignment_id", nullable = false)
    private UUID routeAssignmentId;

    @Column(name = "route_id", nullable = false)
    private UUID routeId;

    @Column(name = "vehicle_id")
    private UUID vehicleId;

    @Column(name = "driver_user_id")
    private UUID driverUserId;

    @Column(name = "conductor_user_id")
    private UUID conductorUserId;

    @Column(name = "service_date", nullable = false)
    private LocalDate serviceDate;

    @Column(name = "shift_type", nullable = false)
    private String shiftType;

    @Column(name = "trip_state", nullable = false)
    private String tripState;

    @Column(name = "planned_start_time")
    private Instant plannedStartTime;

    @Column(name = "planned_end_time")
    private Instant plannedEndTime;

    @Column(name = "actual_start_time")
    private Instant actualStartTime;

    @Column(name = "actual_end_time")
    private Instant actualEndTime;

    @Column(name = "occupancy_count", nullable = false)
    private Integer occupancyCount;

    @Column(name = "gps_status", nullable = false)
    private String gpsStatus;

    @Column(name = "last_ping_at")
    private Instant lastPingAt;

    @Column(name = "current_latitude")
    private BigDecimal currentLatitude;

    @Column(name = "current_longitude")
    private BigDecimal currentLongitude;

    @Column(name = "current_speed")
    private BigDecimal currentSpeed;

    @Column(name = "current_heading")
    private BigDecimal currentHeading;

    @Column(name = "next_stop_id")
    private UUID nextStopId;

    @Column(name = "halt_status", nullable = false)
    private String haltStatus;

    @Column(name = "deviation_status", nullable = false)
    private String deviationStatus;

    @Column(name = "emergency_status", nullable = false)
    private String emergencyStatus;

    @Column(name = "route_efficiency_score")
    private BigDecimal routeEfficiencyScore;

    @Column(name = "eta_to_school_minutes")
    private Integer etaToSchoolMinutes;

    @Column(name = "total_distance_km")
    private BigDecimal totalDistanceKm;

    @Column(name = "notes")
    private String notes;

    @Column(name = "created_at", nullable = false)
    private Instant createdAt;

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    public UUID getTripId() { return tripId; }
    public void setTripId(UUID tripId) { this.tripId = tripId; }
    public UUID getSchoolId() { return schoolId; }
    public void setSchoolId(UUID schoolId) { this.schoolId = schoolId; }
    public UUID getRouteAssignmentId() { return routeAssignmentId; }
    public void setRouteAssignmentId(UUID routeAssignmentId) { this.routeAssignmentId = routeAssignmentId; }
    public UUID getRouteId() { return routeId; }
    public void setRouteId(UUID routeId) { this.routeId = routeId; }
    public UUID getVehicleId() { return vehicleId; }
    public void setVehicleId(UUID vehicleId) { this.vehicleId = vehicleId; }
    public UUID getDriverUserId() { return driverUserId; }
    public void setDriverUserId(UUID driverUserId) { this.driverUserId = driverUserId; }
    public UUID getConductorUserId() { return conductorUserId; }
    public void setConductorUserId(UUID conductorUserId) { this.conductorUserId = conductorUserId; }
    public LocalDate getServiceDate() { return serviceDate; }
    public void setServiceDate(LocalDate serviceDate) { this.serviceDate = serviceDate; }
    public String getShiftType() { return shiftType; }
    public void setShiftType(String shiftType) { this.shiftType = shiftType; }
    public String getTripState() { return tripState; }
    public void setTripState(String tripState) { this.tripState = tripState; }
    public Instant getPlannedStartTime() { return plannedStartTime; }
    public void setPlannedStartTime(Instant plannedStartTime) { this.plannedStartTime = plannedStartTime; }
    public Instant getPlannedEndTime() { return plannedEndTime; }
    public void setPlannedEndTime(Instant plannedEndTime) { this.plannedEndTime = plannedEndTime; }
    public Instant getActualStartTime() { return actualStartTime; }
    public void setActualStartTime(Instant actualStartTime) { this.actualStartTime = actualStartTime; }
    public Instant getActualEndTime() { return actualEndTime; }
    public void setActualEndTime(Instant actualEndTime) { this.actualEndTime = actualEndTime; }
    public Integer getOccupancyCount() { return occupancyCount; }
    public void setOccupancyCount(Integer occupancyCount) { this.occupancyCount = occupancyCount; }
    public String getGpsStatus() { return gpsStatus; }
    public void setGpsStatus(String gpsStatus) { this.gpsStatus = gpsStatus; }
    public Instant getLastPingAt() { return lastPingAt; }
    public void setLastPingAt(Instant lastPingAt) { this.lastPingAt = lastPingAt; }
    public BigDecimal getCurrentLatitude() { return currentLatitude; }
    public void setCurrentLatitude(BigDecimal currentLatitude) { this.currentLatitude = currentLatitude; }
    public BigDecimal getCurrentLongitude() { return currentLongitude; }
    public void setCurrentLongitude(BigDecimal currentLongitude) { this.currentLongitude = currentLongitude; }
    public BigDecimal getCurrentSpeed() { return currentSpeed; }
    public void setCurrentSpeed(BigDecimal currentSpeed) { this.currentSpeed = currentSpeed; }
    public BigDecimal getCurrentHeading() { return currentHeading; }
    public void setCurrentHeading(BigDecimal currentHeading) { this.currentHeading = currentHeading; }
    public UUID getNextStopId() { return nextStopId; }
    public void setNextStopId(UUID nextStopId) { this.nextStopId = nextStopId; }
    public String getHaltStatus() { return haltStatus; }
    public void setHaltStatus(String haltStatus) { this.haltStatus = haltStatus; }
    public String getDeviationStatus() { return deviationStatus; }
    public void setDeviationStatus(String deviationStatus) { this.deviationStatus = deviationStatus; }
    public String getEmergencyStatus() { return emergencyStatus; }
    public void setEmergencyStatus(String emergencyStatus) { this.emergencyStatus = emergencyStatus; }
    public BigDecimal getRouteEfficiencyScore() { return routeEfficiencyScore; }
    public void setRouteEfficiencyScore(BigDecimal routeEfficiencyScore) { this.routeEfficiencyScore = routeEfficiencyScore; }
    public Integer getEtaToSchoolMinutes() { return etaToSchoolMinutes; }
    public void setEtaToSchoolMinutes(Integer etaToSchoolMinutes) { this.etaToSchoolMinutes = etaToSchoolMinutes; }
    public BigDecimal getTotalDistanceKm() { return totalDistanceKm; }
    public void setTotalDistanceKm(BigDecimal totalDistanceKm) { this.totalDistanceKm = totalDistanceKm; }
    public String getNotes() { return notes; }
    public void setNotes(String notes) { this.notes = notes; }
    public Instant getCreatedAt() { return createdAt; }
    public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }
    public Instant getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(Instant updatedAt) { this.updatedAt = updatedAt; }
}
