package com.sms.schoolops.domain;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.time.Instant;
import java.util.UUID;
import org.hibernate.annotations.Filter;

@Entity
@Table(name = "ai_visualization_history", schema = "schoolops")
@Filter(name = "schoolFilter", condition = "school_id = :schoolId")
public class AiVisualizationEntity {
    @Id
    @Column(name = "visualization_id", nullable = false, updatable = false)
    private UUID visualizationId;
    @Column(name = "school_id", nullable = false)
    private UUID schoolId;
    @Column(name = "user_id", nullable = false)
    private UUID userId;
    @Column(name = "question", nullable = false, columnDefinition = "TEXT")
    private String question;
    @Column(name = "response_json", nullable = false, columnDefinition = "JSONB")
    private String responseJson;
    @Column(name = "created_at", nullable = false)
    private Instant createdAt;

    public UUID getVisualizationId() { return visualizationId; }
    public void setVisualizationId(UUID visualizationId) { this.visualizationId = visualizationId; }
    public UUID getSchoolId() { return schoolId; }
    public void setSchoolId(UUID schoolId) { this.schoolId = schoolId; }
    public UUID getUserId() { return userId; }
    public void setUserId(UUID userId) { this.userId = userId; }
    public String getQuestion() { return question; }
    public void setQuestion(String question) { this.question = question; }
    public String getResponseJson() { return responseJson; }
    public void setResponseJson(String responseJson) { this.responseJson = responseJson; }
    public Instant getCreatedAt() { return createdAt; }
    public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }
}
