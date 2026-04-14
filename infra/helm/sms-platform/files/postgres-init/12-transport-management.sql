ALTER TABLE schoolops.transport_route
    ADD COLUMN IF NOT EXISTS route_code VARCHAR(120),
    ADD COLUMN IF NOT EXISTS zone VARCHAR(120),
    ADD COLUMN IF NOT EXISTS direction VARCHAR(40),
    ADD COLUMN IF NOT EXISTS planned_distance_km NUMERIC(10,2),
    ADD COLUMN IF NOT EXISTS estimated_duration_minutes INTEGER,
    ADD COLUMN IF NOT EXISTS corridor_polyline_json TEXT,
    ADD COLUMN IF NOT EXISTS utilization_target NUMERIC(5,2),
    ADD COLUMN IF NOT EXISTS efficiency_score NUMERIC(5,2),
    ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP;

ALTER TABLE schoolops.transport_stop
    ADD COLUMN IF NOT EXISTS locality_label VARCHAR(160),
    ADD COLUMN IF NOT EXISTS geofence_radius_meters NUMERIC(8,2),
    ADD COLUMN IF NOT EXISTS stop_type VARCHAR(40) DEFAULT 'PICKUP_DROP',
    ADD COLUMN IF NOT EXISTS stop_status VARCHAR(40) DEFAULT 'ACTIVE',
    ADD COLUMN IF NOT EXISTS scheduled_pickup_window_start VARCHAR(10),
    ADD COLUMN IF NOT EXISTS scheduled_pickup_window_end VARCHAR(10),
    ADD COLUMN IF NOT EXISTS scheduled_drop_window_start VARCHAR(10),
    ADD COLUMN IF NOT EXISTS scheduled_drop_window_end VARCHAR(10),
    ADD COLUMN IF NOT EXISTS campus_stop BOOLEAN DEFAULT FALSE,
    ADD COLUMN IF NOT EXISTS depot_stop BOOLEAN DEFAULT FALSE,
    ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP;

ALTER TABLE schoolops.transport_student_assignment
    ADD COLUMN IF NOT EXISTS morning_stop_id UUID,
    ADD COLUMN IF NOT EXISTS evening_stop_id UUID,
    ADD COLUMN IF NOT EXISTS pickup_latitude NUMERIC(10,7),
    ADD COLUMN IF NOT EXISTS pickup_longitude NUMERIC(10,7),
    ADD COLUMN IF NOT EXISTS drop_latitude NUMERIC(10,7),
    ADD COLUMN IF NOT EXISTS drop_longitude NUMERIC(10,7),
    ADD COLUMN IF NOT EXISTS locality_label VARCHAR(160),
    ADD COLUMN IF NOT EXISTS effective_from DATE,
    ADD COLUMN IF NOT EXISTS effective_to DATE,
    ADD COLUMN IF NOT EXISTS boarding_verification_mode VARCHAR(40) DEFAULT 'MANUAL',
    ADD COLUMN IF NOT EXISTS transport_status VARCHAR(40) DEFAULT 'ACTIVE',
    ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP;

CREATE TABLE IF NOT EXISTS schoolops.transport_policy (
    policy_id UUID PRIMARY KEY,
    school_id UUID NOT NULL UNIQUE,
    speed_limit_kmph INTEGER NOT NULL DEFAULT 50,
    overspeed_duration_seconds INTEGER NOT NULL DEFAULT 20,
    idle_threshold_minutes INTEGER NOT NULL DEFAULT 8,
    idle_response_timeout_minutes INTEGER NOT NULL DEFAULT 5,
    deviation_radius_meters NUMERIC(8,2) NOT NULL DEFAULT 250,
    gps_offline_timeout_minutes INTEGER NOT NULL DEFAULT 5,
    pre_arrival_notification_minutes INTEGER NOT NULL DEFAULT 10,
    contact_sharing_policy VARCHAR(40) NOT NULL DEFAULT 'CONDUCTOR_ONLY',
    missed_boarding_policy VARCHAR(40) NOT NULL DEFAULT 'NOTIFY_PARENT_AND_ADMIN',
    school_geofence_latitude NUMERIC(10,7),
    school_geofence_longitude NUMERIC(10,7),
    school_geofence_radius_meters NUMERIC(8,2),
    depot_geofence_latitude NUMERIC(10,7),
    depot_geofence_longitude NUMERIC(10,7),
    depot_geofence_radius_meters NUMERIC(8,2),
    holiday_suppression_enabled BOOLEAN NOT NULL DEFAULT TRUE,
    device_api_secret VARCHAR(255),
    created_at TIMESTAMPTZ NOT NULL,
    updated_at TIMESTAMPTZ NOT NULL
);

