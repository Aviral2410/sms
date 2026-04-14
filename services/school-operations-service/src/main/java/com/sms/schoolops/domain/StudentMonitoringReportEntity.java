package com.sms.schoolops.domain;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

import org.hibernate.annotations.Filter;

@Entity
@Table(name = "student_monitoring_report", schema = "schoolops")
@Filter(name = "schoolFilter", condition = "school_id = :schoolId")
public class StudentMonitoringReportEntity {
    @Id
    @Column(name = "report_id", nullable = false, updatable = false)
    private UUID reportId;
    @Column(name = "school_id", nullable = false)
    private UUID schoolId;
    @Column(name = "student_user_id", nullable = false)
    private UUID studentUserId;
    @Column(name = "report_month", nullable = false)
    private String reportMonth;
    @Column(name = "academic_year", nullable = false)
    private String academicYear;
    @Column(name = "attendance_percentage", nullable = false)
    private BigDecimal attendancePercentage;
    @Column(name = "academic_note")
    private String academicNote;
    @Column(name = "behaviour_note")
    private String behaviourNote;
    @Column(name = "wellbeing_note")
    private String wellbeingNote;
    @Column(name = "created_at", nullable = false)
    private Instant createdAt;
    public UUID getReportId() { return reportId; }
    public void setReportId(UUID reportId) { this.reportId = reportId; }
    public UUID getSchoolId() { return schoolId; }
    public void setSchoolId(UUID schoolId) { this.schoolId = schoolId; }
    public UUID getStudentUserId() { return studentUserId; }
    public void setStudentUserId(UUID studentUserId) { this.studentUserId = studentUserId; }
    public String getReportMonth() { return reportMonth; }
    public void setReportMonth(String reportMonth) { this.reportMonth = reportMonth; }
    public String getAcademicYear() { return academicYear; }
    public void setAcademicYear(String academicYear) { this.academicYear = academicYear; }
    public BigDecimal getAttendancePercentage() { return attendancePercentage; }
    public void setAttendancePercentage(BigDecimal attendancePercentage) { this.attendancePercentage = attendancePercentage; }
    public String getAcademicNote() { return academicNote; }
    public void setAcademicNote(String academicNote) { this.academicNote = academicNote; }
    public String getBehaviourNote() { return behaviourNote; }
    public void setBehaviourNote(String behaviourNote) { this.behaviourNote = behaviourNote; }
    public String getWellbeingNote() { return wellbeingNote; }
    public void setWellbeingNote(String wellbeingNote) { this.wellbeingNote = wellbeingNote; }
    public Instant getCreatedAt() { return createdAt; }
    public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }
}
