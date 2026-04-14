package com.sms.schoolops.service;

import static com.sms.schoolops.api.TransportManagementDtos.*;

import com.sms.common.exception.ForbiddenException;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.sms.schoolops.domain.SchoolUserEntity;
import com.sms.schoolops.domain.StudentParentMappingEntity;
import com.sms.schoolops.domain.TransportAlertEntity;
import com.sms.schoolops.domain.TransportAuditLogEntity;
import com.sms.schoolops.domain.TransportBoardingLogEntity;
import com.sms.schoolops.domain.TransportGpsPingEntity;
import com.sms.schoolops.domain.TransportNotificationLogEntity;
import com.sms.schoolops.domain.TransportOptimizationRunEntity;
import com.sms.schoolops.domain.TransportPolicyEntity;
import com.sms.schoolops.domain.TransportPickupLogEntity;
import com.sms.schoolops.domain.TransportRouteAssignmentEntity;
import com.sms.schoolops.domain.TransportRouteEntity;
import com.sms.schoolops.domain.TransportStaffProfileEntity;
import com.sms.schoolops.domain.TransportStopEntity;
import com.sms.schoolops.domain.TransportStudentAssignmentEntity;
import com.sms.schoolops.domain.TransportTripEntity;
import com.sms.schoolops.domain.TransportTripEventEntity;
import com.sms.schoolops.domain.TransportTripStopEntity;
import com.sms.schoolops.domain.TransportUserSubscriptionEntity;
import com.sms.schoolops.domain.TransportVehicleDocumentEntity;
import com.sms.schoolops.domain.TransportVehicleEntity;
import com.sms.schoolops.domain.TransportVehiclePositionEntity;
import com.sms.schoolops.event.MqttEventPublisher;
import com.sms.schoolops.repository.SchoolUserRepository;
import com.sms.schoolops.repository.StudentParentMappingRepository;
import com.sms.schoolops.repository.TransportAlertRepository;
import com.sms.schoolops.repository.TransportAuditLogRepository;
import com.sms.schoolops.repository.TransportBoardingLogRepository;
import com.sms.schoolops.repository.TransportGpsPingRepository;
import com.sms.schoolops.repository.TransportNotificationLogRepository;
import com.sms.schoolops.repository.TransportOptimizationRunRepository;
import com.sms.schoolops.repository.TransportPickupLogRepository;
import com.sms.schoolops.repository.TransportPolicyRepository;
import com.sms.schoolops.repository.TransportRouteAssignmentRepository;
import com.sms.schoolops.repository.TransportRouteRepository;
import com.sms.schoolops.repository.TransportStaffProfileRepository;
import com.sms.schoolops.repository.TransportStopRepository;
import com.sms.schoolops.repository.TransportStudentAssignmentRepository;
import com.sms.schoolops.repository.TransportTripEventRepository;
import com.sms.schoolops.repository.TransportTripRepository;
import com.sms.schoolops.repository.TransportTripStopRepository;
import com.sms.schoolops.repository.TransportUserSubscriptionRepository;
import com.sms.schoolops.repository.TransportVehicleDocumentRepository;
import com.sms.schoolops.repository.TransportVehiclePositionRepository;
import com.sms.schoolops.repository.TransportVehicleRepository;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Duration;
import java.time.Instant;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.Collection;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Objects;
import java.util.Optional;
import java.util.Set;
import java.util.UUID;
import java.util.function.Function;
import java.util.stream.Collectors;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.client.RestClient;

@Service
public class TransportManagementService {
    private static final Set<String> ADMIN_ROLES = Set.of("SCHOOL_ADMIN", "PRINCIPAL", "MANAGER", "TRANSPORT_MANAGER", "PLATFORM_ADMIN", "SUPER_ADMIN");
    private static final Set<String> DRIVER_ROLES = Set.of("DRIVER");
    private static final Set<String> CONDUCTOR_ROLES = Set.of("CONDUCTOR");
    private static final Set<String> ACTIVE_TRIP_STATES = Set.of("PLANNED", "READY", "RUNNING", "HALTED");

    private final TransportPolicyRepository transportPolicyRepository;
    private final TransportRouteRepository transportRouteRepository;
    private final TransportStopRepository transportStopRepository;
    private final TransportStudentAssignmentRepository transportStudentAssignmentRepository;
    private final TransportVehicleRepository transportVehicleRepository;
    private final TransportVehicleDocumentRepository transportVehicleDocumentRepository;
    private final TransportStaffProfileRepository transportStaffProfileRepository;
    private final TransportRouteAssignmentRepository transportRouteAssignmentRepository;
    private final TransportTripRepository transportTripRepository;
    private final TransportTripStopRepository transportTripStopRepository;
    private final TransportUserSubscriptionRepository transportUserSubscriptionRepository;
    private final TransportGpsPingRepository transportGpsPingRepository;
    private final TransportBoardingLogRepository transportBoardingLogRepository;
    private final TransportTripEventRepository transportTripEventRepository;
    private final TransportAlertRepository transportAlertRepository;
    private final TransportNotificationLogRepository transportNotificationLogRepository;
    private final TransportOptimizationRunRepository transportOptimizationRunRepository;
    private final TransportAuditLogRepository transportAuditLogRepository;
    private final SchoolUserRepository schoolUserRepository;
    private final StudentParentMappingRepository studentParentMappingRepository;
    private final TransportVehiclePositionRepository transportVehiclePositionRepository;
    private final TransportPickupLogRepository transportPickupLogRepository;
    private final SubscriptionService subscriptionService;
    private final MqttEventPublisher mqttEventPublisher;
    private final ObjectMapper objectMapper;
    private final RestClient communicationRestClient;
    private final RestClient authRestClient;

    public TransportManagementService(
            TransportPolicyRepository transportPolicyRepository,
            TransportRouteRepository transportRouteRepository,
            TransportStopRepository transportStopRepository,
            TransportStudentAssignmentRepository transportStudentAssignmentRepository,
            TransportVehicleRepository transportVehicleRepository,
            TransportVehicleDocumentRepository transportVehicleDocumentRepository,
            TransportStaffProfileRepository transportStaffProfileRepository,
            TransportRouteAssignmentRepository transportRouteAssignmentRepository,
            TransportTripRepository transportTripRepository,
            TransportTripStopRepository transportTripStopRepository,
            TransportUserSubscriptionRepository transportUserSubscriptionRepository,
            TransportGpsPingRepository transportGpsPingRepository,
            TransportBoardingLogRepository transportBoardingLogRepository,
            TransportTripEventRepository transportTripEventRepository,
            TransportAlertRepository transportAlertRepository,
            TransportNotificationLogRepository transportNotificationLogRepository,
            TransportOptimizationRunRepository transportOptimizationRunRepository,
            TransportAuditLogRepository transportAuditLogRepository,
            SchoolUserRepository schoolUserRepository,
            StudentParentMappingRepository studentParentMappingRepository,
            TransportVehiclePositionRepository transportVehiclePositionRepository,
            TransportPickupLogRepository transportPickupLogRepository,
            SubscriptionService subscriptionService,
            MqttEventPublisher mqttEventPublisher,
            ObjectMapper objectMapper,
            RestClient.Builder restClientBuilder,
            @Value("${app.communication-service-url}") String communicationServiceUrl,
            @Value("${app.auth-service-url}") String authServiceUrl
    ) {
        this.transportPolicyRepository = transportPolicyRepository;
        this.transportRouteRepository = transportRouteRepository;
        this.transportStopRepository = transportStopRepository;
        this.transportStudentAssignmentRepository = transportStudentAssignmentRepository;
        this.transportVehicleRepository = transportVehicleRepository;
        this.transportVehicleDocumentRepository = transportVehicleDocumentRepository;
        this.transportStaffProfileRepository = transportStaffProfileRepository;
        this.transportRouteAssignmentRepository = transportRouteAssignmentRepository;
        this.transportTripRepository = transportTripRepository;
        this.transportTripStopRepository = transportTripStopRepository;
        this.transportUserSubscriptionRepository = transportUserSubscriptionRepository;
        this.transportGpsPingRepository = transportGpsPingRepository;
        this.transportBoardingLogRepository = transportBoardingLogRepository;
        this.transportTripEventRepository = transportTripEventRepository;
        this.transportAlertRepository = transportAlertRepository;
        this.transportNotificationLogRepository = transportNotificationLogRepository;
        this.transportOptimizationRunRepository = transportOptimizationRunRepository;
        this.transportAuditLogRepository = transportAuditLogRepository;
        this.schoolUserRepository = schoolUserRepository;
        this.studentParentMappingRepository = studentParentMappingRepository;
        this.transportVehiclePositionRepository = transportVehiclePositionRepository;
        this.transportPickupLogRepository = transportPickupLogRepository;
        this.subscriptionService = subscriptionService;
        this.mqttEventPublisher = mqttEventPublisher;
        this.objectMapper = objectMapper;
        this.communicationRestClient = restClientBuilder.baseUrl(communicationServiceUrl).build();
        this.authRestClient = restClientBuilder.baseUrl(authServiceUrl).build();
    }

