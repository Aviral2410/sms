package com.sms.auth.repository;

import com.sms.auth.domain.AccountActivationTokenEntity;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;
import java.util.UUID;
import java.util.List;

public interface AccountActivationTokenRepository extends JpaRepository<AccountActivationTokenEntity, UUID> {

    Optional<AccountActivationTokenEntity> findBySchoolCodeIgnoreCaseAndEmailIgnoreCaseAndActivationCode(
            String schoolCode,
            String email,
            String activationCode
    );

    Optional<AccountActivationTokenEntity> findFirstBySchoolCodeIgnoreCaseAndEmailIgnoreCaseAndConsumedAtIsNullOrderByExpiresAtDesc(
            String schoolCode,
            String email
    );

    List<AccountActivationTokenEntity> findByAccountIdAndConsumedAtIsNull(UUID accountId);
}
