package com.sms.finance.service;

import com.sms.finance.domain.FeeStructureEntity;
import com.sms.finance.domain.PaymentRecordEntity;
import com.sms.finance.repository.FeeStructureRepository;
import com.sms.finance.repository.PaymentRecordRepository;
import com.sms.finance.security.SchoolContext;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;
import java.util.UUID;

@Service
public class FinanceService {

    private static final Logger logger = LoggerFactory.getLogger(FinanceService.class);

    private final FeeStructureRepository feeStructureRepository;
    private final PaymentRecordRepository paymentRecordRepository;
    private final RazorpayProvider razorpayProvider;
    private final StripeProvider stripeProvider;

    public FinanceService(FeeStructureRepository feeStructureRepository,
            PaymentRecordRepository paymentRecordRepository,
            RazorpayProvider razorpayProvider,
            StripeProvider stripeProvider) {
        this.feeStructureRepository = feeStructureRepository;
        this.paymentRecordRepository = paymentRecordRepository;
        this.razorpayProvider = razorpayProvider;
        this.stripeProvider = stripeProvider;
    }

    public List<FeeStructureEntity> getAllFeeStructures() {
        UUID schoolId = requireCurrentSchoolId();
        return feeStructureRepository.findBySchoolId(schoolId);
    }

    public FeeStructureEntity createFeeStructure(FeeStructureEntity feeStructure) {
        if (feeStructure.getFeeId() == null) {
            feeStructure.setFeeId(UUID.randomUUID());
        }
        feeStructure.setSchoolId(UUID.fromString(SchoolContext.getCurrentSchoolId()));
        feeStructure.setCreatedAt(Instant.now());
        return feeStructureRepository.save(feeStructure);
    }

    public PaymentRecordEntity recordPayment(PaymentRecordEntity payment) {
        if (payment.getPaymentId() == null) {
            payment.setPaymentId(UUID.randomUUID());
        }
        payment.setSchoolId(UUID.fromString(SchoolContext.getCurrentSchoolId()));
        payment.setPaymentDate(Instant.now());

        // Strategy: Try Razorpay first, then fallback to Stripe
        try {
            String ref = razorpayProvider.processPayment(payment.getAmountPaid(), payment.getStudentUserId());
            payment.setTransactionReference(ref);
            payment.setGatewayProvider(razorpayProvider.getProviderName());
            payment.setStatus("SUCCESS");
        } catch (PaymentGatewayException e) {
            logger.warn("Primary payment gateway failed, attempting fallback. schoolId={} studentUserId={} error={}",
                    payment.getSchoolId(), payment.getStudentUserId(), e.getMessage());
            try {
                String ref = stripeProvider.processPayment(payment.getAmountPaid(), payment.getStudentUserId());
                payment.setTransactionReference(ref);
                payment.setGatewayProvider(stripeProvider.getProviderName());
                payment.setStatus("SUCCESS");
            } catch (PaymentGatewayException ex) {
                payment.setStatus("FAILED");
                payment.setTransactionReference("FAIL_" + UUID.randomUUID());
            }
        }

        return paymentRecordRepository.save(payment);
    }

    public List<PaymentRecordEntity> getStudentPaymentHistory(UUID studentUserId) {
        UUID schoolId = requireCurrentSchoolId();
        return paymentRecordRepository.findBySchoolIdAndStudentUserId(schoolId, studentUserId);
    }

    public BigDecimal calculatePendingDues(UUID studentUserId) {
        UUID schoolId = requireCurrentSchoolId();
        // Simple logic: total fees - total paid
        BigDecimal totalFees = feeStructureRepository.findBySchoolId(schoolId).stream()
                .map(FeeStructureEntity::getAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        BigDecimal totalPaid = paymentRecordRepository.findBySchoolIdAndStudentUserId(schoolId, studentUserId).stream()
                .map(PaymentRecordEntity::getAmountPaid)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        return totalFees.subtract(totalPaid);
    }

    private UUID requireCurrentSchoolId() {
        String raw = SchoolContext.getCurrentSchoolId();
        if (raw == null || raw.isBlank()) {
            throw new IllegalArgumentException("Missing X-School-ID.");
        }
        try {
            return UUID.fromString(raw);
        } catch (IllegalArgumentException ex) {
            throw new IllegalArgumentException("Invalid X-School-ID.");
        }
    }
}
