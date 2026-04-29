package com.sms.auth.service;

import com.sms.auth.api.PublicAuthDtos.JoinSchoolPublicRequest;
import com.sms.auth.api.PublicAuthDtos.JoinSchoolPublicResponse;
import com.sms.auth.api.ProvisionUserAccountRequest;
import com.sms.auth.domain.AccountStatus;
import com.sms.auth.domain.SchoolAccountEntity;
import com.sms.auth.domain.TenantEntity;
import com.sms.auth.domain.TenantUserAccountEntity;
import com.sms.auth.repository.SchoolAccountRepository;
import com.sms.auth.repository.TenantRepository;
import com.sms.auth.repository.TenantUserAccountRepository;
import java.util.Locale;
import java.util.Map;
import java.util.UUID;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.client.RestClient;

@Service
public class PublicJoinService {

    private static final Logger logger = LoggerFactory.getLogger(PublicJoinService.class);

    private final TenantRepository tenantRepository;
    private final SchoolAccountRepository schoolAccountRepository;
    private final TenantUserAccountRepository tenantUserAccountRepository;
    private final SchoolProvisioningService schoolProvisioningService;
    private final RestClient schoolOpsClient;

    public PublicJoinService(
            TenantRepository tenantRepository,
            SchoolAccountRepository schoolAccountRepository,
            TenantUserAccountRepository tenantUserAccountRepository,
            SchoolProvisioningService schoolProvisioningService,
            RestClient.Builder restClientBuilder,
            @Value("${app.school-operations-service-url:http://localhost:8083}") String schoolOpsUrl
    ) {
        this.tenantRepository = tenantRepository;
        this.schoolAccountRepository = schoolAccountRepository;
        this.tenantUserAccountRepository = tenantUserAccountRepository;
        this.schoolProvisioningService = schoolProvisioningService;
        this.schoolOpsClient = restClientBuilder.baseUrl(schoolOpsUrl).build();
    }

    @Transactional
    public JoinSchoolPublicResponse join(JoinSchoolPublicRequest request) {
        String schoolCode = safeUpper(request.schoolCode());
        String adminEmail = safeLower(request.adminEmail());
        String email = safeLower(request.email());

        TenantEntity tenant = tenantRepository.findBySchoolCodeIgnoreCase(schoolCode)
                .orElseThrow(() -> new IllegalArgumentException("Invalid school code."));
        if (tenant.getActive() == null || !tenant.getActive()) {
            throw new IllegalArgumentException("School is not active.");
        }

        SchoolAccountEntity admin = schoolAccountRepository
                .findBySchoolCodeIgnoreCaseAndEmailIgnoreCaseAndActiveTrue(schoolCode, adminEmail)
                .filter(a -> a.getAccountStatus() == AccountStatus.ACTIVE)
                .orElseThrow(() -> new IllegalArgumentException("School admin email not verified for this school."));

        // Avoid creating duplicate accounts.
        TenantUserAccountEntity existing = tenantUserAccountRepository
                .findBySchoolCodeIgnoreCaseAndEmailIgnoreCaseAndActiveTrue(schoolCode, email)
                .orElse(null);
        if (existing != null) {
            return new JoinSchoolPublicResponse("OK", "Account already exists. Please log in.");
        }

        UUID tenantId = tenant.getTenantId();
        UUID schoolId = tenant.getSchoolId();
        String schoolName = tenant.getSchoolName();

        // Create auth account first (source of truth for userId in JWT).
        var provisioned = schoolProvisioningService.provisionTenantUser(new ProvisionUserAccountRequest(
                tenantId,
                schoolId,
                schoolCode,
                schoolName,
                email,
                request.fullName().trim(),
                request.roleName().trim().toUpperCase(Locale.ROOT),
                request.password()
        ));

        // Create/ensure the school-ops profile uses the same UUID as the auth accountId.
        try {
            schoolOpsClient.post()
                    .uri("/api/v1/school-ops/internal/users/profile")
                    .header("X-User-Role", admin.getRoleName())
                    .header("X-School-ID", schoolId.toString())
                    .header("X-Tenant-ID", tenantId.toString())
                    .body(Map.of(
                            "userId", provisioned.accountId(),
                            "tenantId", tenantId,
                            "schoolId", schoolId,
                            "schoolCode", schoolCode,
                            "schoolName", schoolName,
                            "fullName", request.fullName().trim(),
                            "email", email,
                            "roleName", request.roleName().trim().toUpperCase(Locale.ROOT)
                    ))
                    .retrieve()
                    .toBodilessEntity();
        } catch (Exception ex) {
            logger.warn("Failed to create school-ops profile for public join. schoolCode={} email={} accountId={}",
                    schoolCode, email, provisioned.accountId(), ex);
        }

        if ("STUDENT".equalsIgnoreCase(request.roleName())) {
            String guardianName = request.guardianName() == null || request.guardianName().isBlank()
                    ? request.fullName().trim()
                    : request.guardianName().trim();
            String guardianPhone = request.guardianPhone() == null ? "" : request.guardianPhone().trim();

            if (!guardianPhone.isBlank()) {
                try {
                    schoolOpsClient.post()
                            .uri("/api/v1/school-ops/admissions")
                            .body(Map.ofEntries(
                                    Map.entry("schoolId", schoolId),
                                    Map.entry("tenantId", tenantId),
                                    Map.entry("schoolCode", schoolCode),
                                    Map.entry("studentUserId", provisioned.accountId()),
                                    Map.entry("studentFullName", request.fullName().trim()),
                                    Map.entry("studentEmail", email),
                                    Map.entry("admissionNo", ""),
                                    Map.entry("admittedOn", java.time.LocalDate.now().toString()),
                                    Map.entry("guardianName", guardianName),
                                    Map.entry("guardianPhone", guardianPhone),
                                    Map.entry("address", ""),
                                    Map.entry("previousSchool", ""),
                                    Map.entry("admissionStatus", "APPLICATION")
                            ))
                            .retrieve()
                            .toBodilessEntity();
                } catch (Exception ex) {
                    logger.warn("Failed to create student admission application for public join. schoolCode={} email={} accountId={}",
                            schoolCode, email, provisioned.accountId(), ex);
                }
            }
        }

        return new JoinSchoolPublicResponse("OK", "Account created successfully. Please log in.");
    }

    private static String safeUpper(String value) {
        return value == null ? "" : value.trim().toUpperCase(Locale.ROOT);
    }

    private static String safeLower(String value) {
        return value == null ? "" : value.trim().toLowerCase(Locale.ROOT);
    }
}
