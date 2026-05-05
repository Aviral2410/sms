package com.sms.schoolops.api;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.doNothing;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.sms.schoolops.api.SchoolOperationsDtos.StudentAdmissionResponse;
import com.sms.schoolops.api.SchoolOperationsDtos.StudentRowResponse;
import com.sms.schoolops.api.SchoolOperationsDtos.StudentsPageResponse;
import com.sms.schoolops.domain.StudentStatus;
import com.sms.schoolops.service.AIService;
import com.sms.schoolops.service.SchoolOperationsService;
import com.sms.schoolops.service.SubscriptionService;
import java.time.Instant;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

@WebMvcTest(SchoolOperationsController.class)
class SchoolOperationsControllerTest {

    private static final UUID SCHOOL_ID = UUID.fromString("00000000-0000-0000-0000-000000000001");
    private static final UUID STUDENT_ID = UUID.fromString("10000000-0000-0000-0000-000000000001");
    private static final UUID CLASS_ID = UUID.fromString("20000000-0000-0000-0000-000000000001");
    private static final UUID ADMISSION_ID = UUID.fromString("40000000-0000-0000-0000-000000000001");

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private SchoolOperationsService schoolOperationsService;

    @MockBean
    private AIService aiService;

    @MockBean
    private SubscriptionService subscriptionService;

    @BeforeEach
    void allowSchoolOpsFeature() {
        when(subscriptionService.isFeatureAccessibleStrict(SCHOOL_ID, "SCHOOL_OPS")).thenReturn(true);
    }

    @Test
    void shouldExposeHealthStyleListEndpoint() throws Exception {
        mockMvc.perform(get("/api/v1/school-ops/departments")
                        .queryParam("schoolId", SCHOOL_ID.toString())
                        .header("X-Tenant-ID", SCHOOL_ID.toString())
                        .header("X-School-ID", SCHOOL_ID.toString()))
                .andExpect(status().isOk());
    }

