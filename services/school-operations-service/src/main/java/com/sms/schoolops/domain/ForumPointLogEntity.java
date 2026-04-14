package com.sms.schoolops.domain;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.time.Instant;
import java.util.UUID;

import org.hibernate.annotations.Filter;

@Entity
@Table(name = "forum_point_log", schema = "schoolops")
@Filter(name = "schoolFilter", condition = "school_id = :schoolId")
public class ForumPointLogEntity {
    @Id
    @Column(name = "log_id", nullable = false, updatable = false)
    private UUID logId;
    @Column(name = "user_id", nullable = false)
    private UUID userId;
    @Column(name = "school_id", nullable = false)
    private UUID schoolId;
    @Column(name = "points", nullable = false)
    private Integer points;
    @Column(name = "point_type", nullable = false)
    private String pointType; // ANSWER, CORRECT_ANSWER, UPVOTE
    @Column(name = "reference_id")
    private UUID referenceId; // Question or Answer ID
    @Column(name = "timestamp", nullable = false)
    private Instant timestamp;

    public UUID getLogId() { return logId; }
    public void setLogId(UUID logId) { this.logId = logId; }
    public UUID getUserId() { return userId; }
    public void setUserId(UUID userId) { this.userId = userId; }
    public UUID getSchoolId() { return schoolId; }
    public void setSchoolId(UUID schoolId) { this.schoolId = schoolId; }
    public Integer getPoints() { return points; }
    public void setPoints(Integer points) { this.points = points; }
    public String getPointType() { return pointType; }
    public void setPointType(String pointType) { this.pointType = pointType; }
    public UUID getReferenceId() { return referenceId; }
    public void setReferenceId(UUID referenceId) { this.referenceId = referenceId; }
    public Instant getTimestamp() { return timestamp; }
    public void setTimestamp(Instant timestamp) { this.timestamp = timestamp; }
}
