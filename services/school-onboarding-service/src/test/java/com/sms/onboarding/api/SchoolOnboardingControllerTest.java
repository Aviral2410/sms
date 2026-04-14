package com.sms.onboarding.api;

import com.sms.onboarding.domain.OnboardingStatus;
import com.sms.onboarding.service.SchoolOnboardingService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(SchoolOnboardingController.class)
class SchoolOnboardingControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private SchoolOnboardingService schoolOnboardingService;

    @Test
    void shouldCreateSchoolOnboardingRecord() throws Exception {
        when(schoolOnboardingService.createOnboarding(any())).thenReturn(new SchoolOnboardingResponse(
                UUID.randomUUID(),
                "Sunrise Public School",
                "SPS-001",
                OnboardingStatus.SUBMITTED,
                "CBSE",
                "Bengaluru",
                "Karnataka",
                "admin@sunrise.edu",
                null,
                null,
                null,
                null,
                null,
                null,
                null, // Added activationSentAt
                List.of("School registration certificate"),
                null, // activationCode
                "PREMIUM",
                Instant.parse("2026-03-30T10:15:30Z")
        ));

        mockMvc.perform(post("/api/v1/onboarding/schools")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "schoolName": "Sunrise Public School",
                                  "schoolCode": "SPS-001",
                                  "boardAffiliation": "CBSE",
                                  "contactPhone": "+91-9999999999",
                                  "contactEmail": "contact@sunrise.edu",
                                  "addressLine": "MG Road",
                                  "city": "Bengaluru",
                                  "state": "Karnataka",
                                  "country": "India",
                                  "postalCode": "560001",
                                  "selectedPlanCode": "PREMIUM"
                                }
                                """))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.schoolName").value("Sunrise Public School"))
                .andExpect(jsonPath("$.status").value("SUBMITTED"))
                .andExpect(jsonPath("$.boardAffiliation").value("CBSE"))
                .andExpect(jsonPath("$.selectedPlanCode").value("PREMIUM"));
    }

    @Test
    void shouldApproveSchoolOnboardingRecord() throws Exception {
        UUID onboardingId = UUID.randomUUID();

        when(schoolOnboardingService.reviewOnboarding(any(), any())).thenReturn(new SchoolOnboardingResponse(
                onboardingId,
                "Sunrise Public School",
                "SPS-001",
                OnboardingStatus.APPROVED,
                "CBSE",
                "Bengaluru",
                "Karnataka",
                "admin@sunrise.edu",
                "Platform Admin",
                "All documents matched.",
                Instant.parse("2026-03-31T08:00:00Z"),
                UUID.randomUUID(),
                UUID.randomUUID(),
                Instant.now(),
                null, // Added activationSentAt
                List.of("School registration certificate"),
                "ACT-12345", // activationCode
                "BASIC",
                Instant.parse("2026-03-30T10:15:30Z")
        ));

        mockMvc.perform(patch("/api/v1/onboarding/schools/{onboardingId}/review", onboardingId)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "action": "APPROVE",
                                  "reviewerName": "Platform Admin",
                                  "comment": "All documents matched."
                                }
                                """))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("APPROVED"))
                .andExpect(jsonPath("$.reviewedBy").value("Platform Admin"))
                .andExpect(jsonPath("$.selectedPlanCode").value("BASIC"));
    }
}
