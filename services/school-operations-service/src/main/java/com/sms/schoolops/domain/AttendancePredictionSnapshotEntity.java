package com.sms.schoolops.domain;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;

import org.hibernate.annotations.Filter;

@Entity
@Table(name = "attendance_prediction_snapshot", schema = "schoolops")
@Filter(name = "schoolFilter", condition = "school_id = :schoolId")
public class AttendancePredictionSnapshotEntity {
    @Id
    @Column(name = "prediction_id", nullable = false, updatable = false)
    private UUID predictionId;

    @Column(name = "school_id", nullable = false)
    private UUID schoolId;

    @Column(name = "student_user_id", nullable = false)
    private UUID studentUserId;

    @Column(name = "class_id")
    private UUID classId;

    @Column(name = "snapshot_date", nullable = false)
    private LocalDate snapshotDate;

    @Column(name = "current_attendance_percentage", nullable = false)
    private Double currentAttendancePercentage;

    @Column(name = "predicted_attendance_percentage", nullable = false)
    private Double predictedAttendancePercentage;

    @Column(name = "risk_level", nullable = false)
    private String riskLevel;

    @Column(name = "risk_drivers", length = 4000)
    private String riskDrivers;

    @Column(name = "generated_at", nullable = false)
    private Instant generatedAt;

    public UUID getPredictionId() { return predictionId; }
    public void setPredictionId(UUID predictionId) { this.predictionId = predictionId; }
    public UUID getSchoolId() { return schoolId; }
    public void setSchoolId(UUID schoolId) { this.schoolId = schoolId; }
    public UUID getStudentUserId() { return studentUserId; }
    public void setStudentUserId(UUID studentUserId) { this.studentUserId = studentUserId; }
    public UUID getClassId() { return classId; }
    public void setClassId(UUID classId) { this.classId = classId; }
    public LocalDate getSnapshotDate() { return snapshotDate; }
    public void setSnapshotDate(LocalDate snapshotDate) { this.snapshotDate = snapshotDate; }
    public Double getCurrentAttendancePercentage() { return currentAttendancePercentage; }
    public void setCurrentAttendancePercentage(Double currentAttendancePercentage) { this.currentAttendancePercentage = currentAttendancePercentage; }
    public Double getPredictedAttendancePercentage() { return predictedAttendancePercentage; }
    public void setPredictedAttendancePercentage(Double predictedAttendancePercentage) { this.predictedAttendancePercentage = predictedAttendancePercentage; }
    public String getRiskLevel() { return riskLevel; }
    public void setRiskLevel(String riskLevel) { this.riskLevel = riskLevel; }
    public String getRiskDrivers() { return riskDrivers; }
    public void setRiskDrivers(String riskDrivers) { this.riskDrivers = riskDrivers; }
    public Instant getGeneratedAt() { return generatedAt; }
    public void setGeneratedAt(Instant generatedAt) { this.generatedAt = generatedAt; }
}
