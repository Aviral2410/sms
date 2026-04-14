package com.sms.auth.repository;

import com.sms.auth.domain.AdminAccountEntity;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface AdminAccountRepository extends JpaRepository<AdminAccountEntity, String> {

    Optional<AdminAccountEntity> findByEmailIgnoreCaseAndActiveTrue(String email);
}
