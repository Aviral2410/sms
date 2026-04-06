package com.sms.auth.repository;

import com.sms.auth.domain.TenantEntity;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;
import java.util.UUID;

public interface TenantRepository extends JpaRepository<TenantEntity, UUID> {

    Optional<TenantEntity> findBySchoolCodeIgnoreCase(String schoolCode);
}
