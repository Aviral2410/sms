package com.sms.finance.domain;

import jakarta.persistence.*;
import org.hibernate.annotations.Filter;
import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;
import lombok.Data;

@Data
@Entity
@Table(name = "payment_record", schema = "finance")
@Filter(name = "schoolFilter", condition = "school_id = :schoolId")
public class PaymentRecordEntity {

    @Id
    @Column(name = "payment_id", nullable = false, updatable = false)
    private UUID paymentId;

    @Column(name = "school_id", nullable = false)
    private UUID schoolId;

    @Column(name = "student_user_id", nullable = false)
    private UUID studentUserId;

    @Column(name = "fee_id", nullable = false)
    private UUID feeId;

    @Column(name = "amount_paid", nullable = false)
    private BigDecimal amountPaid;

    @Column(name = "payment_date", nullable = false)
    private Instant paymentDate;

    @Column(name = "payment_method", nullable = false)
    private String paymentMethod; // e.g., "ONLINE", "CASH", "CHEQUE"

    @Column(name = "transaction_reference")
    private String transactionReference;

    @Column(name = "status", nullable = false)
    private String status; // e.g., "SUCCESS", "PENDING", "FAILED"

    @Column(name = "gateway_provider")
    private String gatewayProvider; // e.g., "RAZORPAY", "STRIPE"
}
