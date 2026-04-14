package com.sms.schoolops.domain;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.time.Instant;
import java.util.UUID;

import org.hibernate.annotations.Filter;

@Entity
@Table(name = "transport_trip_stop", schema = "schoolops")
@Filter(name = "schoolFilter", condition = "school_id = :schoolId")
public class TransportTripStopEntity {
    @Id
    @Column(name = "trip_stop_id", nullable = false, updatable = false)
    private UUID tripStopId;

    @Column(name = "school_id", nullable = false)
    private UUID schoolId;

    @Column(name = "trip_id", nullable = false)
    private UUID tripId;

    @Column(name = "stop_id", nullable = false)
    private UUID stopId;

    @Column(name = "sequence_order", nullable = false)
    private Integer sequenceOrder;

    @Column(name = "planned_eta")
    private Instant plannedEta;

    @Column(name = "actual_arrival_at")
    private Instant actualArrivalAt;

    @Column(name = "actual_departure_at")
    private Instant actualDepartureAt;

    @Column(name = "stop_status", nullable = false)
    private String stopStatus;

    @Column(name = "occupancy_after_stop")
    private Integer occupancyAfterStop;

    @Column(name = "eta_minutes")
    private Integer etaMinutes;

    @Column(name = "halt_reason")
    private String haltReason;

    @Column(name = "created_at", nullable = false)
    private Instant createdAt;

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    public UUID getTripStopId() { return tripStopId; }
    public void setTripStopId(UUID tripStopId) { this.tripStopId = tripStopId; }
    public UUID getSchoolId() { return schoolId; }
    public void setSchoolId(UUID schoolId) { this.schoolId = schoolId; }
    public UUID getTripId() { return tripId; }
    public void setTripId(UUID tripId) { this.tripId = tripId; }
    public UUID getStopId() { return stopId; }
    public void setStopId(UUID stopId) { this.stopId = stopId; }
    public Integer getSequenceOrder() { return sequenceOrder; }
    public void setSequenceOrder(Integer sequenceOrder) { this.sequenceOrder = sequenceOrder; }
    public Instant getPlannedEta() { return plannedEta; }
    public void setPlannedEta(Instant plannedEta) { this.plannedEta = plannedEta; }
    public Instant getActualArrivalAt() { return actualArrivalAt; }
    public void setActualArrivalAt(Instant actualArrivalAt) { this.actualArrivalAt = actualArrivalAt; }
    public Instant getActualDepartureAt() { return actualDepartureAt; }
    public void setActualDepartureAt(Instant actualDepartureAt) { this.actualDepartureAt = actualDepartureAt; }
    public String getStopStatus() { return stopStatus; }
    public void setStopStatus(String stopStatus) { this.stopStatus = stopStatus; }
    public Integer getOccupancyAfterStop() { return occupancyAfterStop; }
    public void setOccupancyAfterStop(Integer occupancyAfterStop) { this.occupancyAfterStop = occupancyAfterStop; }
    public Integer getEtaMinutes() { return etaMinutes; }
    public void setEtaMinutes(Integer etaMinutes) { this.etaMinutes = etaMinutes; }
    public String getHaltReason() { return haltReason; }
    public void setHaltReason(String haltReason) { this.haltReason = haltReason; }
    public Instant getCreatedAt() { return createdAt; }
    public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }
    public Instant getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(Instant updatedAt) { this.updatedAt = updatedAt; }
}
