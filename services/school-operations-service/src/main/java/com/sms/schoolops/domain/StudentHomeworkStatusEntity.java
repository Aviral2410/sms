package com.sms.schoolops.domain;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;
import java.time.Instant;
import java.util.UUID;
import org.hibernate.annotations.Filter;

@Entity
@Table(
    name = "student_homework_status", 
    schema = "schoolops",
    uniqueConstraints = {
        @UniqueConstraint(columnNames = {"homework_id", "student_user_id"})
    }
)
@Filter(name = "schoolFilter", condition = "school_id = :schoolId")
public class StudentHomeworkStatusEntity {
    @Id
    @Column(name = "status_id", nullable = false, updatable = false)
    private UUID statusId;
    @Column(name = "school_id", nullable = false)
    private UUID schoolId;
    @Column(name = "homework_id", nullable = false)
    private UUID homeworkId;
    @Column(name = "student_user_id", nullable = false)
    private UUID studentUserId;
    @Column(name = "status", nullable = false)
    private String status; // PENDING, IN_PROGRESS, COMPLETED
    @Column(name = "notes")
    private String notes;
    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    public UUID getStatusId() { return statusId; }
    public void setStatusId(UUID statusId) { this.statusId = statusId; }
    public UUID getSchoolId() { return schoolId; }
    public void setSchoolId(UUID schoolId) { this.schoolId = schoolId; }
    public UUID getHomeworkId() { return homeworkId; }
    public void setHomeworkId(UUID homeworkId) { this.homeworkId = homeworkId; }
    public UUID getStudentUserId() { return studentUserId; }
    public void setStudentUserId(UUID studentUserId) { this.studentUserId = studentUserId; }
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
    public String getNotes() { return notes; }
    public void setNotes(String notes) { this.notes = notes; }
    public Instant getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(Instant updatedAt) { this.updatedAt = updatedAt; }
}
