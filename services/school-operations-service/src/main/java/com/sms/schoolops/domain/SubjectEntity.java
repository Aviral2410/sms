package com.sms.schoolops.domain;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

import java.time.Instant;
import java.util.UUID;

import org.hibernate.annotations.Filter;

@Entity
@Table(name = "subject", schema = "schoolops")
@Filter(name = "schoolFilter", condition = "school_id = :schoolId")
public class SubjectEntity {
    @Id
    @Column(name = "subject_id", nullable = false, updatable = false)
    private UUID subjectId;
    @Column(name = "school_id", nullable = false)
    private UUID schoolId;
    @Column(name = "department_id")
    private UUID departmentId;
    @Column(name = "subject_name", nullable = false)
    private String subjectName;
    @Column(name = "subject_code", nullable = false)
    private String subjectCode;
    @Column(name = "created_at", nullable = false)
    private Instant createdAt;

    public UUID getSubjectId() { return subjectId; }
    public void setSubjectId(UUID subjectId) { this.subjectId = subjectId; }
    public UUID getSchoolId() { return schoolId; }
    public void setSchoolId(UUID schoolId) { this.schoolId = schoolId; }
    public UUID getDepartmentId() { return departmentId; }
    public void setDepartmentId(UUID departmentId) { this.departmentId = departmentId; }
    public String getSubjectName() { return subjectName; }
    public void setSubjectName(String subjectName) { this.subjectName = subjectName; }
    public String getSubjectCode() { return subjectCode; }
    public void setSubjectCode(String subjectCode) { this.subjectCode = subjectCode; }
    public Instant getCreatedAt() { return createdAt; }
    public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }
}
