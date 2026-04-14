package com.sms.schoolops.repository;

import com.sms.schoolops.domain.LeaveRequestStatus;
import com.sms.schoolops.domain.StaffLeaveRequestEntity;
import java.util.List;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface StaffLeaveRequestRepository extends JpaRepository<StaffLeaveRequestEntity, UUID> {
    java.util.Optional<StaffLeaveRequestEntity> findBySchoolIdAndLeaveRequestId(UUID schoolId, UUID leaveRequestId);
    List<StaffLeaveRequestEntity> findBySchoolIdOrderByCreatedAtDesc(UUID schoolId);
    List<StaffLeaveRequestEntity> findBySchoolIdAndStatusOrderByCreatedAtDesc(UUID schoolId, LeaveRequestStatus status);
    List<StaffLeaveRequestEntity> findBySchoolIdAndRequesterUserIdOrderByCreatedAtDesc(UUID schoolId, UUID requesterUserId);
}
