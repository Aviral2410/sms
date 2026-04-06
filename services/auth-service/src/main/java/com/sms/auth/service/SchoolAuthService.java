package com.sms.auth.service;

import com.sms.auth.domain.AccountStatus;
import com.sms.auth.api.SchoolLoginRequest;
import com.sms.auth.api.SchoolLoginResponse;
import com.sms.auth.domain.SchoolAccountEntity;
import com.sms.auth.domain.TenantUserAccountEntity;
import com.sms.auth.repository.SchoolAccountRepository;
import com.sms.auth.repository.TenantUserAccountRepository;
import org.springframework.stereotype.Service;

@Service
public class SchoolAuthService {

    private final SchoolAccountRepository schoolAccountRepository;
    private final TenantUserAccountRepository tenantUserAccountRepository;
    private final JwtUtil jwtUtil;

    public SchoolAuthService(
            SchoolAccountRepository schoolAccountRepository,
            TenantUserAccountRepository tenantUserAccountRepository,
            JwtUtil jwtUtil
    ) {
        this.schoolAccountRepository = schoolAccountRepository;
        this.tenantUserAccountRepository = tenantUserAccountRepository;
        this.jwtUtil = jwtUtil;
    }

    public SchoolLoginResponse login(SchoolLoginRequest request) {
        SchoolAccountEntity schoolAdmin = schoolAccountRepository
                .findBySchoolCodeIgnoreCaseAndEmailIgnoreCaseAndActiveTrue(request.schoolCode(), request.email())
                .filter(candidate -> candidate.getPassword().equals(request.password()) && candidate.getAccountStatus() == AccountStatus.ACTIVE)
                .orElse(null);

        if (schoolAdmin != null) {
            String token = jwtUtil.generateToken(
                    schoolAdmin.getAccountId(),
                    schoolAdmin.getEmail(),
                    schoolAdmin.getRoleName(),
                    schoolAdmin.getTenantId(),
                    schoolAdmin.getSchoolId()
            );
            return new SchoolLoginResponse(
                    schoolAdmin.getAccountId(),
                    schoolAdmin.getTenantId(),
                    schoolAdmin.getSchoolId(),
                    schoolAdmin.getSchoolName(),
                    schoolAdmin.getSchoolCode(),
                    schoolAdmin.getEmail(),
                    schoolAdmin.getFullName(),
                    schoolAdmin.getRoleName(),
                    schoolAdmin.getTheme(),
                    schoolAdmin.getActiveTheme(),
                    schoolAdmin.getVibe(),
                    schoolAdmin.getAccentColor(),
                    schoolAdmin.getGlassIntensity() != null ? schoolAdmin.getGlassIntensity().doubleValue() : null,
                    schoolAdmin.getBorderRadius(),
                    token
            );
        }

        TenantUserAccountEntity userAccount = tenantUserAccountRepository
                .findBySchoolCodeIgnoreCaseAndEmailIgnoreCaseAndActiveTrue(request.schoolCode(), request.email())
                .filter(candidate -> candidate.getPassword().equals(request.password()) && candidate.getAccountStatus() == AccountStatus.ACTIVE)
                .orElseThrow(InvalidAdminCredentialsException::new);

        String token = jwtUtil.generateToken(
                userAccount.getAccountId(),
                userAccount.getEmail(),
                userAccount.getRoleName(),
                userAccount.getTenantId(),
                userAccount.getSchoolId()
        );

        return new SchoolLoginResponse(
                userAccount.getAccountId(),
                userAccount.getTenantId(),
                userAccount.getSchoolId(),
                userAccount.getSchoolName(),
                userAccount.getSchoolCode(),
                userAccount.getEmail(),
                userAccount.getFullName(),
                userAccount.getRoleName(),
                userAccount.getTheme(),
                userAccount.getActiveTheme(),
                userAccount.getVibe(),
                userAccount.getAccentColor(),
                userAccount.getGlassIntensity() != null ? userAccount.getGlassIntensity().doubleValue() : null,
                userAccount.getBorderRadius(),
                token
        );
    }
}
