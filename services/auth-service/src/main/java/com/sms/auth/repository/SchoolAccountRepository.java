package com.sms.auth.repository;

import com.sms.auth.domain.SchoolAccountEntity;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;
import java.util.UUID;

public interface SchoolAccountRepository extends JpaRepository<SchoolAccountEntity, UUID> {

    Optional<SchoolAccountEntity> findBySchoolCodeIgnoreCaseAndEmailIgnoreCaseAndActiveTrue(String schoolCode, String email);

    Optional<SchoolAccountEntity> findBySchoolCodeIgnoreCase(String schoolCode);

    Optional<SchoolAccountEntity> findBySchoolCodeIgnoreCaseAndEmailIgnoreCase(String schoolCode, String email);

    Optional<SchoolAccountEntity> findByEmailIgnoreCase(String email);
}
