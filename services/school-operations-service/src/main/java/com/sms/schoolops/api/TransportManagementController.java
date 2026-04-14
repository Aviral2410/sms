package com.sms.schoolops.api;

import static com.sms.schoolops.api.TransportManagementDtos.*;

import com.sms.schoolops.service.TransportManagementService;
import jakarta.validation.Valid;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/school-ops/transport")
public class TransportManagementController {
    private final TransportManagementService transportManagementService;

    public TransportManagementController(TransportManagementService transportManagementService) {
        this.transportManagementService = transportManagementService;
    }

    @GetMapping("/policy")
    public TransportPolicyResponse getPolicy(
            @RequestHeader("X-User-ID") String userId,
            @RequestHeader("X-School-ID") String schoolId,
            @RequestHeader(value = "X-Tenant-ID", required = false) String tenantId,
            @RequestHeader(value = "X-User-Email", required = false) String email,
            @RequestHeader(value = "X-User-Role", required = false) String role
    ) {
        return this.transportManagementService.getPolicy(actor(userId, schoolId, tenantId, email, role));
    }

    @PatchMapping("/policy")
    public TransportPolicyResponse updatePolicy(
            @RequestHeader("X-User-ID") String userId,
            @RequestHeader("X-School-ID") String schoolId,
            @RequestHeader(value = "X-Tenant-ID", required = false) String tenantId,
            @RequestHeader(value = "X-User-Email", required = false) String email,
            @RequestHeader(value = "X-User-Role", required = false) String role,
            @Valid @RequestBody TransportPolicyUpdateRequest request
    ) {
        return this.transportManagementService.updatePolicy(actor(userId, schoolId, tenantId, email, role), request);
    }

    @GetMapping("/dashboard")
    public TransportDashboardResponse getDashboard(
            @RequestHeader("X-User-ID") String userId,
            @RequestHeader("X-School-ID") String schoolId,
            @RequestHeader(value = "X-Tenant-ID", required = false) String tenantId,
            @RequestHeader(value = "X-User-Email", required = false) String email,
            @RequestHeader(value = "X-User-Role", required = false) String role,
            @RequestParam(required = false) LocalDate serviceDate,
            @RequestParam(required = false) String shiftType
    ) {
        return this.transportManagementService.getDashboard(actor(userId, schoolId, tenantId, email, role), serviceDate, shiftType);
    }

    @GetMapping("/live-map")
    public TransportDashboardResponse getLiveMap(
            @RequestHeader("X-User-ID") String userId,
            @RequestHeader("X-School-ID") String schoolId,
            @RequestHeader(value = "X-Tenant-ID", required = false) String tenantId,
            @RequestHeader(value = "X-User-Email", required = false) String email,
            @RequestHeader(value = "X-User-Role", required = false) String role,
            @RequestParam(required = false) LocalDate serviceDate,
            @RequestParam(required = false) String shiftType
    ) {
        return this.transportManagementService.getLiveMap(actor(userId, schoolId, tenantId, email, role), serviceDate, shiftType);
    }

    @GetMapping("/routes")
    public List<TransportRouteResponse> listRoutes(
            @RequestHeader("X-User-ID") String userId,
            @RequestHeader("X-School-ID") String schoolId,
            @RequestHeader(value = "X-Tenant-ID", required = false) String tenantId,
            @RequestHeader(value = "X-User-Email", required = false) String email,
            @RequestHeader(value = "X-User-Role", required = false) String role
    ) {
        return this.transportManagementService.listRoutes(actor(userId, schoolId, tenantId, email, role));
    }

    @GetMapping("/routes/{routeId}")
    public TransportRouteDetailResponse getRouteDetail(
            @RequestHeader("X-User-ID") String userId,
            @RequestHeader("X-School-ID") String schoolId,
            @RequestHeader(value = "X-Tenant-ID", required = false) String tenantId,
            @RequestHeader(value = "X-User-Email", required = false) String email,
            @RequestHeader(value = "X-User-Role", required = false) String role,
            @PathVariable UUID routeId
    ) {
        return this.transportManagementService.getRouteDetail(actor(userId, schoolId, tenantId, email, role), routeId);
    }

