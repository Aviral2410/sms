package com.sms.subscription.controller;

import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.sms.subscription.api.SubscriptionDtos.PublicSubscriptionOverviewResponse;
import com.sms.subscription.api.SubscriptionDtos.SubscriptionPlanResponse;
import com.sms.subscription.service.SubscriptionService;
import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;
import java.util.UUID;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.test.web.servlet.MockMvc;

@WebMvcTest(PublicSubscriptionController.class)
class PublicSubscriptionControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private SubscriptionService subscriptionService;

    @Test
    void shouldReturnPublicPlans() throws Exception {
        when(subscriptionService.listPlans()).thenReturn(List.of(
                new SubscriptionPlanResponse(
                        UUID.randomUUID(),
                        "Basic",
                        "BASIC",
                        "Growing schools",
                        new BigDecimal("999.00"),
                        500,
                        2,
                        List.of("ATTENDANCE", "BILLING"),
                        "ATTENDANCE,BILLING",
                        Instant.parse("2026-04-09T10:00:00Z")
                )
        ));

        mockMvc.perform(get("/api/v1/subscriptions/public/plans"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].planCode").value("BASIC"));
    }

    @Test
    void shouldReturnPublicOverview() throws Exception {
        when(subscriptionService.getPublicOverview()).thenReturn(
                new PublicSubscriptionOverviewResponse(12, 7, 14200, 3, 14, 2180, List.of("North Ridge Academy", "Summit Public School"))
        );

        mockMvc.perform(get("/api/v1/subscriptions/public/overview"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.activeInstitutions").value(12))
                .andExpect(jsonPath("$.availablePlans").value(3))
                .andExpect(jsonPath("$.connectedSchools").value(14))
                .andExpect(jsonPath("$.totalUsers").value(2180))
                .andExpect(jsonPath("$.attachedSchoolNames[0]").value("North Ridge Academy"));
    }
}
