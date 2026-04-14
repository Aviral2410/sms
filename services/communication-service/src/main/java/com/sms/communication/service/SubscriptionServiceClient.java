package com.sms.communication.service;

import com.sms.common.exception.ServiceUnavailableException;
import java.net.URI;
import java.util.UUID;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClientException;
import org.springframework.web.client.RestTemplate;

@Service
public class SubscriptionServiceClient {
    private static final Logger logger = LoggerFactory.getLogger(SubscriptionServiceClient.class);
    private static final String TENANT_HEADER = "X-Tenant-ID";

    private final RestTemplate restTemplate;
    private final String subscriptionServiceUrl;

    public SubscriptionServiceClient(RestTemplate restTemplate,
                                     @Value("${app.subscription-service-url}") String subscriptionServiceUrl) {
        this.restTemplate = restTemplate;
        this.subscriptionServiceUrl = subscriptionServiceUrl;
    }

    public boolean isFeatureAccessibleStrict(UUID tenantId, String featureCode) {
        try {
            FeatureCheckResponse response = checkFeature(tenantId, featureCode);
            return response != null && response.accessible();
        } catch (RestClientException ex) {
            logger.error("Subscription entitlement check failed. tenantId={} featureCode={}", tenantId, featureCode, ex);
            throw new ServiceUnavailableException("Unable to verify subscription entitlements. Please try again later.", ex);
        }
    }

    private FeatureCheckResponse checkFeature(UUID tenantId, String featureCode) {
        String url = subscriptionServiceUrl + "/api/v1/subscriptions/check-feature?featureCode=" + featureCode;
        HttpHeaders headers = new HttpHeaders();
        headers.set(TENANT_HEADER, tenantId.toString());
        HttpEntity<Void> entity = new HttpEntity<>(headers);

        ResponseEntity<FeatureCheckResponse> response = restTemplate.exchange(URI.create(url), HttpMethod.GET, entity, FeatureCheckResponse.class);
        return response.getBody();
    }

    public record FeatureCheckResponse(boolean accessible, String message) {}
}

