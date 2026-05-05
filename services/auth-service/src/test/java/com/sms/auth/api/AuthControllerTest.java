package com.sms.auth.api;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.sms.auth.event.MqttEventPublisher;
import com.sms.auth.api.PublicAuthDtos.ForgotPasswordResponse;
import com.sms.auth.api.PublicAuthDtos.JoinSchoolPublicResponse;
import com.sms.auth.api.PublicAuthDtos.VerifyResetCodeResponse;
import com.sms.auth.service.AccountActivationService;
import com.sms.auth.service.AdminAuthService;
import com.sms.auth.service.PasswordResetService;
import com.sms.auth.service.PublicJoinService;
import com.sms.auth.service.SchoolAuthService;
import com.sms.auth.service.SchoolProvisioningService;
import java.time.Instant;
import java.util.UUID;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

@WebMvcTest(AuthController.class)
class AuthControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private AdminAuthService adminAuthService;

    @MockBean
    private SchoolAuthService schoolAuthService;

    @MockBean
    private SchoolProvisioningService schoolProvisioningService;

    @MockBean
    private AccountActivationService accountActivationService;

    @MockBean
    private MqttEventPublisher mqttEventPublisher;

    @MockBean
    private PasswordResetService passwordResetService;

    @MockBean
    private PublicJoinService publicJoinService;

    @Test
    void shouldReturnHealth() throws Exception {
        mockMvc.perform(get("/api/v1/auth/health"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.service").value("auth-service"))
                .andExpect(jsonPath("$.status").value("UP"));
    }

    @Test
    void shouldLoginAdmin() throws Exception {
        when(adminAuthService.login(any())).thenReturn(new AdminLoginResponse(
                "user-1",
                "superadmin@sms.local",
                "Platform Super Admin",
                "SUPER_ADMIN",
                "stellar",
                "stellar",
                "calm",
                "#22d3ee",
                0.65,
                "18px",
                "jwt-token"
        ));

        mockMvc.perform(post("/api/v1/auth/admin/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "email": "superadmin@sms.local",
                                  "password": "ChangeMe!123"
                                }
                                """))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.email").value("superadmin@sms.local"))
                .andExpect(jsonPath("$.role").value("SUPER_ADMIN"))
                .andExpect(jsonPath("$.token").value("jwt-token"));
    }

    @Test
    void shouldLoginSchoolUser() throws Exception {
        when(schoolAuthService.login(any())).thenReturn(new SchoolLoginResponse(
                UUID.fromString("10000000-0000-0000-0000-000000000001"),
                UUID.fromString("20000000-0000-0000-0000-000000000001"),
                UUID.fromString("30000000-0000-0000-0000-000000000001"),
                "Sunrise Public School",
                "SPS-001",
                "admin@sunrise.edu",
                "Primary Contact",
                "SCHOOL_ADMIN",
                "stellar",
                "stellar",
                "calm",
                "#22d3ee",
                0.65,
                "18px",
                "school-jwt-token"
        ));

        mockMvc.perform(post("/api/v1/auth/school/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "schoolCode": "SPS-001",
                                  "email": "admin@sunrise.edu",
                                  "password": "ChangeMe!123"
                                }
                                """))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.schoolCode").value("SPS-001"))
                .andExpect(jsonPath("$.role").value("SCHOOL_ADMIN"))
                .andExpect(jsonPath("$.token").value("school-jwt-token"));
    }

    @Test
    void shouldActivateSchoolAccount() throws Exception {
        when(accountActivationService.activate(any())).thenReturn(new SchoolActivationResponse(
                "SPS-001",
                "admin@sunrise.edu",
                "Primary Contact",
                "ACTIVATED"
        ));

        mockMvc.perform(post("/api/v1/auth/school/activate")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "schoolCode": "SPS-001",
                                  "email": "admin@sunrise.edu",
                                  "activationCode": "ACT-12345",
                                  "newPassword": "ChangeMe!123"
                                }
                                """))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.schoolCode").value("SPS-001"))
                .andExpect(jsonPath("$.status").value("ACTIVATED"));
    }

    @Test
    void shouldRequireAdminRoleForActivationDetails() throws Exception {
        mockMvc.perform(get("/api/v1/auth/admin/activation-details")
                        .param("schoolCode", "SPS-001")
                        .param("email", "admin@sunrise.edu"))
                .andExpect(status().isForbidden());
    }

    @Test
    void shouldReturnActivationDetailsForAdmin() throws Exception {
        when(accountActivationService.getActiveActivationDetails("SPS-001", "admin@sunrise.edu"))
                .thenReturn(new ActivationDetailsResponse(
                        "SPS-001",
                        "admin@sunrise.edu",
                        "ACT-12345",
                        Instant.parse("2026-03-31T10:00:00Z")
                ));

        mockMvc.perform(get("/api/v1/auth/admin/activation-details")
                        .param("schoolCode", "SPS-001")
                        .param("email", "admin@sunrise.edu")
                        .header("X-User-Role", "PLATFORM_ADMIN"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.activationCode").value("ACT-12345"))
                .andExpect(jsonPath("$.email").value("admin@sunrise.edu"));
    }

    @Test
    void shouldStartForgotPasswordFlow() throws Exception {
        when(passwordResetService.requestReset(any()))
                .thenReturn(new ForgotPasswordResponse("CODE_SENT", "Reset code sent."));

        mockMvc.perform(post("/api/v1/auth/public/password/forgot")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "schoolCode": "SPS-001",
                                  "email": "admin@sunrise.edu"
                                }
                                """))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("CODE_SENT"))
                .andExpect(jsonPath("$.message").value("Reset code sent."));
    }

    @Test
    void shouldVerifyResetCode() throws Exception {
        when(passwordResetService.verifyCode(any()))
                .thenReturn(new VerifyResetCodeResponse("reset-token-123"));

        mockMvc.perform(post("/api/v1/auth/public/password/verify-code")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "schoolCode": "SPS-001",
                                  "email": "admin@sunrise.edu",
                                  "code": "123456"
                                }
                                """))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.resetToken").value("reset-token-123"));
    }

    @Test
    void shouldResetPassword() throws Exception {
        when(passwordResetService.resetPassword(any()))
                .thenReturn(new ForgotPasswordResponse("PASSWORD_RESET", "Password updated."));

        mockMvc.perform(post("/api/v1/auth/public/password/reset")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "resetToken": "reset-token-123",
                                  "newPassword": "ChangeMe!234"
                                }
                                """))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("PASSWORD_RESET"));
    }

    @Test
    void shouldAllowPublicJoin() throws Exception {
        when(publicJoinService.join(any()))
                .thenReturn(new JoinSchoolPublicResponse("JOINED", "School account created."));

        mockMvc.perform(post("/api/v1/auth/public/join")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "schoolCode": "SPS-001",
                                  "adminEmail": "admin@sunrise.edu",
                                  "roleName": "PARENT",
                                  "fullName": "Asha Thomas",
                                  "email": "asha@example.com",
                                  "password": "ChangeMe!234",
                                  "guardianName": "Thomas",
                                  "guardianPhone": "+91-9999999999"
                                }
                                """))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("JOINED"));
    }

    @Test
    void shouldRegenerateActivationCodeForAdmin() throws Exception {
        when(accountActivationService.regenerateSchoolAdminActivationCode("SPS-001", "admin@sunrise.edu"))
                .thenReturn(new ActivationDetailsResponse(
                        "SPS-001",
                        "admin@sunrise.edu",
                        "ACT-67890",
                        Instant.parse("2026-04-01T10:00:00Z")
                ));

        mockMvc.perform(post("/api/v1/auth/admin/activation-regenerate")
                        .param("schoolCode", "SPS-001")
                        .param("email", "admin@sunrise.edu")
                        .header("X-User-Role", "SUPER_ADMIN"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.activationCode").value("ACT-67890"));
    }

    @Test
    void shouldRejectProvisionSchoolWithoutPlatformRole() throws Exception {
        mockMvc.perform(post("/api/v1/auth/internal/provision-school")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "schoolName": "Sunrise Public School",
                                  "schoolCode": "SPS-001",
                                  "realmName": "sunrise-public-school",
                                  "contactEmail": "admin@sunrise.edu"
                                }
                                """))
                .andExpect(status().isForbidden());
    }

    @Test
    void shouldUpdateAdminProfileForPlatformAdmin() throws Exception {
        mockMvc.perform(org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch("/api/v1/auth/admin/profile")
                        .param("email", "superadmin@sms.local")
                        .header("X-User-Role", "PLATFORM_ADMIN")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "fullName": "Platform Super Admin",
                                  "theme": "stellar",
                                  "activeTheme": "stellar",
                                  "vibe": "calm",
                                  "accentColor": "#22d3ee",
                                  "glassIntensity": 0.65,
                                  "borderRadius": "18px"
                                }
                                """))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("updated"))
                .andExpect(jsonPath("$.email").value("superadmin@sms.local"));
    }
}
