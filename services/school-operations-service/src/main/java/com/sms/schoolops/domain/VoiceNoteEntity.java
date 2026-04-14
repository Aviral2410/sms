package com.sms.schoolops.domain;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

import java.time.Instant;
import java.util.UUID;

import org.hibernate.annotations.Filter;

@Entity
@Table(name = "voice_note", schema = "schoolops")
@Filter(name = "schoolFilter", condition = "school_id = :schoolId")
public class VoiceNoteEntity {
    @Id
    @Column(name = "voice_note_id", nullable = false, updatable = false)
    private UUID voiceNoteId;
    @Column(name = "school_id", nullable = false)
    private UUID schoolId;
    @Column(name = "related_user_id")
    private UUID relatedUserId;
    @Column(name = "audience", nullable = false)
    private String audience;
    @Column(name = "title", nullable = false)
    private String title;
    @Column(name = "transcript")
    private String transcript;
    @Column(name = "audio_url")
    private String audioUrl;
    @Column(name = "translations", columnDefinition = "TEXT")
    private String translations; // JSON: { "es": "...", "fr": "..." }
    @Column(name = "created_at", nullable = false)
    private Instant createdAt;
    public UUID getVoiceNoteId() { return voiceNoteId; }
    public void setVoiceNoteId(UUID voiceNoteId) { this.voiceNoteId = voiceNoteId; }
    public UUID getSchoolId() { return schoolId; }
    public void setSchoolId(UUID schoolId) { this.schoolId = schoolId; }
    public UUID getRelatedUserId() { return relatedUserId; }
    public void setRelatedUserId(UUID relatedUserId) { this.relatedUserId = relatedUserId; }
    public String getAudience() { return audience; }
    public void setAudience(String audience) { this.audience = audience; }
    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }
    public String getTranscript() { return transcript; }
    public void setTranscript(String transcript) { this.transcript = transcript; }
    public String getAudioUrl() { return audioUrl; }
    public void setAudioUrl(String audioUrl) { this.audioUrl = audioUrl; }
    public String getTranslations() { return translations; }
    public void setTranslations(String translations) { this.translations = translations; }
    public Instant getCreatedAt() { return createdAt; }
    public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }
}
