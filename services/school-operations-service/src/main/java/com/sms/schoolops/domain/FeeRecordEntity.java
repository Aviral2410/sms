package com.sms.schoolops.domain;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;

@Entity
@Table(name = "fee_record", schema = "schoolops")
public class FeeRecordEntity {
    @Id
    @Column(name = "fee_record_id", nullable = false, updatable = false)
    private UUID feeRecordId;
    @Column(name = "school_id", nullable = false)
    private UUID schoolId;
    @Column(name = "student_user_id", nullable = false)
    private UUID studentUserId;
    @Column(name = "fee_category", nullable = false)
    private String feeCategory;
    @Column(name = "amount_due", nullable = false)
    private BigDecimal amountDue;
    @Column(name = "amount_paid", nullable = false)
    private BigDecimal amountPaid;
    @Column(name = "due_date", nullable = false)
    private LocalDate dueDate;
    @Column(name = "payment_status", nullable = false)
    private String paymentStatus;
    @Column(name = "created_at", nullable = false)
    private Instant createdAt;
    public UUID getFeeRecordId() { return feeRecordId; }
    public void setFeeRecordId(UUID feeRecordId) { this.feeRecordId = feeRecordId; }
    public UUID getSchoolId() { return schoolId; }
    public void setSchoolId(UUID schoolId) { this.schoolId = schoolId; }
    public UUID getStudentUserId() { return studentUserId; }
    public void setStudentUserId(UUID studentUserId) { this.studentUserId = studentUserId; }
    public String getFeeCategory() { return feeCategory; }
    public void setFeeCategory(String feeCategory) { this.feeCategory = feeCategory; }
    public BigDecimal getAmountDue() { return amountDue; }
    public void setAmountDue(BigDecimal amountDue) { this.amountDue = amountDue; }
    public BigDecimal getAmountPaid() { return amountPaid; }
    public void setAmountPaid(BigDecimal amountPaid) { this.amountPaid = amountPaid; }
    public LocalDate getDueDate() { return dueDate; }
    public void setDueDate(LocalDate dueDate) { this.dueDate = dueDate; }
    public String getPaymentStatus() { return paymentStatus; }
    public void setPaymentStatus(String paymentStatus) { this.paymentStatus = paymentStatus; }
    public Instant getCreatedAt() { return createdAt; }
    public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }
}
