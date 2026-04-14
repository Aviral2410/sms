package com.sms.schoolops.api;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

public class TransportManagementDtos {
    public record TransportActor(
            UUID userId,
            UUID schoolId,
            UUID tenantId,
            String email,
            String roleName,
            String fullName
    ) {}

    public record TransportPolicyResponse(
            UUID policyId,
            UUID schoolId,
            int speedLimitKmph,
            int overspeedDurationSeconds,
            int idleThresholdMinutes,
            int idleResponseTimeoutMinutes,
            BigDecimal deviationRadiusMeters,
            int gpsOfflineTimeoutMinutes,
            int preArrivalNotificationMinutes,
            String contactSharingPolicy,
            String missedBoardingPolicy,
            BigDecimal schoolGeofenceLatitude,
            BigDecimal schoolGeofenceLongitude,
            BigDecimal schoolGeofenceRadiusMeters,
            BigDecimal depotGeofenceLatitude,
            BigDecimal depotGeofenceLongitude,
            BigDecimal depotGeofenceRadiusMeters,
            boolean holidaySuppressionEnabled,
            Instant createdAt,
            Instant updatedAt
    ) {}

    public record TransportPolicyUpdateRequest(
            Integer speedLimitKmph,
            Integer overspeedDurationSeconds,
            Integer idleThresholdMinutes,
            Integer idleResponseTimeoutMinutes,
            BigDecimal deviationRadiusMeters,
            Integer gpsOfflineTimeoutMinutes,
            Integer preArrivalNotificationMinutes,
            String contactSharingPolicy,
            String missedBoardingPolicy,
            BigDecimal schoolGeofenceLatitude,
            BigDecimal schoolGeofenceLongitude,
            BigDecimal schoolGeofenceRadiusMeters,
            BigDecimal depotGeofenceLatitude,
            BigDecimal depotGeofenceLongitude,
            BigDecimal depotGeofenceRadiusMeters,
            Boolean holidaySuppressionEnabled
    ) {}

    public record TransportRouteRequest(
            @NotNull UUID schoolId,
            @NotBlank String routeName,
            String routeCode,
            String zone,
            String direction,
            BigDecimal plannedDistanceKm,
            Integer estimatedDurationMinutes,
            String corridorPolylineJson,
            BigDecimal utilizationTarget,
            BigDecimal efficiencyScore,
            String status
    ) {}

    public record TransportRouteResponse(
            UUID routeId,
            UUID schoolId,
            String routeName,
            String routeCode,
            String zone,
            String direction,
            BigDecimal plannedDistanceKm,
            Integer estimatedDurationMinutes,
            BigDecimal utilizationTarget,
            BigDecimal efficiencyScore,
            String status,
            int stopCount,
            int studentCount,
            Instant createdAt,
            Instant updatedAt
    ) {}

    public record TransportStopRequest(
            @NotNull UUID schoolId,
            @NotNull UUID routeId,
            @NotBlank String stopName,
            @NotNull Integer stopOrder,
            BigDecimal latitude,
            BigDecimal longitude,
            String pickupTime,
            String dropTime,
            String localityLabel,
            BigDecimal geofenceRadiusMeters,
            String stopType,
            String stopStatus,
            String scheduledPickupWindowStart,
            String scheduledPickupWindowEnd,
            String scheduledDropWindowStart,
            String scheduledDropWindowEnd,
            Boolean campusStop,
            Boolean depotStop
    ) {}

    public record TransportStopResponse(
            UUID stopId,
            UUID schoolId,
            UUID routeId,
            String stopName,
            int stopOrder,
            BigDecimal latitude,
            BigDecimal longitude,
            String pickupTime,
            String dropTime,
            String localityLabel,
            BigDecimal geofenceRadiusMeters,
            String stopType,
            String stopStatus,
            String scheduledPickupWindowStart,
            String scheduledPickupWindowEnd,
            String scheduledDropWindowStart,
            String scheduledDropWindowEnd,
            boolean campusStop,
            boolean depotStop,
            Instant createdAt,
            Instant updatedAt
    ) {}

    public record TransportVehicleDocumentRequest(
            @NotNull UUID schoolId,
            @NotBlank String documentType,
            @NotBlank String documentName,
            @NotBlank String accessUrl,
            LocalDate issuedOn,
            LocalDate expiresOn,
            String verificationStatus,
            String reminderStatus
    ) {}