    @PostMapping("/routes")
    public TransportRouteResponse createRoute(
            @RequestHeader("X-User-ID") String userId,
            @RequestHeader("X-School-ID") String schoolId,
            @RequestHeader(value = "X-Tenant-ID", required = false) String tenantId,
            @RequestHeader(value = "X-User-Email", required = false) String email,
            @RequestHeader(value = "X-User-Role", required = false) String role,
            @Valid @RequestBody TransportRouteRequest request
    ) {
        return this.transportManagementService.createRoute(actor(userId, schoolId, tenantId, email, role), request);
    }

    @PutMapping("/routes/{routeId}")
    public TransportRouteResponse updateRoute(
            @RequestHeader("X-User-ID") String userId,
            @RequestHeader("X-School-ID") String schoolId,
            @RequestHeader(value = "X-Tenant-ID", required = false) String tenantId,
            @RequestHeader(value = "X-User-Email", required = false) String email,
            @RequestHeader(value = "X-User-Role", required = false) String role,
            @PathVariable UUID routeId,
            @Valid @RequestBody TransportRouteRequest request
    ) {
        return this.transportManagementService.updateRoute(actor(userId, schoolId, tenantId, email, role), routeId, request);
    }

    @DeleteMapping("/routes/{routeId}")
    public void deleteRoute(
            @RequestHeader("X-User-ID") String userId,
            @RequestHeader("X-School-ID") String schoolId,
            @RequestHeader(value = "X-Tenant-ID", required = false) String tenantId,
            @RequestHeader(value = "X-User-Email", required = false) String email,
            @RequestHeader(value = "X-User-Role", required = false) String role,
            @PathVariable UUID routeId
    ) {
        this.transportManagementService.deleteRoute(actor(userId, schoolId, tenantId, email, role), routeId);
    }

    @PostMapping("/stops")
    public TransportStopResponse createStop(
            @RequestHeader("X-User-ID") String userId,
            @RequestHeader("X-School-ID") String schoolId,
            @RequestHeader(value = "X-Tenant-ID", required = false) String tenantId,
            @RequestHeader(value = "X-User-Email", required = false) String email,
            @RequestHeader(value = "X-User-Role", required = false) String role,
            @Valid @RequestBody TransportStopRequest request
    ) {
        return this.transportManagementService.createStop(actor(userId, schoolId, tenantId, email, role), request);
    }

    @PutMapping("/stops/{stopId}")
    public TransportStopResponse updateStop(
            @RequestHeader("X-User-ID") String userId,
            @RequestHeader("X-School-ID") String schoolId,
            @RequestHeader(value = "X-Tenant-ID", required = false) String tenantId,
            @RequestHeader(value = "X-User-Email", required = false) String email,
            @RequestHeader(value = "X-User-Role", required = false) String role,
            @PathVariable UUID stopId,
            @Valid @RequestBody TransportStopRequest request
    ) {
        return this.transportManagementService.updateStop(actor(userId, schoolId, tenantId, email, role), stopId, request);
    }

    @DeleteMapping("/stops/{stopId}")
    public void deleteStop(
            @RequestHeader("X-User-ID") String userId,
            @RequestHeader("X-School-ID") String schoolId,
            @RequestHeader(value = "X-Tenant-ID", required = false) String tenantId,
            @RequestHeader(value = "X-User-Email", required = false) String email,
            @RequestHeader(value = "X-User-Role", required = false) String role,
            @PathVariable UUID stopId
    ) {
        this.transportManagementService.deleteStop(actor(userId, schoolId, tenantId, email, role), stopId);
    }

    @GetMapping("/vehicles")
    public List<TransportVehicleResponse> listVehicles(
            @RequestHeader("X-User-ID") String userId,
            @RequestHeader("X-School-ID") String schoolId,
            @RequestHeader(value = "X-Tenant-ID", required = false) String tenantId,
            @RequestHeader(value = "X-User-Email", required = false) String email,
            @RequestHeader(value = "X-User-Role", required = false) String role
    ) {
        return this.transportManagementService.listVehicles(actor(userId, schoolId, tenantId, email, role));
    }

