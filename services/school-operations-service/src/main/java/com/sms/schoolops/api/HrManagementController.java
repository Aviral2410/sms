package com.sms.schoolops.api;

import com.sms.schoolops.api.HrManagementDtos.LeaveRequestActionRequest;
import com.sms.schoolops.api.HrManagementDtos.LeaveRequestCreateRequest;
import com.sms.schoolops.api.HrManagementDtos.LeaveRequestResponse;
import com.sms.schoolops.domain.LeaveRequestStatus;
import com.sms.schoolops.service.HrActor;
import com.sms.schoolops.service.HrManagementService;
import jakarta.validation.Valid;
import java.util.List;
import java.util.UUID;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/school-ops/hr")
public class HrManagementController {
    private final HrManagementService hrManagementService;

    public HrManagementController(HrManagementService hrManagementService) {
        this.hrManagementService = hrManagementService;
    }

    @PostMapping("/leaves")
    public LeaveRequestResponse createLeaveRequest(
            @RequestHeader("X-User-ID") String userIdHeader,
            @RequestHeader("X-School-ID") String schoolIdHeader,
            @RequestHeader(value = "X-Tenant-ID", required = false) String tenantIdHeader,
            @RequestHeader(value = "X-User-Email", required = false) String emailHeader,
            @RequestHeader(value = "X-User-Role", required = false) String roleHeader,
            @Valid @RequestBody LeaveRequestCreateRequest request
    ) {
        HrActor actor = hrManagementService.resolveActor(userIdHeader, schoolIdHeader, tenantIdHeader, emailHeader, roleHeader);
        return hrManagementService.createLeaveRequest(actor, request);
    }

    @GetMapping("/leaves/my")
    public List<LeaveRequestResponse> listMyLeaveRequests(
            @RequestHeader("X-User-ID") String userIdHeader,
            @RequestHeader("X-School-ID") String schoolIdHeader,
            @RequestHeader(value = "X-Tenant-ID", required = false) String tenantIdHeader,
            @RequestHeader(value = "X-User-Email", required = false) String emailHeader,
            @RequestHeader(value = "X-User-Role", required = false) String roleHeader
    ) {
        HrActor actor = hrManagementService.resolveActor(userIdHeader, schoolIdHeader, tenantIdHeader, emailHeader, roleHeader);
        return hrManagementService.listMyLeaveRequests(actor);
    }

    @GetMapping("/leaves")
    public List<LeaveRequestResponse> listLeaveRequests(
            @RequestHeader("X-User-ID") String userIdHeader,
            @RequestHeader("X-School-ID") String schoolIdHeader,
            @RequestHeader(value = "X-Tenant-ID", required = false) String tenantIdHeader,
            @RequestHeader(value = "X-User-Email", required = false) String emailHeader,
            @RequestHeader(value = "X-User-Role", required = false) String roleHeader,
            @RequestParam(required = false) LeaveRequestStatus status
    ) {
        HrActor actor = hrManagementService.resolveActor(userIdHeader, schoolIdHeader, tenantIdHeader, emailHeader, roleHeader);
        return hrManagementService.listLeaveRequests(actor, status);
    }

    @PostMapping("/leaves/{leaveRequestId}/approve")
    public LeaveRequestResponse approveLeaveRequest(
            @RequestHeader("X-User-ID") String userIdHeader,
            @RequestHeader("X-School-ID") String schoolIdHeader,
            @RequestHeader(value = "X-Tenant-ID", required = false) String tenantIdHeader,
            @RequestHeader(value = "X-User-Email", required = false) String emailHeader,
            @RequestHeader(value = "X-User-Role", required = false) String roleHeader,
            @PathVariable UUID leaveRequestId,
            @Valid @RequestBody LeaveRequestActionRequest request
    ) {
        HrActor actor = hrManagementService.resolveActor(userIdHeader, schoolIdHeader, tenantIdHeader, emailHeader, roleHeader);
        return hrManagementService.approveLeaveRequest(actor, leaveRequestId, request);
    }

    @PostMapping("/leaves/{leaveRequestId}/reject")
    public LeaveRequestResponse rejectLeaveRequest(
            @RequestHeader("X-User-ID") String userIdHeader,
            @RequestHeader("X-School-ID") String schoolIdHeader,
            @RequestHeader(value = "X-Tenant-ID", required = false) String tenantIdHeader,
            @RequestHeader(value = "X-User-Email", required = false) String emailHeader,
            @RequestHeader(value = "X-User-Role", required = false) String roleHeader,
            @PathVariable UUID leaveRequestId,
            @Valid @RequestBody LeaveRequestActionRequest request
    ) {
        HrActor actor = hrManagementService.resolveActor(userIdHeader, schoolIdHeader, tenantIdHeader, emailHeader, roleHeader);
        return hrManagementService.rejectLeaveRequest(actor, leaveRequestId, request);
    }

    @PostMapping("/leaves/{leaveRequestId}/cancel")
    public LeaveRequestResponse cancelLeaveRequest(
            @RequestHeader("X-User-ID") String userIdHeader,
            @RequestHeader("X-School-ID") String schoolIdHeader,
            @RequestHeader(value = "X-Tenant-ID", required = false) String tenantIdHeader,
            @RequestHeader(value = "X-User-Email", required = false) String emailHeader,
            @RequestHeader(value = "X-User-Role", required = false) String roleHeader,
            @PathVariable UUID leaveRequestId
    ) {
        HrActor actor = hrManagementService.resolveActor(userIdHeader, schoolIdHeader, tenantIdHeader, emailHeader, roleHeader);
        return hrManagementService.cancelLeaveRequest(actor, leaveRequestId);
    }
}

