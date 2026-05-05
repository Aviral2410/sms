package com.sms.subscription.controller;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.sms.subscription.api.SubscriptionDtos.FeatureCheckResponse;
import com.sms.subscription.api.SubscriptionDtos.TenantSubscriptionResponse;
import com.sms.subscription.domain.SubscriptionStatus;
import com.sms.subscription.service.SubscriptionService;
import java.time.Instant;
import java.util.List;
import java.util.UUID;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

@WebMvcTest(SubscriptionController.class)
class SubscriptionControllerTest {

    private static final UUID TENANT_ID = UUID.fromString("10000000-0000-0000-0000-000000000001");
    private static final UUID PLAN_ID = UUID.fromString("20000000-0000-0000-0000-000000000001");
    private static final UUID SUBSCRIPTION_ID = UUID.fromString("30000000-0000-0000-0000-000000000001");

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private SubscriptionService subscriptionService;

    @Test
    void shouldReturnCurrentSubscriptionForTenant() throws Exception {
        when(subscriptionService.getTenantSubscription(TENANT_ID)).thenReturn(sampleSubscription());

        mockMvc.perform(get("/api/v1/subscriptions/current")
                        .header("X-Tenant-ID", TENANT_ID.toString()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.tenantId").value(TENANT_ID.toString()))
                .andExpect(jsonPath("$.planCode").value("PREMIUM"));
    }

    @Test
    void shouldCheckFeatureForTenant() throws Exception {
        when(subscriptionService.checkFeatureAccess(TENANT_ID, "ATTENDANCE"))
                .thenReturn(new FeatureCheckResponse(true, "Feature enabled."));

        mockMvc.perform(get("/api/v1/subscriptions/check-feature")
                        .header("X-Tenant-ID", TENANT_ID.toString())
                        .param("featureCode", "ATTENDANCE"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.accessible").value(true))
                .andExpect(jsonPath("$.message").value("Feature enabled."));
    }

    @Test
    void shouldRejectPlanUpdateWithoutPlatformRole() throws Exception {
        mockMvc.perform(patch("/api/v1/subscriptions/plans/{planId}", PLAN_ID)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "planName": "Premium Plus",
                                  "planCode": "PREMIUM_PLUS",
                                  "description": "Expanded plan",
                                  "monthlyPrice": 1499.00,
                                  "maxStudents": 2000,
                                  "maxParentsPerStudent": 2,
                                  "featureCodes": ["ATTENDANCE", "BILLING", "CMS"]
                                }
                                """))
                .andExpect(status().isForbidden());
    }

    @Test
    void shouldUpdateSubscriptionForPlatformAdmin() throws Exception {
        when(subscriptionService.updateSubscription(eq(TENANT_ID), any())).thenReturn(sampleSubscription());

        mockMvc.perform(post("/api/v1/subscriptions/update")
                        .header("X-User-Role", "PLATFORM_ADMIN")
                        .param("tenantId", TENANT_ID.toString())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "planId": "20000000-0000-0000-0000-000000000001",
                                  "planCode": "PREMIUM",
                                  "status": "ACTIVE"
                                }
                                """))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.subscriptionId").value(SUBSCRIPTION_ID.toString()))
                .andExpect(jsonPath("$.status").value("ACTIVE"));
    }

    @Test
    void shouldInitializeSubscriptionForPlatformAdmin() throws Exception {
        when(subscriptionService.initializeSubscription(eq(TENANT_ID), any())).thenReturn(sampleSubscription());

        mockMvc.perform(post("/api/v1/subscriptions/initialize")
                        .header("X-User-Role", "SUPER_ADMIN")
                        .param("tenantId", TENANT_ID.toString())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "planId": "20000000-0000-0000-0000-000000000001",
                                  "planCode": "PREMIUM"
                                }
                                """))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.planCode").value("PREMIUM"));
    }

    @Test
    void shouldListAllSubscriptionsForPlatformAdmin() throws Exception {
        when(subscriptionService.listAllSubscriptions()).thenReturn(List.of(sampleSubscription()));

        mockMvc.perform(get("/api/v1/subscriptions/all")
                        .header("X-User-Role", "PLATFORM_ADMIN"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].tenantId").value(TENANT_ID.toString()));
    }

    private TenantSubscriptionResponse sampleSubscription() {
        return new TenantSubscriptionResponse(
                SUBSCRIPTION_ID,
                TENANT_ID,
                PLAN_ID,
                "Premium",
                "PREMIUM",
                List.of("ATTENDANCE", "BILLING", "CMS"),
                SubscriptionStatus.ACTIVE,
                Instant.parse("2026-04-01T00:00:00Z"),
                Instant.parse("2027-03-31T23:59:59Z"),
                Instant.parse("2026-04-14T23:59:59Z")
        );
    }
}