    @PostMapping("/vehicles")
    public TransportVehicleResponse createVehicle(
            @RequestHeader("X-User-ID") String userId,
            @RequestHeader("X-School-ID") String schoolId,
            @RequestHeader(value = "X-Tenant-ID", required = false) String tenantId,
            @RequestHeader(value = "X-User-Email", required = false) String email,
            @RequestHeader(value = "X-User-Role", required = false) String role,
            @Valid @RequestBody TransportVehicleRequest request
    ) {
        return this.transportManagementService.createVehicle(actor(userId, schoolId, tenantId, email, role), request);
    }

    @PutMapping("/vehicles/{vehicleId}")
    public TransportVehicleResponse updateVehicle(
            @RequestHeader("X-User-ID") String userId,
            @RequestHeader("X-School-ID") String schoolId,
            @RequestHeader(value = "X-Tenant-ID", required = false) String tenantId,
            @RequestHeader(value = "X-User-Email", required = false) String email,
            @RequestHeader(value = "X-User-Role", required = false) String role,
            @PathVariable UUID vehicleId,
            @Valid @RequestBody TransportVehicleRequest request
    ) {
        return this.transportManagementService.updateVehicle(actor(userId, schoolId, tenantId, email, role), vehicleId, request);
    }

    @DeleteMapping("/vehicles/{vehicleId}")
    public void deleteVehicle(
            @RequestHeader("X-User-ID") String userId,
            @RequestHeader("X-School-ID") String schoolId,
            @RequestHeader(value = "X-Tenant-ID", required = false) String tenantId,
            @RequestHeader(value = "X-User-Email", required = false) String email,
            @RequestHeader(value = "X-User-Role", required = false) String role,
            @PathVariable UUID vehicleId
    ) {
        this.transportManagementService.deleteVehicle(actor(userId, schoolId, tenantId, email, role), vehicleId);
    }

    @PostMapping("/vehicles/{vehicleId}/documents")
    public TransportVehicleDocumentResponse addVehicleDocument(
            @RequestHeader("X-User-ID") String userId,
            @RequestHeader("X-School-ID") String schoolId,
            @RequestHeader(value = "X-Tenant-ID", required = false) String tenantId,
            @RequestHeader(value = "X-User-Email", required = false) String email,
            @RequestHeader(value = "X-User-Role", required = false) String role,
            @PathVariable UUID vehicleId,
            @Valid @RequestBody TransportVehicleDocumentRequest request
    ) {
        return this.transportManagementService.addVehicleDocument(actor(userId, schoolId, tenantId, email, role), vehicleId, request);
    }

    @GetMapping("/staff")
    public List<TransportStaffProfileResponse> listStaffProfiles(
            @RequestHeader("X-User-ID") String userId,
            @RequestHeader("X-School-ID") String schoolId,
            @RequestHeader(value = "X-Tenant-ID", required = false) String tenantId,
            @RequestHeader(value = "X-User-Email", required = false) String email,
            @RequestHeader(value = "X-User-Role", required = false) String role
    ) {
        return this.transportManagementService.listStaffProfiles(actor(userId, schoolId, tenantId, email, role));
    }

    @PostMapping("/staff/profiles")
    public TransportStaffProfileResponse upsertStaffProfile(
            @RequestHeader("X-User-ID") String userId,
            @RequestHeader("X-School-ID") String schoolId,
            @RequestHeader(value = "X-Tenant-ID", required = false) String tenantId,
            @RequestHeader(value = "X-User-Email", required = false) String email,
            @RequestHeader(value = "X-User-Role", required = false) String role,
            @Valid @RequestBody TransportStaffProfileRequest request
    ) {
        return this.transportManagementService.upsertStaffProfile(actor(userId, schoolId, tenantId, email, role), request);
    }

    @PostMapping("/student-assignments")
    public TransportStudentAssignmentResponse upsertStudentAssignment(
            @RequestHeader("X-User-ID") String userId,
            @RequestHeader("X-School-ID") String schoolId,
            @RequestHeader(value = "X-Tenant-ID", required = false) String tenantId,
            @RequestHeader(value = "X-User-Email", required = false) String email,
            @RequestHeader(value = "X-User-Role", required = false) String role,
            @Valid @RequestBody TransportStudentAssignmentRequest request
    ) {
        return this.transportManagementService.upsertStudentAssignment(actor(userId, schoolId, tenantId, email, role), request);
    }

