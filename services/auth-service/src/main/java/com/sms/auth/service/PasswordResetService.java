package com.sms.auth.service;

import com.sms.auth.api.PublicAuthDtos.*;
import com.sms.auth.domain.AccountStatus;
import com.sms.auth.domain.PasswordResetTokenEntity;
import com.sms.auth.domain.SchoolAccountEntity;
import com.sms.auth.domain.TenantUserAccountEntity;
import com.sms.auth.repository.PasswordResetTokenRepository;
import com.sms.auth.repository.SchoolAccountRepository;
import com.sms.auth.repository.TenantUserAccountRepository;
import com.sms.auth.security.PasswordService;
import java.time.Duration;
import java.time.Instant;
import java.util.Locale;
import java.util.Optional;
import java.util.Random;
import java.util.UUID;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;

@Service
public class PasswordResetService {

    private static final Logger logger = LoggerFactory.getLogger(PasswordResetService.class);

    private static final Duration CODE_TTL = Duration.ofMinutes(15);
    private final Random random = new Random();

    private final SchoolAccountRepository schoolAccountRepository;
    private final TenantUserAccountRepository tenantUserAccountRepository;
    private final PasswordResetTokenRepository passwordResetTokenRepository;
    private final PasswordService passwordService;
    private final RestClient communicationClient;

    public PasswordResetService(
            SchoolAccountRepository schoolAccountRepository,
            TenantUserAccountRepository tenantUserAccountRepository,
            PasswordResetTokenRepository passwordResetTokenRepository,
            PasswordService passwordService,
            RestClient.Builder restClientBuilder,
            @Value("${app.communication-service-url:http://localhost:8089}") String communicationServiceUrl
    ) {
        this.schoolAccountRepository = schoolAccountRepository;
        this.tenantUserAccountRepository = tenantUserAccountRepository;
        this.passwordResetTokenRepository = passwordResetTokenRepository;
        this.passwordService = passwordService;
        this.communicationClient = restClientBuilder.baseUrl(communicationServiceUrl).build();
    }

    public ForgotPasswordResponse requestReset(ForgotPasswordRequest request) {
        String schoolCode = safeUpper(request.schoolCode());
        String email = safeLower(request.email());

        Optional<AccountRef> accountOpt = resolveAccount(schoolCode, email);
        if (accountOpt.isEmpty()) {
            // Never reveal whether an email exists.
            return new ForgotPasswordResponse("OK", "If the account exists, a reset code has been sent.");
        }

        AccountRef account = accountOpt.get();
        String code = generateSixDigitCode();

        PasswordResetTokenEntity token = new PasswordResetTokenEntity();
        token.setTokenId(UUID.randomUUID());
        token.setTenantId(account.tenantId());
        token.setAccountId(account.accountId());
        token.setAccountType(account.accountType());
        token.setSchoolId(account.schoolId());
        token.setSchoolCode(schoolCode);
        token.setEmail(email);
        token.setCodeHash(passwordService.hash(code));
        token.setCreatedAt(Instant.now());
        token.setExpiresAt(Instant.now().plus(CODE_TTL));
        token.setVerifiedAt(null);
        token.setConsumedAt(null);
        passwordResetTokenRepository.save(token);

        try {
            // Communication service currently persists notifications and stubs actual delivery.
            communicationClient.post()
                    .uri("/api/v1/communication/notifications")
                    .header("X-School-ID", account.schoolId().toString())
                    .body(java.util.Map.of(
                            "recipientId", account.accountId(),
                            "title", "Password Reset Code",
                            "message", "Your password reset code is: " + code + ". It expires in 15 minutes.",
                            "type", "PASSWORD_RESET_CODE",
                            "channel", "EMAIL"
                    ))
                    .retrieve()
                    .toBodilessEntity();
        } catch (Exception ex) {
            logger.warn("Failed to dispatch password reset notification. schoolCode={} email={}", schoolCode, email, ex);
        }

        return new ForgotPasswordResponse("OK", "If the account exists, a reset code has been sent.");
    }

