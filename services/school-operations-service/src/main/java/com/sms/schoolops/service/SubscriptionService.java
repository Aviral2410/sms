package com.sms.schoolops.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.UUID;

@Service
public class SubscriptionService {

    private final RestTemplate restTemplate;
    private final String subscriptionServiceUrl;

    public SubscriptionService(RestTemplate restTemplate, 
                               @Value("${app.subscription-service-url}") String subscriptionServiceUrl) {
        this.restTemplate = restTemplate;
        this.subscriptionServiceUrl = subscriptionServiceUrl;
    }

    public boolean isFeatureAccessible(UUID tenantId, String featureCode) {
        try {
            String url = subscriptionServiceUrl + "/api/v1/subscriptions/check-feature?tenantId=" + tenantId + "&featureCode=" + featureCode;
            FeatureCheckResponse response = restTemplate.getForObject(url, FeatureCheckResponse.class);
            return response != null && response.accessible();
        } catch (Exception e) {
            return false;
        }
    }

    public record FeatureCheckResponse(boolean accessible, String message) {}
}