CREATE TABLE IF NOT EXISTS schoolops.transport_vehicle (
    vehicle_id UUID PRIMARY KEY,
    school_id UUID NOT NULL,
    registration_number VARCHAR(120) NOT NULL,
    vehicle_type VARCHAR(80) NOT NULL,
    capacity INTEGER NOT NULL,
    gps_device_id VARCHAR(160),
    health_status VARCHAR(40) NOT NULL DEFAULT 'GOOD',
    insurance_expiry DATE,
    fitness_expiry DATE,
    permit_expiry DATE,
    pollution_expiry DATE,
    last_service_date DATE,
    next_service_due DATE,
    maintenance_lock BOOLEAN NOT NULL DEFAULT FALSE,
    operational_notes TEXT,
    created_at TIMESTAMPTZ NOT NULL,
    updated_at TIMESTAMPTZ NOT NULL,
    CONSTRAINT uq_transport_vehicle_registration UNIQUE (school_id, registration_number)
);

CREATE TABLE IF NOT EXISTS schoolops.transport_vehicle_document (
    document_id UUID PRIMARY KEY,
    vehicle_id UUID NOT NULL REFERENCES schoolops.transport_vehicle(vehicle_id),
    school_id UUID NOT NULL,
    document_type VARCHAR(80) NOT NULL,
    document_name VARCHAR(255) NOT NULL,
    access_url TEXT NOT NULL,
    issued_on DATE,
    expires_on DATE,
    verification_status VARCHAR(40) NOT NULL DEFAULT 'PENDING',
    reminder_status VARCHAR(40) NOT NULL DEFAULT 'NONE',
    created_at TIMESTAMPTZ NOT NULL,
    updated_at TIMESTAMPTZ NOT NULL
);

CREATE TABLE IF NOT EXISTS schoolops.transport_staff_profile (
    profile_id UUID PRIMARY KEY,
    school_id UUID NOT NULL,
    user_id UUID NOT NULL UNIQUE,
    staff_role VARCHAR(40) NOT NULL,
    mobile_number VARCHAR(80),
    address TEXT,
    emergency_contact_name VARCHAR(255),
    emergency_contact_phone VARCHAR(80),
    govt_id_number VARCHAR(160),
    verification_status VARCHAR(40) NOT NULL DEFAULT 'PENDING',
    background_check_status VARCHAR(40) NOT NULL DEFAULT 'PENDING',
    license_number VARCHAR(160),
    license_expiry DATE,
    onboarding_notes TEXT,
    created_at TIMESTAMPTZ NOT NULL,
    updated_at TIMESTAMPTZ NOT NULL
);

CREATE TABLE IF NOT EXISTS schoolops.transport_route_assignment (
    assignment_id UUID PRIMARY KEY,
    school_id UUID NOT NULL,
    route_id UUID NOT NULL REFERENCES schoolops.transport_route(route_id),
    vehicle_id UUID REFERENCES schoolops.transport_vehicle(vehicle_id),
    driver_user_id UUID,
    conductor_user_id UUID,
    backup_driver_user_id UUID,
    backup_vehicle_id UUID REFERENCES schoolops.transport_vehicle(vehicle_id),
    service_date DATE NOT NULL,
    shift_type VARCHAR(20) NOT NULL,
    assignment_status VARCHAR(40) NOT NULL DEFAULT 'PLANNED',
    driver_onboard_marked BOOLEAN NOT NULL DEFAULT FALSE,
    conductor_onboard_marked BOOLEAN NOT NULL DEFAULT FALSE,
    vehicle_ready BOOLEAN NOT NULL DEFAULT FALSE,
    gps_ready BOOLEAN NOT NULL DEFAULT FALSE,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL,
    updated_at TIMESTAMPTZ NOT NULL,
    CONSTRAINT uq_transport_route_assignment UNIQUE (school_id, route_id, service_date, shift_type)
);

