package com.sms.finance.service;

import org.springframework.stereotype.Service;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import java.math.BigDecimal;
import java.util.UUID;

/**
 * Primary payment gateway implementation using Razorpay.
 */
@Service
public class RazorpayProvider implements PaymentProvider {

    private static final Logger logger = LoggerFactory.getLogger(RazorpayProvider.class);
    private static final String SERVICE_NAME = "RAZORPAY";

    private final PlatformConfigRuntimeClient platformConfigRuntimeClient;

    public RazorpayProvider(PlatformConfigRuntimeClient platformConfigRuntimeClient) {
        this.platformConfigRuntimeClient = platformConfigRuntimeClient;
    }

    @Override
    public String processPayment(BigDecimal amount, UUID studentUserId) throws PaymentGatewayException {
        PlatformConfigRuntimeClient.RuntimePlatformConfig config = this.platformConfigRuntimeClient.getRuntimeConfig(SERVICE_NAME);
        if (!config.enabled()) {
            throw new PaymentGatewayException("Razorpay integration is disabled by platform administration.");
        }
        if (!config.hasSecret()) {
            throw new PaymentGatewayException("Razorpay credentials are not configured.");
        }

        logger.info("[RAZORPAY] Processing payment. amount={} studentUserId={} baseUrl={}",
                amount,
                studentUserId,
                config.apiBaseUrl());
        
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
