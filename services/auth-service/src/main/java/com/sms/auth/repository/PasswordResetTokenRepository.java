package com.sms.auth.repository;

import com.sms.auth.domain.PasswordResetTokenEntity;
import java.time.Instant;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface PasswordResetTokenRepository extends JpaRepository<PasswordResetTokenEntity, UUID> {

    Optional<PasswordResetTokenEntity> findTopBySchoolCodeIgnoreCaseAndEmailIgnoreCaseAndConsumedAtIsNullOrderByCreatedAtDesc(
            String schoolCode,
            String email
    );

    long deleteByExpiresAtBefore(Instant cutoff);
}

