package com.sms.schoolops.repository;

import com.sms.schoolops.domain.AttendanceSessionEntity;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface AttendanceSessionRepository extends JpaRepository<AttendanceSessionEntity, UUID> {
    Optional<AttendanceSessionEntity> findBySchoolIdAndClassIdAndSubjectIdAndAttendanceDateAndPeriodNumber(
            UUID schoolId,
            UUID classId,
            UUID subjectId,
            LocalDate attendanceDate,
            Integer periodNumber
    );

    List<AttendanceSessionEntity> findBySchoolIdAndClassIdOrderByAttendanceDateDescPeriodNumberDesc(UUID schoolId, UUID classId);
    List<AttendanceSessionEntity> findBySchoolIdAndTeacherUserIdOrderByAttendanceDateDescPeriodNumberDesc(UUID schoolId, UUID teacherUserId);
    List<AttendanceSessionEntity> findBySchoolIdAndAttendanceDateBetweenOrderByAttendanceDateDescPeriodNumberDesc(UUID schoolId, LocalDate fromDate, LocalDate toDate);
}