CREATE TABLE IF NOT EXISTS schoolops.transport_trip (
    trip_id UUID PRIMARY KEY,
    school_id UUID NOT NULL,
    route_assignment_id UUID NOT NULL REFERENCES schoolops.transport_route_assignment(assignment_id),
    route_id UUID NOT NULL REFERENCES schoolops.transport_route(route_id),
    vehicle_id UUID REFERENCES schoolops.transport_vehicle(vehicle_id),
    driver_user_id UUID,
    conductor_user_id UUID,
    service_date DATE NOT NULL,
    shift_type VARCHAR(20) NOT NULL,
    trip_state VARCHAR(40) NOT NULL DEFAULT 'PLANNED',
    planned_start_time TIMESTAMPTZ,
    planned_end_time TIMESTAMPTZ,
    actual_start_time TIMESTAMPTZ,
    actual_end_time TIMESTAMPTZ,
    occupancy_count INTEGER NOT NULL DEFAULT 0,
    gps_status VARCHAR(40) NOT NULL DEFAULT 'OFFLINE',
    last_ping_at TIMESTAMPTZ,
    current_latitude NUMERIC(10,7),
    current_longitude NUMERIC(10,7),
    current_speed NUMERIC(8,2),
    current_heading NUMERIC(8,2),
    next_stop_id UUID,
    halt_status VARCHAR(40) NOT NULL DEFAULT 'CLEAR',
    deviation_status VARCHAR(40) NOT NULL DEFAULT 'ON_ROUTE',
    emergency_status VARCHAR(40) NOT NULL DEFAULT 'NORMAL',
    route_efficiency_score NUMERIC(5,2),
    eta_to_school_minutes INTEGER,
    total_distance_km NUMERIC(10,2),
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL,
    updated_at TIMESTAMPTZ NOT NULL
);

CREATE TABLE IF NOT EXISTS schoolops.transport_trip_stop (
    trip_stop_id UUID PRIMARY KEY,
    school_id UUID NOT NULL,
    trip_id UUID NOT NULL REFERENCES schoolops.transport_trip(trip_id),
    stop_id UUID NOT NULL REFERENCES schoolops.transport_stop(stop_id),
    sequence_order INTEGER NOT NULL,
    planned_eta TIMESTAMPTZ,
    actual_arrival_at TIMESTAMPTZ,
    actual_departure_at TIMESTAMPTZ,
    stop_status VARCHAR(40) NOT NULL DEFAULT 'PENDING',
    occupancy_after_stop INTEGER,
    eta_minutes INTEGER,
    halt_reason TEXT,
    created_at TIMESTAMPTZ NOT NULL,
    updated_at TIMESTAMPTZ NOT NULL
);

CREATE TABLE IF NOT EXISTS schoolops.transport_user_subscription (
    subscription_id UUID PRIMARY KEY,
    school_id UUID NOT NULL,
    user_id UUID NOT NULL,
    student_user_id UUID,
    route_id UUID REFERENCES schoolops.transport_route(route_id),
    trip_id UUID REFERENCES schoolops.transport_trip(trip_id),
    notification_preferences_json TEXT,
    subscription_status VARCHAR(40) NOT NULL DEFAULT 'ACTIVE',
    created_at TIMESTAMPTZ NOT NULL,
    updated_at TIMESTAMPTZ NOT NULL
);

CREATE TABLE IF NOT EXISTS schoolops.transport_gps_ping (
    ping_id UUID PRIMARY KEY,
    school_id UUID NOT NULL,
    trip_id UUID REFERENCES schoolops.transport_trip(trip_id),
    vehicle_id UUID REFERENCES schoolops.transport_vehicle(vehicle_id),
    route_id UUID REFERENCES schoolops.transport_route(route_id),
    latitude NUMERIC(10,7) NOT NULL,
    longitude NUMERIC(10,7) NOT NULL,
    speed NUMERIC(8,2),
    heading NUMERIC(8,2),
    accuracy_meters NUMERIC(8,2),
    source VARCHAR(20) NOT NULL DEFAULT 'MOBILE',
    recorded_at TIMESTAMPTZ NOT NULL
);

CREATE TABLE IF NOT EXISTS schoolops.transport_boarding_log (
    log_id UUID PRIMARY KEY,
    school_id UUID NOT NULL,
    trip_id UUID NOT NULL REFERENCES schoolops.transport_trip(trip_id),
    trip_stop_id UUID REFERENCES schoolops.transport_trip_stop(trip_stop_id),
    student_user_id UUID NOT NULL,
    route_id UUID REFERENCES schoolops.transport_route(route_id),
    stop_id UUID REFERENCES schoolops.transport_stop(stop_id),
    boarding_state VARCHAR(40) NOT NULL,
    verification_mode VARCHAR(20) NOT NULL DEFAULT 'MANUAL',
    actor_user_id UUID,
    actor_name VARCHAR(255),
    created_at TIMESTAMPTZ NOT NULL
);

CREATE TABLE IF NOT EXISTS schoolops.transport_trip_event (
    event_id UUID PRIMARY KEY,
    school_id UUID NOT NULL,
    trip_id UUID NOT NULL REFERENCES schoolops.transport_trip(trip_id),
    event_type VARCHAR(60) NOT NULL,
    event_status VARCHAR(40),
    event_message TEXT,
    actor_user_id UUID,
    actor_name VARCHAR(255),
    metadata_json TEXT,
    created_at TIMESTAMPTZ NOT NULL
);

