package com.sms.finance.domain;

import jakarta.persistence.*;
import org.hibernate.annotations.Filter;
import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;
import lombok.Data;

@Data
@Entity
@Table(name = "fee_structure", schema = "finance")
@Filter(name = "schoolFilter", condition = "school_id = :schoolId")
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
}