    public record TransportVehicleDocumentResponse(
            UUID documentId,
            UUID vehicleId,
            UUID schoolId,
            String documentType,
            String documentName,
            String accessUrl,
            LocalDate issuedOn,
            LocalDate expiresOn,
            String verificationStatus,
            String reminderStatus,
            Instant createdAt,
            Instant updatedAt
    ) {}

    public record TransportVehicleRequest(
            @NotNull UUID schoolId,
            @NotBlank String registrationNumber,
            @NotBlank String vehicleType,
            @NotNull Integer capacity,
            String gpsDeviceId,
            String healthStatus,
            LocalDate insuranceExpiry,
            LocalDate fitnessExpiry,
            LocalDate permitExpiry,
            LocalDate pollutionExpiry,
            LocalDate lastServiceDate,
            LocalDate nextServiceDue,
            Boolean maintenanceLock,
            String operationalNotes
    ) {}

    public record TransportVehicleResponse(
            UUID vehicleId,
            UUID schoolId,
            String registrationNumber,
            String vehicleType,
            int capacity,
            String gpsDeviceId,
            String healthStatus,
            LocalDate insuranceExpiry,
            LocalDate fitnessExpiry,
            LocalDate permitExpiry,
            LocalDate pollutionExpiry,
            LocalDate lastServiceDate,
            LocalDate nextServiceDue,
            boolean maintenanceLock,
            String operationalNotes,
            int activeDocumentWarnings,
            Instant createdAt,
            Instant updatedAt
    ) {}

    public record TransportStaffProfileRequest(
            UUID userId,
            UUID tenantId,
            @NotNull UUID schoolId,
            String schoolCode,
            String schoolName,
            String fullName,
            String email,
            String accessKey,
            @NotBlank String staffRole,
            String mobileNumber,
            String address,
            String emergencyContactName,
            String emergencyContactPhone,
            String govtIdNumber,
            String verificationStatus,
            String backgroundCheckStatus,
            String licenseNumber,
            LocalDate licenseExpiry,
            String onboardingNotes
    ) {}

    public record TransportStaffProfileResponse(
            UUID profileId,
            UUID schoolId,
            UUID userId,
            String staffRole,
            String fullName,
            String email,
            String mobileNumber,
            String address,
            String emergencyContactName,
            String emergencyContactPhone,
            String govtIdNumber,
            String verificationStatus,
            String backgroundCheckStatus,
            String licenseNumber,
            LocalDate licenseExpiry,
            String onboardingNotes,
            Instant createdAt,
            Instant updatedAt
    ) {}

    public record TransportStudentAssignmentRequest(
            @NotNull UUID schoolId,
            @NotNull UUID studentUserId,
            @NotNull UUID routeId,
            UUID morningStopId,
            UUID eveningStopId,
            BigDecimal pickupLatitude,
            BigDecimal pickupLongitude,
            BigDecimal dropLatitude,
            BigDecimal dropLongitude,
            String localityLabel,
            LocalDate effectiveFrom,
            LocalDate effectiveTo,
            String boardingVerificationMode,
            String transportStatus
    ) {}

    public record TransportStudentAssignmentResponse(
            UUID assignmentId,
            UUID schoolId,
            UUID studentUserId,
            String studentName,
            UUID routeId,
            UUID morningStopId,
            UUID eveningStopId,
            String morningStopName,
            String eveningStopName,
            String localityLabel,
            LocalDate effectiveFrom,
            LocalDate effectiveTo,
            String boardingVerificationMode,
            String transportStatus,
            Instant createdAt,
            Instant updatedAt
    ) {}

    public record TransportUserSubscriptionRequest(
            @NotNull UUID schoolId,
            @NotNull UUID userId,
            UUID studentUserId,
            UUID routeId,
            UUID tripId,
            String subscriptionStatus
    ) {}

    public record TransportUserSubscriptionResponse(
            UUID subscriptionId,
            UUID schoolId,
            UUID userId,
            String userName,
            UUID studentUserId,
            String studentName,
            UUID routeId,
            UUID tripId,
            String subscriptionStatus,
            TransportNotificationPreferences preferences,
            Instant createdAt,
            Instant updatedAt
    ) {}

