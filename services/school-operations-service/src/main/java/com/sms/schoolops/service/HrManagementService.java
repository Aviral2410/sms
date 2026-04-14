package com.sms.schoolops.service;

import com.sms.common.exception.ForbiddenException;
import com.sms.common.exception.NotFoundException;
import com.sms.schoolops.api.HrManagementDtos.LeaveRequestActionRequest;
import com.sms.schoolops.api.HrManagementDtos.LeaveRequestCreateRequest;
import com.sms.schoolops.api.HrManagementDtos.LeaveRequestResponse;
import com.sms.schoolops.domain.LeaveRequestStatus;
import com.sms.schoolops.domain.SchoolUserEntity;
import com.sms.schoolops.domain.StaffLeaveRequestEntity;
import com.sms.schoolops.repository.SchoolUserRepository;
import com.sms.schoolops.repository.StaffLeaveRequestRepository;
import java.time.Instant;
import java.time.LocalDate;
import java.util.List;
import java.util.Locale;
import java.util.Set;
import java.util.UUID;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class HrManagementService {
    private static final Logger logger = LoggerFactory.getLogger(HrManagementService.class);

    private static final Set<String> HR_ADMIN_ROLES = Set.of("SCHOOL_ADMIN", "PRINCIPAL", "MANAGER");

    private final StaffLeaveRequestRepository staffLeaveRequestRepository;
    private final SchoolUserRepository schoolUserRepository;

    public HrManagementService(StaffLeaveRequestRepository staffLeaveRequestRepository, SchoolUserRepository schoolUserRepository) {
        this.staffLeaveRequestRepository = staffLeaveRequestRepository;
        this.schoolUserRepository = schoolUserRepository;
    }

    @Transactional
    public LeaveRequestResponse createLeaveRequest(HrActor actor, LeaveRequestCreateRequest request) {
        requireActor(actor);
        validateDateRange(request.startDate(), request.endDate());

        // Ensure requester exists in this school context (hibernate filter scopes it).
        SchoolUserEntity requester = this.schoolUserRepository.findBySchoolIdAndUserId(actor.schoolId(), actor.userId())
                .orElseThrow(() -> new NotFoundException("User not found for this school."));

        StaffLeaveRequestEntity entity = new StaffLeaveRequestEntity();
        entity.setLeaveRequestId(UUID.randomUUID());
        entity.setSchoolId(actor.schoolId());
        entity.setRequesterUserId(requester.getUserId());
        entity.setRequesterRole(actor.roleName());
        entity.setLeaveType(request.leaveType());
        entity.setStartDate(request.startDate());
        entity.setEndDate(request.endDate());
        entity.setReason(blankToNull(request.reason()));
        entity.setStatus(LeaveRequestStatus.PENDING);
        entity.setCreatedAt(Instant.now());
        entity.setUpdatedAt(entity.getCreatedAt());

        this.staffLeaveRequestRepository.save(entity);

        logger.info("HR leave request created. schoolId={} requesterUserId={} role={} leaveType={} startDate={} endDate={}",
                actor.schoolId(), actor.userId(), actor.roleName(), request.leaveType(), request.startDate(), request.endDate());

        return toResponse(entity);
    }

    public List<LeaveRequestResponse> listMyLeaveRequests(HrActor actor) {
        requireActor(actor);
        return this.staffLeaveRequestRepository
                .findBySchoolIdAndRequesterUserIdOrderByCreatedAtDesc(actor.schoolId(), actor.userId())
                .stream()
                .map(this::toResponse)
                .toList();
    }

    public List<LeaveRequestResponse> listLeaveRequests(HrActor actor, LeaveRequestStatus status) {
        requireActor(actor);
        requireHrAdmin(actor);

        List<StaffLeaveRequestEntity> rows = status == null
                ? this.staffLeaveRequestRepository.findBySchoolIdOrderByCreatedAtDesc(actor.schoolId())
                : this.staffLeaveRequestRepository.findBySchoolIdAndStatusOrderByCreatedAtDesc(actor.schoolId(), status);

        return rows.stream().map(this::toResponse).toList();
    }

    @Transactional
    public LeaveRequestResponse approveLeaveRequest(HrActor actor, UUID leaveRequestId, LeaveRequestActionRequest request) {
        requireActor(actor);
        requireHrAdmin(actor);

        StaffLeaveRequestEntity entity = this.staffLeaveRequestRepository.findBySchoolIdAndLeaveRequestId(actor.schoolId(), leaveRequestId)
                .orElseThrow(() -> new NotFoundException("Leave request not found."));

        if (entity.getStatus() != LeaveRequestStatus.PENDING) {
            throw new IllegalArgumentException("Only PENDING leave requests can be approved.");
        }

        entity.setStatus(LeaveRequestStatus.APPROVED);
        entity.setReviewedByUserId(actor.userId());
        entity.setReviewNote(blankToNull(request.note()));
        entity.setReviewedAt(Instant.now());
        entity.setUpdatedAt(entity.getReviewedAt());

        this.staffLeaveRequestRepository.save(entity);

        logger.info("HR leave request approved. schoolId={} leaveRequestId={} reviewerUserId={}",
                actor.schoolId(), leaveRequestId, actor.userId());

        return toResponse(entity);
    }

    @Transactional
    public LeaveRequestResponse rejectLeaveRequest(HrActor actor, UUID leaveRequestId, LeaveRequestActionRequest request) {
        requireActor(actor);
        requireHrAdmin(actor);

        StaffLeaveRequestEntity entity = this.staffLeaveRequestRepository.findBySchoolIdAndLeaveRequestId(actor.schoolId(), leaveRequestId)
                .orElseThrow(() -> new NotFoundException("Leave request not found."));

        if (entity.getStatus() != LeaveRequestStatus.PENDING) {
            throw new IllegalArgumentException("Only PENDING leave requests can be rejected.");
        }

        entity.setStatus(LeaveRequestStatus.REJECTED);
        entity.setReviewedByUserId(actor.userId());
        entity.setReviewNote(blankToNull(request.note()));
        entity.setReviewedAt(Instant.now());
        entity.setUpdatedAt(entity.getReviewedAt());

        this.staffLeaveRequestRepository.save(entity);

        logger.info("HR leave request rejected. schoolId={} leaveRequestId={} reviewerUserId={}",
                actor.schoolId(), leaveRequestId, actor.userId());

        return toResponse(entity);
    }

    @Transactional
    public LeaveRequestResponse cancelLeaveRequest(HrActor actor, UUID leaveRequestId) {
        requireActor(actor);

        StaffLeaveRequestEntity entity = this.staffLeaveRequestRepository.findBySchoolIdAndLeaveRequestId(actor.schoolId(), leaveRequestId)
                .orElseThrow(() -> new NotFoundException("Leave request not found."));

        if (!entity.getRequesterUserId().equals(actor.userId())) {
            throw new ForbiddenException("You can only cancel your own leave requests.");
        }
        if (entity.getStatus() != LeaveRequestStatus.PENDING) {
            throw new IllegalArgumentException("Only PENDING leave requests can be canceled.");
        }

        entity.setStatus(LeaveRequestStatus.CANCELED);
        entity.setUpdatedAt(Instant.now());
        this.staffLeaveRequestRepository.save(entity);

        logger.info("HR leave request canceled. schoolId={} leaveRequestId={} requesterUserId={}",
                actor.schoolId(), leaveRequestId, actor.userId());

        return toResponse(entity);
    }

    public HrActor resolveActor(String userIdHeader, String schoolIdHeader, String tenantIdHeader, String emailHeader, String roleHeader) {
        UUID userId = parseUuid(userIdHeader, "Missing or invalid X-User-ID header.");
        UUID schoolId = parseUuid(schoolIdHeader, "Missing or invalid X-School-ID header.");
        UUID tenantId = tenantIdHeader == null || tenantIdHeader.isBlank() ? null : safeParseUuid(tenantIdHeader.trim());
        String role = roleHeader == null ? "" : roleHeader.trim().toUpperCase(Locale.ROOT);
        String email = emailHeader == null || emailHeader.isBlank() ? null : emailHeader.trim();
        return new HrActor(tenantId, schoolId, userId, email, role);
    }

    private void requireActor(HrActor actor) {
        if (actor == null) throw new IllegalArgumentException("Missing actor context.");
        if (actor.schoolId() == null) throw new IllegalArgumentException("Missing school context.");
        if (actor.userId() == null) throw new IllegalArgumentException("Missing user context.");
        if (actor.roleName() == null || actor.roleName().isBlank()) throw new IllegalArgumentException("Missing role context.");
    }

    private void requireHrAdmin(HrActor actor) {
        String role = actor.roleName() == null ? "" : actor.roleName().trim().toUpperCase(Locale.ROOT);
        if (!HR_ADMIN_ROLES.contains(role)) {
            throw new ForbiddenException("You do not have permission to manage leave requests.");
        }
    }

    private void validateDateRange(LocalDate start, LocalDate end) {
        if (start == null || end == null) {
            throw new IllegalArgumentException("startDate and endDate are required.");
        }
        if (end.isBefore(start)) {
            throw new IllegalArgumentException("endDate must be on or after startDate.");
        }
        if (end.isAfter(start.plusDays(60))) {
            // Guardrails for MVP; real policy belongs in HR settings.
            throw new IllegalArgumentException("Leave range is too long for a single request.");
        }
    }

    private UUID parseUuid(String raw, String error) {
        if (raw == null || raw.isBlank()) throw new IllegalArgumentException(error);
        UUID parsed = safeParseUuid(raw.trim());
        if (parsed == null) throw new IllegalArgumentException(error);
        return parsed;
    }

    private UUID safeParseUuid(String raw) {
        try {
            return UUID.fromString(raw);
        } catch (IllegalArgumentException ex) {
            return null;
        }
    }

    private String blankToNull(String value) {
        return value == null || value.isBlank() ? null : value.trim();
    }

    private LeaveRequestResponse toResponse(StaffLeaveRequestEntity entity) {
        return new LeaveRequestResponse(
                entity.getLeaveRequestId(),
                entity.getSchoolId(),
                entity.getRequesterUserId(),
                entity.getRequesterRole(),
                entity.getLeaveType(),
                entity.getStartDate(),
                entity.getEndDate(),
                entity.getReason(),
                entity.getStatus(),
                entity.getReviewedByUserId(),
                entity.getReviewNote(),
                entity.getReviewedAt(),
                entity.getCreatedAt(),
                entity.getUpdatedAt()
        );
    }
}
