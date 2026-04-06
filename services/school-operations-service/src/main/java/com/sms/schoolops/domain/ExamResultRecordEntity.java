package com.sms.schoolops.domain;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "exam_result_record", schema = "schoolops")
public class ExamResultRecordEntity {
    @Id
    @Column(name = "result_id", nullable = false, updatable = false)
    private UUID resultId;
    @Column(name = "school_id", nullable = false)
    private UUID schoolId;
    @Column(name = "student_user_id", nullable = false)
    private UUID studentUserId;
    @Column(name = "subject_id", nullable = false)
    private UUID subjectId;
    @Column(name = "exam_name", nullable = false)
    private String examName;
    @Column(name = "academic_year", nullable = false)
    private String academicYear;
    @Column(name = "marks_obtained", nullable = false)
    private BigDecimal marksObtained;
    @Column(name = "max_marks", nullable = false)
    private BigDecimal maxMarks;
    @Column(name = "grade")
    private String grade;
    @Column(name = "created_at", nullable = false)
    private Instant createdAt;
    public UUID getResultId() { return resultId; }
    public void setResultId(UUID resultId) { this.resultId = resultId; }
    public UUID getSchoolId() { return schoolId; }
    public void setSchoolId(UUID schoolId) { this.schoolId = schoolId; }
    public UUID getStudentUserId() { return studentUserId; }
    public void setStudentUserId(UUID studentUserId) { this.studentUserId = studentUserId; }
    public UUID getSubjectId() { return subjectId; }
    public void setSubjectId(UUID subjectId) { this.subjectId = subjectId; }
    public String getExamName() { return examName; }
    public void setExamName(String examName) { this.examName = examName; }
    public String getAcademicYear() { return academicYear; }
    public void setAcademicYear(String academicYear) { this.academicYear = academicYear; }
    public BigDecimal getMarksObtained() { return marksObtained; }
    public void setMarksObtained(BigDecimal marksObtained) { this.marksObtained = marksObtained; }
    public BigDecimal getMaxMarks() { return maxMarks; }
    public void setMaxMarks(BigDecimal maxMarks) { this.maxMarks = maxMarks; }
    public String getGrade() { return grade; }
    public void setGrade(String grade) { this.grade = grade; }
    public Instant getCreatedAt() { return createdAt; }
    public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }
}