    public record TransportRouteAssignmentRequest(
            @NotNull UUID schoolId,
            @NotNull UUID routeId,
            UUID vehicleId,
            UUID driverUserId,
            UUID conductorUserId,
            UUID backupDriverUserId,
            UUID backupVehicleId,
            @NotNull LocalDate serviceDate,
            @NotBlank String shiftType,
            String assignmentStatus,
            String notes
    ) {}

    public record TransportRouteAssignmentResponse(
            UUID assignmentId,
            UUID schoolId,
            UUID routeId,
            String routeName,
            UUID vehicleId,
            String vehicleNumber,
            UUID driverUserId,
            String driverName,
            UUID conductorUserId,
            String conductorName,
            UUID backupDriverUserId,
            UUID backupVehicleId,
            LocalDate serviceDate,
            String shiftType,
            String assignmentStatus,
            boolean driverOnboardMarked,
            boolean conductorOnboardMarked,
            boolean vehicleReady,
            boolean gpsReady,
            String readinessSummary,
            String notes,
            Instant createdAt,
            Instant updatedAt
    ) {}

    public record TransportTripStopResponse(
            UUID tripStopId,
            UUID stopId,
            String stopName,
            int sequenceOrder,
            Instant plannedEta,
            Instant actualArrivalAt,
            Instant actualDepartureAt,
            String stopStatus,
            Integer occupancyAfterStop,
            Integer etaMinutes,
            String haltReason
    ) {}

    public record TransportTripEventResponse(
            UUID eventId,
            String eventType,
            String eventStatus,
            String eventMessage,
            String actorName,
            Instant createdAt
    ) {}

    public record TransportTripResponse(
            UUID tripId,
            UUID routeAssignmentId,
            UUID routeId,
            String routeName,
            UUID vehicleId,
            String vehicleNumber,
            String vehicleType,
            UUID driverUserId,
            String driverName,
            UUID conductorUserId,
            String conductorName,
            LocalDate serviceDate,
            String shiftType,
            String tripState,
            Integer occupancyCount,
            Integer capacity,
            String gpsStatus,
            BigDecimal currentLatitude,
            BigDecimal currentLongitude,
            BigDecimal currentSpeed,
            BigDecimal currentHeading,
            UUID nextStopId,
            String nextStopName,
            Integer etaToSchoolMinutes,
            String haltStatus,
            String deviationStatus,
            String emergencyStatus,
            BigDecimal routeEfficiencyScore,
            Instant plannedStartTime,
            Instant actualStartTime,
            Instant actualEndTime,
            Instant lastPingAt,
            List<TransportTripStopResponse> stops,
            List<TransportTripEventResponse> recentEvents
    ) {}

    public record TransportAlertResponse(
            UUID alertId,
            UUID tripId,
            UUID vehicleId,
            String alertType,
            String severity,
            String message,
            String alertStatus,
            Instant createdAt,
            Instant updatedAt
    ) {}

    public record TransportDashboardStats(
            int activeVehicles,
            int runningRoutes,
            int studentsOnboard,
            int overspeedAlerts,
            int idleAlerts,
            int offlineGps,
            int openCriticalAlerts
    ) {}

    public record TransportClusterResponse(
            String localityLabel,
            int studentCount,
            int routeCount,
            int capacityDelta
    ) {}

    public record TransportDashboardResponse(
            TransportDashboardStats stats,
            List<TransportTripResponse> activeTrips,
            List<TransportAlertResponse> alerts,
            List<TransportClusterResponse> clusters
    ) {}

    public record TransportAnalyticsRoutePoint(
            UUID routeId,
            String routeName,
            int studentCount,
            int capacity,
            BigDecimal utilizationPercent,
            BigDecimal efficiencyScore,
            int tripCount
    ) {}

    public record TransportAnalyticsResponse(
            int totalTrips,
            BigDecimal onTimeRate,
            BigDecimal averageOccupancy,
            BigDecimal totalDistanceKm,
            BigDecimal averageEfficiencyScore,
            int alertCount,
            List<TransportAnalyticsRoutePoint> routes
    ) {}

    public record TransportReplayPoint(
            BigDecimal latitude,
            BigDecimal longitude,
            BigDecimal speed,
            BigDecimal heading,
            Instant recordedAt
    ) {}