    @DeleteMapping("/student-assignments/{studentUserId}")
    public void clearStudentAssignment(
            @RequestHeader("X-User-ID") String userId,
            @RequestHeader("X-School-ID") String schoolId,
            @RequestHeader(value = "X-Tenant-ID", required = false) String tenantId,
            @RequestHeader(value = "X-User-Email", required = false) String email,
            @RequestHeader(value = "X-User-Role", required = false) String role,
            @PathVariable UUID studentUserId
    ) {
        this.transportManagementService.clearStudentAssignment(actor(userId, schoolId, tenantId, email, role), UUID.fromString(schoolId), studentUserId);
    }

    @GetMapping("/subscriptions")
    public List<TransportUserSubscriptionResponse> listSubscriptions(
            @RequestHeader("X-User-ID") String userId,
            @RequestHeader("X-School-ID") String schoolId,
            @RequestHeader(value = "X-Tenant-ID", required = false) String tenantId,
            @RequestHeader(value = "X-User-Email", required = false) String email,
            @RequestHeader(value = "X-User-Role", required = false) String role
    ) {
        return this.transportManagementService.listSubscriptions(actor(userId, schoolId, tenantId, email, role));
    }

    @PostMapping("/subscriptions")
    public TransportUserSubscriptionResponse upsertSubscription(
            @RequestHeader("X-User-ID") String userId,
            @RequestHeader("X-School-ID") String schoolId,
            @RequestHeader(value = "X-Tenant-ID", required = false) String tenantId,
            @RequestHeader(value = "X-User-Email", required = false) String email,
            @RequestHeader(value = "X-User-Role", required = false) String role,
            @Valid @RequestBody TransportUserSubscriptionRequest request
    ) {
        return this.transportManagementService.upsertSubscription(actor(userId, schoolId, tenantId, email, role), request);
    }

    @DeleteMapping("/subscriptions/{subscriptionId}")
    public void deleteSubscription(
            @RequestHeader("X-User-ID") String userId,
            @RequestHeader("X-School-ID") String schoolId,
            @RequestHeader(value = "X-Tenant-ID", required = false) String tenantId,
            @RequestHeader(value = "X-User-Email", required = false) String email,
            @RequestHeader(value = "X-User-Role", required = false) String role,
            @PathVariable UUID subscriptionId
    ) {
        this.transportManagementService.deleteSubscription(actor(userId, schoolId, tenantId, email, role), subscriptionId);
    }

    @GetMapping("/assignments")
    public List<TransportRouteAssignmentResponse> listAssignments(
            @RequestHeader("X-User-ID") String userId,
            @RequestHeader("X-School-ID") String schoolId,
            @RequestHeader(value = "X-Tenant-ID", required = false) String tenantId,
            @RequestHeader(value = "X-User-Email", required = false) String email,
            @RequestHeader(value = "X-User-Role", required = false) String role,
            @RequestParam(required = false) LocalDate serviceDate
    ) {
        return this.transportManagementService.listAssignments(actor(userId, schoolId, tenantId, email, role), serviceDate);
    }

    @PostMapping("/route-assignments")
    public TransportRouteAssignmentResponse upsertRouteAssignment(
            @RequestHeader("X-User-ID") String userId,
            @RequestHeader("X-School-ID") String schoolId,
            @RequestHeader(value = "X-Tenant-ID", required = false) String tenantId,
            @RequestHeader(value = "X-User-Email", required = false) String email,
            @RequestHeader(value = "X-User-Role", required = false) String role,
            @Valid @RequestBody TransportRouteAssignmentRequest request
    ) {
        return this.transportManagementService.upsertRouteAssignment(actor(userId, schoolId, tenantId, email, role), request);
    }

    @DeleteMapping("/route-assignments/{assignmentId}")
    public void deleteRouteAssignment(
            @RequestHeader("X-User-ID") String userId,
            @RequestHeader("X-School-ID") String schoolId,
            @RequestHeader(value = "X-Tenant-ID", required = false) String tenantId,
            @RequestHeader(value = "X-User-Email", required = false) String email,
            @RequestHeader(value = "X-User-Role", required = false) String role,
            @PathVariable UUID assignmentId
    ) {
        this.transportManagementService.deleteRouteAssignment(actor(userId, schoolId, tenantId, email, role), assignmentId);
    }

