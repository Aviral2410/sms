package com.sms.schoolops.domain;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "teacher_monthly_report", schema = "schoolops")
public class TeacherMonthlyReportEntity {
    @Id
    @Column(name = "report_id", nullable = false, updatable = false)
    private UUID reportId;
    @Column(name = "school_id", nullable = false)
    private UUID schoolId;
    @Column(name = "teacher_user_id", nullable = false)
    private UUID teacherUserId;
    @Column(name = "report_month", nullable = false)
    private String reportMonth;
    @Column(name = "academic_year", nullable = false)
    private String academicYear;
    @Column(name = "classes_handled", nullable = false)
    private Integer classesHandled;
    @Column(name = "attendance_percentage", nullable = false)
    private BigDecimal attendancePercentage;
    @Column(name = "biometric_compliance", nullable = false)
    private String biometricCompliance;
    @Column(name = "principal_note")
    private String principalNote;
    @Column(name = "created_at", nullable = false)
    private Instant createdAt;
    public UUID getReportId() { return reportId; }
    public void setReportId(UUID reportId) { this.reportId = reportId; }
    public UUID getSchoolId() { return schoolId; }
    public void setSchoolId(UUID schoolId) { this.schoolId = schoolId; }
    public UUID getTeacherUserId() { return teacherUserId; }
    public void setTeacherUserId(UUID teacherUserId) { this.teacherUserId = teacherUserId; }
    public String getReportMonth() { return reportMonth; }
    public void setReportMonth(String reportMonth) { this.reportMonth = reportMonth; }
    public String getAcademicYear() { return academicYear; }
    public void setAcademicYear(String academicYear) { this.academicYear = academicYear; }
    public Integer getClassesHandled() { return classesHandled; }
    public void setClassesHandled(Integer classesHandled) { this.classesHandled = classesHandled; }
    public BigDecimal getAttendancePercentage() { return attendancePercentage; }
    public void setAttendancePercentage(BigDecimal attendancePercentage) { this.attendancePercentage = attendancePercentage; }
    public String getBiometricCompliance() { return biometricCompliance; }
    public void setBiometricCompliance(String biometricCompliance) { this.biometricCompliance = biometricCompliance; }
    public String getPrincipalNote() { return principalNote; }
    public void setPrincipalNote(String principalNote) { this.principalNote = principalNote; }
    public Instant getCreatedAt() { return createdAt; }
    public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }
}
