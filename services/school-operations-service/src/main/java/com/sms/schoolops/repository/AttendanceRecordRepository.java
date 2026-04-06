package com.sms.schoolops.repository;

import com.sms.schoolops.domain.AttendanceRecordEntity;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.time.LocalDate;
import java.util.UUID;

public interface AttendanceRecordRepository extends JpaRepository<AttendanceRecordEntity, UUID> {
    List<AttendanceRecordEntity> findBySchoolIdOrderByAttendanceDateDescCreatedAtDesc(UUID schoolId);
    List<AttendanceRecordEntity> findBySchoolIdAndClassIdOrderByAttendanceDateDescCreatedAtDesc(UUID schoolId, UUID classId);
    List<AttendanceRecordEntity> findBySchoolIdAndTeacherUserIdOrderByAttendanceDateDescCreatedAtDesc(UUID schoolId, UUID teacherUserId);
    List<AttendanceRecordEntity> findBySchoolIdAndAttendanceDateOrderByCreatedAtDesc(UUID schoolId, LocalDate attendanceDate);
    List<AttendanceRecordEntity> findBySchoolIdAndAttendanceDateBetweenOrderByAttendanceDateAsc(UUID schoolId, LocalDate fromDate, LocalDate toDate);
    List<AttendanceRecordEntity> findBySchoolIdAndUserIdOrderByAttendanceDateDescCreatedAtDesc(UUID schoolId, UUID userId);
    List<AttendanceRecordEntity> findBySchoolIdAndUserIdAndAttendanceDateAfter(UUID schoolId, UUID userId, LocalDate date);
}
