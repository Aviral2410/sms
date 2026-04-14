package com.sms.schoolops.domain;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

import java.time.Instant;
import java.util.UUID;

import org.hibernate.annotations.Filter;

@Entity
@Table(name = "class_teacher_mapping", schema = "schoolops")
@Filter(name = "schoolFilter", condition = "school_id = :schoolId")
public class ClassTeacherMappingEntity {
    @Id
    @Column(name = "mapping_id", nullable = false, updatable = false)
    private UUID mappingId;
    @Column(name = "school_id", nullable = false)
    private UUID schoolId;
    @Column(name = "teacher_user_id", nullable = false)
    private UUID teacherUserId;
    @Column(name = "class_id", nullable = false)
    private UUID classId;
    @Column(name = "created_at", nullable = false)
    private Instant createdAt;
    public UUID getMappingId() { return mappingId; }
    public void setMappingId(UUID mappingId) { this.mappingId = mappingId; }
    public UUID getSchoolId() { return schoolId; }
    public void setSchoolId(UUID schoolId) { this.schoolId = schoolId; }
    public UUID getTeacherUserId() { return teacherUserId; }
    public void setTeacherUserId(UUID teacherUserId) { this.teacherUserId = teacherUserId; }
    public UUID getClassId() { return classId; }
    public void setClassId(UUID classId) { this.classId = classId; }
    public Instant getCreatedAt() { return createdAt; }
    public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }
}
