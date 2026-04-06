package com.sms.schoolops.domain;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;

@Entity
@Table(name = "homework_item", schema = "schoolops")
public class HomeworkItemEntity {
    @Id
    @Column(name = "homework_id", nullable = false, updatable = false)
    private UUID homeworkId;
    @Column(name = "school_id", nullable = false)
    private UUID schoolId;
    @Column(name = "class_id", nullable = false)
    private UUID classId;
    @Column(name = "subject_id", nullable = false)
    private UUID subjectId;
    @Column(name = "teacher_user_id", nullable = false)
    private UUID teacherUserId;
    @Column(name = "title", nullable = false)
    private String title;
    @Column(name = "description", nullable = false)
    private String description;
    @Column(name = "due_date", nullable = false)
    private LocalDate dueDate;
    @Column(name = "created_at", nullable = false)
    private Instant createdAt;
    public UUID getHomeworkId() { return homeworkId; }
    public void setHomeworkId(UUID homeworkId) { this.homeworkId = homeworkId; }
    public UUID getSchoolId() { return schoolId; }
    public void setSchoolId(UUID schoolId) { this.schoolId = schoolId; }
    public UUID getClassId() { return classId; }
    public void setClassId(UUID classId) { this.classId = classId; }
    public UUID getSubjectId() { return subjectId; }
    public void setSubjectId(UUID subjectId) { this.subjectId = subjectId; }
    public UUID getTeacherUserId() { return teacherUserId; }
    public void setTeacherUserId(UUID teacherUserId) { this.teacherUserId = teacherUserId; }
    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }
    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }
    public LocalDate getDueDate() { return dueDate; }
    public void setDueDate(LocalDate dueDate) { this.dueDate = dueDate; }
    public Instant getCreatedAt() { return createdAt; }
    public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }
}
