package com.sms.finance.controller;

import com.sms.finance.domain.FeeStructureEntity;
import com.sms.finance.domain.PaymentRecordEntity;
import com.sms.finance.service.FinanceService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/finance")
public class FinanceController {

    private final FinanceService financeService;

    public FinanceController(FinanceService financeService) {
        this.financeService = financeService;
    }

    @GetMapping("/fees")
    public List<FeeStructureEntity> getAllFees() {
        return financeService.getAllFeeStructures();
    }

    @PostMapping("/fees")
    public ResponseEntity<FeeStructureEntity> createFee(@RequestBody FeeStructureEntity fee) {
        return ResponseEntity.ok(financeService.createFeeStructure(fee));
    }

    @PostMapping("/payments")
    public ResponseEntity<PaymentRecordEntity> recordPayment(@RequestBody PaymentRecordEntity payment) {
        return ResponseEntity.ok(financeService.recordPayment(payment));
    }

    @GetMapping("/payments/student/{studentUserId}")
    public List<PaymentRecordEntity> getStudentPayments(@PathVariable UUID studentUserId) {
        return financeService.getStudentPaymentHistory(studentUserId);
    }

    @GetMapping("/dues/student/{studentUserId}")
    public ResponseEntity<BigDecimal> getPendingDues(@PathVariable UUID studentUserId) {
        return ResponseEntity.ok(financeService.calculatePendingDues(studentUserId));
    }
}
