package com.sms.onboarding.api;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.doNothing;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.multipart;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.sms.onboarding.domain.OnboardingStatus;
import com.sms.onboarding.service.SchoolOnboardingService;
import java.time.Instant;
import java.util.List;
import java.util.UUID;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.test.web.servlet.MockMvc;

@WebMvcTest(SchoolOnboardingController.class)
class SchoolOnboardingControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private SchoolOnboardingService schoolOnboardingService;

    @Test
    void shouldCreateSchoolOnboardingRecord() throws Exception {
        when(schoolOnboardingService.createOnboarding(any())).thenReturn(sampleResponse(OnboardingStatus.SUBMITTED));

        mockMvc.perform(post("/api/v1/onboarding/schools")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "schoolName": "Sunrise Public School",
                                  "schoolCode": "SPS-001",
                                  "realmName": "sunrise-public-school",
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
                .andExpect(jsonPath("$.selectedPlanCode").value("PREMIUM"))
                .andExpect(jsonPath("$.realmName").value("sunrise-public-school"));
    }

    @Test
    void shouldRejectInvalidOnboardingPayload() throws Exception {
        mockMvc.perform(post("/api/v1/onboarding/schools")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "schoolCode": "SPS-001"
                                }
                                """))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.title").value("Invalid onboarding payload"))
                .andExpect(jsonPath("$.errors").isArray());
    }

    @Test
    void shouldRequireAdminRoleForListing() throws Exception {
        mockMvc.perform(get("/api/v1/onboarding/schools"))
                .andExpect(status().isForbidden());
    }

    @Test
    void shouldListOnboardingsForPlatformAdmin() throws Exception {
        when(schoolOnboardingService.listOnboardings(any())).thenReturn(List.of(sampleResponse(OnboardingStatus.SUBMITTED)));

        mockMvc.perform(get("/api/v1/onboarding/schools")
                        .header("X-User-Role", "PLATFORM_ADMIN"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].schoolCode").value("SPS-001"))
                .andExpect(jsonPath("$[0].status").value("SUBMITTED"));
    }

    @Test
    void shouldReturnSingleOnboardingForAdmin() throws Exception {
        UUID onboardingId = UUID.fromString("10000000-0000-0000-0000-000000000001");
        when(schoolOnboardingService.getOnboarding(onboardingId)).thenReturn(sampleResponse(OnboardingStatus.UNDER_REVIEW));

        mockMvc.perform(get("/api/v1/onboarding/schools/{onboardingId}", onboardingId)
                        .header("X-User-Role", "SUPER_ADMIN"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.onboardingId").value(onboardingId.toString()))
                .andExpect(jsonPath("$.status").value("UNDER_REVIEW"));
    }

    @Test
    void shouldLookupPublicSchoolStatus() throws Exception {
        when(schoolOnboardingService.lookupStatus("SPS-001", "admin@sunrise.edu"))
                .thenReturn(new SchoolStatusLookupResponse(
                        "Sunrise Public School",
                        "SPS-001",
                        OnboardingStatus.APPROVED,
                        "Approved and ready for activation.",
                        Instant.parse("2026-03-31T08:00:00Z"),
                        Instant.parse("2026-03-30T10:15:30Z"),
                        true,
                        "admin@sunrise.edu",
                        "/school",
                        UUID.randomUUID(),
                        UUID.randomUUID()
                ));

        mockMvc.perform(get("/api/v1/onboarding/schools/status")
                        .param("schoolCode", "SPS-001")
                        .param("adminEmail", "admin@sunrise.edu"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.schoolCode").value("SPS-001"))
                .andExpect(jsonPath("$.status").value("APPROVED"))
                .andExpect(jsonPath("$.activated").value(true))
                .andExpect(jsonPath("$.loginEmail").value("admin@sunrise.edu"));
    }

    @Test
    void shouldReturnPublicSchoolProfile() throws Exception {
        when(schoolOnboardingService.getPublicProfile("SPS-001"))
                .thenReturn(new PublicSchoolProfileResponse(
                        UUID.fromString("10000000-0000-0000-0000-000000000001"),
                        UUID.fromString("20000000-0000-0000-0000-000000000001"),
                        "Sunrise Public School",
                        "SPS-001",
                        "Bengaluru",
                        "Karnataka",
                        "https://cdn.example.com/sps/logo.png",
                        "Vision",
                        "Mission",
                        List.of("Achievement"),
                        List.of(new PublicSchoolProfileResponse.HouseInfo("Phoenix", "#f87171", "Rise", "Sparkles"))
                ));

        mockMvc.perform(get("/api/v1/onboarding/schools/public/SPS-001"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.schoolCode").value("SPS-001"))
                .andExpect(jsonPath("$.logoUrl").value("https://cdn.example.com/sps/logo.png"));
    }

    @Test
    void shouldApproveSchoolOnboardingRecord() throws Exception {
        UUID onboardingId = UUID.fromString("10000000-0000-0000-0000-000000000001");

        when(schoolOnboardingService.reviewOnboarding(eq(onboardingId), any()))
                .thenReturn(sampleResponse(OnboardingStatus.APPROVED));

        mockMvc.perform(patch("/api/v1/onboarding/schools/{onboardingId}/review", onboardingId)
                        .header("X-User-Role", "PLATFORM_ADMIN")
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
                .andExpect(jsonPath("$.selectedPlanCode").value("PREMIUM"))
                .andExpect(jsonPath("$.tenantId").value("30000000-0000-0000-0000-000000000001"));
    }

    @Test
    void shouldRequireAdminRoleForReview() throws Exception {
        UUID onboardingId = UUID.fromString("10000000-0000-0000-0000-000000000001");

        mockMvc.perform(patch("/api/v1/onboarding/schools/{onboardingId}/review", onboardingId)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "action": "REJECT",
                                  "reviewerName": "Platform Admin",
                                  "comment": "Missing documents."
                                }
                                """))
                .andExpect(status().isForbidden());
    }

    @Test
    void shouldSendActivationEmailForAdmin() throws Exception {
        UUID onboardingId = UUID.fromString("10000000-0000-0000-0000-000000000001");
        doNothing().when(schoolOnboardingService).sendActivationEmail(onboardingId);

        mockMvc.perform(post("/api/v1/onboarding/schools/{onboardingId}/activation-email", onboardingId)
                        .header("X-User-Role", "PLATFORM_ADMIN"))
                .andExpect(status().isAccepted());
    }

    @Test
    void shouldReturnCurrentBrandingForSchoolAdmin() throws Exception {
        UUID schoolId = UUID.fromString("20000000-0000-0000-0000-000000000001");
        when(schoolOnboardingService.getBranding(schoolId))
                .thenReturn(new SchoolBrandingResponse(
                        UUID.fromString("10000000-0000-0000-0000-000000000001"),
                        schoolId,
                        "Sunrise Public School",
                        "SPS-001",
                        "Bengaluru",
                        "Karnataka",
                        "https://cdn.example.com/sps/logo.png"
                ));

        mockMvc.perform(get("/api/v1/onboarding/schools/branding/current")
                        .header("X-User-Role", "SCHOOL_ADMIN")
                        .header("X-School-ID", schoolId.toString()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.schoolId").value(schoolId.toString()))
                .andExpect(jsonPath("$.schoolCode").value("SPS-001"));
    }

    @Test
    void shouldRejectBrandingRequestWithoutSchoolContext() throws Exception {
        mockMvc.perform(get("/api/v1/onboarding/schools/branding/current")
                        .header("X-User-Role", "SCHOOL_ADMIN"))
                .andExpect(status().isBadRequest());
    }

    @Test
    void shouldUploadCurrentSchoolLogoForSchoolAdmin() throws Exception {
        UUID schoolId = UUID.fromString("20000000-0000-0000-0000-000000000001");
        when(schoolOnboardingService.uploadSchoolLogo(eq(schoolId), any(), eq("admin@sunrise.edu")))
                .thenReturn(new SchoolBrandingResponse(
                        UUID.fromString("10000000-0000-0000-0000-000000000001"),
                        schoolId,
                        "Sunrise Public School",
                        "SPS-001",
                        "Bengaluru",
                        "Karnataka",
                        "https://cdn.example.com/sps/logo-2.png"
                ));

        MockMultipartFile file = new MockMultipartFile("file", "logo.png", "image/png", new byte[] {1, 2, 3});

        mockMvc.perform(multipart("/api/v1/onboarding/schools/branding/current/logo")
                        .file(file)
                        .header("X-User-Role", "SCHOOL_ADMIN")
                        .header("X-School-ID", schoolId.toString())
                        .header("X-User-Email", "admin@sunrise.edu")
                        .with(request -> {
                            request.setMethod("POST");
                            return request;
                        }))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.logoUrl").value("https://cdn.example.com/sps/logo-2.png"));
    }

    @Test
    void shouldDeleteOnboardingForAdmin() throws Exception {
        UUID onboardingId = UUID.fromString("10000000-0000-0000-0000-000000000001");
        doNothing().when(schoolOnboardingService).deleteOnboarding(onboardingId);

        mockMvc.perform(delete("/api/v1/onboarding/schools/{onboardingId}", onboardingId)
                        .header("X-User-Role", "SUPER_ADMIN"))
                .andExpect(status().isNoContent());
    }

    private SchoolOnboardingResponse sampleResponse(OnboardingStatus status) {
        return new SchoolOnboardingResponse(
                UUID.fromString("10000000-0000-0000-0000-000000000001"),
                "Sunrise Public School",
                "SPS-001",
                "sunrise-public-school",
                status,
                "CBSE",
                "Bengaluru",
                "Karnataka",
                "admin@sunrise.edu",
                "Platform Admin",
                "All documents matched.",
                Instant.parse("2026-03-31T08:00:00Z"),
                status == OnboardingStatus.APPROVED ? UUID.fromString("30000000-0000-0000-0000-000000000001") : null,
                status == OnboardingStatus.APPROVED ? UUID.fromString("20000000-0000-0000-0000-000000000001") : null,
                status == OnboardingStatus.APPROVED ? Instant.parse("2026-03-31T09:00:00Z") : null,
                status == OnboardingStatus.APPROVED ? Instant.parse("2026-03-31T09:30:00Z") : null,
                List.of("School registration certificate"),
                status == OnboardingStatus.APPROVED ? "ACT-12345" : null,
                "PREMIUM",
                "https://cdn.example.com/sps/logo.png",
                true,
                null,
                "PENDING",
                "Learning beyond boundaries",
                12.9716,
                77.5946,
                true,
                false,
                null,
                null,
                Instant.parse("2026-03-30T10:15:30Z")
        );
    }
}
