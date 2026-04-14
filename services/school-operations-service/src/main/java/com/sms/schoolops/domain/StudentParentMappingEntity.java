package com.sms.schoolops.domain;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.time.Instant;
import java.util.UUID;

import org.hibernate.annotations.Filter;

@Entity
@Table(name = "student_parent_mapping", schema = "schoolops")
@Filter(name = "schoolFilter", condition = "school_id = :schoolId")
public class StudentParentMappingEntity {
    @Id
    @Column(name = "mapping_id", nullable = false)
    private UUID mappingId;

    @Column(name = "school_id", nullable = false)
    private UUID schoolId;

    @Column(name = "student_user_id", nullable = false)
    private UUID studentUserId;

    @Column(name = "parent_user_id", nullable = false)
    private UUID parentUserId;

    @Column(name = "relationship", nullable = false)
    private String relationship; // FATHER, MOTHER, GUARDIAN

    @Column(name = "created_at", nullable = false)
    private Instant createdAt;

    public UUID getMappingId() { return mappingId; }
    public void setMappingId(UUID mappingId) { this.mappingId = mappingId; }

    public UUID getSchoolId() { return schoolId; }
    public void setSchoolId(UUID schoolId) { this.schoolId = schoolId; }

    public UUID getStudentUserId() { return studentUserId; }
    public void setStudentUserId(UUID studentUserId) { this.studentUserId = studentUserId; }

    public UUID getParentUserId() { return parentUserId; }
    public void setParentUserId(UUID parentUserId) { this.parentUserId = parentUserId; }

    public String getRelationship() { return relationship; }
    public void setRelationship(String relationship) { this.relationship = relationship; }

    public Instant getCreatedAt() { return createdAt; }
    public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }
}
