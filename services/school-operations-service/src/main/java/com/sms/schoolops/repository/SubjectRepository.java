package com.sms.schoolops.repository;

import com.sms.schoolops.domain.SubjectEntity;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface SubjectRepository extends JpaRepository<SubjectEntity, UUID> {
    List<SubjectEntity> findBySchoolIdOrderBySubjectNameAsc(UUID schoolId);
}
