package com.sms.finance.service;

import com.sms.finance.domain.FeeStructureEntity;
import com.sms.finance.domain.PaymentRecordEntity;
import com.sms.finance.repository.FeeStructureRepository;
import com.sms.finance.repository.PaymentRecordRepository;
import com.sms.finance.security.TenantContext;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;
import java.util.UUID;

@Service
public class FinanceService {

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
        return feeStructureRepository.findAll();
    }

    public FeeStructureEntity createFeeStructure(FeeStructureEntity feeStructure) {
        if (feeStructure.getFeeId() == null) {
            feeStructure.setFeeId(UUID.randomUUID());
        }
        feeStructure.setSchoolId(UUID.fromString(TenantContext.getCurrentTenant()));
        feeStructure.setCreatedAt(Instant.now());
        return feeStructureRepository.save(feeStructure);
    }

    public PaymentRecordEntity recordPayment(PaymentRecordEntity payment) {
        if (payment.getPaymentId() == null) {
            payment.setPaymentId(UUID.randomUUID());
        }
        payment.setSchoolId(UUID.fromString(TenantContext.getCurrentTenant()));
        payment.setPaymentDate(Instant.now());

        // Strategy: Try Razorpay first, then fallback to Stripe
        try {
            String ref = razorpayProvider.processPayment(payment.getAmountPaid(), payment.getStudentUserId());
            payment.setTransactionReference(ref);
            payment.setGatewayProvider(razorpayProvider.getProviderName());
            payment.setStatus("SUCCESS");
        } catch (PaymentGatewayException e) {
            System.err.println("Primary Gateway Failed: " + e.getMessage() + ". Attempting fallback...");
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
        return paymentRecordRepository.findByStudentUserId(studentUserId);
    }

    public BigDecimal calculatePendingDues(UUID studentUserId) {
        // Simple logic: total fees - total paid
        BigDecimal totalFees = feeStructureRepository.findAll().stream()
                .map(FeeStructureEntity::getAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        BigDecimal totalPaid = paymentRecordRepository.findByStudentUserId(studentUserId).stream()
                .map(PaymentRecordEntity::getAmountPaid)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        return totalFees.subtract(totalPaid);
    }
}
