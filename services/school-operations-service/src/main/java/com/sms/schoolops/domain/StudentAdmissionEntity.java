package com.sms.schoolops.domain;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;

import jakarta.persistence.UniqueConstraint;
import org.hibernate.annotations.Filter;
import org.hibernate.annotations.FilterDef;
import org.hibernate.annotations.ParamDef;

@Entity
@Table(
    name = "student_admission", 
    schema = "schoolops",
    uniqueConstraints = {
        @UniqueConstraint(columnNames = {"school_id", "admission_no"})
    }
)
@Filter(name = "tenantFilter", condition = "school_id = :tenantId")
public class StudentAdmissionEntity {
    @Id
    @Column(name = "admission_id", nullable = false, updatable = false)
    private UUID admissionId;
    @Column(name = "school_id", nullable = false)
    private UUID schoolId;
    @Column(name = "student_user_id", nullable = false)
    private UUID studentUserId;
    @Column(name = "admission_no", nullable = false)
    private String admissionNo;
    @Column(name = "roll_no")
    private String rollNo;
    @Column(name = "admitted_on", nullable = false)
    private LocalDate admittedOn;
    @Column(name = "date_of_birth")
    private LocalDate dateOfBirth;
    @Column(name = "guardian_name", nullable = false)
    private String guardianName;
    @Column(name = "guardian_phone", nullable = false)
    private String guardianPhone;
    @Column(name = "address")
    private String address;
    @Column(name = "previous_school")
    private String previousSchool;
    @Enumerated(EnumType.STRING)
    @Column(name = "admission_status", nullable = false)
    private StudentStatus admissionStatus;
    @Column(name = "created_at", nullable = false)
    private Instant createdAt;
    public UUID getAdmissionId() { return admissionId; }
    public void setAdmissionId(UUID admissionId) { this.admissionId = admissionId; }
    public UUID getSchoolId() { return schoolId; }
    public void setSchoolId(UUID schoolId) { this.schoolId = schoolId; }
    public UUID getStudentUserId() { return studentUserId; }
    public void setStudentUserId(UUID studentUserId) { this.studentUserId = studentUserId; }
    public String getAdmissionNo() { return admissionNo; }
    public void setAdmissionNo(String admissionNo) { this.admissionNo = admissionNo; }
    public String getRollNo() { return rollNo; }
    public void setRollNo(String rollNo) { this.rollNo = rollNo; }
    public LocalDate getAdmittedOn() { return admittedOn; }
    public void setAdmittedOn(LocalDate admittedOn) { this.admittedOn = admittedOn; }
    public LocalDate getDateOfBirth() { return dateOfBirth; }
    public void setDateOfBirth(LocalDate dateOfBirth) { this.dateOfBirth = dateOfBirth; }
    public String getGuardianName() { return guardianName; }
    public void setGuardianName(String guardianName) { this.guardianName = guardianName; }
    public String getGuardianPhone() { return guardianPhone; }
    public void setGuardianPhone(String guardianPhone) { this.guardianPhone = guardianPhone; }
    public String getAddress() { return address; }
    public void setAddress(String address) { this.address = address; }
    public String getPreviousSchool() { return previousSchool; }
    public void setPreviousSchool(String previousSchool) { this.previousSchool = previousSchool; }
    public StudentStatus getAdmissionStatus() { return admissionStatus; }
    public void setAdmissionStatus(StudentStatus admissionStatus) { this.admissionStatus = admissionStatus; }
    public Instant getCreatedAt() { return createdAt; }
    public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }
}
