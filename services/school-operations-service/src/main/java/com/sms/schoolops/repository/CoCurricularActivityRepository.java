package com.sms.schoolops.repository;

import com.sms.schoolops.domain.CoCurricularActivityEntity;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface CoCurricularActivityRepository extends JpaRepository<CoCurricularActivityEntity, UUID> {
    List<CoCurricularActivityEntity> findBySchoolIdOrderByEventDateDesc(UUID schoolId);
}
