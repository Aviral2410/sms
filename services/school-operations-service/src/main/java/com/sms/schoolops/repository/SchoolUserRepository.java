package com.sms.schoolops.repository;

import com.sms.schoolops.domain.SchoolUserEntity;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface SchoolUserRepository extends JpaRepository<SchoolUserEntity, UUID> {
    List<SchoolUserEntity> findBySchoolIdOrderByRoleNameAscFullNameAsc(UUID schoolId);
    java.util.Optional<SchoolUserEntity> findBySchoolIdAndEmail(UUID schoolId, String email);
    java.util.Optional<SchoolUserEntity> findByEmailIgnoreCase(String email);
}
