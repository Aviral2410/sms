package com.sms.schoolops.domain;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;

import org.hibernate.annotations.Filter;
import org.hibernate.annotations.FilterDef;
import org.hibernate.annotations.ParamDef;

@Entity
@Table(name = "attendance_record", schema = "schoolops")
@Filter(name = "schoolFilter", condition = "school_id = :schoolId")
public class AttendanceRecordEntity {
    @Id
    @Column(name = "attendance_id", nullable = false, updatable = false)
    private UUID attendanceId;
    @Column(name = "school_id", nullable = false)
    private UUID schoolId;
    @Column(name = "user_id", nullable = false)
    private UUID userId;
    @Column(name = "role_name", nullable = false)
    private String roleName;
    @Column(name = "class_id")
    private UUID classId;
    @Column(name = "teacher_user_id")
    private UUID teacherUserId;
    @Column(name = "session_id")
    private UUID sessionId;
    @Column(name = "subject_id")
    private UUID subjectId;
    @Column(name = "attendance_mode", nullable = false)
    private String attendanceMode;
    @Column(name = "timetable_slot_id")
    private UUID timetableSlotId;
    @Column(name = "period_number")
    private Integer periodNumber;
    @Column(name = "attendance_date", nullable = false)
    private LocalDate attendanceDate;
    @Column(name = "attendance_status", nullable = false)
    private String attendanceStatus;
    @Column(name = "marked_by", nullable = false)
    private String markedBy;
    @Column(name = "capture_source")
    private String captureSource;
    @Column(name = "recorded_at")
    private Instant recordedAt;
    @Column(name = "last_modified_by")
    private String lastModifiedBy;
    @Column(name = "last_modified_at")
    private Instant lastModifiedAt;
    @Column(name = "created_at", nullable = false)
    private Instant createdAt;
    public UUID getAttendanceId() { return attendanceId; }
    public void setAttendanceId(UUID attendanceId) { this.attendanceId = attendanceId; }
    public UUID getSchoolId() { return schoolId; }
    public void setSchoolId(UUID schoolId) { this.schoolId = schoolId; }
    public UUID getUserId() { return userId; }
    public void setUserId(UUID userId) { this.userId = userId; }
    public String getRoleName() { return roleName; }
    public void setRoleName(String roleName) { this.roleName = roleName; }
    public UUID getClassId() { return classId; }
    public void setClassId(UUID classId) { this.classId = classId; }
    public UUID getTeacherUserId() { return teacherUserId; }
    public void setTeacherUserId(UUID teacherUserId) { this.teacherUserId = teacherUserId; }
    public UUID getSessionId() { return sessionId; }
    public void setSessionId(UUID sessionId) { this.sessionId = sessionId; }
    public UUID getSubjectId() { return subjectId; }
    public void setSubjectId(UUID subjectId) { this.subjectId = subjectId; }
    public String getAttendanceMode() { return attendanceMode; }
    public void setAttendanceMode(String attendanceMode) { this.attendanceMode = attendanceMode; }
    public UUID getTimetableSlotId() { return timetableSlotId; }
    public void setTimetableSlotId(UUID timetableSlotId) { this.timetableSlotId = timetableSlotId; }
    public Integer getPeriodNumber() { return periodNumber; }
    public void setPeriodNumber(Integer periodNumber) { this.periodNumber = periodNumber; }
    public LocalDate getAttendanceDate() { return attendanceDate; }
    public void setAttendanceDate(LocalDate attendanceDate) { this.attendanceDate = attendanceDate; }
    public String getAttendanceStatus() { return attendanceStatus; }
    public void setAttendanceStatus(String attendanceStatus) { this.attendanceStatus = attendanceStatus; }
    public String getMarkedBy() { return markedBy; }
    public void setMarkedBy(String markedBy) { this.markedBy = markedBy; }
    public String getCaptureSource() { return captureSource; }
    public void setCaptureSource(String captureSource) { this.captureSource = captureSource; }
    public Instant getRecordedAt() { return recordedAt; }
    public void setRecordedAt(Instant recordedAt) { this.recordedAt = recordedAt; }
    public String getLastModifiedBy() { return lastModifiedBy; }
    public void setLastModifiedBy(String lastModifiedBy) { this.lastModifiedBy = lastModifiedBy; }
    public Instant getLastModifiedAt() { return lastModifiedAt; }
    public void setLastModifiedAt(Instant lastModifiedAt) { this.lastModifiedAt = lastModifiedAt; }
    public Instant getCreatedAt() { return createdAt; }
    public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }
}
