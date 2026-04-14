package com.sms.schoolops.repository;

import com.sms.schoolops.domain.StudentMonitoringReportEntity;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface StudentMonitoringReportRepository extends JpaRepository<StudentMonitoringReportEntity, UUID> {
    List<StudentMonitoringReportEntity> findBySchoolIdOrderByCreatedAtDesc(UUID schoolId);
}
