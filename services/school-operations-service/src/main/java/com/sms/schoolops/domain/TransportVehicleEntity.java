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
@Table(name = "transport_vehicle", schema = "schoolops")
@Filter(name = "schoolFilter", condition = "school_id = :schoolId")
public class TransportVehicleEntity {
    @Id
    @Column(name = "vehicle_id", nullable = false, updatable = false)
    private UUID vehicleId;

    @Column(name = "school_id", nullable = false)
    private UUID schoolId;

    @Column(name = "registration_number", nullable = false)
    private String registrationNumber;

    @Column(name = "vehicle_type", nullable = false)
    private String vehicleType;

    @Column(name = "capacity", nullable = false)
    private Integer capacity;

    @Column(name = "gps_device_id")
    private String gpsDeviceId;

    @Column(name = "health_status", nullable = false)
    private String healthStatus;

    @Column(name = "insurance_expiry")
    private LocalDate insuranceExpiry;

    @Column(name = "fitness_expiry")
    private LocalDate fitnessExpiry;

    @Column(name = "permit_expiry")
    private LocalDate permitExpiry;

    @Column(name = "pollution_expiry")
    private LocalDate pollutionExpiry;

    @Column(name = "last_service_date")
    private LocalDate lastServiceDate;

    @Column(name = "next_service_due")
    private LocalDate nextServiceDue;

    @Column(name = "maintenance_lock", nullable = false)
    private Boolean maintenanceLock;

    @Column(name = "operational_notes")
    private String operationalNotes;

    @Column(name = "created_at", nullable = false)
    private Instant createdAt;

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    public UUID getVehicleId() { return vehicleId; }
    public void setVehicleId(UUID vehicleId) { this.vehicleId = vehicleId; }
    public UUID getSchoolId() { return schoolId; }
    public void setSchoolId(UUID schoolId) { this.schoolId = schoolId; }
    public String getRegistrationNumber() { return registrationNumber; }
    public void setRegistrationNumber(String registrationNumber) { this.registrationNumber = registrationNumber; }
    public String getVehicleType() { return vehicleType; }
    public void setVehicleType(String vehicleType) { this.vehicleType = vehicleType; }
    public Integer getCapacity() { return capacity; }
    public void setCapacity(Integer capacity) { this.capacity = capacity; }
    public String getGpsDeviceId() { return gpsDeviceId; }
    public void setGpsDeviceId(String gpsDeviceId) { this.gpsDeviceId = gpsDeviceId; }
    public String getHealthStatus() { return healthStatus; }
    public void setHealthStatus(String healthStatus) { this.healthStatus = healthStatus; }
    public LocalDate getInsuranceExpiry() { return insuranceExpiry; }
    public void setInsuranceExpiry(LocalDate insuranceExpiry) { this.insuranceExpiry = insuranceExpiry; }
    public LocalDate getFitnessExpiry() { return fitnessExpiry; }
    public void setFitnessExpiry(LocalDate fitnessExpiry) { this.fitnessExpiry = fitnessExpiry; }
    public LocalDate getPermitExpiry() { return permitExpiry; }
    public void setPermitExpiry(LocalDate permitExpiry) { this.permitExpiry = permitExpiry; }
    public LocalDate getPollutionExpiry() { return pollutionExpiry; }
    public void setPollutionExpiry(LocalDate pollutionExpiry) { this.pollutionExpiry = pollutionExpiry; }
    public LocalDate getLastServiceDate() { return lastServiceDate; }
    public void setLastServiceDate(LocalDate lastServiceDate) { this.lastServiceDate = lastServiceDate; }
    public LocalDate getNextServiceDue() { return nextServiceDue; }
    public void setNextServiceDue(LocalDate nextServiceDue) { this.nextServiceDue = nextServiceDue; }
    public Boolean getMaintenanceLock() { return maintenanceLock; }
    public void setMaintenanceLock(Boolean maintenanceLock) { this.maintenanceLock = maintenanceLock; }
    public String getOperationalNotes() { return operationalNotes; }
    public void setOperationalNotes(String operationalNotes) { this.operationalNotes = operationalNotes; }
    public Instant getCreatedAt() { return createdAt; }
    public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }
    public Instant getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(Instant updatedAt) { this.updatedAt = updatedAt; }
}
