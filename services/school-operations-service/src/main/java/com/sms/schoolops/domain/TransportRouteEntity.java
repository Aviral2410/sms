package com.sms.schoolops.domain;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "transport_route", schema = "schoolops")
public class TransportRouteEntity {
    @Id
    @Column(name = "route_id", nullable = false, updatable = false)
    private UUID routeId;
    @Column(name = "school_id", nullable = false)
    private UUID schoolId;
    @Column(name = "route_name", nullable = false)
    private String routeName;
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
    @Column(name = "created_at", nullable = false)
    private Instant createdAt;
    public UUID getRouteId() { return routeId; }
    public void setRouteId(UUID routeId) { this.routeId = routeId; }
    public UUID getSchoolId() { return schoolId; }
    public void setSchoolId(UUID schoolId) { this.schoolId = schoolId; }
    public String getRouteName() { return routeName; }
    public void setRouteName(String routeName) { this.routeName = routeName; }
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
    public Instant getCreatedAt() { return createdAt; }
    public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }
}