    @GetMapping("/alerts")
    public List<TransportAlertResponse> listAlerts(
            @RequestHeader("X-User-ID") String userId,
            @RequestHeader("X-School-ID") String schoolId,
            @RequestHeader(value = "X-Tenant-ID", required = false) String tenantId,
            @RequestHeader(value = "X-User-Email", required = false) String email,
            @RequestHeader(value = "X-User-Role", required = false) String role
    ) {
        return this.transportManagementService.listAlerts(actor(userId, schoolId, tenantId, email, role));
    }

    @GetMapping("/analytics")
    public TransportAnalyticsResponse getAnalytics(
            @RequestHeader("X-User-ID") String userId,
            @RequestHeader("X-School-ID") String schoolId,
            @RequestHeader(value = "X-Tenant-ID", required = false) String tenantId,
            @RequestHeader(value = "X-User-Email", required = false) String email,
            @RequestHeader(value = "X-User-Role", required = false) String role
    ) {
        return this.transportManagementService.getAnalytics(actor(userId, schoolId, tenantId, email, role));
    }

    @GetMapping("/replay/{tripId}")
    public TransportReplayResponse getReplay(
            @RequestHeader("X-User-ID") String userId,
            @RequestHeader("X-School-ID") String schoolId,
            @RequestHeader(value = "X-Tenant-ID", required = false) String tenantId,
            @RequestHeader(value = "X-User-Email", required = false) String email,
            @RequestHeader(value = "X-User-Role", required = false) String role,
            @PathVariable UUID tripId
    ) {
        return this.transportManagementService.getReplay(actor(userId, schoolId, tenantId, email, role), tripId);
    }

    @GetMapping("/clusters")
    public List<TransportClusterResponse> getClusters(
            @RequestHeader("X-User-ID") String userId,
            @RequestHeader("X-School-ID") String schoolId,
            @RequestHeader(value = "X-Tenant-ID", required = false) String tenantId,
            @RequestHeader(value = "X-User-Email", required = false) String email,
            @RequestHeader(value = "X-User-Role", required = false) String role
    ) {
        return this.transportManagementService.getClusters(actor(userId, schoolId, tenantId, email, role));
    }

    @GetMapping("/my")
    public TransportMyResponse getMyTransport(
            @RequestHeader("X-User-ID") String userId,
            @RequestHeader("X-School-ID") String schoolId,
            @RequestHeader(value = "X-Tenant-ID", required = false) String tenantId,
            @RequestHeader(value = "X-User-Email", required = false) String email,
            @RequestHeader(value = "X-User-Role", required = false) String role
    ) {
        return this.transportManagementService.getMyTransport(actor(userId, schoolId, tenantId, email, role));
    }

    @GetMapping("/my/timeline")
    public List<TransportMyTimelineItem> getMyTimeline(
            @RequestHeader("X-User-ID") String userId,
            @RequestHeader("X-School-ID") String schoolId,
            @RequestHeader(value = "X-Tenant-ID", required = false) String tenantId,
            @RequestHeader(value = "X-User-Email", required = false) String email,
            @RequestHeader(value = "X-User-Role", required = false) String role
    ) {
        return this.transportManagementService.getMyTimeline(actor(userId, schoolId, tenantId, email, role));
    }

    @GetMapping("/my/preferences")
    public TransportNotificationPreferencesResponse getPreferences(
            @RequestHeader("X-User-ID") String userId,
            @RequestHeader("X-School-ID") String schoolId,
            @RequestHeader(value = "X-Tenant-ID", required = false) String tenantId,
            @RequestHeader(value = "X-User-Email", required = false) String email,
            @RequestHeader(value = "X-User-Role", required = false) String role
    ) {
        return this.transportManagementService.getPreferences(actor(userId, schoolId, tenantId, email, role));
    }

    @PatchMapping("/my/preferences")
    public TransportNotificationPreferencesResponse updatePreferences(
            @RequestHeader("X-User-ID") String userId,
            @RequestHeader("X-School-ID") String schoolId,
            @RequestHeader(value = "X-Tenant-ID", required = false) String tenantId,
            @RequestHeader(value = "X-User-Email", required = false) String email,
            @RequestHeader(value = "X-User-Role", required = false) String role,
            @Valid @RequestBody TransportNotificationPreferencesUpdateRequest request
    ) {
        return this.transportManagementService.updatePreferences(actor(userId, schoolId, tenantId, email, role), request);
    }

