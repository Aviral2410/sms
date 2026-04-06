package com.sms.schoolops.domain;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "note_share", schema = "schoolops")
public class NoteShareEntity {
    @Id
    @Column(name = "note_id", nullable = false, updatable = false)
    private UUID noteId;
    @Column(name = "school_id", nullable = false)
    private UUID schoolId;
    @Column(name = "shared_by_user_id", nullable = false)
    private UUID sharedByUserId;
    @Column(name = "class_id")
    private UUID classId;
    @Column(name = "subject_id")
    private UUID subjectId;
    @Column(name = "title", nullable = false)
    private String title;
    @Column(name = "access_url", nullable = false)
    private String accessUrl;
    @Column(name = "created_at", nullable = false)
    private Instant createdAt;
    public UUID getNoteId() { return noteId; }
    public void setNoteId(UUID noteId) { this.noteId = noteId; }
    public UUID getSchoolId() { return schoolId; }
    public void setSchoolId(UUID schoolId) { this.schoolId = schoolId; }
    public UUID getSharedByUserId() { return sharedByUserId; }
    public void setSharedByUserId(UUID sharedByUserId) { this.sharedByUserId = sharedByUserId; }
    public UUID getClassId() { return classId; }
    public void setClassId(UUID classId) { this.classId = classId; }
    public UUID getSubjectId() { return subjectId; }
    public void setSubjectId(UUID subjectId) { this.subjectId = subjectId; }
    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }
    public String getAccessUrl() { return accessUrl; }
    public void setAccessUrl(String accessUrl) { this.accessUrl = accessUrl; }
    public Instant getCreatedAt() { return createdAt; }
    public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }
}