    public record TransportReplayResponse(
            UUID tripId,
            UUID routeId,
            UUID vehicleId,
            String vehicleNumber,
            List<TransportReplayPoint> points,
            List<TransportTripEventResponse> events
    ) {}

    public record TransportRouteDetailResponse(
            TransportRouteResponse route,
            List<TransportStopResponse> stops,
            List<TransportStudentAssignmentResponse> assignments,
            List<TransportRouteAssignmentResponse> routeAssignments,
            TransportTripResponse activeTrip
    ) {}

    public record TransportMyTimelineItem(
            String eventType,
            String title,
            String detail,
            Instant occurredAt,
            Integer etaMinutes
    ) {}

    public record TransportNotificationPreferences(
            boolean pickupAlert,
            boolean schoolArrivalAlert,
            boolean dropBoardingAlert,
            boolean homeDropAlert,
            boolean delayAlert
    ) {}

    public record TransportNotificationPreferencesResponse(
            TransportNotificationPreferences preferences
    ) {}

    public record TransportNotificationPreferencesUpdateRequest(
            Boolean pickupAlert,
            Boolean schoolArrivalAlert,
            Boolean dropBoardingAlert,
            Boolean homeDropAlert,
            Boolean delayAlert
    ) {}

    public record TransportMyResponse(
            String subscriberRole,
            UUID trackedStudentUserId,
            String trackedStudentName,
            boolean contactAllowed,
            String conductorContact,
            TransportNotificationPreferences preferences,
            TransportTripResponse trip,
            List<TransportMyTimelineItem> timeline
    ) {}

    public record TransportTripGpsUpdateRequest(
            @NotNull BigDecimal latitude,
            @NotNull BigDecimal longitude,
            BigDecimal speed,
            BigDecimal heading,
            BigDecimal accuracyMeters,
            String source
    ) {}

    public record TransportHaltRequest(@NotBlank String reason) {}
    public record TransportDelayRequest(@NotNull Integer delayMinutes, @NotBlank String reason) {}
    public record TransportSosRequest(String message) {}
    public record TransportTripStatusResponse(UUID tripId, String tripState, String message, Instant updatedAt) {}

    public record TransportBoardingRequest(
            @NotNull UUID studentUserId,
            UUID tripStopId,
            UUID stopId,
            @NotBlank String boardingState,
            String verificationMode,
            String note
    ) {}

    public record TransportBoardingResponse(
            UUID logId,
            UUID tripId,
            UUID studentUserId,
            String studentName,
            String boardingState,
            String verificationMode,
            Instant createdAt
    ) {}

    public record TransportVoiceBoardingRequest(@NotBlank String transcript) {}

    public record TransportVoiceBoardingMatch(
            String studentName,
            String boardingState,
            boolean applied,
            String reason
    ) {}

    public record TransportVoiceBoardingResponse(
            String transcript,
            List<TransportVoiceBoardingMatch> matches,
            int appliedCount,
            int rejectedCount
    ) {}

    public record TransportOptimizationRequest(LocalDate serviceDate, String shiftType) {}

    public record TransportOptimizationRunResponse(
            UUID optimizationRunId,
            UUID schoolId,
            String shiftType,
            LocalDate serviceDate,
            Integer beforeVehicleCount,
            Integer afterVehicleCount,
            BigDecimal distanceSavedKm,
            Integer timeSavedMinutes,
            BigDecimal confidenceScore,
            String explanation,
            String approvalStatus,
            Instant createdAt,
            Instant updatedAt
    ) {}

    public record TransportBackupOptionResponse(
            UUID vehicleId,
            String vehicleNumber,
            String healthStatus,
            UUID driverUserId,
            String driverName,
            String reason
    ) {}

    public record TransportSubstitutionRequest(
            UUID vehicleId,
            UUID driverUserId,
            String note
    ) {}

    public record TransportDeviceLocationRequest(
            @NotNull UUID schoolId,
            @NotBlank String gpsDeviceId,
            @NotBlank String deviceSecret,
            @NotNull BigDecimal latitude,
            @NotNull BigDecimal longitude,
            BigDecimal speed,
            BigDecimal heading,
            BigDecimal accuracyMeters,
            Instant recordedAt
    ) {}
}
