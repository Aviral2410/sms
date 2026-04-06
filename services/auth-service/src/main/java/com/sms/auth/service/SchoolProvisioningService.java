package com.sms.auth.service;

import com.sms.auth.api.ProvisionUserAccountRequest;
import com.sms.auth.api.ProvisionUserAccountResponse;
import com.sms.auth.domain.AccountActivationTokenEntity;
import com.sms.auth.domain.AccountStatus;
import com.sms.auth.api.ProvisionSchoolRequest;
import com.sms.auth.api.ProvisionSchoolResponse;
import com.sms.auth.domain.SchoolAccountEntity;
import com.sms.auth.domain.TenantUserAccountEntity;
import com.sms.auth.domain.TenantEntity;
import com.sms.auth.repository.AccountActivationTokenRepository;
import com.sms.auth.repository.SchoolAccountRepository;
import com.sms.auth.repository.TenantUserAccountRepository;
import com.sms.auth.repository.TenantRepository;
import com.sms.auth.repository.AdminAccountRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

@Service
public class SchoolProvisioningService {

    private final TenantRepository tenantRepository;
    private final SchoolAccountRepository schoolAccountRepository;
    private final AccountActivationTokenRepository accountActivationTokenRepository;
    private final TenantUserAccountRepository tenantUserAccountRepository;
    private final AdminAccountRepository adminAccountRepository;

    public SchoolProvisioningService(
            TenantRepository tenantRepository,
            SchoolAccountRepository schoolAccountRepository,
            AccountActivationTokenRepository accountActivationTokenRepository,
            TenantUserAccountRepository tenantUserAccountRepository,
            AdminAccountRepository adminAccountRepository
    ) {
        this.tenantRepository = tenantRepository;
        this.schoolAccountRepository = schoolAccountRepository;
        this.accountActivationTokenRepository = accountActivationTokenRepository;
        this.tenantUserAccountRepository = tenantUserAccountRepository;
        this.adminAccountRepository = adminAccountRepository;
    }

    @Transactional
    public ProvisionSchoolResponse provision(ProvisionSchoolRequest request) {
        return tenantRepository.findBySchoolCodeIgnoreCase(request.schoolCode())
                .map(existing -> {
                    SchoolAccountEntity account = schoolAccountRepository.findBySchoolCodeIgnoreCase(request.schoolCode())
                            .orElseThrow();
                    String activationCode = createOrRefreshActivationCode(existing.getTenantId(), account.getAccountId(), account.getSchoolCode(), account.getEmail());
                    return new ProvisionSchoolResponse(
                            existing.getTenantId(),
                            existing.getSchoolId(),
                            existing.getSchoolName(),
                            existing.getSchoolCode(),
                            account.getEmail(),
                            activationCode,
                            "/school"
                    );
                })
                .orElseGet(() -> createProvisionedTenant(request));
    }

    private ProvisionSchoolResponse createProvisionedTenant(ProvisionSchoolRequest request) {
        UUID tenantId = UUID.randomUUID();
        UUID schoolId = UUID.randomUUID();

        TenantEntity tenant = new TenantEntity();
        tenant.setTenantId(tenantId);
        tenant.setSchoolId(schoolId);
        tenant.setSchoolName(request.schoolName());
        tenant.setSchoolCode(request.schoolCode());
        tenant.setActive(true);
        tenant.setActivatedAt(Instant.now());
        tenantRepository.save(tenant);

        SchoolAccountEntity account = new SchoolAccountEntity();
        account.setAccountId(UUID.randomUUID());
        account.setTenantId(tenantId);
        account.setSchoolId(schoolId);
        account.setSchoolName(request.schoolName());
        account.setSchoolCode(request.schoolCode());
        account.setEmail(request.contactEmail());
        account.setPassword("");
        account.setFullName(request.schoolName() + " Admin");
        account.setRoleName("SCHOOL_ADMIN");
        account.setAccountStatus(AccountStatus.PENDING_ACTIVATION);
        account.setActive(false);
        schoolAccountRepository.save(account);
        String activationCode = createOrRefreshActivationCode(tenantId, account.getAccountId(), request.schoolCode(), request.contactEmail());

        return new ProvisionSchoolResponse(
                tenantId,
                schoolId,
                request.schoolName(),
                request.schoolCode(),
                request.contactEmail(),
                activationCode,
                "/school"
        );
    }