    public TransportActor resolveActor(String userIdHeader, String schoolIdHeader, String tenantIdHeader, String emailHeader, String roleHeader) {
        UUID userId = parseUuid(userIdHeader, "Missing X-User-ID header");
        UUID schoolId = parseUuid(schoolIdHeader, "Missing X-School-ID header");
        UUID tenantId = tenantIdHeader == null || tenantIdHeader.isBlank() ? schoolId : parseUuid(tenantIdHeader, "Invalid X-Tenant-ID header");
        SchoolUserEntity user = this.schoolUserRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("Authenticated transport user not found."));
        if (!schoolId.equals(user.getSchoolId())) {
            throw new IllegalArgumentException("Authenticated transport user does not belong to the requested school.");
        }
        return new TransportActor(
                userId,
                schoolId,
                tenantId,
                emailHeader == null || emailHeader.isBlank() ? user.getEmail() : emailHeader,
                roleHeader == null || roleHeader.isBlank() ? user.getRoleName() : roleHeader,
                user.getFullName()
        );
    }

    public TransportPolicyResponse getPolicy(TransportActor actor) {
        requireFeature(actor, "TRANSPORT_BASE");
        return toPolicyResponse(getOrCreatePolicy(actor.schoolId()));
    }

    @Transactional
    public TransportPolicyResponse updatePolicy(TransportActor actor, TransportPolicyUpdateRequest request) {
        requireAdmin(actor);
        requireFeature(actor, "TRANSPORT_BASE");
        TransportPolicyEntity policy = getOrCreatePolicy(actor.schoolId());
        if (request.speedLimitKmph() != null) policy.setSpeedLimitKmph(request.speedLimitKmph());
        if (request.overspeedDurationSeconds() != null) policy.setOverspeedDurationSeconds(request.overspeedDurationSeconds());
        if (request.idleThresholdMinutes() != null) policy.setIdleThresholdMinutes(request.idleThresholdMinutes());
        if (request.idleResponseTimeoutMinutes() != null) policy.setIdleResponseTimeoutMinutes(request.idleResponseTimeoutMinutes());
        if (request.deviationRadiusMeters() != null) policy.setDeviationRadiusMeters(request.deviationRadiusMeters());
        if (request.gpsOfflineTimeoutMinutes() != null) policy.setGpsOfflineTimeoutMinutes(request.gpsOfflineTimeoutMinutes());
        if (request.preArrivalNotificationMinutes() != null) policy.setPreArrivalNotificationMinutes(request.preArrivalNotificationMinutes());
        if (request.contactSharingPolicy() != null) policy.setContactSharingPolicy(request.contactSharingPolicy().trim().toUpperCase(Locale.ROOT));
        if (request.missedBoardingPolicy() != null) policy.setMissedBoardingPolicy(request.missedBoardingPolicy().trim().toUpperCase(Locale.ROOT));
        if (request.schoolGeofenceLatitude() != null) policy.setSchoolGeofenceLatitude(request.schoolGeofenceLatitude());
        if (request.schoolGeofenceLongitude() != null) policy.setSchoolGeofenceLongitude(request.schoolGeofenceLongitude());
        if (request.schoolGeofenceRadiusMeters() != null) policy.setSchoolGeofenceRadiusMeters(request.schoolGeofenceRadiusMeters());
        if (request.depotGeofenceLatitude() != null) policy.setDepotGeofenceLatitude(request.depotGeofenceLatitude());
        if (request.depotGeofenceLongitude() != null) policy.setDepotGeofenceLongitude(request.depotGeofenceLongitude());
        if (request.depotGeofenceRadiusMeters() != null) policy.setDepotGeofenceRadiusMeters(request.depotGeofenceRadiusMeters());
        if (request.holidaySuppressionEnabled() != null) policy.setHolidaySuppressionEnabled(request.holidaySuppressionEnabled());
        policy.setUpdatedAt(Instant.now());
        this.transportPolicyRepository.save(policy);
        publishTransportTopic("transport/dashboard/" + actor.schoolId(), Map.of("type", "POLICY_UPDATED"));
        writeAudit(actor, "TRANSPORT_POLICY", policy.getPolicyId(), "UPDATE", null, policy);
        return toPolicyResponse(policy);
    }

    public List<TransportRouteResponse> listRoutes(TransportActor actor) {
        requireFeature(actor, "TRANSPORT_BASE");
        requireAdmin(actor);
        return this.transportRouteRepository.findBySchoolIdOrderByCreatedAtDesc(actor.schoolId()).stream()
                .map(route -> toRouteResponse(route, actor.schoolId()))
                .toList();
    }

    public TransportRouteDetailResponse getRouteDetail(TransportActor actor, UUID routeId) {
        requireFeature(actor, "TRANSPORT_BASE");
        requireAdmin(actor);
        TransportRouteEntity route = getRoute(routeId);
        List<TransportStopResponse> stops = this.transportStopRepository.findByRouteIdOrderByStopOrderAsc(routeId).stream()
                .map(this::toStopResponse)
                .toList();
        List<TransportStudentAssignmentResponse> assignments = this.transportStudentAssignmentRepository.findByRouteId(routeId).stream()
                .map(this::toStudentAssignmentResponse)
                .toList();
        List<TransportRouteAssignmentResponse> routeAssignments = this.transportRouteAssignmentRepository.findBySchoolIdAndServiceDateOrderByCreatedAtDesc(actor.schoolId(), LocalDate.now()).stream()
                .filter(item -> item.getRouteId().equals(routeId))
                .map(this::toRouteAssignmentResponse)
                .toList();
        TransportTripResponse activeTrip = this.transportTripRepository.findBySchoolIdAndTripStateInOrderByUpdatedAtDesc(actor.schoolId(), ACTIVE_TRIP_STATES).stream()
                .filter(item -> item.getRouteId().equals(routeId))
                .findFirst()
                .map(this::toTripResponse)
                .orElse(null);
        return new TransportRouteDetailResponse(toRouteResponse(route, actor.schoolId()), stops, assignments, routeAssignments, activeTrip);
    }

    @Transactional
    public TransportRouteResponse createRoute(TransportActor actor, TransportRouteRequest request) {
        requireAdmin(actor);
        requireFeature(actor, "TRANSPORT_BASE");
        TransportRouteEntity entity = new TransportRouteEntity();
        entity.setRouteId(UUID.randomUUID());
        entity.setSchoolId(request.schoolId());
        entity.setRouteName(request.routeName());
        entity.setRouteCode(blankToNull(request.routeCode()));
        entity.setZone(blankToNull(request.zone()));
        entity.setDirection(blankToNull(request.direction()));
        entity.setPlannedDistanceKm(request.plannedDistanceKm());
        entity.setEstimatedDurationMinutes(request.estimatedDurationMinutes());
        entity.setCorridorPolylineJson(blankToNull(request.corridorPolylineJson()));
        entity.setUtilizationTarget(request.utilizationTarget());
        entity.setEfficiencyScore(request.efficiencyScore());
        entity.setStatus(blankToDefault(request.status(), "ACTIVE"));
        entity.setVehicleNumber("UNASSIGNED");
        entity.setDriverName("UNASSIGNED");
        entity.setDriverPhone("");
        entity.setCapacity(0);
        entity.setConductorName(null);
        entity.setConductorPhone(null);
        entity.setCreatedAt(Instant.now());
        entity.setUpdatedAt(Instant.now());
        this.transportRouteRepository.save(entity);
        writeAudit(actor, "TRANSPORT_ROUTE", entity.getRouteId(), "CREATE", null, entity);
        return toRouteResponse(entity, actor.schoolId());
    }

    @Transactional
    public TransportRouteResponse updateRoute(TransportActor actor, UUID routeId, TransportRouteRequest request) {
        requireAdmin(actor);
        requireFeature(actor, "TRANSPORT_BASE");
        TransportRouteEntity entity = getRoute(routeId);
        entity.setRouteName(request.routeName());
        entity.setRouteCode(blankToNull(request.routeCode()));
        entity.setZone(blankToNull(request.zone()));
        entity.setDirection(blankToNull(request.direction()));
        entity.setPlannedDistanceKm(request.plannedDistanceKm());
        entity.setEstimatedDurationMinutes(request.estimatedDurationMinutes());
        entity.setCorridorPolylineJson(blankToNull(request.corridorPolylineJson()));
        entity.setUtilizationTarget(request.utilizationTarget());
        entity.setEfficiencyScore(request.efficiencyScore());
        entity.setStatus(blankToDefault(request.status(), entity.getStatus()));
        entity.setUpdatedAt(Instant.now());
        this.transportRouteRepository.save(entity);
        writeAudit(actor, "TRANSPORT_ROUTE", entity.getRouteId(), "UPDATE", null, entity);
        return toRouteResponse(entity, actor.schoolId());
    }

    @Transactional
    public void deleteRoute(TransportActor actor, UUID routeId) {
        requireAdmin(actor);
        requireFeature(actor, "TRANSPORT_BASE");
        TransportRouteEntity entity = getRoute(routeId);
        this.transportRouteRepository.delete(entity);
        writeAudit(actor, "TRANSPORT_ROUTE", routeId, "DELETE", entity, null);
    }

    @Transactional
    public TransportStopResponse createStop(TransportActor actor, TransportStopRequest request) {
        requireAdmin(actor);
        requireFeature(actor, "TRANSPORT_BASE");
        TransportStopEntity entity = new TransportStopEntity();
        entity.setStopId(UUID.randomUUID());
        applyStopRequest(entity, request);
        entity.setCreatedAt(Instant.now());
        entity.setUpdatedAt(Instant.now());
        this.transportStopRepository.save(entity);
        writeAudit(actor, "TRANSPORT_STOP", entity.getStopId(), "CREATE", null, entity);
        return toStopResponse(entity);
    }

    @Transactional
    public TransportStopResponse updateStop(TransportActor actor, UUID stopId, TransportStopRequest request) {
        requireAdmin(actor);
        requireFeature(actor, "TRANSPORT_BASE");
        TransportStopEntity entity = this.transportStopRepository.findById(stopId)
                .orElseThrow(() -> new IllegalArgumentException("Transport stop not found."));
        applyStopRequest(entity, request);
        entity.setUpdatedAt(Instant.now());
        this.transportStopRepository.save(entity);
        writeAudit(actor, "TRANSPORT_STOP", entity.getStopId(), "UPDATE", null, entity);
        return toStopResponse(entity);
    }

    @Transactional
    public void deleteStop(TransportActor actor, UUID stopId) {
        requireAdmin(actor);
        requireFeature(actor, "TRANSPORT_BASE");
        TransportStopEntity entity = this.transportStopRepository.findById(stopId)
                .orElseThrow(() -> new IllegalArgumentException("Transport stop not found."));
        this.transportStopRepository.delete(entity);
        writeAudit(actor, "TRANSPORT_STOP", stopId, "DELETE", entity, null);
    }

    public List<TransportVehicleResponse> listVehicles(TransportActor actor) {
        requireAdmin(actor);
        requireFeature(actor, "TRANSPORT_BASE");
        return this.transportVehicleRepository.findBySchoolIdOrderByCreatedAtDesc(actor.schoolId()).stream()
                .map(this::toVehicleResponse)
                .toList();
    }

    @Transactional
    public TransportVehicleResponse createVehicle(TransportActor actor, TransportVehicleRequest request) {
        requireAdmin(actor);
        requireFeature(actor, "TRANSPORT_BASE");
        TransportVehicleEntity entity = new TransportVehicleEntity();
        entity.setVehicleId(UUID.randomUUID());
        applyVehicleRequest(entity, request);
        entity.setCreatedAt(Instant.now());
        entity.setUpdatedAt(Instant.now());
        this.transportVehicleRepository.save(entity);
        writeAudit(actor, "TRANSPORT_VEHICLE", entity.getVehicleId(), "CREATE", null, entity);
        return toVehicleResponse(entity);
    }

    @Transactional
    public TransportVehicleResponse updateVehicle(TransportActor actor, UUID vehicleId, TransportVehicleRequest request) {
        requireAdmin(actor);
        requireFeature(actor, "TRANSPORT_BASE");
        TransportVehicleEntity entity = this.transportVehicleRepository.findById(vehicleId)
                .orElseThrow(() -> new IllegalArgumentException("Transport vehicle not found."));
        applyVehicleRequest(entity, request);
        entity.setUpdatedAt(Instant.now());
        this.transportVehicleRepository.save(entity);
        writeAudit(actor, "TRANSPORT_VEHICLE", entity.getVehicleId(), "UPDATE", null, entity);
        return toVehicleResponse(entity);
    }

    @Transactional
    public void deleteVehicle(TransportActor actor, UUID vehicleId) {
        requireAdmin(actor);
        requireFeature(actor, "TRANSPORT_BASE");
        TransportVehicleEntity entity = this.transportVehicleRepository.findById(vehicleId)
                .orElseThrow(() -> new IllegalArgumentException("Transport vehicle not found."));
        this.transportVehicleRepository.delete(entity);
        writeAudit(actor, "TRANSPORT_VEHICLE", vehicleId, "DELETE", entity, null);
    }

    @Transactional
    public TransportVehicleDocumentResponse addVehicleDocument(TransportActor actor, UUID vehicleId, TransportVehicleDocumentRequest request) {
        requireAdmin(actor);
        requireFeature(actor, "TRANSPORT_BASE");
        if (!this.transportVehicleRepository.existsById(vehicleId)) {
            throw new IllegalArgumentException("Transport vehicle not found.");
        }
        TransportVehicleDocumentEntity entity = new TransportVehicleDocumentEntity();
        entity.setDocumentId(UUID.randomUUID());
        entity.setVehicleId(vehicleId);
        entity.setSchoolId(request.schoolId());
        entity.setDocumentType(request.documentType());
        entity.setDocumentName(request.documentName());
        entity.setAccessUrl(request.accessUrl());
        entity.setIssuedOn(request.issuedOn());
        entity.setExpiresOn(request.expiresOn());
        entity.setVerificationStatus(blankToDefault(request.verificationStatus(), "PENDING"));
        entity.setReminderStatus(blankToDefault(request.reminderStatus(), "NONE"));
        entity.setCreatedAt(Instant.now());
        entity.setUpdatedAt(Instant.now());
        this.transportVehicleDocumentRepository.save(entity);
        writeAudit(actor, "TRANSPORT_VEHICLE_DOCUMENT", entity.getDocumentId(), "CREATE", null, entity);
        return toVehicleDocumentResponse(entity);
    }

    public List<TransportStaffProfileResponse> listStaffProfiles(TransportActor actor) {
        requireAdmin(actor);
        requireFeature(actor, "TRANSPORT_BASE");
        return this.transportStaffProfileRepository.findBySchoolIdOrderByCreatedAtDesc(actor.schoolId()).stream()
                .map(this::toStaffProfileResponse)
                .toList();
    }

    @Transactional
    public TransportStaffProfileResponse upsertStaffProfile(TransportActor actor, TransportStaffProfileRequest request) {
        requireAdmin(actor);
        requireFeature(actor, "TRANSPORT_BASE");
        SchoolUserEntity user = request.userId() != null
                ? this.schoolUserRepository.findById(request.userId()).orElseThrow(() -> new IllegalArgumentException("Transport staff user not found."))
                : createTransportUser(request);
        TransportStaffProfileEntity entity = this.transportStaffProfileRepository.findByUserId(user.getUserId())
                .orElseGet(() -> {
                    TransportStaffProfileEntity profile = new TransportStaffProfileEntity();
                    profile.setProfileId(UUID.randomUUID());
                    profile.setSchoolId(request.schoolId());
                    profile.setUserId(user.getUserId());
                    profile.setCreatedAt(Instant.now());
                    return profile;
                });
        entity.setStaffRole(request.staffRole().trim().toUpperCase(Locale.ROOT));
        entity.setMobileNumber(blankToNull(request.mobileNumber()));
        entity.setAddress(blankToNull(request.address()));
        entity.setEmergencyContactName(blankToNull(request.emergencyContactName()));
        entity.setEmergencyContactPhone(blankToNull(request.emergencyContactPhone()));
        entity.setGovtIdNumber(blankToNull(request.govtIdNumber()));
        entity.setVerificationStatus(blankToDefault(request.verificationStatus(), "PENDING"));
        entity.setBackgroundCheckStatus(blankToDefault(request.backgroundCheckStatus(), "PENDING"));
        entity.setLicenseNumber(blankToNull(request.licenseNumber()));
        entity.setLicenseExpiry(request.licenseExpiry());
        entity.setOnboardingNotes(blankToNull(request.onboardingNotes()));
        entity.setUpdatedAt(Instant.now());
        this.transportStaffProfileRepository.save(entity);
        writeAudit(actor, "TRANSPORT_STAFF_PROFILE", entity.getProfileId(), "UPSERT", null, entity);
        return toStaffProfileResponse(entity);
    }

    @Transactional
    public TransportStudentAssignmentResponse upsertStudentAssignment(TransportActor actor, TransportStudentAssignmentRequest request) {
        requireAdmin(actor);
        requireFeature(actor, "TRANSPORT_BASE");
        TransportStudentAssignmentEntity entity = this.transportStudentAssignmentRepository.findByStudentUserId(request.studentUserId())
                .orElseGet(() -> {
                    TransportStudentAssignmentEntity assignment = new TransportStudentAssignmentEntity();
                    assignment.setAssignmentId(UUID.randomUUID());
                    assignment.setSchoolId(request.schoolId());
                    assignment.setStudentUserId(request.studentUserId());
                    assignment.setCreatedAt(Instant.now());
                    return assignment;
                });
        entity.setRouteId(request.routeId());
        entity.setStopId(request.morningStopId());
        entity.setMorningStopId(request.morningStopId());
        entity.setEveningStopId(request.eveningStopId());
        entity.setPickupLatitude(request.pickupLatitude());
        entity.setPickupLongitude(request.pickupLongitude());
        entity.setDropLatitude(request.dropLatitude());
        entity.setDropLongitude(request.dropLongitude());
        entity.setLocalityLabel(blankToNull(request.localityLabel()));
        entity.setEffectiveFrom(request.effectiveFrom());
        entity.setEffectiveTo(request.effectiveTo());
        entity.setBoardingVerificationMode(blankToDefault(request.boardingVerificationMode(), "MANUAL"));
        entity.setTransportStatus(blankToDefault(request.transportStatus(), "ACTIVE"));
        entity.setUpdatedAt(Instant.now());
        this.transportStudentAssignmentRepository.save(entity);
        writeAudit(actor, "TRANSPORT_STUDENT_ASSIGNMENT", entity.getAssignmentId(), "UPSERT", null, entity);
        return toStudentAssignmentResponse(entity);
    }

    @Transactional
    public void clearStudentAssignment(TransportActor actor, UUID schoolId, UUID studentUserId) {
        requireAdmin(actor);
        requireFeature(actor, "TRANSPORT_BASE");
        this.transportStudentAssignmentRepository.findByStudentUserId(studentUserId)
                .filter(item -> item.getSchoolId().equals(schoolId))
                .ifPresent(item -> {
                    this.transportStudentAssignmentRepository.delete(item);
                    writeAudit(actor, "TRANSPORT_STUDENT_ASSIGNMENT", item.getAssignmentId(), "DELETE", item, null);
                });
    }

    public List<TransportRouteAssignmentResponse> listAssignments(TransportActor actor, LocalDate serviceDate) {
        requireAdmin(actor);
        requireFeature(actor, "TRANSPORT_BASE");
        return this.transportRouteAssignmentRepository.findBySchoolIdAndServiceDateOrderByCreatedAtDesc(actor.schoolId(), serviceDate == null ? LocalDate.now() : serviceDate).stream()
                .map(this::toRouteAssignmentResponse)
                .toList();
    }

    @Transactional
    public TransportRouteAssignmentResponse upsertRouteAssignment(TransportActor actor, TransportRouteAssignmentRequest request) {
        requireAdmin(actor);
        requireFeature(actor, "TRANSPORT_BASE");
        TransportRouteAssignmentEntity entity = this.transportRouteAssignmentRepository.findByRouteIdAndServiceDateAndShiftType(request.routeId(), request.serviceDate(), request.shiftType().trim().toUpperCase(Locale.ROOT))
                .orElseGet(() -> {
                    TransportRouteAssignmentEntity assignment = new TransportRouteAssignmentEntity();
                    assignment.setAssignmentId(UUID.randomUUID());
                    assignment.setSchoolId(request.schoolId());
                    assignment.setRouteId(request.routeId());
                    assignment.setDriverOnboardMarked(false);
                    assignment.setConductorOnboardMarked(false);
                    assignment.setCreatedAt(Instant.now());
                    return assignment;
                });
        entity.setVehicleId(request.vehicleId());
        entity.setDriverUserId(request.driverUserId());
        entity.setConductorUserId(request.conductorUserId());
        entity.setBackupDriverUserId(request.backupDriverUserId());
        entity.setBackupVehicleId(request.backupVehicleId());
        entity.setServiceDate(request.serviceDate());
        entity.setShiftType(request.shiftType().trim().toUpperCase(Locale.ROOT));
        entity.setAssignmentStatus(blankToDefault(request.assignmentStatus(), "PLANNED"));
        entity.setNotes(blankToNull(request.notes()));
        AssignmentReadiness readiness = evaluateAssignmentReadiness(entity);
        entity.setVehicleReady(readiness.vehicleReady());
        entity.setGpsReady(readiness.gpsReady());
        entity.setUpdatedAt(Instant.now());
        this.transportRouteAssignmentRepository.save(entity);
        ensureTripForAssignment(entity);
        writeAudit(actor, "TRANSPORT_ROUTE_ASSIGNMENT", entity.getAssignmentId(), "UPSERT", null, entity);
        return toRouteAssignmentResponse(entity);
    }

    @Transactional
    public void deleteRouteAssignment(TransportActor actor, UUID assignmentId) {
        requireAdmin(actor);
        requireFeature(actor, "TRANSPORT_BASE");
        TransportRouteAssignmentEntity entity = this.transportRouteAssignmentRepository.findById(assignmentId)
                .orElseThrow(() -> new IllegalArgumentException("Transport route assignment not found."));
        this.transportTripRepository.findByRouteAssignmentId(assignmentId).ifPresent(this.transportTripRepository::delete);
        this.transportRouteAssignmentRepository.delete(entity);
        writeAudit(actor, "TRANSPORT_ROUTE_ASSIGNMENT", assignmentId, "DELETE", entity, null);
    }

    public TransportDashboardResponse getDashboard(TransportActor actor, LocalDate serviceDate, String shiftType) {
        requireAdmin(actor);
        requireFeature(actor, "TRANSPORT_BASE");
        LocalDate effectiveDate = serviceDate == null ? LocalDate.now() : serviceDate;
        List<TransportTripEntity> trips = this.transportTripRepository.findBySchoolIdAndServiceDateOrderByUpdatedAtDesc(actor.schoolId(), effectiveDate).stream()
                .filter(trip -> shiftType == null || shiftType.isBlank() || shiftType.equalsIgnoreCase(trip.getShiftType()))
                .toList();
        List<TransportAlertResponse> alerts = this.transportAlertRepository.findBySchoolIdOrderByCreatedAtDesc(actor.schoolId()).stream()
                .limit(12)
                .map(this::toAlertResponse)
                .toList();
        List<TransportTripResponse> activeTrips = trips.stream().map(this::toTripResponse).toList();
        List<TransportClusterResponse> clusters = hasFeature(actor, "TRANSPORT_PREMIUM_ANALYTICS")
                ? getClustersInternal(actor.schoolId())
                : List.of();
        int studentsOnboard = trips.stream().mapToInt(trip -> safeInt(this.transportBoardingLogRepository.countByTripIdAndBoardingState(trip.getTripId(), "BOARDED"))).sum();
        TransportDashboardStats stats = new TransportDashboardStats(
                (int) trips.stream().filter(trip -> ACTIVE_TRIP_STATES.contains(trip.getTripState())).count(),
                trips.size(),
                studentsOnboard,
                (int) alerts.stream().filter(alert -> "OVERSPEED".equalsIgnoreCase(alert.alertType()) && "OPEN".equalsIgnoreCase(alert.alertStatus())).count(),
                (int) alerts.stream().filter(alert -> "IDLE".equalsIgnoreCase(alert.alertType()) && "OPEN".equalsIgnoreCase(alert.alertStatus())).count(),
                (int) trips.stream().filter(trip -> "OFFLINE".equalsIgnoreCase(trip.getGpsStatus())).count(),
                (int) alerts.stream().filter(alert -> "CRITICAL".equalsIgnoreCase(alert.severity()) && "OPEN".equalsIgnoreCase(alert.alertStatus())).count()
        );
        return new TransportDashboardResponse(stats, activeTrips, alerts, clusters);
    }

    public TransportDashboardResponse getLiveMap(TransportActor actor, LocalDate serviceDate, String shiftType) {
        requireAdmin(actor);
        requireFeature(actor, "TRANSPORT_LIVE_TRACKING");
        return getDashboard(actor, serviceDate, shiftType);
    }

    public List<TransportAlertResponse> listAlerts(TransportActor actor) {
        requireAdmin(actor);
        requireFeature(actor, "TRANSPORT_PREMIUM_ALERTS");
        return this.transportAlertRepository.findBySchoolIdOrderByCreatedAtDesc(actor.schoolId()).stream()
                .map(this::toAlertResponse)
                .toList();
    }

    public TransportAnalyticsResponse getAnalytics(TransportActor actor) {
        requireAdmin(actor);
        requireFeature(actor, "TRANSPORT_PREMIUM_ANALYTICS");
        List<TransportTripEntity> trips = this.transportTripRepository.findBySchoolIdAndTripStateInOrderByUpdatedAtDesc(actor.schoolId(), List.of("RUNNING", "HALTED", "COMPLETED", "READY"));
        Map<UUID, TransportVehicleEntity> vehiclesById = this.transportVehicleRepository.findBySchoolIdOrderByCreatedAtDesc(actor.schoolId()).stream()
                .collect(Collectors.toMap(TransportVehicleEntity::getVehicleId, Function.identity()));
        Map<UUID, List<TransportStudentAssignmentEntity>> assignmentsByRoute = this.transportStudentAssignmentRepository.findBySchoolId(actor.schoolId()).stream()
                .collect(Collectors.groupingBy(TransportStudentAssignmentEntity::getRouteId));
        List<TransportAnalyticsRoutePoint> routePoints = this.transportRouteRepository.findBySchoolIdOrderByCreatedAtDesc(actor.schoolId()).stream()
                .map(route -> {
                    int studentCount = assignmentsByRoute.getOrDefault(route.getRouteId(), List.of()).size();
                    TransportVehicleEntity vehicle = this.transportRouteAssignmentRepository.findBySchoolIdAndServiceDateOrderByCreatedAtDesc(actor.schoolId(), LocalDate.now()).stream()
                            .filter(item -> route.getRouteId().equals(item.getRouteId()) && item.getVehicleId() != null)
                            .map(item -> vehiclesById.get(item.getVehicleId()))
                            .filter(Objects::nonNull)
                            .findFirst()
                            .orElse(null);
                    int capacity = vehicle == null ? Math.max(route.getCapacity() == null ? 0 : route.getCapacity(), 0) : vehicle.getCapacity();
                    BigDecimal utilization = capacity == 0 ? BigDecimal.ZERO : BigDecimal.valueOf(studentCount * 100.0d / capacity).setScale(2, RoundingMode.HALF_UP);
                    int tripCount = (int) trips.stream().filter(trip -> trip.getRouteId().equals(route.getRouteId())).count();
                    return new TransportAnalyticsRoutePoint(route.getRouteId(), route.getRouteName(), studentCount, capacity, utilization, defaultBigDecimal(route.getEfficiencyScore()), tripCount);
                })
                .toList();
        long onTimeTrips = trips.stream().filter(trip -> trip.getActualEndTime() != null && trip.getPlannedEndTime() != null && !trip.getActualEndTime().isAfter(trip.getPlannedEndTime())).count();
        BigDecimal onTimeRate = trips.isEmpty() ? BigDecimal.ZERO : BigDecimal.valueOf(onTimeTrips * 100.0d / trips.size()).setScale(2, RoundingMode.HALF_UP);
        BigDecimal averageOccupancy = trips.isEmpty() ? BigDecimal.ZERO : BigDecimal.valueOf(trips.stream().mapToInt(trip -> safeInt(trip.getOccupancyCount())).average().orElse(0d)).setScale(2, RoundingMode.HALF_UP);
        BigDecimal totalDistance = BigDecimal.valueOf(trips.stream().map(TransportTripEntity::getTotalDistanceKm).filter(Objects::nonNull).mapToDouble(BigDecimal::doubleValue).sum()).setScale(2, RoundingMode.HALF_UP);
        BigDecimal averageEfficiency = trips.isEmpty() ? BigDecimal.ZERO : BigDecimal.valueOf(trips.stream().map(TransportTripEntity::getRouteEfficiencyScore).filter(Objects::nonNull).mapToDouble(BigDecimal::doubleValue).average().orElse(0d)).setScale(2, RoundingMode.HALF_UP);
        int alertCount = this.transportAlertRepository.findBySchoolIdOrderByCreatedAtDesc(actor.schoolId()).size();
        return new TransportAnalyticsResponse(trips.size(), onTimeRate, averageOccupancy, totalDistance, averageEfficiency, alertCount, routePoints);
    }

    public TransportReplayResponse getReplay(TransportActor actor, UUID tripId) {
        requireAdmin(actor);
        requireFeature(actor, "TRANSPORT_PREMIUM_ANALYTICS");
        TransportTripEntity trip = getTrip(tripId);
        List<TransportReplayPoint> points = this.transportGpsPingRepository.findByTripIdOrderByRecordedAtAsc(tripId).stream()
                .map(ping -> new TransportReplayPoint(ping.getLatitude(), ping.getLongitude(), ping.getSpeed(), ping.getHeading(), ping.getRecordedAt()))
                .toList();
        String vehicleNumber = trip.getVehicleId() == null ? null : this.transportVehicleRepository.findById(trip.getVehicleId()).map(TransportVehicleEntity::getRegistrationNumber).orElse(null);
        List<TransportTripEventResponse> events = this.transportTripEventRepository.findByTripIdOrderByCreatedAtDesc(tripId).stream()
                .map(this::toTripEventResponse)
                .toList();
        return new TransportReplayResponse(trip.getTripId(), trip.getRouteId(), trip.getVehicleId(), vehicleNumber, points, events);
    }

    public List<TransportClusterResponse> getClusters(TransportActor actor) {
        requireAdmin(actor);
        requireFeature(actor, "TRANSPORT_PREMIUM_ANALYTICS");
        Map<String, List<TransportStudentAssignmentEntity>> grouped = this.transportStudentAssignmentRepository.findBySchoolId(actor.schoolId()).stream()
                .collect(Collectors.groupingBy(item -> blankToDefault(item.getLocalityLabel(), "Unassigned Locality"), LinkedHashMap::new, Collectors.toList()));
        return grouped.entrySet().stream()
                .map(entry -> {
                    Set<UUID> routeIds = entry.getValue().stream().map(TransportStudentAssignmentEntity::getRouteId).collect(Collectors.toSet());
                    int studentCount = entry.getValue().size();
                    int capacity = this.transportRouteAssignmentRepository.findBySchoolIdAndServiceDateOrderByCreatedAtDesc(actor.schoolId(), LocalDate.now()).stream()
                            .filter(item -> routeIds.contains(item.getRouteId()) && item.getVehicleId() != null)
                            .map(item -> this.transportVehicleRepository.findById(item.getVehicleId()).map(TransportVehicleEntity::getCapacity).orElse(0))
                            .mapToInt(Integer::intValue)
                            .sum();
                    return new TransportClusterResponse(entry.getKey(), studentCount, routeIds.size(), capacity - studentCount);
                })
                .sorted(Comparator.comparingInt(TransportClusterResponse::studentCount).reversed())
                .toList();
    }

    public TransportMyResponse getMyTransport(TransportActor actor) {
        requireFeature(actor, "TRANSPORT_LIVE_TRACKING");
        ResolvedTransportAudience audience = resolveAudience(actor);
        TransportTripEntity trip = audience.trip();
        TransportNotificationPreferences preferences = getPreferences(actor).preferences();
        TransportTripResponse tripResponse = trip == null ? null : toTripResponse(trip);
        List<TransportMyTimelineItem> timeline = buildTimeline(actor.schoolId(), trip == null ? null : trip.getTripId(), audience.trackedStudentUserId());
        return new TransportMyResponse(
                actor.roleName(),
                audience.trackedStudentUserId(),
                audience.trackedStudentName(),
                audience.contactAllowed(),
                audience.conductorContact(),
                preferences,
                tripResponse,
                timeline
        );
    }

    public List<TransportMyTimelineItem> getMyTimeline(TransportActor actor) {
        requireFeature(actor, "TRANSPORT_LIVE_TRACKING");
        ResolvedTransportAudience audience = resolveAudience(actor);
        return buildTimeline(actor.schoolId(), audience.trip() == null ? null : audience.trip().getTripId(), audience.trackedStudentUserId());
    }

    public TransportNotificationPreferencesResponse getPreferences(TransportActor actor) {
        requireFeature(actor, "TRANSPORT_NOTIFICATIONS");
        TransportUserSubscriptionEntity entity = getOrCreateSubscription(actor);
        return new TransportNotificationPreferencesResponse(parsePreferences(entity.getNotificationPreferencesJson()));
    }

    @Transactional
    public TransportNotificationPreferencesResponse updatePreferences(TransportActor actor, TransportNotificationPreferencesUpdateRequest request) {
        requireFeature(actor, "TRANSPORT_NOTIFICATIONS");
        TransportUserSubscriptionEntity entity = getOrCreateSubscription(actor);
        TransportNotificationPreferences current = parsePreferences(entity.getNotificationPreferencesJson());
        TransportNotificationPreferences updated = new TransportNotificationPreferences(
                request.pickupAlert() == null ? current.pickupAlert() : request.pickupAlert(),
                request.schoolArrivalAlert() == null ? current.schoolArrivalAlert() : request.schoolArrivalAlert(),
                request.dropBoardingAlert() == null ? current.dropBoardingAlert() : request.dropBoardingAlert(),
                request.homeDropAlert() == null ? current.homeDropAlert() : request.homeDropAlert(),
                request.delayAlert() == null ? current.delayAlert() : request.delayAlert()
        );
        entity.setNotificationPreferencesJson(toJson(updated));
        entity.setUpdatedAt(Instant.now());
        this.transportUserSubscriptionRepository.save(entity);
        return new TransportNotificationPreferencesResponse(updated);
    }

    public List<TransportTripResponse> getMyActiveTrips(TransportActor actor) {
        requireFeature(actor, "TRANSPORT_LIVE_TRACKING");
        LocalDate today = LocalDate.now();
        List<TransportTripEntity> trips;
        if (DRIVER_ROLES.contains(actor.roleName().toUpperCase(Locale.ROOT))) {
            trips = this.transportTripRepository.findBySchoolIdAndDriverUserIdAndServiceDateAndTripStateIn(actor.schoolId(), actor.userId(), today, ACTIVE_TRIP_STATES);
        } else if (CONDUCTOR_ROLES.contains(actor.roleName().toUpperCase(Locale.ROOT))) {
            trips = this.transportTripRepository.findBySchoolIdAndConductorUserIdAndServiceDateAndTripStateIn(actor.schoolId(), actor.userId(), today, ACTIVE_TRIP_STATES);
        } else {
            ResolvedTransportAudience audience = resolveAudience(actor);
            trips = audience.trip() == null ? List.of() : List.of(audience.trip());
        }
        return trips.stream().map(this::toTripResponse).toList();
    }

    @Transactional
    public TransportTripStatusResponse onboardTrip(TransportActor actor, UUID tripId) {
        requireFeature(actor, "TRANSPORT_BASE");
        TransportTripEntity trip = getTrip(tripId);
        TransportRouteAssignmentEntity assignment = getAssignment(trip.getRouteAssignmentId());
        if (DRIVER_ROLES.contains(actor.roleName().toUpperCase(Locale.ROOT))) {
            if (!actor.userId().equals(assignment.getDriverUserId())) {
                throw new IllegalArgumentException("Driver is not assigned to this trip.");
            }
            assignment.setDriverOnboardMarked(true);
        } else if (CONDUCTOR_ROLES.contains(actor.roleName().toUpperCase(Locale.ROOT))) {
            if (!actor.userId().equals(assignment.getConductorUserId())) {
                throw new IllegalArgumentException("Conductor is not assigned to this trip.");
            }
            assignment.setConductorOnboardMarked(true);
        } else {
            requireAdmin(actor);
            assignment.setDriverOnboardMarked(true);
            assignment.setConductorOnboardMarked(true);
        }
        AssignmentReadiness readiness = evaluateAssignmentReadiness(assignment);
        assignment.setVehicleReady(readiness.vehicleReady());
        assignment.setGpsReady(readiness.gpsReady());
        assignment.setUpdatedAt(Instant.now());
        this.transportRouteAssignmentRepository.save(assignment);
        if (Boolean.TRUE.equals(assignment.getDriverOnboardMarked()) && Boolean.TRUE.equals(assignment.getConductorOnboardMarked())) {
            trip.setTripState("READY");
            trip.setUpdatedAt(Instant.now());
            this.transportTripRepository.save(trip);
        }
        createTripEvent(trip, "ONBOARD_MARKED", "SUCCESS", actor.fullName() + " marked onboard.", actor, Map.of("role", actor.roleName()));
        writeAudit(actor, "TRANSPORT_TRIP", tripId, "ONBOARD", null, trip);
        publishTripStatus(trip);
        return new TransportTripStatusResponse(trip.getTripId(), trip.getTripState(), "Onboard recorded.", Instant.now());
    }

    @Transactional
    public TransportTripStatusResponse startTrip(TransportActor actor, UUID tripId) {
        requireFeature(actor, "TRANSPORT_BASE");
        TransportTripEntity trip = getTrip(tripId);
        TransportRouteAssignmentEntity assignment = getAssignment(trip.getRouteAssignmentId());
        ensureTripActorAccess(actor, trip, assignment);
        AssignmentReadiness readiness = evaluateAssignmentReadiness(assignment);
        if (!Boolean.TRUE.equals(assignment.getDriverOnboardMarked()) || !Boolean.TRUE.equals(assignment.getConductorOnboardMarked())) {
            openOrRefreshAlert(trip.getSchoolId(), trip.getTripId(), trip.getVehicleId(), trip.getRouteAssignmentId(), "STAFF_MISSING", "WARNING", "Driver or conductor has not marked onboard before trip start.", dedupeKey(trip.getTripId(), "STAFF_MISSING"), Map.of("tripId", trip.getTripId()));
            throw new IllegalStateException("Driver and conductor must both mark onboard before the trip starts.");
        }
        if (!readiness.vehicleReady()) {
            throw new IllegalStateException("Assigned vehicle is not ready for service.");
        }
        if (!readiness.gpsReady()) {
            throw new IllegalStateException("GPS source is not ready for this trip.");
        }
        trip.setTripState("RUNNING");
        if (trip.getActualStartTime() == null) {
            trip.setActualStartTime(Instant.now());
        }
        trip.setGpsStatus("ONLINE");
        trip.setUpdatedAt(Instant.now());
        this.transportTripRepository.save(trip);
        createTripEvent(trip, "TRIP_STARTED", "SUCCESS", "Trip started.", actor, Map.of("shiftType", blankToDefault(trip.getShiftType(), "UNKNOWN")));
        publishTripStatus(trip);
        return new TransportTripStatusResponse(trip.getTripId(), trip.getTripState(), "Trip started.", trip.getUpdatedAt());
    }

    @Transactional
    public TransportTripStatusResponse endTrip(TransportActor actor, UUID tripId) {
        requireFeature(actor, "TRANSPORT_BASE");
        TransportTripEntity trip = getTrip(tripId);
        TransportRouteAssignmentEntity assignment = getAssignment(trip.getRouteAssignmentId());
        ensureTripActorAccess(actor, trip, assignment);
        trip.setTripState("COMPLETED");
        trip.setActualEndTime(Instant.now());
        trip.setUpdatedAt(Instant.now());
        this.transportTripRepository.save(trip);
        createTripEvent(trip, "TRIP_ENDED", "SUCCESS", "Trip ended.", actor, Map.of());
        publishTripStatus(trip);
        notifyTripCompletion(trip);
        return new TransportTripStatusResponse(trip.getTripId(), trip.getTripState(), "Trip completed.", trip.getUpdatedAt());
    }

    @Transactional
    public TransportTripStatusResponse offboardTrip(TransportActor actor, UUID tripId) {
        requireFeature(actor, "TRANSPORT_BASE");
        TransportTripEntity trip = getTrip(tripId);
        TransportRouteAssignmentEntity assignment = getAssignment(trip.getRouteAssignmentId());
        ensureTripActorAccess(actor, trip, assignment);
        if (DRIVER_ROLES.contains(actor.roleName().toUpperCase(Locale.ROOT))) {
            assignment.setDriverOnboardMarked(false);
        } else if (CONDUCTOR_ROLES.contains(actor.roleName().toUpperCase(Locale.ROOT))) {
            assignment.setConductorOnboardMarked(false);
        } else {
            assignment.setDriverOnboardMarked(false);
            assignment.setConductorOnboardMarked(false);
        }
        assignment.setUpdatedAt(Instant.now());
        if (!Boolean.TRUE.equals(assignment.getDriverOnboardMarked()) && !Boolean.TRUE.equals(assignment.getConductorOnboardMarked())) {
            assignment.setAssignmentStatus("COMPLETED");
        }
        this.transportRouteAssignmentRepository.save(assignment);
        createTripEvent(trip, "OFFBOARD_MARKED", "SUCCESS", actor.fullName() + " marked offboard.", actor, Map.of("role", actor.roleName()));
        publishTripStatus(trip);
        return new TransportTripStatusResponse(trip.getTripId(), trip.getTripState(), "Offboard recorded.", Instant.now());
    }

    @Transactional
    public TransportTripStatusResponse updateTripGps(TransportActor actor, UUID tripId, TransportTripGpsUpdateRequest request) {
        requireFeature(actor, "TRANSPORT_LIVE_TRACKING");
        TransportTripEntity trip = getTrip(tripId);
        TransportRouteAssignmentEntity assignment = getAssignment(trip.getRouteAssignmentId());
        ensureTripActorAccess(actor, trip, assignment);
        applyGpsUpdate(trip, request.latitude(), request.longitude(), request.speed(), request.heading(), request.accuracyMeters(), blankToDefault(request.source(), "MOBILE"), Instant.now());
        createTripEvent(trip, "GPS_UPDATE", "SUCCESS", "Location updated.", actor, Map.of("latitude", request.latitude(), "longitude", request.longitude()));
        publishTripLocation(trip);
        return new TransportTripStatusResponse(trip.getTripId(), trip.getTripState(), "Location updated.", trip.getUpdatedAt());
    }

    @Transactional
    public TransportTripStatusResponse reportHalt(TransportActor actor, UUID tripId, TransportHaltRequest request) {
        requireFeature(actor, "TRANSPORT_BASE");
        TransportTripEntity trip = getTrip(tripId);
        TransportRouteAssignmentEntity assignment = getAssignment(trip.getRouteAssignmentId());
        ensureTripActorAccess(actor, trip, assignment);
        trip.setTripState("HALTED");
        trip.setHaltStatus("ACKNOWLEDGED");
        trip.setNotes(blankToNull(request.reason()));
        trip.setUpdatedAt(Instant.now());
        this.transportTripRepository.save(trip);
        TransportTripStopEntity activeStop = getCurrentTripStop(trip);
        if (activeStop != null) {
            activeStop.setHaltReason(blankToNull(request.reason()));
            activeStop.setUpdatedAt(Instant.now());
            this.transportTripStopRepository.save(activeStop);
        }
        resolveAlert(dedupeKey(trip.getTripId(), "IDLE"), actor.fullName());
        createTripEvent(trip, "HALT_REASON_UPDATED", "SUCCESS", request.reason(), actor, Map.of());
        notifyDelayIfEligible(trip, request.reason(), null);
        publishTripStatus(trip);
        return new TransportTripStatusResponse(trip.getTripId(), trip.getTripState(), "Halt reason updated.", trip.getUpdatedAt());
    }

    @Transactional
    public TransportTripStatusResponse reportDelay(TransportActor actor, UUID tripId, TransportDelayRequest request) {
        requireFeature(actor, "TRANSPORT_NOTIFICATIONS");
        TransportTripEntity trip = getTrip(tripId);
        TransportRouteAssignmentEntity assignment = getAssignment(trip.getRouteAssignmentId());
        ensureTripActorAccess(actor, trip, assignment);
        trip.setNotes("Delay " + request.delayMinutes() + " minutes: " + request.reason());
        trip.setUpdatedAt(Instant.now());
        this.transportTripRepository.save(trip);
        createTripEvent(trip, "DELAY_REPORTED", "SUCCESS", trip.getNotes(), actor, Map.of("delayMinutes", request.delayMinutes()));
        notifyDelayIfEligible(trip, request.reason(), request.delayMinutes());
        publishTripStatus(trip);
        return new TransportTripStatusResponse(trip.getTripId(), trip.getTripState(), "Delay recorded.", trip.getUpdatedAt());
    }

    @Transactional
    public TransportTripStatusResponse raiseSos(TransportActor actor, UUID tripId, TransportSosRequest request) {
        requireFeature(actor, "TRANSPORT_PREMIUM_ALERTS");
        TransportTripEntity trip = getTrip(tripId);
        TransportRouteAssignmentEntity assignment = getAssignment(trip.getRouteAssignmentId());
        ensureTripActorAccess(actor, trip, assignment);
        trip.setEmergencyStatus("SOS");
        trip.setUpdatedAt(Instant.now());
        this.transportTripRepository.save(trip);
        String message = blankToDefault(request.message(), "Emergency alert raised by " + actor.fullName());
        openOrRefreshAlert(trip.getSchoolId(), trip.getTripId(), trip.getVehicleId(), trip.getRouteAssignmentId(), "SOS", "CRITICAL", message, dedupeKey(trip.getTripId(), "SOS"), payloadOf(
                "routeAssignmentId", trip.getRouteAssignmentId(),
                "driverUserId", trip.getDriverUserId(),
                "conductorUserId", trip.getConductorUserId(),
                "latitude", trip.getCurrentLatitude(),
                "longitude", trip.getCurrentLongitude()
        ));
        createTripEvent(trip, "SOS_RAISED", "CRITICAL", message, actor, Map.of());
        publishTripStatus(trip);
        return new TransportTripStatusResponse(trip.getTripId(), trip.getTripState(), "SOS raised.", trip.getUpdatedAt());
    }

    @Transactional
    public TransportTripStatusResponse completeStop(TransportActor actor, UUID tripId, UUID tripStopId) {
        requireFeature(actor, "TRANSPORT_BASE");
        TransportTripEntity trip = getTrip(tripId);
        TransportRouteAssignmentEntity assignment = getAssignment(trip.getRouteAssignmentId());
        ensureTripActorAccess(actor, trip, assignment);
        TransportTripStopEntity tripStop = this.transportTripStopRepository.findById(tripStopId)
                .orElseThrow(() -> new IllegalArgumentException("Trip stop not found."));
        tripStop.setActualArrivalAt(tripStop.getActualArrivalAt() == null ? Instant.now() : tripStop.getActualArrivalAt());
        tripStop.setActualDepartureAt(Instant.now());
        tripStop.setStopStatus("COMPLETED");
        tripStop.setOccupancyAfterStop(trip.getOccupancyCount());
        tripStop.setUpdatedAt(Instant.now());
        this.transportTripStopRepository.save(tripStop);

        List<TransportTripStopEntity> tripStops = this.transportTripStopRepository.findByTripIdOrderBySequenceOrderAsc(tripId);
        TransportTripStopEntity nextStop = tripStops.stream()
                .filter(item -> !"COMPLETED".equalsIgnoreCase(item.getStopStatus()))
                .findFirst()
                .orElse(null);
        trip.setNextStopId(nextStop == null ? null : nextStop.getStopId());
        trip.setEtaToSchoolMinutes(Math.max(0, tripStops.size() - (int) tripStops.stream().filter(item -> "COMPLETED".equalsIgnoreCase(item.getStopStatus())).count()) * 5);
        if (nextStop == null && "MORNING".equalsIgnoreCase(trip.getShiftType())) {
            notifySchoolArrival(trip);
        }
        if (nextStop == null && "EVENING".equalsIgnoreCase(trip.getShiftType())) {
            trip.setTripState("COMPLETED");
            trip.setActualEndTime(Instant.now());
        }
        trip.setUpdatedAt(Instant.now());
        this.transportTripRepository.save(trip);
        createTripEvent(trip, "STOP_COMPLETED", "SUCCESS", "Stop completed.", actor, Map.of("tripStopId", tripStopId));
        publishTripStatus(trip);
        return new TransportTripStatusResponse(trip.getTripId(), trip.getTripState(), "Stop completed.", trip.getUpdatedAt());
    }

    @Transactional
    public TransportBoardingResponse markBoarding(TransportActor actor, UUID tripId, TransportBoardingRequest request) {
        requireFeature(actor, "TRANSPORT_NOTIFICATIONS");
        TransportTripEntity trip = getTrip(tripId);
        TransportRouteAssignmentEntity assignment = getAssignment(trip.getRouteAssignmentId());
        ensureTripActorAccess(actor, trip, assignment);
        SchoolUserEntity student = this.schoolUserRepository.findById(request.studentUserId())
                .orElseThrow(() -> new IllegalArgumentException("Student not found."));
        TransportBoardingLogEntity log = new TransportBoardingLogEntity();
        log.setLogId(UUID.randomUUID());
        log.setSchoolId(trip.getSchoolId());
        log.setTripId(tripId);
        log.setTripStopId(request.tripStopId());
        log.setStudentUserId(request.studentUserId());
        log.setRouteId(trip.getRouteId());
        log.setStopId(request.stopId());
        log.setBoardingState(request.boardingState().trim().toUpperCase(Locale.ROOT));
        log.setVerificationMode(blankToDefault(request.verificationMode(), "MANUAL"));
        log.setActorUserId(actor.userId());
        log.setActorName(actor.fullName());
        log.setCreatedAt(Instant.now());
        this.transportBoardingLogRepository.save(log);

        if ("BOARDED".equalsIgnoreCase(log.getBoardingState())) {
            trip.setOccupancyCount(safeInt(trip.getOccupancyCount()) + 1);
        } else if ("DROPPED".equalsIgnoreCase(log.getBoardingState())) {
            trip.setOccupancyCount(Math.max(0, safeInt(trip.getOccupancyCount()) - 1));
        }
        trip.setUpdatedAt(Instant.now());
        this.transportTripRepository.save(trip);
        mirrorLegacyBoardingLog(trip, log);
        createTripEvent(trip, "BOARDING_UPDATED", "SUCCESS", student.getFullName() + " marked " + log.getBoardingState().toLowerCase(Locale.ROOT) + ".", actor, Map.of("studentUserId", student.getUserId()));
        sendBoardingNotification(trip, student, log);
        if ("ABSENT".equalsIgnoreCase(log.getBoardingState()) || "NO_SHOW".equalsIgnoreCase(log.getBoardingState())) {
            handleMissedBoardingAlert(trip, student, log);
        }
        publishTripStatus(trip);
        return new TransportBoardingResponse(log.getLogId(), tripId, student.getUserId(), student.getFullName(), log.getBoardingState(), log.getVerificationMode(), log.getCreatedAt());
    }

    @Transactional
    public TransportBoardingResponse scanBoarding(TransportActor actor, UUID tripId, TransportBoardingRequest request) {
        return markBoarding(actor, tripId, request);
    }

    @Transactional
    public TransportVoiceBoardingResponse processVoiceBoarding(TransportActor actor, UUID tripId, TransportVoiceBoardingRequest request) {
        requireFeature(actor, "TRANSPORT_NOTIFICATIONS");
        TransportTripEntity trip = getTrip(tripId);
        TransportRouteAssignmentEntity assignment = getAssignment(trip.getRouteAssignmentId());
        ensureTripActorAccess(actor, trip, assignment);
        String transcript = request.transcript().trim();
        String normalized = transcript.toLowerCase(Locale.ROOT);
        String boardingState = normalized.contains("absent") ? "ABSENT"
                : normalized.contains("drop") ? "DROPPED"
                : normalized.contains("no show") ? "NO_SHOW"
                : "BOARDED";
        List<TransportStudentAssignmentEntity> students = this.transportStudentAssignmentRepository.findByRouteId(trip.getRouteId());
        List<TransportVoiceBoardingMatch> matches = new ArrayList<>();
        int appliedCount = 0;
        int rejectedCount = 0;
        for (TransportStudentAssignmentEntity assignmentEntity : students) {
            SchoolUserEntity student = this.schoolUserRepository.findById(assignmentEntity.getStudentUserId()).orElse(null);
            if (student == null) {
                continue;
            }
            if (normalized.contains(student.getFullName().toLowerCase(Locale.ROOT))) {
                markBoarding(actor, tripId, new TransportBoardingRequest(
                        student.getUserId(),
                        null,
                        "EVENING".equalsIgnoreCase(trip.getShiftType()) ? assignmentEntity.getEveningStopId() : assignmentEntity.getMorningStopId(),
                        boardingState,
                        "VOICE",
                        transcript
                ));
                matches.add(new TransportVoiceBoardingMatch(student.getFullName(), boardingState, true, "Matched from transcript"));
                appliedCount++;
            }
        }
        if (matches.isEmpty()) {
            matches.add(new TransportVoiceBoardingMatch(null, boardingState, false, "No student name matched in transcript"));
            rejectedCount = 1;
        }
        return new TransportVoiceBoardingResponse(transcript, matches, appliedCount, rejectedCount);
    }

    public List<TransportUserSubscriptionResponse> listSubscriptions(TransportActor actor) {
        requireAdmin(actor);
        requireFeature(actor, "TRANSPORT_LIVE_TRACKING");
        return this.transportUserSubscriptionRepository.findBySchoolIdOrderByCreatedAtDesc(actor.schoolId()).stream()
                .map(this::toUserSubscriptionResponse)
                .toList();
    }

    @Transactional
    public TransportUserSubscriptionResponse upsertSubscription(TransportActor actor, TransportUserSubscriptionRequest request) {
        requireAdmin(actor);
        requireFeature(actor, "TRANSPORT_LIVE_TRACKING");
        TransportUserSubscriptionEntity entity = this.transportUserSubscriptionRepository.findFirstBySchoolIdAndUserIdAndSubscriptionStatusOrderByCreatedAtDesc(request.schoolId(), request.userId(), blankToDefault(request.subscriptionStatus(), "ACTIVE"))
                .orElseGet(() -> {
                    TransportUserSubscriptionEntity subscription = new TransportUserSubscriptionEntity();
                    subscription.setSubscriptionId(UUID.randomUUID());
                    subscription.setCreatedAt(Instant.now());
                    subscription.setNotificationPreferencesJson(toJson(defaultPreferences()));
                    return subscription;
                });
        entity.setSchoolId(request.schoolId());
        entity.setUserId(request.userId());
        entity.setStudentUserId(request.studentUserId());
        entity.setRouteId(request.routeId());
        entity.setTripId(request.tripId());
        entity.setSubscriptionStatus(blankToDefault(request.subscriptionStatus(), "ACTIVE"));
        entity.setUpdatedAt(Instant.now());
        this.transportUserSubscriptionRepository.save(entity);
        writeAudit(actor, "TRANSPORT_SUBSCRIPTION", entity.getSubscriptionId(), "UPSERT", null, entity);
        return toUserSubscriptionResponse(entity);
    }

    @Transactional
    public void deleteSubscription(TransportActor actor, UUID subscriptionId) {
        requireAdmin(actor);
        requireFeature(actor, "TRANSPORT_LIVE_TRACKING");
        TransportUserSubscriptionEntity entity = this.transportUserSubscriptionRepository.findById(subscriptionId)
                .orElseThrow(() -> new IllegalArgumentException("Transport subscription not found."));
        this.transportUserSubscriptionRepository.delete(entity);
        writeAudit(actor, "TRANSPORT_SUBSCRIPTION", subscriptionId, "DELETE", entity, null);
    }

    @Transactional
    public TransportOptimizationRunResponse runOptimization(TransportActor actor, TransportOptimizationRequest request) {
        requireAdmin(actor);
        requireFeature(actor, "TRANSPORT_PREMIUM_OPTIMIZATION");
        LocalDate serviceDate = request.serviceDate() == null ? LocalDate.now() : request.serviceDate();
        String shiftType = blankToDefault(request.shiftType(), "MORNING").toUpperCase(Locale.ROOT);
        List<TransportRouteAssignmentEntity> assignments = this.transportRouteAssignmentRepository.findBySchoolIdAndServiceDateOrderByCreatedAtDesc(actor.schoolId(), serviceDate).stream()
                .filter(item -> shiftType.equalsIgnoreCase(item.getShiftType()))
                .toList();
        List<TransportRouteEntity> routes = this.transportRouteRepository.findBySchoolIdOrderByCreatedAtDesc(actor.schoolId());
        Map<UUID, Integer> studentCounts = this.transportStudentAssignmentRepository.findBySchoolId(actor.schoolId()).stream()
                .collect(Collectors.groupingBy(TransportStudentAssignmentEntity::getRouteId, Collectors.summingInt(item -> 1)));
        int beforeVehicleCount = Math.max(assignments.size(), routes.size());
        int totalStudents = studentCounts.values().stream().mapToInt(Integer::intValue).sum();
        int averageCapacity = Math.max(1, this.transportVehicleRepository.findBySchoolIdOrderByCreatedAtDesc(actor.schoolId()).stream()
                .map(TransportVehicleEntity::getCapacity)
                .filter(Objects::nonNull)
                .mapToInt(Integer::intValue)
                .max()
                .orElse(40));
        int afterVehicleCount = Math.max(1, (int) Math.ceil(totalStudents / (double) averageCapacity));
        BigDecimal distanceSavedKm = BigDecimal.valueOf(Math.max(0, beforeVehicleCount - afterVehicleCount) * 12.5d).setScale(2, RoundingMode.HALF_UP);
        int timeSavedMinutes = Math.max(0, beforeVehicleCount - afterVehicleCount) * 18;
        BigDecimal confidenceScore = BigDecimal.valueOf(Math.min(0.95d, 0.6d + (beforeVehicleCount > afterVehicleCount ? 0.2d : 0.05d))).setScale(2, RoundingMode.HALF_UP);
        List<TransportClusterResponse> clusters = getClustersInternal(actor.schoolId());
        String explanation = buildOptimizationExplanation(routes, studentCounts, beforeVehicleCount, afterVehicleCount, distanceSavedKm, timeSavedMinutes);

        TransportOptimizationRunEntity entity = new TransportOptimizationRunEntity();
        entity.setOptimizationRunId(UUID.randomUUID());
        entity.setSchoolId(actor.schoolId());
        entity.setRequestedBy(actor.userId());
        entity.setRequestedByName(actor.fullName());
        entity.setShiftType(shiftType);
        entity.setServiceDate(serviceDate);
        entity.setInputSnapshotJson(toJson(Map.of("routes", routes.size(), "assignments", assignments.size(), "students", totalStudents)));
        entity.setClusterSnapshotJson(toJson(clusters));
        entity.setProposalSnapshotJson(toJson(Map.of("studentCounts", studentCounts, "recommendedVehicleCount", afterVehicleCount)));
        entity.setBeforeVehicleCount(beforeVehicleCount);
        entity.setAfterVehicleCount(afterVehicleCount);
        entity.setDistanceSavedKm(distanceSavedKm);
        entity.setTimeSavedMinutes(timeSavedMinutes);
        entity.setConfidenceScore(confidenceScore);
        entity.setExplanation(explanation);
        entity.setApprovalStatus("PROPOSED");
        entity.setCreatedAt(Instant.now());
        entity.setUpdatedAt(Instant.now());
        this.transportOptimizationRunRepository.save(entity);
        writeAudit(actor, "TRANSPORT_OPTIMIZATION_RUN", entity.getOptimizationRunId(), "CREATE", null, entity);
        return toOptimizationRunResponse(entity);
    }

    public TransportOptimizationRunResponse getOptimizationRun(TransportActor actor, UUID runId) {
        requireAdmin(actor);
        requireFeature(actor, "TRANSPORT_PREMIUM_OPTIMIZATION");
        TransportOptimizationRunEntity entity = this.transportOptimizationRunRepository.findById(runId)
                .orElseThrow(() -> new IllegalArgumentException("Optimization run not found."));
        return toOptimizationRunResponse(entity);
    }

    @Transactional
    public TransportOptimizationRunResponse approveOptimizationRun(TransportActor actor, UUID runId) {
        requireAdmin(actor);
        requireFeature(actor, "TRANSPORT_PREMIUM_OPTIMIZATION");
        TransportOptimizationRunEntity entity = this.transportOptimizationRunRepository.findById(runId)
                .orElseThrow(() -> new IllegalArgumentException("Optimization run not found."));
        entity.setApprovalStatus("APPROVED");
        entity.setApprovedBy(actor.fullName());
        entity.setApprovedAt(Instant.now());
        entity.setUpdatedAt(Instant.now());
        this.transportOptimizationRunRepository.save(entity);
        writeAudit(actor, "TRANSPORT_OPTIMIZATION_RUN", runId, "APPROVE", null, entity);
        return toOptimizationRunResponse(entity);
    }

    @Transactional
    public TransportOptimizationRunResponse discardOptimizationRun(TransportActor actor, UUID runId) {
        requireAdmin(actor);
        requireFeature(actor, "TRANSPORT_PREMIUM_OPTIMIZATION");
        TransportOptimizationRunEntity entity = this.transportOptimizationRunRepository.findById(runId)
                .orElseThrow(() -> new IllegalArgumentException("Optimization run not found."));
        entity.setApprovalStatus("DISCARDED");
        entity.setUpdatedAt(Instant.now());
        this.transportOptimizationRunRepository.save(entity);
        writeAudit(actor, "TRANSPORT_OPTIMIZATION_RUN", runId, "DISCARD", null, entity);
        return toOptimizationRunResponse(entity);
    }

    public List<TransportBackupOptionResponse> getBackupOptions(TransportActor actor, UUID assignmentId) {
        requireAdmin(actor);
        requireFeature(actor, "TRANSPORT_BASE");
        TransportRouteAssignmentEntity assignment = getAssignment(assignmentId);
        List<TransportVehicleEntity> vehicles = this.transportVehicleRepository.findBySchoolIdOrderByCreatedAtDesc(actor.schoolId()).stream()
                .filter(vehicle -> !vehicle.getVehicleId().equals(assignment.getVehicleId()))
                .filter(this::isVehicleOperational)
                .toList();
        List<TransportStaffProfileEntity> drivers = this.transportStaffProfileRepository.findBySchoolIdOrderByCreatedAtDesc(actor.schoolId()).stream()
                .filter(profile -> "DRIVER".equalsIgnoreCase(profile.getStaffRole()))
                .filter(profile -> !profile.getUserId().equals(assignment.getDriverUserId()))
                .filter(profile -> profile.getLicenseExpiry() == null || !profile.getLicenseExpiry().isBefore(LocalDate.now()))
                .toList();
        List<TransportBackupOptionResponse> options = new ArrayList<>();
        int max = Math.max(vehicles.size(), drivers.size());
        for (int index = 0; index < max; index++) {
            TransportVehicleEntity vehicle = index < vehicles.size() ? vehicles.get(index) : null;
            TransportStaffProfileEntity driver = index < drivers.size() ? drivers.get(index) : null;
            String reason = vehicle != null && driver != null ? "Compliant backup vehicle and driver available."
                    : vehicle != null ? "Vehicle ready for reassignment."
                    : "Backup driver available.";
            options.add(new TransportBackupOptionResponse(
                    vehicle == null ? null : vehicle.getVehicleId(),
                    vehicle == null ? null : vehicle.getRegistrationNumber(),
                    vehicle == null ? null : vehicle.getHealthStatus(),
                    driver == null ? null : driver.getUserId(),
                    driver == null ? null : resolveUserName(driver.getUserId()),
                    reason
            ));
        }
        return options;
    }

    @Transactional
    public TransportRouteAssignmentResponse substituteAssignment(TransportActor actor, UUID assignmentId, TransportSubstitutionRequest request) {
        requireAdmin(actor);
        requireFeature(actor, "TRANSPORT_BASE");
        TransportRouteAssignmentEntity assignment = getAssignment(assignmentId);
        if (request.vehicleId() != null) {
            assignment.setBackupVehicleId(assignment.getVehicleId());
            assignment.setVehicleId(request.vehicleId());
        }
        if (request.driverUserId() != null) {
            assignment.setBackupDriverUserId(assignment.getDriverUserId());
            assignment.setDriverUserId(request.driverUserId());
        }
        assignment.setNotes(blankToNull(request.note()));
        AssignmentReadiness readiness = evaluateAssignmentReadiness(assignment);
        assignment.setVehicleReady(readiness.vehicleReady());
        assignment.setGpsReady(readiness.gpsReady());
        assignment.setUpdatedAt(Instant.now());
        this.transportRouteAssignmentRepository.save(assignment);
        TransportTripEntity trip = ensureTripForAssignment(assignment);
        createTripEvent(trip, "SUBSTITUTION_APPLIED", "SUCCESS", blankToDefault(request.note(), "Backup assignment applied."), actor, Map.of());
        publishTripStatus(trip);
        writeAudit(actor, "TRANSPORT_ROUTE_ASSIGNMENT", assignmentId, "SUBSTITUTE", null, assignment);
        return toRouteAssignmentResponse(assignment);
    }

    @Transactional
    public TransportTripStatusResponse ingestDeviceLocation(TransportDeviceLocationRequest request) {
        TransportPolicyEntity policy = getOrCreatePolicy(request.schoolId());
        if (policy.getDeviceApiSecret() != null && !policy.getDeviceApiSecret().isBlank() && !policy.getDeviceApiSecret().equals(request.deviceSecret())) {
            throw new IllegalArgumentException("Invalid GPS device secret.");
        }
        TransportVehicleEntity vehicle = this.transportVehicleRepository.findBySchoolIdAndGpsDeviceId(request.schoolId(), request.gpsDeviceId())
                .orElseThrow(() -> new IllegalArgumentException("Vehicle not mapped to GPS device."));
        Instant recordedAt = request.recordedAt() == null ? Instant.now() : request.recordedAt();
        LocalDate serviceDate = LocalDate.ofInstant(recordedAt, java.time.ZoneOffset.UTC);
        TransportTripEntity trip = this.transportTripRepository.findBySchoolIdAndServiceDateOrderByUpdatedAtDesc(request.schoolId(), serviceDate).stream()
                .filter(item -> vehicle.getVehicleId().equals(item.getVehicleId()) && ACTIVE_TRIP_STATES.contains(item.getTripState()))
                .findFirst()
                .orElseThrow(() -> new IllegalArgumentException("No active trip found for GPS device."));
        applyGpsUpdate(trip, request.latitude(), request.longitude(), request.speed(), request.heading(), request.accuracyMeters(), "DEVICE", recordedAt);
        publishTripLocation(trip);
        return new TransportTripStatusResponse(trip.getTripId(), trip.getTripState(), "Device location ingested.", trip.getUpdatedAt());
    }

    private UUID parseUuid(String rawValue, String errorMessage) {
        if (rawValue == null || rawValue.isBlank()) {
            throw new IllegalArgumentException(errorMessage);
        }
        try {
            return UUID.fromString(rawValue.trim());
        } catch (IllegalArgumentException exception) {
            throw new IllegalArgumentException(errorMessage);
        }
    }

    private boolean hasFeature(TransportActor actor, String featureCode) {
        return this.subscriptionService.isFeatureAccessibleBestEffort(actor.tenantId(), featureCode);
    }

    private void requireFeature(TransportActor actor, String featureCode) {
        if (!this.subscriptionService.isFeatureAccessibleStrict(actor.tenantId(), featureCode)) {
            throw new ForbiddenException("Transport feature " + featureCode + " is not enabled for the current subscription.");
        }
    }

    private void requireAdmin(TransportActor actor) {
        if (!ADMIN_ROLES.contains(actor.roleName().toUpperCase(Locale.ROOT))) {
            throw new ForbiddenException("You do not have permission to manage transport operations.");
        }
    }

    private String blankToNull(String value) {
        return value == null || value.isBlank() ? null : value.trim();
    }

    private String blankToDefault(String value, String fallback) {
        return value == null || value.isBlank() ? fallback : value.trim();
    }

    private int safeInt(Integer value) {
        return value == null ? 0 : value;
    }

    private int safeInt(long value) {
        return (int) value;
    }

    private BigDecimal defaultBigDecimal(BigDecimal value) {
        return value == null ? BigDecimal.ZERO : value;
    }

    private String dedupeKey(UUID tripId, String alertType) {
        return tripId + ":" + alertType;
    }

    private String resolveUserName(UUID userId) {
        if (userId == null) {
            return null;
        }
        return this.schoolUserRepository.findById(userId).map(SchoolUserEntity::getFullName).orElse(null);
    }

    private String toJson(Object value) {
        try {
            return value == null ? null : this.objectMapper.writeValueAsString(value);
        } catch (JsonProcessingException exception) {
            throw new IllegalStateException("Unable to serialize transport payload.", exception);
        }
    }

    private Map<String, Object> payloadOf(Object... values) {
        Map<String, Object> payload = new LinkedHashMap<>();
        for (int index = 0; index + 1 < values.length; index += 2) {
            Object key = values[index];
            Object value = values[index + 1];
            if (key != null && value != null) {
                payload.put(String.valueOf(key), value);
            }
        }
        return payload;
    }

    private TransportNotificationPreferences defaultPreferences() {
        return new TransportNotificationPreferences(true, true, true, true, true);
    }

    private TransportNotificationPreferences parsePreferences(String rawJson) {
        if (rawJson == null || rawJson.isBlank()) {
            return defaultPreferences();
        }
        try {
            return this.objectMapper.readValue(rawJson, new TypeReference<TransportNotificationPreferences>() {});
        } catch (Exception exception) {
            return defaultPreferences();
        }
    }

    private void publishTransportTopic(String topic, Object payload) {
        this.mqttEventPublisher.publish(topic, payload);
    }

    private void writeAudit(TransportActor actor, String entityType, UUID entityId, String actionType, Object oldValue, Object newValue) {
        TransportAuditLogEntity log = new TransportAuditLogEntity();
        log.setAuditLogId(UUID.randomUUID());
        log.setSchoolId(actor.schoolId());
        log.setActorUserId(actor.userId());
        log.setActorName(actor.fullName());
        log.setEntityType(entityType);
        log.setEntityId(entityId);
        log.setActionType(actionType);
        log.setOldValueJson(toJson(oldValue));
        log.setNewValueJson(toJson(newValue));
        log.setCreatedAt(Instant.now());
        this.transportAuditLogRepository.save(log);
    }

    private TransportPolicyEntity getOrCreatePolicy(UUID schoolId) {
        return this.transportPolicyRepository.findBySchoolId(schoolId)
                .orElseGet(() -> {
                    TransportPolicyEntity entity = new TransportPolicyEntity();
                    entity.setPolicyId(UUID.randomUUID());
                    entity.setSchoolId(schoolId);
                    entity.setSpeedLimitKmph(50);
                    entity.setOverspeedDurationSeconds(30);
                    entity.setIdleThresholdMinutes(10);
                    entity.setIdleResponseTimeoutMinutes(5);
                    entity.setDeviationRadiusMeters(BigDecimal.valueOf(250));
                    entity.setGpsOfflineTimeoutMinutes(5);
                    entity.setPreArrivalNotificationMinutes(10);
                    entity.setContactSharingPolicy("ALLOWED");
                    entity.setMissedBoardingPolicy("PARENT_AND_ADMIN");
                    entity.setHolidaySuppressionEnabled(true);
                    entity.setDeviceApiSecret(UUID.randomUUID().toString().replace("-", ""));
                    entity.setCreatedAt(Instant.now());
                    entity.setUpdatedAt(Instant.now());
                    return this.transportPolicyRepository.save(entity);
                });
    }

    private TransportPolicyResponse toPolicyResponse(TransportPolicyEntity policy) {
        return new TransportPolicyResponse(
                policy.getPolicyId(),
                policy.getSchoolId(),
                safeInt(policy.getSpeedLimitKmph()),
                safeInt(policy.getOverspeedDurationSeconds()),
                safeInt(policy.getIdleThresholdMinutes()),
                safeInt(policy.getIdleResponseTimeoutMinutes()),
                defaultBigDecimal(policy.getDeviationRadiusMeters()),
                safeInt(policy.getGpsOfflineTimeoutMinutes()),
                safeInt(policy.getPreArrivalNotificationMinutes()),
                blankToDefault(policy.getContactSharingPolicy(), "ALLOWED"),
                blankToDefault(policy.getMissedBoardingPolicy(), "PARENT_AND_ADMIN"),
                policy.getSchoolGeofenceLatitude(),
                policy.getSchoolGeofenceLongitude(),
                policy.getSchoolGeofenceRadiusMeters(),
                policy.getDepotGeofenceLatitude(),
                policy.getDepotGeofenceLongitude(),
                policy.getDepotGeofenceRadiusMeters(),
                Boolean.TRUE.equals(policy.getHolidaySuppressionEnabled()),
                policy.getCreatedAt(),
                policy.getUpdatedAt()
        );
    }

    private TransportRouteEntity getRoute(UUID routeId) {
        return this.transportRouteRepository.findById(routeId)
                .orElseThrow(() -> new IllegalArgumentException("Transport route not found."));
    }

    private TransportRouteAssignmentEntity getAssignment(UUID assignmentId) {
        return this.transportRouteAssignmentRepository.findById(assignmentId)
                .orElseThrow(() -> new IllegalArgumentException("Transport route assignment not found."));
    }

    private TransportTripEntity getTrip(UUID tripId) {
        return this.transportTripRepository.findById(tripId)
                .orElseThrow(() -> new IllegalArgumentException("Transport trip not found."));
    }

    private TransportRouteResponse toRouteResponse(TransportRouteEntity route, UUID schoolId) {
        int stopCount = this.transportStopRepository.findByRouteIdOrderByStopOrderAsc(route.getRouteId()).size();
        int studentCount = this.transportStudentAssignmentRepository.findByRouteId(route.getRouteId()).size();
        return new TransportRouteResponse(
                route.getRouteId(),
                route.getSchoolId(),
                route.getRouteName(),
                route.getRouteCode(),
                route.getZone(),
                route.getDirection(),
                route.getPlannedDistanceKm(),
                route.getEstimatedDurationMinutes(),
                route.getUtilizationTarget(),
                route.getEfficiencyScore(),
                blankToDefault(route.getStatus(), "ACTIVE"),
                stopCount,
                studentCount,
                route.getCreatedAt(),
                route.getUpdatedAt()
        );
    }

    private TransportStopResponse toStopResponse(TransportStopEntity stop) {
        return new TransportStopResponse(
                stop.getStopId(),
                stop.getSchoolId(),
                stop.getRouteId(),
                stop.getStopName(),
                safeInt(stop.getStopOrder()),
                stop.getLatitude(),
                stop.getLongitude(),
                stop.getPickupTime(),
                stop.getDropTime(),
                stop.getLocalityLabel(),
                stop.getGeofenceRadiusMeters(),
                blankToDefault(stop.getStopType(), "PICKUP_DROP"),
                blankToDefault(stop.getStopStatus(), "ACTIVE"),
                stop.getScheduledPickupWindowStart(),
                stop.getScheduledPickupWindowEnd(),
                stop.getScheduledDropWindowStart(),
                stop.getScheduledDropWindowEnd(),
                Boolean.TRUE.equals(stop.getCampusStop()),
                Boolean.TRUE.equals(stop.getDepotStop()),
                stop.getCreatedAt(),
                stop.getUpdatedAt()
        );
    }

    private void applyStopRequest(TransportStopEntity entity, TransportStopRequest request) {
        entity.setSchoolId(request.schoolId());
        entity.setRouteId(request.routeId());
        entity.setStopName(request.stopName());
        entity.setStopOrder(request.stopOrder());
        entity.setLatitude(request.latitude());
        entity.setLongitude(request.longitude());
        entity.setPickupTime(blankToNull(request.pickupTime()));
        entity.setDropTime(blankToNull(request.dropTime()));
        entity.setLocalityLabel(blankToNull(request.localityLabel()));
        entity.setGeofenceRadiusMeters(request.geofenceRadiusMeters());
        entity.setStopType(blankToDefault(request.stopType(), "PICKUP_DROP"));
        entity.setStopStatus(blankToDefault(request.stopStatus(), "ACTIVE"));
        entity.setScheduledPickupWindowStart(blankToNull(request.scheduledPickupWindowStart()));
        entity.setScheduledPickupWindowEnd(blankToNull(request.scheduledPickupWindowEnd()));
        entity.setScheduledDropWindowStart(blankToNull(request.scheduledDropWindowStart()));
        entity.setScheduledDropWindowEnd(blankToNull(request.scheduledDropWindowEnd()));
        entity.setCampusStop(Boolean.TRUE.equals(request.campusStop()));
        entity.setDepotStop(Boolean.TRUE.equals(request.depotStop()));
    }

    private void applyVehicleRequest(TransportVehicleEntity entity, TransportVehicleRequest request) {
        entity.setSchoolId(request.schoolId());
        entity.setRegistrationNumber(request.registrationNumber().trim().toUpperCase(Locale.ROOT));
        entity.setVehicleType(request.vehicleType().trim().toUpperCase(Locale.ROOT));
        entity.setCapacity(request.capacity());
        entity.setGpsDeviceId(blankToNull(request.gpsDeviceId()));
        entity.setHealthStatus(blankToDefault(request.healthStatus(), "GOOD").toUpperCase(Locale.ROOT));
        entity.setInsuranceExpiry(request.insuranceExpiry());
        entity.setFitnessExpiry(request.fitnessExpiry());
        entity.setPermitExpiry(request.permitExpiry());
        entity.setPollutionExpiry(request.pollutionExpiry());
        entity.setLastServiceDate(request.lastServiceDate());
        entity.setNextServiceDue(request.nextServiceDue());
        entity.setMaintenanceLock(Boolean.TRUE.equals(request.maintenanceLock()) || !isVehicleDocumentationValid(entity));
        entity.setOperationalNotes(blankToNull(request.operationalNotes()));
    }

    private TransportVehicleResponse toVehicleResponse(TransportVehicleEntity entity) {
        int activeDocumentWarnings = (int) this.transportVehicleDocumentRepository.findByVehicleIdOrderByCreatedAtDesc(entity.getVehicleId()).stream()
                .filter(document -> document.getExpiresOn() != null && !document.getExpiresOn().isAfter(LocalDate.now().plusDays(30)))
                .count();
        return new TransportVehicleResponse(
                entity.getVehicleId(),
                entity.getSchoolId(),
                entity.getRegistrationNumber(),
                entity.getVehicleType(),
                safeInt(entity.getCapacity()),
                entity.getGpsDeviceId(),
                entity.getHealthStatus(),
                entity.getInsuranceExpiry(),
                entity.getFitnessExpiry(),
                entity.getPermitExpiry(),
                entity.getPollutionExpiry(),
                entity.getLastServiceDate(),
                entity.getNextServiceDue(),
                Boolean.TRUE.equals(entity.getMaintenanceLock()),
                entity.getOperationalNotes(),
                activeDocumentWarnings,
                entity.getCreatedAt(),
                entity.getUpdatedAt()
        );
    }

    private TransportVehicleDocumentResponse toVehicleDocumentResponse(TransportVehicleDocumentEntity entity) {
        return new TransportVehicleDocumentResponse(
                entity.getDocumentId(),
                entity.getVehicleId(),
                entity.getSchoolId(),
                entity.getDocumentType(),
                entity.getDocumentName(),
                entity.getAccessUrl(),
                entity.getIssuedOn(),
                entity.getExpiresOn(),
                entity.getVerificationStatus(),
                entity.getReminderStatus(),
                entity.getCreatedAt(),
                entity.getUpdatedAt()
        );
    }

    private TransportStaffProfileResponse toStaffProfileResponse(TransportStaffProfileEntity entity) {
        SchoolUserEntity user = this.schoolUserRepository.findById(entity.getUserId()).orElse(null);
        return new TransportStaffProfileResponse(
                entity.getProfileId(),
                entity.getSchoolId(),
                entity.getUserId(),
                entity.getStaffRole(),
                user == null ? null : user.getFullName(),
                user == null ? null : user.getEmail(),
                entity.getMobileNumber(),
                entity.getAddress(),
                entity.getEmergencyContactName(),
                entity.getEmergencyContactPhone(),
                entity.getGovtIdNumber(),
                entity.getVerificationStatus(),
                entity.getBackgroundCheckStatus(),
                entity.getLicenseNumber(),
                entity.getLicenseExpiry(),
                entity.getOnboardingNotes(),
                entity.getCreatedAt(),
                entity.getUpdatedAt()
        );
    }

    private SchoolUserEntity createTransportUser(TransportStaffProfileRequest request) {
        SchoolUserEntity entity = new SchoolUserEntity();
        entity.setUserId(UUID.randomUUID());
        entity.setTenantId(request.tenantId() == null ? request.schoolId() : request.tenantId());
        entity.setSchoolId(request.schoolId());
        entity.setSchoolCode(blankToDefault(request.schoolCode(), "SCHOOL"));
        entity.setFullName(request.fullName());
        entity.setEmail(request.email());
        entity.setRoleName(request.staffRole().trim().toUpperCase(Locale.ROOT));
        entity.setActive(true);
        entity.setCreatedAt(Instant.now());
        this.schoolUserRepository.save(entity);
        String accessKey = blankToDefault(request.accessKey(), UUID.randomUUID().toString().substring(0, 8).toUpperCase(Locale.ROOT));
        try {
            this.authRestClient.post()
                    .uri("/api/v1/auth/internal/provision-user")
                    .body(payloadOf(
                            "tenantId", entity.getTenantId(),
                            "schoolId", entity.getSchoolId(),
                            "schoolCode", blankToDefault(entity.getSchoolCode(), "SCHOOL"),
                            "schoolName", blankToDefault(request.schoolName(), blankToDefault(request.schoolCode(), "School")),
                            "email", blankToDefault(entity.getEmail(), "transport-user@example.com"),
                            "fullName", blankToDefault(entity.getFullName(), "Transport Staff"),
                            "roleName", entity.getRoleName(),
                            "accessKey", accessKey
                    ))
                    .retrieve()
                    .toBodilessEntity();
        } catch (Exception ignored) {
        }
        try {
            this.communicationRestClient.post()
                    .uri("/api/v1/communication/notifications")
                    .body(payloadOf(
                            "recipientId", entity.getUserId(),
                            "title", "Transport account created",
                            "message", "Your transport account is ready. Login with " + blankToDefault(entity.getEmail(), "your email") + " and access key " + accessKey + ".",
                            "type", "TRANSPORT_STAFF_ONBOARDED",
                            "channel", "EMAIL"
                    ))
                    .retrieve()
                    .toBodilessEntity();
        } catch (Exception ignored) {
        }
        return entity;
    }

    private TransportStudentAssignmentResponse toStudentAssignmentResponse(TransportStudentAssignmentEntity entity) {
        SchoolUserEntity student = this.schoolUserRepository.findById(entity.getStudentUserId()).orElse(null);
        String morningStopName = entity.getMorningStopId() == null ? null : this.transportStopRepository.findById(entity.getMorningStopId()).map(TransportStopEntity::getStopName).orElse(null);
        String eveningStopName = entity.getEveningStopId() == null ? null : this.transportStopRepository.findById(entity.getEveningStopId()).map(TransportStopEntity::getStopName).orElse(null);
        return new TransportStudentAssignmentResponse(
                entity.getAssignmentId(),
                entity.getSchoolId(),
                entity.getStudentUserId(),
                student == null ? null : student.getFullName(),
                entity.getRouteId(),
                entity.getMorningStopId(),
                entity.getEveningStopId(),
                morningStopName,
                eveningStopName,
                entity.getLocalityLabel(),
                entity.getEffectiveFrom(),
                entity.getEffectiveTo(),
                blankToDefault(entity.getBoardingVerificationMode(), "MANUAL"),
                blankToDefault(entity.getTransportStatus(), "ACTIVE"),
                entity.getCreatedAt(),
                entity.getUpdatedAt()
        );
    }

    private AssignmentReadiness evaluateAssignmentReadiness(TransportRouteAssignmentEntity entity) {
        TransportVehicleEntity vehicle = entity.getVehicleId() == null ? null : this.transportVehicleRepository.findById(entity.getVehicleId()).orElse(null);
        boolean vehicleReady = vehicle != null && isVehicleOperational(vehicle);
        boolean gpsReady = vehicle != null && vehicle.getGpsDeviceId() != null && !vehicle.getGpsDeviceId().isBlank();
        if (!gpsReady && entity.getDriverUserId() != null) {
            gpsReady = true;
        }
        String summary = vehicleReady ? "Vehicle ready" : "Vehicle blocked";
        summary = summary + (gpsReady ? ", GPS ready" : ", GPS pending");
        return new AssignmentReadiness(vehicleReady, gpsReady, summary);
    }

    private TransportRouteAssignmentResponse toRouteAssignmentResponse(TransportRouteAssignmentEntity entity) {
        TransportRouteEntity route = this.transportRouteRepository.findById(entity.getRouteId()).orElse(null);
        TransportVehicleEntity vehicle = entity.getVehicleId() == null ? null : this.transportVehicleRepository.findById(entity.getVehicleId()).orElse(null);
        AssignmentReadiness readiness = evaluateAssignmentReadiness(entity);
        return new TransportRouteAssignmentResponse(
                entity.getAssignmentId(),
                entity.getSchoolId(),
                entity.getRouteId(),
                route == null ? null : route.getRouteName(),
                entity.getVehicleId(),
                vehicle == null ? null : vehicle.getRegistrationNumber(),
                entity.getDriverUserId(),
                resolveUserName(entity.getDriverUserId()),
                entity.getConductorUserId(),
                resolveUserName(entity.getConductorUserId()),
                entity.getBackupDriverUserId(),
                entity.getBackupVehicleId(),
                entity.getServiceDate(),
                entity.getShiftType(),
                entity.getAssignmentStatus(),
                Boolean.TRUE.equals(entity.getDriverOnboardMarked()),
                Boolean.TRUE.equals(entity.getConductorOnboardMarked()),
                readiness.vehicleReady(),
                readiness.gpsReady(),
                readiness.summary(),
                entity.getNotes(),
                entity.getCreatedAt(),
                entity.getUpdatedAt()
        );
    }

    private TransportTripEntity ensureTripForAssignment(TransportRouteAssignmentEntity assignment) {
        TransportTripEntity trip = this.transportTripRepository.findByRouteAssignmentId(assignment.getAssignmentId())
                .orElseGet(() -> {
                    TransportTripEntity entity = new TransportTripEntity();
                    entity.setTripId(UUID.randomUUID());
                    entity.setSchoolId(assignment.getSchoolId());
                    entity.setRouteAssignmentId(assignment.getAssignmentId());
                    entity.setCreatedAt(Instant.now());
                    return entity;
                });
        trip.setRouteId(assignment.getRouteId());
        trip.setVehicleId(assignment.getVehicleId());
        trip.setDriverUserId(assignment.getDriverUserId());
        trip.setConductorUserId(assignment.getConductorUserId());
        trip.setServiceDate(assignment.getServiceDate());
        trip.setShiftType(assignment.getShiftType());
        trip.setTripState(blankToDefault(trip.getTripState(), Boolean.TRUE.equals(assignment.getDriverOnboardMarked()) && Boolean.TRUE.equals(assignment.getConductorOnboardMarked()) ? "READY" : "PLANNED"));
        trip.setOccupancyCount(safeInt(trip.getOccupancyCount()));
        trip.setGpsStatus(blankToDefault(trip.getGpsStatus(), "PENDING"));
        trip.setHaltStatus(blankToDefault(trip.getHaltStatus(), "NORMAL"));
        trip.setDeviationStatus(blankToDefault(trip.getDeviationStatus(), "ON_ROUTE"));
        trip.setEmergencyStatus(blankToDefault(trip.getEmergencyStatus(), "NORMAL"));
        trip.setRouteEfficiencyScore(this.transportRouteRepository.findById(assignment.getRouteId()).map(TransportRouteEntity::getEfficiencyScore).orElse(null));
        trip.setPlannedStartTime(trip.getPlannedStartTime() == null ? assignment.getServiceDate().atStartOfDay(java.time.ZoneOffset.UTC).toInstant().plus(Duration.ofHours("EVENING".equalsIgnoreCase(assignment.getShiftType()) ? 14 : 6)) : trip.getPlannedStartTime());
        trip.setPlannedEndTime(trip.getPlannedEndTime() == null ? trip.getPlannedStartTime().plus(Duration.ofMinutes(this.transportRouteRepository.findById(assignment.getRouteId()).map(TransportRouteEntity::getEstimatedDurationMinutes).orElse(60))) : trip.getPlannedEndTime());
        trip.setUpdatedAt(Instant.now());
        this.transportTripRepository.save(trip);

        List<TransportTripStopEntity> existingStops = this.transportTripStopRepository.findByTripIdOrderBySequenceOrderAsc(trip.getTripId());
        if (existingStops.isEmpty()) {
            List<TransportStopEntity> routeStops = this.transportStopRepository.findByRouteIdOrderByStopOrderAsc(assignment.getRouteId());
            for (int index = 0; index < routeStops.size(); index++) {
                TransportStopEntity routeStop = routeStops.get(index);
                TransportTripStopEntity tripStop = new TransportTripStopEntity();
                tripStop.setTripStopId(UUID.randomUUID());
                tripStop.setSchoolId(assignment.getSchoolId());
                tripStop.setTripId(trip.getTripId());
                tripStop.setStopId(routeStop.getStopId());
                tripStop.setSequenceOrder(index + 1);
                tripStop.setPlannedEta(trip.getPlannedStartTime() == null ? null : trip.getPlannedStartTime().plus(Duration.ofMinutes(index * 8L)));
                tripStop.setStopStatus("PENDING");
                tripStop.setEtaMinutes((index + 1) * 8);
                tripStop.setCreatedAt(Instant.now());
                tripStop.setUpdatedAt(Instant.now());
                this.transportTripStopRepository.save(tripStop);
            }
            trip.setNextStopId(routeStops.isEmpty() ? null : routeStops.get(0).getStopId());
            trip.setUpdatedAt(Instant.now());
            this.transportTripRepository.save(trip);
        }
        return trip;
    }

    private TransportTripStopResponse toTripStopResponse(TransportTripStopEntity entity) {
        String stopName = this.transportStopRepository.findById(entity.getStopId()).map(TransportStopEntity::getStopName).orElse(null);
        return new TransportTripStopResponse(
                entity.getTripStopId(),
                entity.getStopId(),
                stopName,
                safeInt(entity.getSequenceOrder()),
                entity.getPlannedEta(),
                entity.getActualArrivalAt(),
                entity.getActualDepartureAt(),
                blankToDefault(entity.getStopStatus(), "PENDING"),
                entity.getOccupancyAfterStop(),
                entity.getEtaMinutes(),
                entity.getHaltReason()
        );
    }

    private TransportTripEventResponse toTripEventResponse(TransportTripEventEntity entity) {
        return new TransportTripEventResponse(
                entity.getEventId(),
                entity.getEventType(),
                entity.getEventStatus(),
                entity.getEventMessage(),
                entity.getActorName(),
                entity.getCreatedAt()
        );
    }

    private TransportAlertResponse toAlertResponse(TransportAlertEntity entity) {
        return new TransportAlertResponse(
                entity.getAlertId(),
                entity.getTripId(),
                entity.getVehicleId(),
                entity.getAlertType(),
                entity.getSeverity(),
                entity.getMessage(),
                entity.getAlertStatus(),
                entity.getCreatedAt(),
                entity.getUpdatedAt()
        );
    }

    private TransportTripResponse toTripResponse(TransportTripEntity entity) {
        refreshOfflineStatus(entity);
        TransportRouteEntity route = this.transportRouteRepository.findById(entity.getRouteId()).orElse(null);
        TransportVehicleEntity vehicle = entity.getVehicleId() == null ? null : this.transportVehicleRepository.findById(entity.getVehicleId()).orElse(null);
        UUID nextStopId = entity.getNextStopId();
        String nextStopName = nextStopId == null ? null : this.transportStopRepository.findById(nextStopId).map(TransportStopEntity::getStopName).orElse(null);
        List<TransportTripStopResponse> stops = this.transportTripStopRepository.findByTripIdOrderBySequenceOrderAsc(entity.getTripId()).stream()
                .map(this::toTripStopResponse)
                .toList();
        List<TransportTripEventResponse> recentEvents = this.transportTripEventRepository.findByTripIdOrderByCreatedAtDesc(entity.getTripId()).stream()
                .limit(10)
                .map(this::toTripEventResponse)
                .toList();
        return new TransportTripResponse(
                entity.getTripId(),
                entity.getRouteAssignmentId(),
                entity.getRouteId(),
                route == null ? null : route.getRouteName(),
                entity.getVehicleId(),
                vehicle == null ? null : vehicle.getRegistrationNumber(),
                vehicle == null ? null : vehicle.getVehicleType(),
                entity.getDriverUserId(),
                resolveUserName(entity.getDriverUserId()),
                entity.getConductorUserId(),
                resolveUserName(entity.getConductorUserId()),
                entity.getServiceDate(),
                entity.getShiftType(),
                entity.getTripState(),
                entity.getOccupancyCount(),
                vehicle == null ? (route == null ? null : route.getCapacity()) : vehicle.getCapacity(),
                entity.getGpsStatus(),
                entity.getCurrentLatitude(),
                entity.getCurrentLongitude(),
                entity.getCurrentSpeed(),
                entity.getCurrentHeading(),
                nextStopId,
                nextStopName,
                entity.getEtaToSchoolMinutes(),
                entity.getHaltStatus(),
                entity.getDeviationStatus(),
                entity.getEmergencyStatus(),
                entity.getRouteEfficiencyScore(),
                entity.getPlannedStartTime(),
                entity.getActualStartTime(),
                entity.getActualEndTime(),
                entity.getLastPingAt(),
                stops,
                recentEvents
        );
    }

    private TransportUserSubscriptionResponse toUserSubscriptionResponse(TransportUserSubscriptionEntity entity) {
        return new TransportUserSubscriptionResponse(
                entity.getSubscriptionId(),
                entity.getSchoolId(),
                entity.getUserId(),
                resolveUserName(entity.getUserId()),
                entity.getStudentUserId(),
                resolveUserName(entity.getStudentUserId()),
                entity.getRouteId(),
                entity.getTripId(),
                entity.getSubscriptionStatus(),
                parsePreferences(entity.getNotificationPreferencesJson()),
                entity.getCreatedAt(),
                entity.getUpdatedAt()
        );
    }

    private TransportOptimizationRunResponse toOptimizationRunResponse(TransportOptimizationRunEntity entity) {
        return new TransportOptimizationRunResponse(
                entity.getOptimizationRunId(),
                entity.getSchoolId(),
                entity.getShiftType(),
                entity.getServiceDate(),
                entity.getBeforeVehicleCount(),
                entity.getAfterVehicleCount(),
                entity.getDistanceSavedKm(),
                entity.getTimeSavedMinutes(),
                entity.getConfidenceScore(),
                entity.getExplanation(),
                entity.getApprovalStatus(),
                entity.getCreatedAt(),
                entity.getUpdatedAt()
        );
    }

    private List<TransportClusterResponse> getClustersInternal(UUID schoolId) {
        Map<String, List<TransportStudentAssignmentEntity>> grouped = this.transportStudentAssignmentRepository.findBySchoolId(schoolId).stream()
                .collect(Collectors.groupingBy(item -> blankToDefault(item.getLocalityLabel(), "Unassigned Locality"), LinkedHashMap::new, Collectors.toList()));
        return grouped.entrySet().stream()
                .map(entry -> {
                    Set<UUID> routeIds = entry.getValue().stream().map(TransportStudentAssignmentEntity::getRouteId).collect(Collectors.toSet());
                    int studentCount = entry.getValue().size();
                    int capacity = this.transportRouteAssignmentRepository.findBySchoolIdAndServiceDateOrderByCreatedAtDesc(schoolId, LocalDate.now()).stream()
                            .filter(item -> routeIds.contains(item.getRouteId()) && item.getVehicleId() != null)
                            .map(item -> this.transportVehicleRepository.findById(item.getVehicleId()).map(TransportVehicleEntity::getCapacity).orElse(0))
                            .mapToInt(Integer::intValue)
                            .sum();
                    return new TransportClusterResponse(entry.getKey(), studentCount, routeIds.size(), capacity - studentCount);
                })
                .sorted(Comparator.comparingInt(TransportClusterResponse::studentCount).reversed())
                .toList();
    }

    private ResolvedTransportAudience resolveAudience(TransportActor actor) {
        String role = actor.roleName().toUpperCase(Locale.ROOT);
        UUID trackedStudentUserId = null;
        if ("STUDENT".equals(role)) {
            trackedStudentUserId = actor.userId();
        } else if ("PARENT".equals(role)) {
            trackedStudentUserId = this.studentParentMappingRepository.findByParentUserId(actor.userId()).stream()
                    .map(StudentParentMappingEntity::getStudentUserId)
                    .findFirst()
                    .orElse(null);
        } else if ("TEACHER".equals(role)) {
            TransportUserSubscriptionEntity subscription = this.transportUserSubscriptionRepository.findFirstBySchoolIdAndUserIdAndSubscriptionStatusOrderByCreatedAtDesc(actor.schoolId(), actor.userId(), "ACTIVE")
                    .orElseThrow(() -> new IllegalArgumentException("Teacher transport subscription not found."));
            trackedStudentUserId = subscription.getStudentUserId();
        } else {
            throw new IllegalArgumentException("Transport subscriber role not supported for this endpoint.");
        }
        String trackedStudentName = resolveUserName(trackedStudentUserId);
        TransportStudentAssignmentEntity assignment = trackedStudentUserId == null ? null : this.transportStudentAssignmentRepository.findByStudentUserId(trackedStudentUserId).orElse(null);
        TransportTripEntity trip = assignment == null ? null : this.transportTripRepository.findBySchoolIdAndServiceDateOrderByUpdatedAtDesc(actor.schoolId(), LocalDate.now()).stream()
                .filter(item -> item.getRouteId().equals(assignment.getRouteId()) && ACTIVE_TRIP_STATES.contains(item.getTripState()))
                .findFirst()
                .orElse(null);
        TransportPolicyEntity policy = getOrCreatePolicy(actor.schoolId());
        boolean contactAllowed = !"NONE".equalsIgnoreCase(policy.getContactSharingPolicy());
        String conductorContact = null;
        if (contactAllowed && trip != null && trip.getConductorUserId() != null) {
            TransportStaffProfileEntity profile = this.transportStaffProfileRepository.findByUserId(trip.getConductorUserId()).orElse(null);
            conductorContact = profile == null ? resolveUserName(trip.getConductorUserId()) : blankToDefault(profile.getMobileNumber(), resolveUserName(trip.getConductorUserId()));
        }
        return new ResolvedTransportAudience(trackedStudentUserId, trackedStudentName, trip, contactAllowed, conductorContact);
    }

    private TransportUserSubscriptionEntity getOrCreateSubscription(TransportActor actor) {
        return this.transportUserSubscriptionRepository.findFirstBySchoolIdAndUserIdAndSubscriptionStatusOrderByCreatedAtDesc(actor.schoolId(), actor.userId(), "ACTIVE")
                .orElseGet(() -> {
                    TransportUserSubscriptionEntity entity = new TransportUserSubscriptionEntity();
                    entity.setSubscriptionId(UUID.randomUUID());
                    entity.setSchoolId(actor.schoolId());
                    entity.setUserId(actor.userId());
                    if ("STUDENT".equalsIgnoreCase(actor.roleName())) {
                        entity.setStudentUserId(actor.userId());
                    } else if ("PARENT".equalsIgnoreCase(actor.roleName())) {
                        entity.setStudentUserId(this.studentParentMappingRepository.findByParentUserId(actor.userId()).stream().map(StudentParentMappingEntity::getStudentUserId).findFirst().orElse(null));
                    }
                    entity.setNotificationPreferencesJson(toJson(defaultPreferences()));
                    entity.setSubscriptionStatus("ACTIVE");
                    entity.setCreatedAt(Instant.now());
                    entity.setUpdatedAt(Instant.now());
                    return this.transportUserSubscriptionRepository.save(entity);
                });
    }

    private List<TransportMyTimelineItem> buildTimeline(UUID schoolId, UUID tripId, UUID trackedStudentUserId) {
        List<TransportMyTimelineItem> items = new ArrayList<>();
        if (tripId != null) {
            this.transportTripEventRepository.findByTripIdOrderByCreatedAtDesc(tripId).stream()
                    .limit(10)
                    .forEach(event -> items.add(new TransportMyTimelineItem(
                            event.getEventType(),
                            event.getEventType().replace('_', ' '),
                            event.getEventMessage(),
                            event.getCreatedAt(),
                            null
                    )));
        }
        if (tripId != null && trackedStudentUserId != null) {
            this.transportBoardingLogRepository.findByTripIdAndStudentUserIdOrderByCreatedAtDesc(tripId, trackedStudentUserId).stream()
                    .limit(5)
                    .forEach(log -> items.add(new TransportMyTimelineItem(
                            log.getBoardingState(),
                            "Student " + log.getBoardingState().toLowerCase(Locale.ROOT),
                            resolveUserName(log.getStudentUserId()),
                            log.getCreatedAt(),
                            null
                    )));
        }
        return items.stream()
                .sorted(Comparator.comparing(TransportMyTimelineItem::occurredAt, Comparator.nullsLast(Comparator.reverseOrder())))
                .toList();
    }

    private void ensureTripActorAccess(TransportActor actor, TransportTripEntity trip, TransportRouteAssignmentEntity assignment) {
        String role = actor.roleName().toUpperCase(Locale.ROOT);
        if (ADMIN_ROLES.contains(role)) {
            return;
        }
        if (DRIVER_ROLES.contains(role) && actor.userId().equals(assignment.getDriverUserId())) {
            return;
        }
        if (CONDUCTOR_ROLES.contains(role) && actor.userId().equals(assignment.getConductorUserId())) {
            return;
        }
        throw new IllegalArgumentException("You are not assigned to this trip.");
    }

    private TransportTripStopEntity getCurrentTripStop(TransportTripEntity trip) {
        return this.transportTripStopRepository.findByTripIdOrderBySequenceOrderAsc(trip.getTripId()).stream()
                .filter(item -> !"COMPLETED".equalsIgnoreCase(item.getStopStatus()))
                .findFirst()
                .orElse(null);
    }

    private void createTripEvent(TransportTripEntity trip, String eventType, String eventStatus, String message, TransportActor actor, Map<?, ?> metadata) {
        TransportTripEventEntity event = new TransportTripEventEntity();
        event.setEventId(UUID.randomUUID());
        event.setSchoolId(trip.getSchoolId());
        event.setTripId(trip.getTripId());
        event.setEventType(eventType);
        event.setEventStatus(eventStatus);
        event.setEventMessage(message);
        event.setActorUserId(actor == null ? null : actor.userId());
        event.setActorName(actor == null ? null : actor.fullName());
        event.setMetadataJson(toJson(metadata));
        event.setCreatedAt(Instant.now());
        this.transportTripEventRepository.save(event);
    }

    private void publishTripStatus(TransportTripEntity trip) {
        publishTransportTopic("transport/trips/" + trip.getSchoolId() + "/" + trip.getTripId() + "/status", toTripResponse(trip));
        publishTransportTopic("transport/dashboard/" + trip.getSchoolId(), Map.of("tripId", trip.getTripId(), "tripState", trip.getTripState()));
    }

    private void publishTripLocation(TransportTripEntity trip) {
        publishTransportTopic("transport/trips/" + trip.getSchoolId() + "/" + trip.getTripId() + "/location", payloadOf(
                "tripId", trip.getTripId(),
                "latitude", trip.getCurrentLatitude(),
                "longitude", trip.getCurrentLongitude(),
                "speed", trip.getCurrentSpeed(),
                "heading", trip.getCurrentHeading(),
                "updatedAt", trip.getUpdatedAt()
        ));
        publishTransportTopic("transport/dashboard/" + trip.getSchoolId(), payloadOf("tripId", trip.getTripId(), "latitude", trip.getCurrentLatitude(), "longitude", trip.getCurrentLongitude()));
    }

    private void applyGpsUpdate(TransportTripEntity trip, BigDecimal latitude, BigDecimal longitude, BigDecimal speed, BigDecimal heading, BigDecimal accuracyMeters, String source, Instant recordedAt) {
        List<TransportGpsPingEntity> existing = this.transportGpsPingRepository.findByTripIdOrderByRecordedAtDesc(trip.getTripId());
        TransportGpsPingEntity ping = new TransportGpsPingEntity();
        ping.setPingId(UUID.randomUUID());
        ping.setSchoolId(trip.getSchoolId());
        ping.setTripId(trip.getTripId());
        ping.setVehicleId(trip.getVehicleId());
        ping.setRouteId(trip.getRouteId());
        ping.setLatitude(latitude);
        ping.setLongitude(longitude);
        ping.setSpeed(speed);
        ping.setHeading(heading);
        ping.setAccuracyMeters(accuracyMeters);
        ping.setSource(blankToDefault(source, "MOBILE"));
        ping.setRecordedAt(recordedAt);
        this.transportGpsPingRepository.save(ping);

        TransportVehiclePositionEntity legacy = new TransportVehiclePositionEntity();
        legacy.setPositionId(UUID.randomUUID());
        legacy.setSchoolId(trip.getSchoolId());
        legacy.setRouteId(trip.getRouteId());
        legacy.setLatitude(latitude);
        legacy.setLongitude(longitude);
        legacy.setSpeed(speed);
        legacy.setHeading(heading);
        legacy.setRecordedAt(recordedAt);
        this.transportVehiclePositionRepository.save(legacy);

        if (!existing.isEmpty()) {
            TransportGpsPingEntity previous = existing.get(0);
            trip.setTotalDistanceKm(defaultBigDecimal(trip.getTotalDistanceKm()).add(BigDecimal.valueOf(distanceKm(previous.getLatitude(), previous.getLongitude(), latitude, longitude))).setScale(2, RoundingMode.HALF_UP));
        }
        trip.setCurrentLatitude(latitude);
        trip.setCurrentLongitude(longitude);
        trip.setCurrentSpeed(speed);
        trip.setCurrentHeading(heading);
        trip.setLastPingAt(recordedAt);
        trip.setGpsStatus("ONLINE");
        TransportTripStopEntity nextStop = getCurrentTripStop(trip);
        if (nextStop != null) {
            trip.setNextStopId(nextStop.getStopId());
            TransportStopEntity stop = this.transportStopRepository.findById(nextStop.getStopId()).orElse(null);
            if (stop != null && stop.getLatitude() != null && stop.getLongitude() != null) {
                int etaMinutes = (int) Math.max(1, Math.round(distanceKm(latitude, longitude, stop.getLatitude(), stop.getLongitude()) / 0.4d));
                nextStop.setEtaMinutes(etaMinutes);
                nextStop.setUpdatedAt(Instant.now());
                this.transportTripStopRepository.save(nextStop);
                trip.setEtaToSchoolMinutes(etaMinutes + Math.max(0, this.transportTripStopRepository.findByTripIdOrderBySequenceOrderAsc(trip.getTripId()).size() - nextStop.getSequenceOrder()) * 6);
                maybeSendPreArrivalNotification(trip, stop, etaMinutes);
                evaluateDeviation(trip, latitude, longitude, stop);
            }
        }
        trip.setTripState("RUNNING".equalsIgnoreCase(trip.getTripState()) ? "RUNNING" : trip.getTripState());
        trip.setUpdatedAt(Instant.now());
        this.transportTripRepository.save(trip);
        evaluateOverspeed(trip, speed);
        evaluateIdle(trip, speed, recordedAt);
        resolveAlert(dedupeKey(trip.getTripId(), "GPS_OFFLINE"), "SYSTEM");
    }

    private void refreshOfflineStatus(TransportTripEntity trip) {
        TransportPolicyEntity policy = getOrCreatePolicy(trip.getSchoolId());
        if (trip.getLastPingAt() != null && trip.getLastPingAt().isBefore(Instant.now().minus(Duration.ofMinutes(policy.getGpsOfflineTimeoutMinutes())))) {
            trip.setGpsStatus("OFFLINE");
            trip.setUpdatedAt(Instant.now());
            this.transportTripRepository.save(trip);
            openOrRefreshAlert(trip.getSchoolId(), trip.getTripId(), trip.getVehicleId(), trip.getRouteAssignmentId(), "GPS_OFFLINE", "WARNING", "GPS signal lost for assigned transport.", dedupeKey(trip.getTripId(), "GPS_OFFLINE"), Map.of("lastPingAt", trip.getLastPingAt()));
        }
    }

    private boolean isVehicleDocumentationValid(TransportVehicleEntity vehicle) {
        LocalDate today = LocalDate.now();
        return (vehicle.getInsuranceExpiry() == null || !vehicle.getInsuranceExpiry().isBefore(today))
                && (vehicle.getFitnessExpiry() == null || !vehicle.getFitnessExpiry().isBefore(today))
                && (vehicle.getPermitExpiry() == null || !vehicle.getPermitExpiry().isBefore(today))
                && (vehicle.getPollutionExpiry() == null || !vehicle.getPollutionExpiry().isBefore(today))
                && (vehicle.getNextServiceDue() == null || !vehicle.getNextServiceDue().isBefore(today.minusDays(7)));
    }

    private boolean isVehicleOperational(TransportVehicleEntity vehicle) {
        return vehicle != null
                && !Boolean.TRUE.equals(vehicle.getMaintenanceLock())
                && !"CRITICAL".equalsIgnoreCase(vehicle.getHealthStatus())
                && isVehicleDocumentationValid(vehicle);
    }

    private double distanceKm(BigDecimal fromLat, BigDecimal fromLng, BigDecimal toLat, BigDecimal toLng) {
        if (fromLat == null || fromLng == null || toLat == null || toLng == null) {
            return 0d;
        }
        double earthRadius = 6371d;
        double dLat = Math.toRadians(toLat.doubleValue() - fromLat.doubleValue());
        double dLng = Math.toRadians(toLng.doubleValue() - fromLng.doubleValue());
        double a = Math.sin(dLat / 2) * Math.sin(dLat / 2)
                + Math.cos(Math.toRadians(fromLat.doubleValue())) * Math.cos(Math.toRadians(toLat.doubleValue()))
                * Math.sin(dLng / 2) * Math.sin(dLng / 2);
        return 2 * earthRadius * Math.asin(Math.sqrt(a));
    }

    private void evaluateOverspeed(TransportTripEntity trip, BigDecimal speed) {
        if (speed == null) {
            return;
        }
        TransportPolicyEntity policy = getOrCreatePolicy(trip.getSchoolId());
        if (speed.compareTo(BigDecimal.valueOf(policy.getSpeedLimitKmph())) > 0) {
            openOrRefreshAlert(trip.getSchoolId(), trip.getTripId(), trip.getVehicleId(), trip.getRouteAssignmentId(), "OVERSPEED", "WARNING", "Vehicle speed crossed limit at " + speed + " km/h.", dedupeKey(trip.getTripId(), "OVERSPEED"), Map.of("speed", speed));
        } else {
            resolveAlert(dedupeKey(trip.getTripId(), "OVERSPEED"), "SYSTEM");
        }
    }

    private void evaluateIdle(TransportTripEntity trip, BigDecimal speed, Instant recordedAt) {
        if (speed == null || speed.compareTo(BigDecimal.ZERO) > 0) {
            resolveAlert(dedupeKey(trip.getTripId(), "IDLE"), "SYSTEM");
            return;
        }
        TransportPolicyEntity policy = getOrCreatePolicy(trip.getSchoolId());
        if (trip.getLastPingAt() != null && trip.getLastPingAt().isBefore(recordedAt.minus(Duration.ofMinutes(policy.getIdleThresholdMinutes())))) {
            trip.setHaltStatus("UNVERIFIED");
            this.transportTripRepository.save(trip);
            openOrRefreshAlert(trip.getSchoolId(), trip.getTripId(), trip.getVehicleId(), trip.getRouteAssignmentId(), "IDLE", "WARNING", "Vehicle idle beyond threshold.", dedupeKey(trip.getTripId(), "IDLE"), Map.of("thresholdMinutes", policy.getIdleThresholdMinutes()));
        }
    }

    private void evaluateDeviation(TransportTripEntity trip, BigDecimal latitude, BigDecimal longitude, TransportStopEntity nextStop) {
        TransportPolicyEntity policy = getOrCreatePolicy(trip.getSchoolId());
        double distanceMeters = distanceKm(latitude, longitude, nextStop.getLatitude(), nextStop.getLongitude()) * 1000d;
        if (distanceMeters > policy.getDeviationRadiusMeters().doubleValue() * 4d) {
            trip.setDeviationStatus("DEVIATED");
            this.transportTripRepository.save(trip);
            openOrRefreshAlert(trip.getSchoolId(), trip.getTripId(), trip.getVehicleId(), trip.getRouteAssignmentId(), "ROUTE_DEVIATION", "WARNING", "Vehicle deviated significantly from the planned corridor.", dedupeKey(trip.getTripId(), "ROUTE_DEVIATION"), Map.of("distanceMeters", distanceMeters));
        } else {
            trip.setDeviationStatus("ON_ROUTE");
            this.transportTripRepository.save(trip);
            resolveAlert(dedupeKey(trip.getTripId(), "ROUTE_DEVIATION"), "SYSTEM");
        }
    }

    private void openOrRefreshAlert(UUID schoolId, UUID tripId, UUID vehicleId, UUID routeAssignmentId, String alertType, String severity, String message, String dedupeKey, Map<?, ?> metadata) {
        TransportAlertEntity alert = this.transportAlertRepository.findByDedupeKeyAndAlertStatus(dedupeKey, "OPEN")
                .orElseGet(() -> {
                    TransportAlertEntity entity = new TransportAlertEntity();
                    entity.setAlertId(UUID.randomUUID());
                    entity.setSchoolId(schoolId);
                    entity.setTripId(tripId);
                    entity.setVehicleId(vehicleId);
                    entity.setRouteAssignmentId(routeAssignmentId);
                    entity.setAlertType(alertType);
                    entity.setSeverity(severity);
                    entity.setDedupeKey(dedupeKey);
                    entity.setCreatedAt(Instant.now());
                    return entity;
                });
        alert.setMessage(message);
        alert.setAlertStatus("OPEN");
        alert.setMetadataJson(toJson(metadata));
        alert.setUpdatedAt(Instant.now());
        this.transportAlertRepository.save(alert);
        publishTransportTopic("transport/alerts/" + schoolId, toAlertResponse(alert));
        notifyAdminsOfAlert(schoolId, alert);
    }

    private void resolveAlert(String dedupeKey, String resolvedBy) {
        this.transportAlertRepository.findByDedupeKeyAndAlertStatus(dedupeKey, "OPEN").ifPresent(alert -> {
            alert.setAlertStatus("RESOLVED");
            alert.setResolvedBy(resolvedBy);
            alert.setResolvedAt(Instant.now());
            alert.setUpdatedAt(Instant.now());
            this.transportAlertRepository.save(alert);
        });
    }

    private void notifyAdminsOfAlert(UUID schoolId, TransportAlertEntity alert) {
        this.schoolUserRepository.findBySchoolIdOrderByRoleNameAscFullNameAsc(schoolId).stream()
                .filter(user -> ADMIN_ROLES.contains(user.getRoleName().toUpperCase(Locale.ROOT)))
                .forEach(user -> sendNotification(schoolId, alert.getTripId(), null, user.getUserId(), "PUSH", alert.getAlertType(), "Transport alert", alert.getMessage(), Map.of("severity", alert.getSeverity())));
    }

    private void maybeSendPreArrivalNotification(TransportTripEntity trip, TransportStopEntity stop, int etaMinutes) {
        TransportPolicyEntity policy = getOrCreatePolicy(trip.getSchoolId());
        if (etaMinutes > policy.getPreArrivalNotificationMinutes()) {
            return;
        }
        this.transportStudentAssignmentRepository.findByRouteId(trip.getRouteId()).stream()
                .filter(item -> stop.getStopId().equals("EVENING".equalsIgnoreCase(trip.getShiftType()) ? item.getEveningStopId() : item.getMorningStopId()))
                .forEach(item -> notifyStudentAudience(
                        trip,
                        item.getStudentUserId(),
                        "PRE_ARRIVAL",
                        "Bus arriving soon",
                        "Your transport will reach " + stop.getStopName() + " in about " + etaMinutes + " minutes."
                ));
    }

    private void notifyDelayIfEligible(TransportTripEntity trip, String reason, Integer delayMinutes) {
        this.transportStudentAssignmentRepository.findByRouteId(trip.getRouteId()).forEach(item -> notifyStudentAudience(
                trip,
                item.getStudentUserId(),
                "DELAY_UPDATE",
                "Transport delayed",
                delayMinutes == null ? "Your transport reported a halt: " + reason : "Your transport is delayed by " + delayMinutes + " minutes. " + reason
        ));
    }

    private void notifySchoolArrival(TransportTripEntity trip) {
        this.transportStudentAssignmentRepository.findByRouteId(trip.getRouteId()).forEach(item -> notifyStudentAudience(
                trip,
                item.getStudentUserId(),
                "SCHOOL_ARRIVAL",
                "Reached school",
                "Your assigned transport has reached school."
        ));
    }

    private void notifyTripCompletion(TransportTripEntity trip) {
        if ("EVENING".equalsIgnoreCase(trip.getShiftType())) {
            this.transportStudentAssignmentRepository.findByRouteId(trip.getRouteId()).forEach(item -> notifyStudentAudience(
                    trip,
                    item.getStudentUserId(),
                    "TRIP_COMPLETED",
                    "Trip completed",
                    "Your transport trip has completed."
            ));
        }
    }

    private void sendBoardingNotification(TransportTripEntity trip, SchoolUserEntity student, TransportBoardingLogEntity log) {
        String state = log.getBoardingState();
        if ("BOARDED".equalsIgnoreCase(state)) {
            notifyStudentAudience(trip, student.getUserId(), "EVENING".equalsIgnoreCase(trip.getShiftType()) ? "DROP_BOARDING" : "PICKUP_BOARDING", "Student boarded", student.getFullName() + " boarded the bus.");
        } else if ("DROPPED".equalsIgnoreCase(state)) {
            notifyStudentAudience(trip, student.getUserId(), "EVENING".equalsIgnoreCase(trip.getShiftType()) ? "HOME_DROP" : "SCHOOL_ARRIVAL", "Student dropped", student.getFullName() + " was dropped at the destination.");
        }
    }

    private void handleMissedBoardingAlert(TransportTripEntity trip, SchoolUserEntity student, TransportBoardingLogEntity log) {
        TransportPolicyEntity policy = getOrCreatePolicy(trip.getSchoolId());
        if (!"NONE".equalsIgnoreCase(policy.getMissedBoardingPolicy())) {
            openOrRefreshAlert(trip.getSchoolId(), trip.getTripId(), trip.getVehicleId(), trip.getRouteAssignmentId(), "MISSED_BOARDING", "INFO", student.getFullName() + " was marked " + log.getBoardingState().toLowerCase(Locale.ROOT) + ".", dedupeKey(trip.getTripId(), "MISSED_BOARDING:" + student.getUserId()), Map.of("studentUserId", student.getUserId()));
        }
    }

    private void mirrorLegacyBoardingLog(TransportTripEntity trip, TransportBoardingLogEntity log) {
        TransportPickupLogEntity entity = new TransportPickupLogEntity();
        entity.setLogId(UUID.randomUUID());
        entity.setSchoolId(trip.getSchoolId());
        entity.setRouteId(trip.getRouteId());
        entity.setStudentUserId(log.getStudentUserId());
        entity.setStopId(log.getStopId());
        entity.setAction("DROPPED".equalsIgnoreCase(log.getBoardingState()) ? "DROP" : "PICKUP");
        entity.setMarkedBy(blankToDefault(log.getActorName(), "SYSTEM"));
        entity.setTripDate(trip.getServiceDate());
        entity.setMarkedAt(log.getCreatedAt());
        this.transportPickupLogRepository.save(entity);
    }

    private void notifyStudentAudience(TransportTripEntity trip, UUID studentUserId, String notificationType, String title, String message) {
        sendNotification(trip.getSchoolId(), trip.getTripId(), studentUserId, studentUserId, "PUSH", notificationType, title, message, Map.of("tripId", trip.getTripId()));
        this.studentParentMappingRepository.findByStudentUserId(studentUserId).forEach(mapping ->
                sendNotification(trip.getSchoolId(), trip.getTripId(), studentUserId, mapping.getParentUserId(), "PUSH", notificationType, title, message, Map.of("tripId", trip.getTripId()))
        );
        this.transportUserSubscriptionRepository.findBySchoolIdAndStudentUserIdAndSubscriptionStatus(trip.getSchoolId(), studentUserId, "ACTIVE").forEach(subscription ->
                sendNotification(trip.getSchoolId(), trip.getTripId(), studentUserId, subscription.getUserId(), "PUSH", notificationType, title, message, Map.of("tripId", trip.getTripId()))
        );
    }

    private void sendNotification(UUID schoolId, UUID tripId, UUID studentUserId, UUID recipientUserId, String channel, String type, String title, String message, Map<?, ?> metadata) {
        if (recipientUserId == null) {
            return;
        }
        TransportNotificationLogEntity log = new TransportNotificationLogEntity();
        log.setNotificationLogId(UUID.randomUUID());
        log.setSchoolId(schoolId);
        log.setTripId(tripId);
        log.setStudentUserId(studentUserId);
        log.setRecipientUserId(recipientUserId);
        log.setRecipientChannel(channel);
        log.setNotificationType(type);
        log.setTitle(title);
        log.setMessage(message);
        log.setNotificationStatus("SENT");
        log.setMetadataJson(toJson(metadata));
        log.setSentAt(Instant.now());
        log.setCreatedAt(Instant.now());
        this.transportNotificationLogRepository.save(log);
        try {
            this.communicationRestClient.post()
                    .uri("/api/v1/communication/notifications")
                    .body(Map.of(
                            "recipientId", recipientUserId,
                            "title", title,
                            "message", message,
                            "type", type,
                            "channel", channel
                    ))
                    .retrieve()
                    .toBodilessEntity();
        } catch (Exception ignored) {
        }
    }

    private String buildOptimizationExplanation(List<TransportRouteEntity> routes, Map<UUID, Integer> studentCounts, int beforeVehicleCount, int afterVehicleCount, BigDecimal distanceSavedKm, int timeSavedMinutes) {
        List<String> underUtilizedRoutes = routes.stream()
                .filter(route -> studentCounts.getOrDefault(route.getRouteId(), 0) < 20)
                .map(TransportRouteEntity::getRouteName)
                .limit(3)
                .toList();
        if (beforeVehicleCount <= afterVehicleCount) {
            return "Current route mix is already close to optimal. The engine recommends keeping the same fleet size and balancing low-density localities inside existing routes.";
        }
        return "Optimization recommends consolidating underutilized routes such as "
                + String.join(", ", underUtilizedRoutes.isEmpty() ? List.of("selected low-density corridors") : underUtilizedRoutes)
                + " to reduce fleet demand from "
                + beforeVehicleCount
                + " to "
                + afterVehicleCount
                + " vehicles, saving about "
                + distanceSavedKm
                + " km and "
                + timeSavedMinutes
                + " minutes per day.";
    }

    private record AssignmentReadiness(boolean vehicleReady, boolean gpsReady, String summary) {}

    private record ResolvedTransportAudience(
            UUID trackedStudentUserId,
            String trackedStudentName,
            TransportTripEntity trip,
            boolean contactAllowed,
            String conductorContact
    ) {}
}
