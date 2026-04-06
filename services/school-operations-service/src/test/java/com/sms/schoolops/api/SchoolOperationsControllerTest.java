package com.sms.schoolops.api;

import com.sms.schoolops.service.AIService;
import com.sms.schoolops.service.SchoolOperationsService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.test.web.servlet.MockMvc;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(SchoolOperationsController.class)
class SchoolOperationsControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private SchoolOperationsService schoolOperationsService;
    @MockBean
    private AIService aiService;

    @Test
    void shouldExposeHealthStyleListEndpoint() throws Exception {
        mockMvc.perform(get("/api/v1/school-ops/departments").queryParam("schoolId", "00000000-0000-0000-0000-000000000001"))
                .andExpect(status().isOk());
    }
}
