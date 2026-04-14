package com.sms.schoolops.domain;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.time.Instant;
import java.util.UUID;

import org.hibernate.annotations.Filter;

@Entity
@Table(name = "attendance_voice_command_log", schema = "schoolops")
@Filter(name = "schoolFilter", condition = "school_id = :schoolId")
public class AttendanceVoiceCommandLogEntity {
    @Id
    @Column(name = "voice_log_id", nullable = false, updatable = false)
    private UUID voiceLogId;

    @Column(name = "school_id", nullable = false)
    private UUID schoolId;

    @Column(name = "session_id", nullable = false)
    private UUID sessionId;

    @Column(name = "actor_user_id", nullable = false)
    private UUID actorUserId;

    @Column(name = "actor_name", nullable = false)
    private String actorName;

    @Column(name = "transcript", nullable = false, length = 4000)
    private String transcript;

    @Column(name = "parsed_commands", length = 4000)
    private String parsedCommands;

    @Column(name = "rejected_commands", length = 4000)
    private String rejectedCommands;

    @Column(name = "processing_status", nullable = false)
    private String processingStatus;

    @Column(name = "created_at", nullable = false)
    private Instant createdAt;

    public UUID getVoiceLogId() { return voiceLogId; }
    public void setVoiceLogId(UUID voiceLogId) { this.voiceLogId = voiceLogId; }
    public UUID getSchoolId() { return schoolId; }
    public void setSchoolId(UUID schoolId) { this.schoolId = schoolId; }
    public UUID getSessionId() { return sessionId; }
    public void setSessionId(UUID sessionId) { this.sessionId = sessionId; }
    public UUID getActorUserId() { return actorUserId; }
    public void setActorUserId(UUID actorUserId) { this.actorUserId = actorUserId; }
    public String getActorName() { return actorName; }
    public void setActorName(String actorName) { this.actorName = actorName; }
    public String getTranscript() { return transcript; }
    public void setTranscript(String transcript) { this.transcript = transcript; }
    public String getParsedCommands() { return parsedCommands; }
    public void setParsedCommands(String parsedCommands) { this.parsedCommands = parsedCommands; }
    public String getRejectedCommands() { return rejectedCommands; }
    public void setRejectedCommands(String rejectedCommands) { this.rejectedCommands = rejectedCommands; }
    public String getProcessingStatus() { return processingStatus; }
    public void setProcessingStatus(String processingStatus) { this.processingStatus = processingStatus; }
    public Instant getCreatedAt() { return createdAt; }
    public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }
}
