package com.sms.schoolops.api;

import com.sms.schoolops.domain.LeaveRequestStatus;
import com.sms.schoolops.domain.LeaveType;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;

public class HrManagementDtos {
    public record LeaveRequestCreateRequest(
            @NotNull LeaveType leaveType,
            @NotNull LocalDate startDate,
            @NotNull LocalDate endDate,
            String reason
    ) {}

    public record LeaveRequestActionRequest(
            @NotBlank String note
    ) {}

    public record LeaveRequestResponse(
            UUID leaveRequestId,
            UUID schoolId,
            UUID requesterUserId,
            String requesterRole,
            LeaveType leaveType,
            LocalDate startDate,
            LocalDate endDate,
            String reason,
            LeaveRequestStatus status,
            UUID reviewedByUserId,
            String reviewNote,
            Instant reviewedAt,
            Instant createdAt,
            Instant updatedAt
    ) {}
}