    @Test
    void shouldListAdmissionsFromHeaderSchoolContext() throws Exception {
        when(schoolOperationsService.listStudentAdmissions(SCHOOL_ID))
                .thenReturn(List.of(sampleAdmission()));

        mockMvc.perform(get("/api/v1/school-ops/admissions")
                        .header("X-Tenant-ID", SCHOOL_ID.toString())
                        .header("X-School-ID", SCHOOL_ID.toString()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].admissionNo").value("ADM-2026-001"))
                .andExpect(jsonPath("$[0].studentFullName").value("Aarav Sharma"));
    }

    @Test
    void shouldReturnNextAdmissionNumber() throws Exception {
        when(schoolOperationsService.previewNextAdmissionNo(SCHOOL_ID)).thenReturn("ADM-2026-010");

        mockMvc.perform(get("/api/v1/school-ops/admissions/next-number")
                        .param("schoolId", SCHOOL_ID.toString())
                        .header("X-Tenant-ID", SCHOOL_ID.toString())
                        .header("X-School-ID", SCHOOL_ID.toString()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.admissionNo").value("ADM-2026-010"));
    }

    @Test
    void shouldCreateAdmission() throws Exception {
        when(schoolOperationsService.createStudentAdmission(any()))
                .thenReturn(sampleAdmission());

        mockMvc.perform(post("/api/v1/school-ops/admissions")
                        .header("X-Tenant-ID", SCHOOL_ID.toString())
                        .header("X-School-ID", SCHOOL_ID.toString())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "schoolId": "00000000-0000-0000-0000-000000000001",
                                  "tenantId": "30000000-0000-0000-0000-000000000001",
                                  "schoolCode": "SPS-001",
                                  "studentUserId": "10000000-0000-0000-0000-000000000001",
                                  "studentFullName": "Aarav Sharma",
                                  "studentEmail": "aarav@sunrise.edu",
                                  "admissionNo": "ADM-2026-001",
                                  "admittedOn": "2026-04-01",
                                  "dateOfBirth": "2014-06-15",
                                  "guardianName": "Neha Sharma",
                                  "guardianPhone": "+91-9999999999",
                                  "address": "MG Road",
                                  "previousSchool": "Little Steps School",
                                  "admissionStatus": "ACTIVE",
                                  "classId": "20000000-0000-0000-0000-000000000001"
                                }
                                """))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.admissionId").value(ADMISSION_ID.toString()))
                .andExpect(jsonPath("$.studentFullName").value("Aarav Sharma"));
    }

    @Test
    void shouldUpdateAdmission() throws Exception {
        when(schoolOperationsService.updateStudentAdmission(eq(ADMISSION_ID), any()))
                .thenReturn(sampleAdmission());

        mockMvc.perform(patch("/api/v1/school-ops/admissions/{admissionId}", ADMISSION_ID)
                        .header("X-Tenant-ID", SCHOOL_ID.toString())
                        .header("X-School-ID", SCHOOL_ID.toString())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "guardianName": "Neha Sharma",
                                  "guardianPhone": "+91-9999999999",
                                  "address": "Brigade Road",
                                  "previousSchool": "Little Steps School",
                                  "admissionStatus": "ACTIVE"
                                }
                                """))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.guardianPhone").value("+91-9999999999"));
    }

    @Test
    void shouldDeleteAdmission() throws Exception {
        doNothing().when(schoolOperationsService).deleteStudentAdmission(ADMISSION_ID);

        mockMvc.perform(delete("/api/v1/school-ops/admissions/{admissionId}", ADMISSION_ID)
                        .header("X-Tenant-ID", SCHOOL_ID.toString())
                        .header("X-School-ID", SCHOOL_ID.toString()))
                .andExpect(status().isOk());
    }

    @Test
    void shouldListStudentsWithPagingEnvelope() throws Exception {
        when(schoolOperationsService.listStudents(eq(SCHOOL_ID), eq(null), eq(null), eq(null), eq(null), eq(null), eq("createdAt"), eq("desc"), eq(0), eq(20)))
                .thenReturn(new StudentsPageResponse(List.of(sampleStudent()), 1, 0, 20, false));

        mockMvc.perform(get("/api/v1/school-ops/students")
                        .param("schoolId", SCHOOL_ID.toString())
                        .header("X-Tenant-ID", SCHOOL_ID.toString())
                        .header("X-School-ID", SCHOOL_ID.toString()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.items[0].fullName").value("Aarav Sharma"))
                .andExpect(jsonPath("$.total").value(1));
    }

    @Test
    void shouldCreateStudent() throws Exception {
        when(schoolOperationsService.createStudent(any()))
                .thenReturn(sampleStudent());

        mockMvc.perform(post("/api/v1/school-ops/students")
                        .header("X-Tenant-ID", SCHOOL_ID.toString())
                        .header("X-School-ID", SCHOOL_ID.toString())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "schoolId": "00000000-0000-0000-0000-000000000001",
                                  "studentUserId": "10000000-0000-0000-0000-000000000001",
                                  "fullName": "Aarav Sharma",
                                  "email": "aarav@sunrise.edu",
                                  "admissionNo": "ADM-2026-001",
                                  "rollNo": "12",
                                  "guardianName": "Neha Sharma",
                                  "contact": "+91-8888888888",
                                  "address": "MG Road",
                                  "previousSchool": "Little Steps School",
                                  "admissionStatus": "ACTIVE",
                                  "classId": "20000000-0000-0000-0000-000000000001"
                                }
                                """))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.studentUserId").value(STUDENT_ID.toString()))
                .andExpect(jsonPath("$.status").value("ACTIVE"));
    }

    @Test
    void shouldUpdateStudent() throws Exception {
        when(schoolOperationsService.updateStudent(eq(STUDENT_ID), any()))
                .thenReturn(sampleStudent());

        mockMvc.perform(put("/api/v1/school-ops/students/{studentId}", STUDENT_ID)
                        .header("X-Tenant-ID", SCHOOL_ID.toString())
                        .header("X-School-ID", SCHOOL_ID.toString())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "schoolId": "00000000-0000-0000-0000-000000000001",
                                  "studentUserId": "10000000-0000-0000-0000-000000000001",
                                  "fullName": "Aarav Sharma",
                                  "email": "aarav@sunrise.edu",
                                  "admissionNo": "ADM-2026-001",
                                  "rollNo": "12",
                                  "guardianName": "Neha Sharma",
                                  "contact": "+91-8888888888",
                                  "address": "MG Road",
                                  "previousSchool": "Little Steps School",
                                  "admissionStatus": "ACTIVE",
                                  "classId": "20000000-0000-0000-0000-000000000001"
                                }
                                """))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.fullName").value("Aarav Sharma"));
    }

    @Test
    void shouldDeleteStudent() throws Exception {
        doNothing().when(schoolOperationsService).deleteStudent(STUDENT_ID, SCHOOL_ID);

        mockMvc.perform(delete("/api/v1/school-ops/students/{studentId}", STUDENT_ID)
                        .param("schoolId", SCHOOL_ID.toString())
                        .header("X-Tenant-ID", SCHOOL_ID.toString())
                        .header("X-School-ID", SCHOOL_ID.toString()))
                .andExpect(status().isNoContent());
    }

    private StudentAdmissionResponse sampleAdmission() {
        return new StudentAdmissionResponse(
                ADMISSION_ID,
                SCHOOL_ID,
                STUDENT_ID,
                "Aarav Sharma",
                "aarav@sunrise.edu",
                "ADM-2026-001",
                LocalDate.parse("2026-04-01"),
                LocalDate.parse("2014-06-15"),
                "Neha Sharma",
                "+91-9999999999",
                "MG Road",
                "Little Steps School",
                StudentStatus.ACTIVE,
                Instant.parse("2026-04-01T09:00:00Z")
        );
    }

    private StudentRowResponse sampleStudent() {
        return new StudentRowResponse(
                STUDENT_ID,
                SCHOOL_ID,
                ADMISSION_ID,
                "Aarav Sharma",
                "aarav@sunrise.edu",
                "ADM-2026-001",
                "12",
                "Grade 5",
                "A",
                CLASS_ID,
                "Meera Iyer",
                "Neha Sharma",
                "+91-8888888888",
                "SCHOOL_BUS",
                UUID.fromString("50000000-0000-0000-0000-000000000001"),
                "Route 1",
                UUID.fromString("60000000-0000-0000-0000-000000000001"),
                "ACTIVE",
                Instant.parse("2026-04-01T09:30:00Z")
        );
    }
}
