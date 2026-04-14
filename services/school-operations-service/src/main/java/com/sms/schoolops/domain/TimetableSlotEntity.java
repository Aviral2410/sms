package com.sms.schoolops.domain;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

import java.time.Instant;
import java.util.UUID;

import org.hibernate.annotations.Filter;

@Entity
@Table(name = "timetable_slot", schema = "schoolops")
@Filter(name = "schoolFilter", condition = "school_id = :schoolId")
public class TimetableSlotEntity {
    @Id
    @Column(name = "slot_id", nullable = false, updatable = false)
    private UUID slotId;
    @Column(name = "school_id", nullable = false)
    private UUID schoolId;
    @Column(name = "class_id", nullable = false)
    private UUID classId;
    @Column(name = "subject_id", nullable = false)
    private UUID subjectId;
    @Column(name = "teacher_user_id", nullable = false)
    private UUID teacherUserId;
    @Column(name = "day_of_week", nullable = false)
    private String dayOfWeek;
    @Column(name = "start_time", nullable = false)
    private String startTime;
    @Column(name = "end_time", nullable = false)
    private String endTime;
    @Column(name = "room_name")
    private String roomName;
    @Column(name = "created_at", nullable = false)
    private Instant createdAt;
    public UUID getSlotId() { return slotId; }
    public void setSlotId(UUID slotId) { this.slotId = slotId; }
    public UUID getSchoolId() { return schoolId; }
    public void setSchoolId(UUID schoolId) { this.schoolId = schoolId; }
    public UUID getClassId() { return classId; }
    public void setClassId(UUID classId) { this.classId = classId; }
    public UUID getSubjectId() { return subjectId; }
    public void setSubjectId(UUID subjectId) { this.subjectId = subjectId; }
    public UUID getTeacherUserId() { return teacherUserId; }
    public void setTeacherUserId(UUID teacherUserId) { this.teacherUserId = teacherUserId; }
    public String getDayOfWeek() { return dayOfWeek; }
    public void setDayOfWeek(String dayOfWeek) { this.dayOfWeek = dayOfWeek; }
    public String getStartTime() { return startTime; }
    public void setStartTime(String startTime) { this.startTime = startTime; }
    public String getEndTime() { return endTime; }
    public void setEndTime(String endTime) { this.endTime = endTime; }
    public String getRoomName() { return roomName; }
    public void setRoomName(String roomName) { this.roomName = roomName; }
    public Instant getCreatedAt() { return createdAt; }
    public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }
}
