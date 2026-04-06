package com.sms.finance.service;

import org.springframework.stereotype.Service;
import java.math.BigDecimal;
import java.util.UUID;

/**
 * Fallback payment gateway implementation using Stripe.
 */
@Service
public class StripeProvider implements PaymentProvider {

    @Override
    public String processPayment(BigDecimal amount, UUID studentUserId) throws PaymentGatewayException {
        // Mocking Stripe API call (e.g., stripeClient.charges.create)
        System.out.println("[STRIPE] Processing payment of " + amount + " for student " + studentUserId + " (FALLBACK)");
        
        return "ch_test_" + UUID.randomUUID().toString().substring(0, 10);
    }

    @Override
    public String getProviderName() {
        return "STRIPE";
    }
}
