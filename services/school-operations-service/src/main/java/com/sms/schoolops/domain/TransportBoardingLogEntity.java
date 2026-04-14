package com.sms.schoolops.domain;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.time.Instant;
import java.util.UUID;

import org.hibernate.annotations.Filter;

@Entity
@Table(name = "transport_boarding_log", schema = "schoolops")
@Filter(name = "schoolFilter", condition = "school_id = :schoolId")
public class TransportBoardingLogEntity {
    @Id
    @Column(name = "log_id", nullable = false, updatable = false)
    private UUID logId;

    @Column(name = "school_id", nullable = false)
    private UUID schoolId;

    @Column(name = "trip_id", nullable = false)
    private UUID tripId;

    @Column(name = "trip_stop_id")
    private UUID tripStopId;

    @Column(name = "student_user_id", nullable = false)
    private UUID studentUserId;

    @Column(name = "route_id")
    private UUID routeId;

    @Column(name = "stop_id")
    private UUID stopId;

    @Column(name = "boarding_state", nullable = false)
    private String boardingState;

    @Column(name = "verification_mode", nullable = false)
    private String verificationMode;

    @Column(name = "actor_user_id")
    private UUID actorUserId;

    @Column(name = "actor_name")
    private String actorName;

    @Column(name = "created_at", nullable = false)
    private Instant createdAt;

    public UUID getLogId() { return logId; }
    public void setLogId(UUID logId) { this.logId = logId; }
    public UUID getSchoolId() { return schoolId; }
    public void setSchoolId(UUID schoolId) { this.schoolId = schoolId; }
    public UUID getTripId() { return tripId; }
    public void setTripId(UUID tripId) { this.tripId = tripId; }
    public UUID getTripStopId() { return tripStopId; }
    public void setTripStopId(UUID tripStopId) { this.tripStopId = tripStopId; }
    public UUID getStudentUserId() { return studentUserId; }
    public void setStudentUserId(UUID studentUserId) { this.studentUserId = studentUserId; }
    public UUID getRouteId() { return routeId; }
    public void setRouteId(UUID routeId) { this.routeId = routeId; }
    public UUID getStopId() { return stopId; }
    public void setStopId(UUID stopId) { this.stopId = stopId; }
    public String getBoardingState() { return boardingState; }
    public void setBoardingState(String boardingState) { this.boardingState = boardingState; }
    public String getVerificationMode() { return verificationMode; }
    public void setVerificationMode(String verificationMode) { this.verificationMode = verificationMode; }
    public UUID getActorUserId() { return actorUserId; }
    public void setActorUserId(UUID actorUserId) { this.actorUserId = actorUserId; }
    public String getActorName() { return actorName; }
    public void setActorName(String actorName) { this.actorName = actorName; }
    public Instant getCreatedAt() { return createdAt; }
    public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }
}