    @Transactional
    public ProvisionUserAccountResponse provisionTenantUser(ProvisionUserAccountRequest request) {
        UUID tenantId = request.tenantId();
        UUID schoolId = request.schoolId();
        
        // If IDs are missing or zero-UUID, resolve them from schoolCode
        UUID zeroUuid = new UUID(0, 0);
        if (tenantId == null || tenantId.equals(zeroUuid) || schoolId == null || schoolId.equals(zeroUuid)) {
            TenantEntity tenant = tenantRepository.findBySchoolCodeIgnoreCase(request.schoolCode())
                    .orElseThrow(() -> new IllegalArgumentException("Invalid school code: " + request.schoolCode()));
            tenantId = tenant.getTenantId();
            schoolId = tenant.getSchoolId();
        }

        TenantUserAccountEntity account = new TenantUserAccountEntity();
        account.setAccountId(UUID.randomUUID());
        account.setTenantId(tenantId);
        account.setSchoolId(schoolId);
        account.setSchoolCode(request.schoolCode());
        account.setSchoolName(request.schoolName());
        account.setEmail(request.email());
        account.setPassword(request.accessKey());
        account.setFullName(request.fullName());
        account.setRoleName(request.roleName());
        account.setAccountStatus(AccountStatus.ACTIVE);
        account.setActive(true);
        tenantUserAccountRepository.save(account);

        return new ProvisionUserAccountResponse(
                account.getAccountId(),
                request.schoolCode(),
                request.email(),
                request.fullName(),
                request.roleName()
        );
    }

    @Transactional
    public void updateUserPreferences(String email, com.sms.auth.api.UserPreferencesRequest request) {
        // Try Admin
        adminAccountRepository.findByEmailIgnoreCaseAndActiveTrue(email).ifPresent(admin -> {
            if (request.theme() != null) admin.setTheme(request.theme());
            if (request.activeTheme() != null) admin.setActiveTheme(request.activeTheme());
            if (request.vibe() != null) admin.setVibe(request.vibe());
            if (request.accentColor() != null) admin.setAccentColor(request.accentColor());
            if (request.glassIntensity() != null) admin.setGlassIntensity(BigDecimal.valueOf(request.glassIntensity()));
            if (request.borderRadius() != null) admin.setBorderRadius(request.borderRadius());
            adminAccountRepository.save(admin);
        });

        // Try School Admin
        schoolAccountRepository.findByEmailIgnoreCase(email).ifPresent(school -> {
            if (request.theme() != null) school.setTheme(request.theme());
            if (request.activeTheme() != null) school.setActiveTheme(request.activeTheme());
            if (request.vibe() != null) school.setVibe(request.vibe());
            if (request.accentColor() != null) school.setAccentColor(request.accentColor());
            if (request.glassIntensity() != null) school.setGlassIntensity(BigDecimal.valueOf(request.glassIntensity()));
            if (request.borderRadius() != null) school.setBorderRadius(request.borderRadius());
            schoolAccountRepository.save(school);
        });

        // Try Tenant User
        tenantUserAccountRepository.findByEmailIgnoreCase(email).ifPresent(user -> {
            if (request.theme() != null) user.setTheme(request.theme());
            if (request.activeTheme() != null) user.setActiveTheme(request.activeTheme());
            if (request.vibe() != null) user.setVibe(request.vibe());
            if (request.accentColor() != null) user.setAccentColor(request.accentColor());
            if (request.glassIntensity() != null) user.setGlassIntensity(BigDecimal.valueOf(request.glassIntensity()));
            if (request.borderRadius() != null) user.setBorderRadius(request.borderRadius());
            tenantUserAccountRepository.save(user);
        });
    }

    private String createOrRefreshActivationCode(UUID tenantId, UUID accountId, String schoolCode, String email) {
        String activationCode = UUID.randomUUID().toString().substring(0, 8).toUpperCase();
        AccountActivationTokenEntity token = new AccountActivationTokenEntity();
        token.setTokenId(UUID.randomUUID());
        token.setTenantId(tenantId);
        token.setAccountId(accountId);
        token.setSchoolCode(schoolCode);
        token.setEmail(email);
        token.setActivationCode(activationCode);
        token.setExpiresAt(Instant.now().plusSeconds(60L * 60L * 24L * 3L));
        token.setConsumedAt(null);
        accountActivationTokenRepository.save(token);
        return activationCode;
    }
}