    @GetMapping("/trips/my-active")
    public List<TransportTripResponse> getMyActiveTrips(
            @RequestHeader("X-User-ID") String userId,
            @RequestHeader("X-School-ID") String schoolId,
            @RequestHeader(value = "X-Tenant-ID", required = false) String tenantId,
            @RequestHeader(value = "X-User-Email", required = false) String email,
            @RequestHeader(value = "X-User-Role", required = false) String role
    ) {
        return this.transportManagementService.getMyActiveTrips(actor(userId, schoolId, tenantId, email, role));
    }

    @PostMapping("/trips/{tripId}/onboard")
    public TransportTripStatusResponse onboardTrip(
            @RequestHeader("X-User-ID") String userId,
            @RequestHeader("X-School-ID") String schoolId,
            @RequestHeader(value = "X-Tenant-ID", required = false) String tenantId,
            @RequestHeader(value = "X-User-Email", required = false) String email,
            @RequestHeader(value = "X-User-Role", required = false) String role,
            @PathVariable UUID tripId
    ) {
        return this.transportManagementService.onboardTrip(actor(userId, schoolId, tenantId, email, role), tripId);
    }

    @PostMapping("/trips/{tripId}/start")
    public TransportTripStatusResponse startTrip(
            @RequestHeader("X-User-ID") String userId,
            @RequestHeader("X-School-ID") String schoolId,
            @RequestHeader(value = "X-Tenant-ID", required = false) String tenantId,
            @RequestHeader(value = "X-User-Email", required = false) String email,
            @RequestHeader(value = "X-User-Role", required = false) String role,
            @PathVariable UUID tripId
    ) {
        return this.transportManagementService.startTrip(actor(userId, schoolId, tenantId, email, role), tripId);
    }

    @PostMapping("/trips/{tripId}/end")
    public TransportTripStatusResponse endTrip(
            @RequestHeader("X-User-ID") String userId,
            @RequestHeader("X-School-ID") String schoolId,
            @RequestHeader(value = "X-Tenant-ID", required = false) String tenantId,
            @RequestHeader(value = "X-User-Email", required = false) String email,
            @RequestHeader(value = "X-User-Role", required = false) String role,
            @PathVariable UUID tripId
    ) {
        return this.transportManagementService.endTrip(actor(userId, schoolId, tenantId, email, role), tripId);
    }

    @PostMapping("/trips/{tripId}/offboard")
    public TransportTripStatusResponse offboardTrip(
            @RequestHeader("X-User-ID") String userId,
            @RequestHeader("X-School-ID") String schoolId,
            @RequestHeader(value = "X-Tenant-ID", required = false) String tenantId,
            @RequestHeader(value = "X-User-Email", required = false) String email,
            @RequestHeader(value = "X-User-Role", required = false) String role,
            @PathVariable UUID tripId
    ) {
        return this.transportManagementService.offboardTrip(actor(userId, schoolId, tenantId, email, role), tripId);
    }

    @PostMapping("/trips/{tripId}/gps")
    public TransportTripStatusResponse updateGps(
            @RequestHeader("X-User-ID") String userId,
            @RequestHeader("X-School-ID") String schoolId,
            @RequestHeader(value = "X-Tenant-ID", required = false) String tenantId,
            @RequestHeader(value = "X-User-Email", required = false) String email,
            @RequestHeader(value = "X-User-Role", required = false) String role,
            @PathVariable UUID tripId,
            @Valid @RequestBody TransportTripGpsUpdateRequest request
    ) {
        return this.transportManagementService.updateTripGps(actor(userId, schoolId, tenantId, email, role), tripId, request);
    }

    @PostMapping("/trips/{tripId}/halt")
    public TransportTripStatusResponse reportHalt(
            @RequestHeader("X-User-ID") String userId,
            @RequestHeader("X-School-ID") String schoolId,
            @RequestHeader(value = "X-Tenant-ID", required = false) String tenantId,
            @RequestHeader(value = "X-User-Email", required = false) String email,
            @RequestHeader(value = "X-User-Role", required = false) String role,
            @PathVariable UUID tripId,
            @Valid @RequestBody TransportHaltRequest request
    ) {
        return this.transportManagementService.reportHalt(actor(userId, schoolId, tenantId, email, role), tripId, request);
    }