    public VerifyResetCodeResponse verifyCode(VerifyResetCodeRequest request) {
        String schoolCode = safeUpper(request.schoolCode());
        String email = safeLower(request.email());
        String code = request.code() == null ? "" : request.code().trim();

        PasswordResetTokenEntity token = passwordResetTokenRepository
                .findTopBySchoolCodeIgnoreCaseAndEmailIgnoreCaseAndConsumedAtIsNullOrderByCreatedAtDesc(schoolCode, email)
                .orElseThrow(() -> new IllegalArgumentException("Invalid or expired reset code."));

        if (token.getExpiresAt() == null || token.getExpiresAt().isBefore(Instant.now())) {
            throw new IllegalArgumentException("Invalid or expired reset code.");
        }

        if (!passwordService.matches(code, token.getCodeHash())) {
            throw new IllegalArgumentException("Invalid or expired reset code.");
        }

        if (token.getVerifiedAt() == null) {
            token.setVerifiedAt(Instant.now());
            passwordResetTokenRepository.save(token);
        }

        return new VerifyResetCodeResponse(token.getTokenId().toString());
    }

    public ForgotPasswordResponse resetPassword(ResetPasswordRequest request) {
        UUID tokenId;
        try {
            tokenId = UUID.fromString(request.resetToken().trim());
        } catch (IllegalArgumentException ex) {
            throw new IllegalArgumentException("Invalid reset token.");
        }

        PasswordResetTokenEntity token = passwordResetTokenRepository.findById(tokenId)
                .orElseThrow(() -> new IllegalArgumentException("Invalid reset token."));

        if (token.getConsumedAt() != null) {
            throw new IllegalArgumentException("Reset token already used.");
        }
        if (token.getVerifiedAt() == null) {
            throw new IllegalArgumentException("Reset token not verified.");
        }
        if (token.getExpiresAt() == null || token.getExpiresAt().isBefore(Instant.now())) {
            throw new IllegalArgumentException("Reset token expired.");
        }

        String accountType = token.getAccountType() == null ? "" : token.getAccountType().trim().toUpperCase(Locale.ROOT);
        UUID accountId = token.getAccountId();

        if ("SCHOOL_ADMIN".equals(accountType)) {
            SchoolAccountEntity account = schoolAccountRepository.findById(accountId)
                    .orElseThrow(() -> new IllegalArgumentException("Account not found."));
            account.setPassword(passwordService.hash(request.newPassword()));
            account.setAccountStatus(AccountStatus.ACTIVE);
            schoolAccountRepository.save(account);
        } else if ("TENANT_USER".equals(accountType)) {
            TenantUserAccountEntity account = tenantUserAccountRepository.findById(accountId)
                    .orElseThrow(() -> new IllegalArgumentException("Account not found."));
            account.setPassword(passwordService.hash(request.newPassword()));
            account.setAccountStatus(AccountStatus.ACTIVE);
            tenantUserAccountRepository.save(account);
        } else {
            throw new IllegalArgumentException("Account type not supported for password reset.");
        }

        token.setConsumedAt(Instant.now());
        passwordResetTokenRepository.save(token);

        return new ForgotPasswordResponse("OK", "Password updated successfully.");
    }

    private Optional<AccountRef> resolveAccount(String schoolCode, String email) {
        SchoolAccountEntity schoolAdmin = schoolAccountRepository
                .findBySchoolCodeIgnoreCaseAndEmailIgnoreCaseAndActiveTrue(schoolCode, email)
                .filter(a -> a.getAccountStatus() == AccountStatus.ACTIVE)
                .orElse(null);
        if (schoolAdmin != null) {
            return Optional.of(new AccountRef(
                    schoolAdmin.getAccountId(),
                    schoolAdmin.getTenantId(),
                    schoolAdmin.getSchoolId(),
                    "SCHOOL_ADMIN"
            ));
        }

        TenantUserAccountEntity user = tenantUserAccountRepository
                .findBySchoolCodeIgnoreCaseAndEmailIgnoreCaseAndActiveTrue(schoolCode, email)
                .filter(a -> a.getAccountStatus() == AccountStatus.ACTIVE)
                .orElse(null);
        if (user != null) {
            return Optional.of(new AccountRef(
                    user.getAccountId(),
                    user.getTenantId(),
                    user.getSchoolId(),
                    "TENANT_USER"
            ));
        }

        return Optional.empty();
    }

    private String generateSixDigitCode() {
        int code = 100_000 + random.nextInt(900_000);
        return String.valueOf(code);
    }

    private static String safeUpper(String value) {
        return value == null ? "" : value.trim().toUpperCase(Locale.ROOT);
    }

    private static String safeLower(String value) {
        return value == null ? "" : value.trim().toLowerCase(Locale.ROOT);
    }

    private record AccountRef(UUID accountId, UUID tenantId, UUID schoolId, String accountType) {}
}

