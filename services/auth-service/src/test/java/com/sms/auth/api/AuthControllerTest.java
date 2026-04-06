package com.sms.auth.api;

import com.sms.auth.service.AdminAuthService;
import com.sms.auth.service.AccountActivationService;
import com.sms.auth.service.SchoolAuthService;
import com.sms.auth.service.SchoolProvisioningService;
import com.sms.auth.event.MqttEventPublisher;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.test.web.servlet.MockMvc;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

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

    @Test
    void shouldReturnHealth() throws Exception {
        mockMvc.perform(get("/api/v1/auth/health"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.service").value("auth-service"))
                .andExpect(jsonPath("$.status").value("UP"));
    }
}
