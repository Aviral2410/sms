package com.sms.finance.service;

import java.math.BigDecimal;
import java.util.UUID;

/**
 * Strategy interface for multi-gateway payment processing.
 */
public interface PaymentProvider {
    /**
     * Process a payment through the specific gateway.
     * @param amount The amount to process.
     * @param studentUserId The student ID for internal tracking.
     * @return The transaction ID returned by the gateway.
     * @throws PaymentGatewayException If the payment fails.
     */
    String processPayment(BigDecimal amount, UUID studentUserId) throws PaymentGatewayException;
    
    /**
     * Get the name of the provider.
     */
    String getProviderName();
}

/**
 * Custom exception for payment failures to trigger fallback logic.
 */
class PaymentGatewayException extends Exception {
    public PaymentGatewayException(String message) {
        super(message);
    }
}