    @PostMapping("/trips/{tripId}/delay")
    public TransportTripStatusResponse reportDelay(
            @RequestHeader("X-User-ID") String userId,
            @RequestHeader("X-School-ID") String schoolId,
            @RequestHeader(value = "X-Tenant-ID", required = false) String tenantId,
            @RequestHeader(value = "X-User-Email", required = false) String email,
            @RequestHeader(value = "X-User-Role", required = false) String role,
            @PathVariable UUID tripId,
            @Valid @RequestBody TransportDelayRequest request
    ) {
        return this.transportManagementService.reportDelay(actor(userId, schoolId, tenantId, email, role), tripId, request);
    }

    @PostMapping("/trips/{tripId}/sos")
    public TransportTripStatusResponse raiseSos(
            @RequestHeader("X-User-ID") String userId,
            @RequestHeader("X-School-ID") String schoolId,
            @RequestHeader(value = "X-Tenant-ID", required = false) String tenantId,
            @RequestHeader(value = "X-User-Email", required = false) String email,
            @RequestHeader(value = "X-User-Role", required = false) String role,
            @PathVariable UUID tripId,
            @RequestBody TransportSosRequest request
    ) {
        return this.transportManagementService.raiseSos(actor(userId, schoolId, tenantId, email, role), tripId, request);
    }

    @PostMapping("/trips/{tripId}/stops/{tripStopId}/complete")
    public TransportTripStatusResponse completeStop(
            @RequestHeader("X-User-ID") String userId,
            @RequestHeader("X-School-ID") String schoolId,
            @RequestHeader(value = "X-Tenant-ID", required = false) String tenantId,
            @RequestHeader(value = "X-User-Email", required = false) String email,
            @RequestHeader(value = "X-User-Role", required = false) String role,
            @PathVariable UUID tripId,
            @PathVariable UUID tripStopId
    ) {
        return this.transportManagementService.completeStop(actor(userId, schoolId, tenantId, email, role), tripId, tripStopId);
    }

    @PostMapping("/trips/{tripId}/boarding")
    public TransportBoardingResponse markBoarding(
            @RequestHeader("X-User-ID") String userId,
            @RequestHeader("X-School-ID") String schoolId,
            @RequestHeader(value = "X-Tenant-ID", required = false) String tenantId,
            @RequestHeader(value = "X-User-Email", required = false) String email,
            @RequestHeader(value = "X-User-Role", required = false) String role,
            @PathVariable UUID tripId,
            @Valid @RequestBody TransportBoardingRequest request
    ) {
        return this.transportManagementService.markBoarding(actor(userId, schoolId, tenantId, email, role), tripId, request);
    }

    @PostMapping("/trips/{tripId}/boarding/scan")
    public TransportBoardingResponse scanBoarding(
            @RequestHeader("X-User-ID") String userId,
            @RequestHeader("X-School-ID") String schoolId,
            @RequestHeader(value = "X-Tenant-ID", required = false) String tenantId,
            @RequestHeader(value = "X-User-Email", required = false) String email,
            @RequestHeader(value = "X-User-Role", required = false) String role,
            @PathVariable UUID tripId,
            @Valid @RequestBody TransportBoardingRequest request
    ) {
        return this.transportManagementService.scanBoarding(actor(userId, schoolId, tenantId, email, role), tripId, request);
    }

    @PostMapping("/trips/{tripId}/boarding/voice")
    public TransportVoiceBoardingResponse voiceBoarding(
            @RequestHeader("X-User-ID") String userId,
            @RequestHeader("X-School-ID") String schoolId,
            @RequestHeader(value = "X-Tenant-ID", required = false) String tenantId,
            @RequestHeader(value = "X-User-Email", required = false) String email,
            @RequestHeader(value = "X-User-Role", required = false) String role,
            @PathVariable UUID tripId,
            @Valid @RequestBody TransportVoiceBoardingRequest request
    ) {
        return this.transportManagementService.processVoiceBoarding(actor(userId, schoolId, tenantId, email, role), tripId, request);
    }

