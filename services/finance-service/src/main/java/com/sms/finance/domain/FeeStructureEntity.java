package com.sms.finance.domain;

import jakarta.persistence.*;
import org.hibernate.annotations.Filter;
import org.hibernate.annotations.FilterDef;
import org.hibernate.annotations.ParamDef;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "fee_structure", schema = "finance")
@Filter(name = "tenantFilter", condition = "school_id = :tenantId")
public class FeeStructureEntity {

    @Id
    @Column(name = "fee_id", nullable = false, updatable = false)
    private UUID feeId;

    @Column(name = "school_id", nullable = false)
    private UUID schoolId;

    @Column(name = "fee_name", nullable = false)
    private String feeName;

    @Column(name = "amount", nullable = false)
    private BigDecimal amount;

    @Column(name = "academic_year", nullable = false)
    private String academicYear;

    @Column(name = "due_date")
    private Instant dueDate;

    @Column(name = "created_at", nullable = false)
    private Instant createdAt;

    // Getters and Setters
    public UUID getFeeId() { return feeId; }
    public void setFeeId(UUID feeId) { this.feeId = feeId; }
    public UUID getSchoolId() { return schoolId; }
    public void setSchoolId(UUID schoolId) { this.schoolId = schoolId; }
    public String getFeeName() { return feeName; }
    public void setFeeName(String feeName) { this.feeName = feeName; }
    public BigDecimal getAmount() { return amount; }
    public void setAmount(BigDecimal amount) { this.amount = amount; }
    public String getAcademicYear() { return academicYear; }
    public void setAcademicYear(String academicYear) { this.academicYear = academicYear; }
    public Instant getDueDate() { return dueDate; }
    public void setDueDate(Instant dueDate) { this.dueDate = dueDate; }
    public Instant getCreatedAt() { return createdAt; }
    public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }
}
