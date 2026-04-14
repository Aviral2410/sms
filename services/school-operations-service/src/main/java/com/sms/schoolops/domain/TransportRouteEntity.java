package com.sms.schoolops.domain;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

import java.time.Instant;
import java.util.UUID;

import org.hibernate.annotations.Filter;

@Entity
@Table(name = "transport_route", schema = "schoolops")
@Filter(name = "schoolFilter", condition = "school_id = :schoolId")
public class TransportRouteEntity {
    @Id
    @Column(name = "route_id", nullable = false, updatable = false)
    private UUID routeId;
    @Column(name = "school_id", nullable = false)
    private UUID schoolId;
    @Column(name = "route_name", nullable = false)
    private String routeName;
    @Column(name = "route_code")
    private String routeCode;
    @Column(name = "zone")
    private String zone;
    @Column(name = "direction")
    private String direction;
    @Column(name = "vehicle_number", nullable = false)
    private String vehicleNumber;
    @Column(name = "driver_name", nullable = false)
    private String driverName;
    @Column(name = "driver_phone", nullable = false)
    private String driverPhone;
    @Column(name = "attendant_name")
    private String attendantName;
    @Column(name = "status")
    private String status;
    @Column(name = "capacity")
    private Integer capacity;
    @Column(name = "conductor_name")
    private String conductorName;
    @Column(name = "conductor_phone")
    private String conductorPhone;
    @Column(name = "planned_distance_km")
    private java.math.BigDecimal plannedDistanceKm;
    @Column(name = "estimated_duration_minutes")
    private Integer estimatedDurationMinutes;
    @Column(name = "corridor_polyline_json")
    private String corridorPolylineJson;
    @Column(name = "utilization_target")
    private java.math.BigDecimal utilizationTarget;
    @Column(name = "efficiency_score")
    private java.math.BigDecimal efficiencyScore;
    @Column(name = "created_at", nullable = false)
    private Instant createdAt;
    @Column(name = "updated_at")
    private Instant updatedAt;
    public UUID getRouteId() { return routeId; }
    public void setRouteId(UUID routeId) { this.routeId = routeId; }
    public UUID getSchoolId() { return schoolId; }
    public void setSchoolId(UUID schoolId) { this.schoolId = schoolId; }
    public String getRouteName() { return routeName; }
    public void setRouteName(String routeName) { this.routeName = routeName; }
    public String getRouteCode() { return routeCode; }
    public void setRouteCode(String routeCode) { this.routeCode = routeCode; }
    public String getZone() { return zone; }
    public void setZone(String zone) { this.zone = zone; }
    public String getDirection() { return direction; }
    public void setDirection(String direction) { this.direction = direction; }
    public String getVehicleNumber() { return vehicleNumber; }
    public void setVehicleNumber(String vehicleNumber) { this.vehicleNumber = vehicleNumber; }
    public String getDriverName() { return driverName; }
    public void setDriverName(String driverName) { this.driverName = driverName; }
    public String getDriverPhone() { return driverPhone; }
    public void setDriverPhone(String driverPhone) { this.driverPhone = driverPhone; }
    public String getAttendantName() { return attendantName; }
    public void setAttendantName(String attendantName) { this.attendantName = attendantName; }
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
    public Integer getCapacity() { return capacity; }
    public void setCapacity(Integer capacity) { this.capacity = capacity; }
    public String getConductorName() { return conductorName; }
    public void setConductorName(String conductorName) { this.conductorName = conductorName; }
    public String getConductorPhone() { return conductorPhone; }
    public void setConductorPhone(String conductorPhone) { this.conductorPhone = conductorPhone; }
    public java.math.BigDecimal getPlannedDistanceKm() { return plannedDistanceKm; }
    public void setPlannedDistanceKm(java.math.BigDecimal plannedDistanceKm) { this.plannedDistanceKm = plannedDistanceKm; }
    public Integer getEstimatedDurationMinutes() { return estimatedDurationMinutes; }
    public void setEstimatedDurationMinutes(Integer estimatedDurationMinutes) { this.estimatedDurationMinutes = estimatedDurationMinutes; }
    public String getCorridorPolylineJson() { return corridorPolylineJson; }
    public void setCorridorPolylineJson(String corridorPolylineJson) { this.corridorPolylineJson = corridorPolylineJson; }
    public java.math.BigDecimal getUtilizationTarget() { return utilizationTarget; }
    public void setUtilizationTarget(java.math.BigDecimal utilizationTarget) { this.utilizationTarget = utilizationTarget; }
    public java.math.BigDecimal getEfficiencyScore() { return efficiencyScore; }
    public void setEfficiencyScore(java.math.BigDecimal efficiencyScore) { this.efficiencyScore = efficiencyScore; }
    public Instant getCreatedAt() { return createdAt; }
    public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }
    public Instant getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(Instant updatedAt) { this.updatedAt = updatedAt; }
}
