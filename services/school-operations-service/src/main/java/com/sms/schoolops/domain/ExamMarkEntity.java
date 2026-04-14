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
@Table(name = "exam_mark", schema = "schoolops")
@Filter(name = "schoolFilter", condition = "school_id = :schoolId")
public class ExamMarkEntity {

    @Id
    @Column(name = "mark_id", nullable = false, updatable = false)
    private UUID markId;

    @Column(name = "school_id", nullable = false)
    private UUID schoolId;

    @Column(name = "exam_id", nullable = false)
    private UUID examId;

    @Column(name = "schedule_item_id")
    private UUID scheduleItemId;

    @Column(name = "student_user_id", nullable = false)
    private UUID studentUserId;

    @Column(name = "subject_id", nullable = false)
    private UUID subjectId;

    @Column(name = "marks_obtained", nullable = false)
    private BigDecimal marksObtained;

    @Column(name = "max_marks", nullable = false)
    private BigDecimal maxMarks;

    @Column(name = "grade")
    private String grade;

    @Column(name = "entered_by_user_id")
    private UUID enteredByUserId;

    @Column(name = "created_at", nullable = false)
    private Instant createdAt;

    @Column(name = "updated_at")
    private Instant updatedAt;

    public UUID getMarkId() {
        return markId;
    }

    public void setMarkId(UUID markId) {
        this.markId = markId;
    }

    public UUID getSchoolId() {
        return schoolId;
    }

    public void setSchoolId(UUID schoolId) {
        this.schoolId = schoolId;
    }

    public UUID getExamId() {
        return examId;
    }

    public void setExamId(UUID examId) {
        this.examId = examId;
    }

    public UUID getScheduleItemId() {
        return scheduleItemId;
    }

    public void setScheduleItemId(UUID scheduleItemId) {
        this.scheduleItemId = scheduleItemId;
    }

    public UUID getStudentUserId() {
        return studentUserId;
    }

    public void setStudentUserId(UUID studentUserId) {
        this.studentUserId = studentUserId;
    }

    public UUID getSubjectId() {
        return subjectId;
    }

    public void setSubjectId(UUID subjectId) {
        this.subjectId = subjectId;
    }

    public BigDecimal getMarksObtained() {
        return marksObtained;
    }

    public void setMarksObtained(BigDecimal marksObtained) {
        this.marksObtained = marksObtained;
    }

    public BigDecimal getMaxMarks() {
        return maxMarks;
    }

    public void setMaxMarks(BigDecimal maxMarks) {
        this.maxMarks = maxMarks;
    }

    public String getGrade() {
        return grade;
    }

    public void setGrade(String grade) {
        this.grade = grade;
    }

    public UUID getEnteredByUserId() {
        return enteredByUserId;
    }

    public void setEnteredByUserId(UUID enteredByUserId) {
        this.enteredByUserId = enteredByUserId;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(Instant createdAt) {
        this.createdAt = createdAt;
    }

    public Instant getUpdatedAt() {
        return updatedAt;
    }

    public void setUpdatedAt(Instant updatedAt) {
        this.updatedAt = updatedAt;
    }
}

