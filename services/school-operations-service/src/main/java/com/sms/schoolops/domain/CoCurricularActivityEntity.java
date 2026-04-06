package com.sms.schoolops.domain;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;

@Entity
@Table(name = "co_curricular_activity", schema = "schoolops")
public class CoCurricularActivityEntity {
    @Id
    @Column(name = "activity_id", nullable = false, updatable = false)
    private UUID activityId;
    @Column(name = "school_id", nullable = false)
    private UUID schoolId;
    @Column(name = "title", nullable = false)
    private String title;
    @Column(name = "activity_type", nullable = false)
    private String activityType;
    @Column(name = "event_date", nullable = false)
    private LocalDate eventDate;
    @Column(name = "coordinator_user_id")
    private UUID coordinatorUserId;
    @Column(name = "description")
    private String description;
    @Column(name = "created_at", nullable = false)
    private Instant createdAt;
    public UUID getActivityId() { return activityId; }
    public void setActivityId(UUID activityId) { this.activityId = activityId; }
    public UUID getSchoolId() { return schoolId; }
    public void setSchoolId(UUID schoolId) { this.schoolId = schoolId; }
    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }
    public String getActivityType() { return activityType; }
    public void setActivityType(String activityType) { this.activityType = activityType; }
    public LocalDate getEventDate() { return eventDate; }
    public void setEventDate(LocalDate eventDate) { this.eventDate = eventDate; }
    public UUID getCoordinatorUserId() { return coordinatorUserId; }
    public void setCoordinatorUserId(UUID coordinatorUserId) { this.coordinatorUserId = coordinatorUserId; }
    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }
    public Instant getCreatedAt() { return createdAt; }
    public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }
}
