package com.sms.onboarding.api;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.sms.onboarding.service.PlatformSettingsService;
import java.time.Instant;
import java.util.List;
import java.util.UUID;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

@WebMvcTest(PlatformSettingsController.class)
class PlatformSettingsControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private PlatformSettingsService platformSettingsService;

    @Test
    void shouldRequirePlatformRoleForAdminSettings() throws Exception {
        mockMvc.perform(get("/api/v1/platform/settings"))
                .andExpect(status().isForbidden());
    }

    @Test
    void shouldReturnPublicSettingsWithoutAuth() throws Exception {
        when(platformSettingsService.getPublicSettings()).thenReturn(publicResponse());

        mockMvc.perform(get("/api/v1/platform/settings/public"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.platformName").value("ElevateSmart"))
                .andExpect(jsonPath("$.releasedFeatureCodes[0]").value("SCHOOL_OPS"));
    }

    @Test
    void shouldReturnAdminSettingsForPlatformRole() throws Exception {
        when(platformSettingsService.getSettings()).thenReturn(adminResponse());

        mockMvc.perform(get("/api/v1/platform/settings")
                        .header("X-User-Role", "PLATFORM_ADMIN"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.releasedFeatureCodes[1]").value("ATTENDANCE"));
    }

    @Test
    void shouldUpdateReleasedFeatureCodesForPlatformAdmin() throws Exception {
        when(platformSettingsService.updateSettings(any())).thenReturn(adminResponse());

        mockMvc.perform(patch("/api/v1/platform/settings")
                        .header("X-User-Role", "SUPER_ADMIN")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "themeName": "indigo-flow",
                                  "accentColor": "#6366f1",
                                  "defaultTrialDays": 14,
                                  "maintenanceMode": false,
                                  "platformName": "ElevateSmart",
                                  "contactEmail": "support@elevatesmart.ai",
                                  "glassIntensity": 0.4,
                                  "borderRadius": "24px",
                                  "authServiceUrl": "http://auth-service:8082",
                                  "communicationServiceUrl": "http://communication-service:8089",
                                  "releasedFeatureCodes": ["SCHOOL_OPS", "ATTENDANCE"]
                                }
                                """))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.releasedFeatureCodes[0]").value("SCHOOL_OPS"))
                .andExpect(jsonPath("$.releasedFeatureCodes[1]").value("ATTENDANCE"));
    }

    private PlatformSettingsResponse adminResponse() {
        return new PlatformSettingsResponse(
                UUID.fromString("00000000-0000-0000-0000-000000000000"),
                "indigo-flow",
                "#6366f1",
                14,
                false,
                "ElevateSmart",
                "support@elevatesmart.ai",
                0.4,
                "24px",
                "http://auth-service:8082",
                "http://communication-service:8089",
                List.of("SCHOOL_OPS", "ATTENDANCE"),
                Instant.parse("2026-05-05T08:00:00Z")
        );
    }

    private PublicPlatformSettingsResponse publicResponse() {
        return new PublicPlatformSettingsResponse(
                "ElevateSmart",
                "support@elevatesmart.ai",
                false,
                List.of("SCHOOL_OPS", "ATTENDANCE"),
                Instant.parse("2026-05-05T08:00:00Z")
        );
    }
}
