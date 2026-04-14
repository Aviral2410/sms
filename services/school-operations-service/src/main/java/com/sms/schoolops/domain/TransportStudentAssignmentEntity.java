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
@Table(name = "transport_student_assignment", schema = "schoolops")
@Filter(name = "schoolFilter", condition = "school_id = :schoolId")
public class TransportStudentAssignmentEntity {
    @Id
    @Column(name = "assignment_id", nullable = false, updatable = false)
    private UUID assignmentId;
    @Column(name = "school_id", nullable = false)
    private UUID schoolId;
    @Column(name = "student_user_id", nullable = false)
    private UUID studentUserId;
    @Column(name = "route_id", nullable = false)
    private UUID routeId;
    @Column(name = "stop_id")
    private UUID stopId;
    @Column(name = "morning_stop_id")
    private UUID morningStopId;
    @Column(name = "evening_stop_id")
    private UUID eveningStopId;
    @Column(name = "pickup_latitude")
    private BigDecimal pickupLatitude;
    @Column(name = "pickup_longitude")
    private BigDecimal pickupLongitude;
    @Column(name = "drop_latitude")
    private BigDecimal dropLatitude;
    @Column(name = "drop_longitude")
    private BigDecimal dropLongitude;
    @Column(name = "locality_label")
    private String localityLabel;
    @Column(name = "effective_from")
    private LocalDate effectiveFrom;
    @Column(name = "effective_to")
    private LocalDate effectiveTo;
    @Column(name = "boarding_verification_mode")
    private String boardingVerificationMode;
    @Column(name = "transport_status")
    private String transportStatus;
    @Column(name = "created_at", nullable = false)
    private Instant createdAt;
    @Column(name = "updated_at")
    private Instant updatedAt;

    public UUID getAssignmentId() { return assignmentId; }
    public void setAssignmentId(UUID assignmentId) { this.assignmentId = assignmentId; }
    public UUID getSchoolId() { return schoolId; }
    public void setSchoolId(UUID schoolId) { this.schoolId = schoolId; }
    public UUID getStudentUserId() { return studentUserId; }
    public void setStudentUserId(UUID studentUserId) { this.studentUserId = studentUserId; }
    public UUID getRouteId() { return routeId; }
    public void setRouteId(UUID routeId) { this.routeId = routeId; }
    public UUID getStopId() { return stopId; }
    public void setStopId(UUID stopId) { this.stopId = stopId; }
    public UUID getMorningStopId() { return morningStopId; }
    public void setMorningStopId(UUID morningStopId) { this.morningStopId = morningStopId; }
    public UUID getEveningStopId() { return eveningStopId; }
    public void setEveningStopId(UUID eveningStopId) { this.eveningStopId = eveningStopId; }
    public BigDecimal getPickupLatitude() { return pickupLatitude; }
    public void setPickupLatitude(BigDecimal pickupLatitude) { this.pickupLatitude = pickupLatitude; }
    public BigDecimal getPickupLongitude() { return pickupLongitude; }
    public void setPickupLongitude(BigDecimal pickupLongitude) { this.pickupLongitude = pickupLongitude; }
    public BigDecimal getDropLatitude() { return dropLatitude; }
    public void setDropLatitude(BigDecimal dropLatitude) { this.dropLatitude = dropLatitude; }
    public BigDecimal getDropLongitude() { return dropLongitude; }
    public void setDropLongitude(BigDecimal dropLongitude) { this.dropLongitude = dropLongitude; }
    public String getLocalityLabel() { return localityLabel; }
    public void setLocalityLabel(String localityLabel) { this.localityLabel = localityLabel; }
    public LocalDate getEffectiveFrom() { return effectiveFrom; }
    public void setEffectiveFrom(LocalDate effectiveFrom) { this.effectiveFrom = effectiveFrom; }
    public LocalDate getEffectiveTo() { return effectiveTo; }
    public void setEffectiveTo(LocalDate effectiveTo) { this.effectiveTo = effectiveTo; }
    public String getBoardingVerificationMode() { return boardingVerificationMode; }
    public void setBoardingVerificationMode(String boardingVerificationMode) { this.boardingVerificationMode = boardingVerificationMode; }
    public String getTransportStatus() { return transportStatus; }
    public void setTransportStatus(String transportStatus) { this.transportStatus = transportStatus; }
    public Instant getCreatedAt() { return createdAt; }
    public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }
    public Instant getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(Instant updatedAt) { this.updatedAt = updatedAt; }
}
