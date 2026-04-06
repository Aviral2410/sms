package com.sms.auth.repository;

import com.sms.auth.domain.TenantUserAccountEntity;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface TenantUserAccountRepository extends JpaRepository<TenantUserAccountEntity, UUID> {

    Optional<TenantUserAccountEntity> findBySchoolCodeIgnoreCaseAndEmailIgnoreCaseAndActiveTrue(String schoolCode, String email);

    List<TenantUserAccountEntity> findBySchoolIdOrderByRoleNameAscFullNameAsc(UUID schoolId);

    Optional<TenantUserAccountEntity> findByEmailIgnoreCase(String email);
}
