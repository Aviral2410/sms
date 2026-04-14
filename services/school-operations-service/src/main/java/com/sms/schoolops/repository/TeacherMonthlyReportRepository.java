package com.sms.schoolops.repository;

import com.sms.schoolops.domain.TeacherMonthlyReportEntity;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface TeacherMonthlyReportRepository extends JpaRepository<TeacherMonthlyReportEntity, UUID> {
    List<TeacherMonthlyReportEntity> findBySchoolIdOrderByCreatedAtDesc(UUID schoolId);
}