    @PostMapping("/optimization/run")
    public TransportOptimizationRunResponse runOptimization(
            @RequestHeader("X-User-ID") String userId,
            @RequestHeader("X-School-ID") String schoolId,
            @RequestHeader(value = "X-Tenant-ID", required = false) String tenantId,
            @RequestHeader(value = "X-User-Email", required = false) String email,
            @RequestHeader(value = "X-User-Role", required = false) String role,
            @RequestBody TransportOptimizationRequest request
    ) {
        return this.transportManagementService.runOptimization(actor(userId, schoolId, tenantId, email, role), request);
    }

    @GetMapping("/optimization/runs/{runId}")
    public TransportOptimizationRunResponse getOptimizationRun(
            @RequestHeader("X-User-ID") String userId,
            @RequestHeader("X-School-ID") String schoolId,
            @RequestHeader(value = "X-Tenant-ID", required = false) String tenantId,
            @RequestHeader(value = "X-User-Email", required = false) String email,
            @RequestHeader(value = "X-User-Role", required = false) String role,
            @PathVariable UUID runId
    ) {
        return this.transportManagementService.getOptimizationRun(actor(userId, schoolId, tenantId, email, role), runId);
    }

    @PostMapping("/optimization/runs/{runId}/approve")
    public TransportOptimizationRunResponse approveOptimizationRun(
            @RequestHeader("X-User-ID") String userId,
            @RequestHeader("X-School-ID") String schoolId,
            @RequestHeader(value = "X-Tenant-ID", required = false) String tenantId,
            @RequestHeader(value = "X-User-Email", required = false) String email,
            @RequestHeader(value = "X-User-Role", required = false) String role,
            @PathVariable UUID runId
    ) {
        return this.transportManagementService.approveOptimizationRun(actor(userId, schoolId, tenantId, email, role), runId);
    }

    @PostMapping("/optimization/runs/{runId}/discard")
    public TransportOptimizationRunResponse discardOptimizationRun(
            @RequestHeader("X-User-ID") String userId,
            @RequestHeader("X-School-ID") String schoolId,
            @RequestHeader(value = "X-Tenant-ID", required = false) String tenantId,
            @RequestHeader(value = "X-User-Email", required = false) String email,
            @RequestHeader(value = "X-User-Role", required = false) String role,
            @PathVariable UUID runId
    ) {
        return this.transportManagementService.discardOptimizationRun(actor(userId, schoolId, tenantId, email, role), runId);
    }

    @GetMapping("/assignments/{assignmentId}/backup-options")
    public List<TransportBackupOptionResponse> getBackupOptions(
            @RequestHeader("X-User-ID") String userId,
            @RequestHeader("X-School-ID") String schoolId,
            @RequestHeader(value = "X-Tenant-ID", required = false) String tenantId,
            @RequestHeader(value = "X-User-Email", required = false) String email,
            @RequestHeader(value = "X-User-Role", required = false) String role,
            @PathVariable UUID assignmentId
    ) {
        return this.transportManagementService.getBackupOptions(actor(userId, schoolId, tenantId, email, role), assignmentId);
    }

    @PostMapping("/assignments/{assignmentId}/substitute")
    public TransportRouteAssignmentResponse substituteAssignment(
            @RequestHeader("X-User-ID") String userId,
            @RequestHeader("X-School-ID") String schoolId,
            @RequestHeader(value = "X-Tenant-ID", required = false) String tenantId,
            @RequestHeader(value = "X-User-Email", required = false) String email,
            @RequestHeader(value = "X-User-Role", required = false) String role,
            @PathVariable UUID assignmentId,
            @RequestBody TransportSubstitutionRequest request
    ) {
        return this.transportManagementService.substituteAssignment(actor(userId, schoolId, tenantId, email, role), assignmentId, request);
    }

    @PostMapping("/internal/device-location")
    public TransportTripStatusResponse ingestDeviceLocation(@Valid @RequestBody TransportDeviceLocationRequest request) {
        return this.transportManagementService.ingestDeviceLocation(request);
    }

    private TransportActor actor(String userId, String schoolId, String tenantId, String email, String role) {
        return this.transportManagementService.resolveActor(userId, schoolId, tenantId, email, role);
    }
}
