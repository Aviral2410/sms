package com.sms.finance.service;

import org.springframework.stereotype.Service;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import java.math.BigDecimal;
import java.util.UUID;

/**
 * Fallback payment gateway implementation using Stripe.
 */
@Service
public class StripeProvider implements PaymentProvider {

    private static final Logger logger = LoggerFactory.getLogger(StripeProvider.class);
    private static final String SERVICE_NAME = "STRIPE";

    private final PlatformConfigRuntimeClient platformConfigRuntimeClient;

    public StripeProvider(PlatformConfigRuntimeClient platformConfigRuntimeClient) {
        this.platformConfigRuntimeClient = platformConfigRuntimeClient;
    }

    @Override
    public String processPayment(BigDecimal amount, UUID studentUserId) throws PaymentGatewayException {
        PlatformConfigRuntimeClient.RuntimePlatformConfig config = this.platformConfigRuntimeClient.getRuntimeConfig(SERVICE_NAME);
        if (!config.enabled()) {
            throw new PaymentGatewayException("Stripe integration is disabled by platform administration.");
        }
        if (!config.hasSecret()) {
            throw new PaymentGatewayException("Stripe credentials are not configured.");
        }

        logger.info("[STRIPE] Processing payment. amount={} studentUserId={} baseUrl={} mode=FALLBACK",
                amount,
                studentUserId,
                config.apiBaseUrl());
        
        return "ch_test_" + UUID.randomUUID().toString().substring(0, 10);
    }

    @Override
    public String getProviderName() {
        return "STRIPE";
    }
}
