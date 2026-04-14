package com.sms.finance.controller;

import com.sms.finance.domain.FeeStructureEntity;
import com.sms.finance.domain.PaymentRecordEntity;
import com.sms.finance.service.FinanceService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/finance")
@Tag(name = "Finance", description = "Finance management, fee structures, and payment processing APIs.")
public class FinanceController {

    private final FinanceService financeService;

    public FinanceController(FinanceService financeService) {
        this.financeService = financeService;
    }

    @GetMapping("/fees")
    @Operation(summary = "List fee structures for the current school")
    public List<FeeStructureEntity> getAllFees() {
        return financeService.getAllFeeStructures();
    }

    @PostMapping("/fees")
    @Operation(summary = "Create a fee structure")
    public ResponseEntity<FeeStructureEntity> createFee(@RequestBody FeeStructureEntity fee) {
        return ResponseEntity.ok(financeService.createFeeStructure(fee));
    }

    @PostMapping("/payments")
    @Operation(summary = "Record a payment and process it through configured providers")
    public ResponseEntity<PaymentRecordEntity> recordPayment(@RequestBody PaymentRecordEntity payment) {
        return ResponseEntity.ok(financeService.recordPayment(payment));
    }

    @GetMapping("/payments/student/{studentUserId}")
    @Operation(summary = "Get payment history for a student")
    public List<PaymentRecordEntity> getStudentPayments(@PathVariable UUID studentUserId) {
        return financeService.getStudentPaymentHistory(studentUserId);
    }

    @GetMapping("/dues/student/{studentUserId}")
    @Operation(summary = "Calculate pending dues for a student")
    public ResponseEntity<BigDecimal> getPendingDues(@PathVariable UUID studentUserId) {
        return ResponseEntity.ok(financeService.calculatePendingDues(studentUserId));
    }
}