CREATE TABLE IF NOT EXISTS schoolops.transport_alert (
    alert_id UUID PRIMARY KEY,
    school_id UUID NOT NULL,
    trip_id UUID REFERENCES schoolops.transport_trip(trip_id),
    vehicle_id UUID REFERENCES schoolops.transport_vehicle(vehicle_id),
    route_assignment_id UUID REFERENCES schoolops.transport_route_assignment(assignment_id),
    alert_type VARCHAR(60) NOT NULL,
    severity VARCHAR(20) NOT NULL,
    dedupe_key VARCHAR(255),
    message TEXT NOT NULL,
    alert_status VARCHAR(40) NOT NULL DEFAULT 'OPEN',
    escalated_at TIMESTAMPTZ,
    acknowledged_at TIMESTAMPTZ,
    acknowledged_by VARCHAR(255),
    resolved_at TIMESTAMPTZ,
    resolved_by VARCHAR(255),
    metadata_json TEXT,
    created_at TIMESTAMPTZ NOT NULL,
    updated_at TIMESTAMPTZ NOT NULL
);

CREATE TABLE IF NOT EXISTS schoolops.transport_notification_log (
    notification_log_id UUID PRIMARY KEY,
    school_id UUID NOT NULL,
    trip_id UUID REFERENCES schoolops.transport_trip(trip_id),
    student_user_id UUID,
    recipient_user_id UUID,
    recipient_channel VARCHAR(40),
    notification_type VARCHAR(60) NOT NULL,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    notification_status VARCHAR(40) NOT NULL DEFAULT 'PENDING',
    metadata_json TEXT,
    sent_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL
);

CREATE TABLE IF NOT EXISTS schoolops.transport_optimization_run (
    optimization_run_id UUID PRIMARY KEY,
    school_id UUID NOT NULL,
    requested_by UUID,
    requested_by_name VARCHAR(255),
    shift_type VARCHAR(20),
    service_date DATE,
    input_snapshot_json TEXT,
    cluster_snapshot_json TEXT,
    proposal_snapshot_json TEXT,
    before_vehicle_count INTEGER,
    after_vehicle_count INTEGER,
    distance_saved_km NUMERIC(10,2),
    time_saved_minutes INTEGER,
    confidence_score NUMERIC(5,2),
    explanation TEXT,
    approval_status VARCHAR(40) NOT NULL DEFAULT 'DRAFT',
    approved_by VARCHAR(255),
    approved_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL,
    updated_at TIMESTAMPTZ NOT NULL
);

CREATE TABLE IF NOT EXISTS schoolops.transport_audit_log (
    audit_log_id UUID PRIMARY KEY,
    school_id UUID NOT NULL,
    actor_user_id UUID,
    actor_name VARCHAR(255),
    entity_type VARCHAR(80) NOT NULL,
    entity_id UUID,
    action_type VARCHAR(40) NOT NULL,
    old_value_json TEXT,
    new_value_json TEXT,
    created_at TIMESTAMPTZ NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_transport_vehicle_school ON schoolops.transport_vehicle(school_id);
CREATE INDEX IF NOT EXISTS idx_transport_route_assignment_date ON schoolops.transport_route_assignment(school_id, service_date, shift_type);
CREATE INDEX IF NOT EXISTS idx_transport_trip_assignment ON schoolops.transport_trip(route_assignment_id);
CREATE INDEX IF NOT EXISTS idx_transport_trip_status ON schoolops.transport_trip(school_id, service_date, shift_type, trip_state);
CREATE INDEX IF NOT EXISTS idx_transport_trip_stop_trip ON schoolops.transport_trip_stop(trip_id, sequence_order);
CREATE INDEX IF NOT EXISTS idx_transport_subscription_user ON schoolops.transport_user_subscription(user_id, subscription_status);
CREATE INDEX IF NOT EXISTS idx_transport_gps_ping_trip ON schoolops.transport_gps_ping(trip_id, recorded_at DESC);
CREATE INDEX IF NOT EXISTS idx_transport_boarding_trip ON schoolops.transport_boarding_log(trip_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_transport_event_trip ON schoolops.transport_trip_event(trip_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_transport_alert_status ON schoolops.transport_alert(school_id, alert_status, severity, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_transport_notification_trip ON schoolops.transport_notification_log(trip_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_transport_optimization_school ON schoolops.transport_optimization_run(school_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_transport_audit_school ON schoolops.transport_audit_log(school_id, created_at DESC);
