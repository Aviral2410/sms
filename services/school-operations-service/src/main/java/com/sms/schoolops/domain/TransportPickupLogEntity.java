package com.sms.schoolops.domain;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;

@Entity
@Table(name = "transport_pickup_log", schema = "schoolops")
public class TransportPickupLogEntity {
    @Id
    @Column(name = "log_id", nullable = false, updatable = false)
    private UUID logId;
    @Column(name = "school_id", nullable = false)
    private UUID schoolId;
    @Column(name = "route_id", nullable = false)
    private UUID routeId;
    @Column(name = "student_user_id", nullable = false)
    private UUID studentUserId;
    @Column(name = "stop_id")
    private UUID stopId;
    @Column(name = "action", nullable = false)
    private String action;
    @Column(name = "marked_by", nullable = false)
    private String markedBy;
    @Column(name = "trip_date", nullable = false)
    private LocalDate tripDate;
    @Column(name = "marked_at", nullable = false)
    private Instant markedAt;

    public UUID getLogId() { return logId; }
    public void setLogId(UUID logId) { this.logId = logId; }
    public UUID getSchoolId() { return schoolId; }
    public void setSchoolId(UUID schoolId) { this.schoolId = schoolId; }
    public UUID getRouteId() { return routeId; }
    public void setRouteId(UUID routeId) { this.routeId = routeId; }
    public UUID getStudentUserId() { return studentUserId; }
    public void setStudentUserId(UUID studentUserId) { this.studentUserId = studentUserId; }
    public UUID getStopId() { return stopId; }
    public void setStopId(UUID stopId) { this.stopId = stopId; }
    public String getAction() { return action; }
    public void setAction(String action) { this.action = action; }
    public String getMarkedBy() { return markedBy; }
    public void setMarkedBy(String markedBy) { this.markedBy = markedBy; }
    public LocalDate getTripDate() { return tripDate; }
    public void setTripDate(LocalDate tripDate) { this.tripDate = tripDate; }
    public Instant getMarkedAt() { return markedAt; }
    public void setMarkedAt(Instant markedAt) { this.markedAt = markedAt; }
}
