package com.sms.finance.service;

import org.springframework.stereotype.Service;
import java.math.BigDecimal;
import java.util.UUID;

/**
 * Primary payment gateway implementation using Razorpay.
 */
@Service
public class RazorpayProvider implements PaymentProvider {

    @Override
    public String processPayment(BigDecimal amount, UUID studentUserId) throws PaymentGatewayException {
        // Mocking Razorpay API call (e.g., razorpayClient.orders.create)
        System.out.println("[RAZORPAY] Processing payment of " + amount + " for student " + studentUserId);
        
        // Simulating a potential failure scenario for redundant testing
        if (amount.compareTo(new BigDecimal("100000")) > 0) {
            throw new PaymentGatewayException("Razorpay: Excessive amount limit exceeded for this account.");
        }
        
        return "rzp_test_" + UUID.randomUUID().toString().substring(0, 8);
    }

    @Override
    public String getProviderName() {
        return "RAZORPAY";
    }
}
