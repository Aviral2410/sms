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
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.Optional;

@Service
public class AccountActivationService {

    private final AccountActivationTokenRepository accountActivationTokenRepository;
    private final SchoolAccountRepository schoolAccountRepository;
    private final TenantUserAccountRepository tenantUserAccountRepository;

    public AccountActivationService(
            AccountActivationTokenRepository accountActivationTokenRepository,
            SchoolAccountRepository schoolAccountRepository,
            TenantUserAccountRepository tenantUserAccountRepository
    ) {
        this.accountActivationTokenRepository = accountActivationTokenRepository;
        this.schoolAccountRepository = schoolAccountRepository;
        this.tenantUserAccountRepository = tenantUserAccountRepository;
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
            account.setPassword(request.newPassword());
            account.setActive(true);
            account.setAccountStatus(AccountStatus.ACTIVE);
            schoolAccountRepository.save(account);
            token.setConsumedAt(Instant.now());
            accountActivationTokenRepository.save(token);
            return new SchoolActivationResponse(account.getSchoolCode(), account.getEmail(), account.getFullName(), account.getAccountStatus().name());
        }

        TenantUserAccountEntity account = tenantUserAccountRepository.findById(token.getAccountId())
                .orElseThrow(InvalidActivationCodeException::new);
        account.setPassword(request.newPassword());
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
