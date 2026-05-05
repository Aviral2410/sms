package com.sms.auth.service;

import com.sms.auth.api.SchoolActivationRequest;
import com.sms.auth.api.SchoolActivationResponse;
import com.sms.auth.api.ActivationDetailsResponse;
import com.sms.auth.domain.AccountActivationTokenEntity;
import com.sms.auth.domain.AccountStatus;
import com.sms.auth.domain.SchoolAccountEntity;
import com.sms.auth.domain.TenantUserAccountEntity;
import com.sms.auth.repository.AccountActivationTokenRepository;
import com.sms.auth.repository.SchoolAccountRepository;
import com.sms.auth.repository.TenantUserAccountRepository;
import com.sms.auth.security.PasswordService;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.Optional;

@Service
public class AccountActivationService {

    private final AccountActivationTokenRepository accountActivationTokenRepository;
    private final SchoolAccountRepository schoolAccountRepository;
    private final TenantUserAccountRepository tenantUserAccountRepository;
    private final PasswordService passwordService;
    private final org.springframework.web.client.RestClient onboardingRestClient;

    public AccountActivationService(
            AccountActivationTokenRepository accountActivationTokenRepository,
            SchoolAccountRepository schoolAccountRepository,
            TenantUserAccountRepository tenantUserAccountRepository,
            PasswordService passwordService,
            org.springframework.web.client.RestClient.Builder restClientBuilder,
            @org.springframework.beans.factory.annotation.Value("${app.school-onboarding-service-url:http://school-onboarding-service:8081}") String onboardingServiceUrl
    ) {
        this.accountActivationTokenRepository = accountActivationTokenRepository;
        this.schoolAccountRepository = schoolAccountRepository;
        this.tenantUserAccountRepository = tenantUserAccountRepository;
        this.passwordService = passwordService;
        this.onboardingRestClient = restClientBuilder.baseUrl(onboardingServiceUrl).build();
    }

    @Transactional
    public SchoolActivationResponse activate(SchoolActivationRequest request) {
        AccountActivationTokenEntity token = accountActivationTokenRepository
                .findBySchoolCodeIgnoreCaseAndEmailIgnoreCaseAndActivationCode(
                        request.schoolCode(),
                        request.email(),
                        request.activationCode()
                )
                .filter(candidate -> candidate.getConsumedAt() == null && candidate.getExpiresAt().isAfter(Instant.now()))
                .orElseThrow(InvalidActivationCodeException::new);

        Optional<SchoolAccountEntity> schoolAccount = schoolAccountRepository.findById(token.getAccountId());
        if (schoolAccount.isPresent()) {
            SchoolAccountEntity account = schoolAccount.get();
            account.setPassword(passwordService.hash(request.newPassword()));
            account.setActive(true);
            account.setAccountStatus(AccountStatus.ACTIVE);
            schoolAccountRepository.save(account);
            token.setConsumedAt(Instant.now());
            accountActivationTokenRepository.save(token);

            // Notify onboarding service that the school admin has activated
            try {
                onboardingRestClient.post()
                        .uri(uriBuilder -> uriBuilder
                                .path("/api/v1/onboarding/schools/internal/mark-activated")
                                .queryParam("schoolCode", account.getSchoolCode())
                                .queryParam("email", account.getEmail())
                                .build())
                        .retrieve()
                        .toBodilessEntity();
            } catch (Exception e) {
                // Log and continue, as auth activation is the source of truth for login
                org.slf4j.LoggerFactory.getLogger(AccountActivationService.class)
                        .warn("Failed to notify onboarding service of activation for {}: {}", account.getSchoolCode(), e.getMessage());
            }

            return new SchoolActivationResponse(account.getSchoolCode(), account.getEmail(), account.getFullName(), account.getAccountStatus().name());
        }

        TenantUserAccountEntity account = tenantUserAccountRepository.findById(token.getAccountId())
                .orElseThrow(InvalidActivationCodeException::new);
        account.setPassword(passwordService.hash(request.newPassword()));
        account.setActive(true);
        account.setAccountStatus(AccountStatus.ACTIVE);
        tenantUserAccountRepository.save(account);
        token.setConsumedAt(Instant.now());
        accountActivationTokenRepository.save(token);
        return new SchoolActivationResponse(account.getSchoolCode(), account.getEmail(), account.getFullName(), account.getAccountStatus().name());
    }

    @Transactional(readOnly = true)
    public ActivationDetailsResponse getActiveActivationDetails(String schoolCode, String email) {
        AccountActivationTokenEntity token = accountActivationTokenRepository
                .findFirstBySchoolCodeIgnoreCaseAndEmailIgnoreCaseAndConsumedAtIsNullOrderByExpiresAtDesc(schoolCode, email)
                .filter(candidate -> candidate.getExpiresAt().isAfter(Instant.now()))
                .orElseThrow(() -> new ActivationDetailsNotFoundException(schoolCode, email));

        return new ActivationDetailsResponse(token.getSchoolCode(), token.getEmail(), token.getActivationCode(), token.getExpiresAt());
    }

    @Transactional
    public ActivationDetailsResponse regenerateSchoolAdminActivationCode(String schoolCode, String email) {
        SchoolAccountEntity account = schoolAccountRepository
                .findBySchoolCodeIgnoreCaseAndEmailIgnoreCase(schoolCode, email)
                .orElseThrow(() -> new ActivationDetailsNotFoundException(schoolCode, email));

        accountActivationTokenRepository.findByAccountIdAndConsumedAtIsNull(account.getAccountId())
                .forEach(token -> {
                    token.setConsumedAt(Instant.now());
                    accountActivationTokenRepository.save(token);
                });

        AccountActivationTokenEntity token = new AccountActivationTokenEntity();
        token.setTokenId(java.util.UUID.randomUUID());
        token.setAccountId(account.getAccountId());
        token.setSchoolCode(account.getSchoolCode());
        token.setEmail(account.getEmail());
        token.setActivationCode(java.util.UUID.randomUUID().toString().substring(0, 8).toUpperCase());
        token.setExpiresAt(Instant.now().plusSeconds(60L * 60L * 24L * 3L));
        token.setConsumedAt(null);
        accountActivationTokenRepository.save(token);

        return new ActivationDetailsResponse(token.getSchoolCode(), token.getEmail(), token.getActivationCode(), token.getExpiresAt());
    }
}
