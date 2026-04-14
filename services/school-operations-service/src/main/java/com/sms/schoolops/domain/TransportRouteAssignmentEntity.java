package com.sms.schoolops.domain;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;

import org.hibernate.annotations.Filter;

@Entity
@Table(name = "transport_route_assignment", schema = "schoolops")
@Filter(name = "schoolFilter", condition = "school_id = :schoolId")
public class TransportRouteAssignmentEntity {
    @Id
    @Column(name = "assignment_id", nullable = false, updatable = false)
    private UUID assignmentId;

    @Column(name = "school_id", nullable = false)
    private UUID schoolId;

    @Column(name = "route_id", nullable = false)
    private UUID routeId;

    @Column(name = "vehicle_id")
    private UUID vehicleId;

    @Column(name = "driver_user_id")
    private UUID driverUserId;

    @Column(name = "conductor_user_id")
    private UUID conductorUserId;

    @Column(name = "backup_driver_user_id")
    private UUID backupDriverUserId;

    @Column(name = "backup_vehicle_id")
    private UUID backupVehicleId;

    @Column(name = "service_date", nullable = false)
    private LocalDate serviceDate;

    @Column(name = "shift_type", nullable = false)
    private String shiftType;

    @Column(name = "assignment_status", nullable = false)
    private String assignmentStatus;

    @Column(name = "driver_onboard_marked", nullable = false)
    private Boolean driverOnboardMarked;

    @Column(name = "conductor_onboard_marked", nullable = false)
    private Boolean conductorOnboardMarked;

    @Column(name = "vehicle_ready", nullable = false)
    private Boolean vehicleReady;

    @Column(name = "gps_ready", nullable = false)
    private Boolean gpsReady;

    @Column(name = "notes")
    private String notes;

    @Column(name = "created_at", nullable = false)
    private Instant createdAt;

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    public UUID getAssignmentId() { return assignmentId; }
    public void setAssignmentId(UUID assignmentId) { this.assignmentId = assignmentId; }
    public UUID getSchoolId() { return schoolId; }
    public void setSchoolId(UUID schoolId) { this.schoolId = schoolId; }
    public UUID getRouteId() { return routeId; }
    public void setRouteId(UUID routeId) { this.routeId = routeId; }
    public UUID getVehicleId() { return vehicleId; }
    public void setVehicleId(UUID vehicleId) { this.vehicleId = vehicleId; }
    public UUID getDriverUserId() { return driverUserId; }
    public void setDriverUserId(UUID driverUserId) { this.driverUserId = driverUserId; }
    public UUID getConductorUserId() { return conductorUserId; }
    public void setConductorUserId(UUID conductorUserId) { this.conductorUserId = conductorUserId; }
    public UUID getBackupDriverUserId() { return backupDriverUserId; }
    public void setBackupDriverUserId(UUID backupDriverUserId) { this.backupDriverUserId = backupDriverUserId; }
    public UUID getBackupVehicleId() { return backupVehicleId; }
    public void setBackupVehicleId(UUID backupVehicleId) { this.backupVehicleId = backupVehicleId; }
    public LocalDate getServiceDate() { return serviceDate; }
    public void setServiceDate(LocalDate serviceDate) { this.serviceDate = serviceDate; }
    public String getShiftType() { return shiftType; }
    public void setShiftType(String shiftType) { this.shiftType = shiftType; }
    public String getAssignmentStatus() { return assignmentStatus; }
    public void setAssignmentStatus(String assignmentStatus) { this.assignmentStatus = assignmentStatus; }
    public Boolean getDriverOnboardMarked() { return driverOnboardMarked; }
    public void setDriverOnboardMarked(Boolean driverOnboardMarked) { this.driverOnboardMarked = driverOnboardMarked; }
    public Boolean getConductorOnboardMarked() { return conductorOnboardMarked; }
    public void setConductorOnboardMarked(Boolean conductorOnboardMarked) { this.conductorOnboardMarked = conductorOnboardMarked; }
    public Boolean getVehicleReady() { return vehicleReady; }
    public void setVehicleReady(Boolean vehicleReady) { this.vehicleReady = vehicleReady; }
    public Boolean getGpsReady() { return gpsReady; }
    public void setGpsReady(Boolean gpsReady) { this.gpsReady = gpsReady; }
    public String getNotes() { return notes; }
    public void setNotes(String notes) { this.notes = notes; }
    public Instant getCreatedAt() { return createdAt; }
    public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }
    public Instant getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(Instant updatedAt) { this.updatedAt = updatedAt; }
}
