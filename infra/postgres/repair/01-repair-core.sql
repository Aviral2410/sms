-- Idempotent repair script for existing Postgres volumes where init scripts
-- were not executed (or were executed before newer tables were introduced).

CREATE EXTENSION IF NOT EXISTS pgcrypto;
CREATE SCHEMA IF NOT EXISTS identity;
CREATE SCHEMA IF NOT EXISTS schoolops;
CREATE SCHEMA IF NOT EXISTS subscription;

-- ---------------------------------------------------------------------------
-- identity.platform_settings (required by school-onboarding-service)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS identity.platform_settings (
    settings_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    theme_name VARCHAR(50) DEFAULT 'INDIGO_FLOW',
    accent_color VARCHAR(20) DEFAULT '#6366f1',
    default_trial_days INT DEFAULT 14,
    maintenance_mode BOOLEAN DEFAULT FALSE,
    platform_name VARCHAR(100) DEFAULT 'ElevateSmart',
    contact_email VARCHAR(100) DEFAULT 'support@elevatesmart.com',
    glass_intensity DOUBLE PRECISION DEFAULT 0.55,
    border_radius VARCHAR(20) DEFAULT '16px',
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE identity.platform_settings
    ADD COLUMN IF NOT EXISTS theme_name VARCHAR(50) DEFAULT 'INDIGO_FLOW',
    ADD COLUMN IF NOT EXISTS accent_color VARCHAR(20) DEFAULT '#6366f1',
    ADD COLUMN IF NOT EXISTS default_trial_days INT DEFAULT 14,
    ADD COLUMN IF NOT EXISTS maintenance_mode BOOLEAN DEFAULT FALSE,
    ADD COLUMN IF NOT EXISTS platform_name VARCHAR(100) DEFAULT 'ElevateSmart',
    ADD COLUMN IF NOT EXISTS contact_email VARCHAR(100) DEFAULT 'support@elevatesmart.com',
    ADD COLUMN IF NOT EXISTS glass_intensity DOUBLE PRECISION DEFAULT 0.55,
    ADD COLUMN IF NOT EXISTS border_radius VARCHAR(20) DEFAULT '16px',
    ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP;

INSERT INTO identity.platform_settings (
    settings_id,
    theme_name,
    accent_color,
    default_trial_days,
    maintenance_mode,
    platform_name,
    contact_email,
    glass_intensity,
    border_radius,
    updated_at
)
SELECT
    gen_random_uuid(),
    'INDIGO_FLOW',
    '#6366f1',
    14,
    FALSE,
    'ElevateSmart',
    'support@elevatesmart.com',
    0.55,
    '16px',
    CURRENT_TIMESTAMP
WHERE NOT EXISTS (SELECT 1 FROM identity.platform_settings);

-- ---------------------------------------------------------------------------
-- schoolops.student_parent_mapping (required by school-operations-service)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS schoolops.student_parent_mapping (
    mapping_id UUID PRIMARY KEY,
    school_id UUID NOT NULL,
    student_user_id UUID NOT NULL,
    parent_user_id UUID NOT NULL,
    relationship VARCHAR(50) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL
);

ALTER TABLE schoolops.student_parent_mapping
    ADD COLUMN IF NOT EXISTS school_id UUID,
    ADD COLUMN IF NOT EXISTS relationship VARCHAR(50);

UPDATE schoolops.student_parent_mapping
SET relationship = 'GUARDIAN'
WHERE relationship IS NULL;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM schoolops.student_parent_mapping
        WHERE relationship IS NULL
    ) THEN
        ALTER TABLE schoolops.student_parent_mapping
            ALTER COLUMN relationship SET NOT NULL;
    END IF;

    IF NOT EXISTS (
        SELECT 1
        FROM schoolops.student_parent_mapping
        WHERE school_id IS NULL
    ) THEN
        ALTER TABLE schoolops.student_parent_mapping
            ALTER COLUMN school_id SET NOT NULL;
    END IF;
END $$;

-- ---------------------------------------------------------------------------
-- subscription service core tables/columns
-- ---------------------------------------------------------------------------
SET search_path TO subscription;

CREATE TABLE IF NOT EXISTS subscription_plans (
    plan_id UUID PRIMARY KEY,
    plan_name VARCHAR(100) NOT NULL UNIQUE,
    plan_code VARCHAR(50) NOT NULL UNIQUE,
    description TEXT,
    monthly_price DECIMAL(19,4) NOT NULL,
    max_students INTEGER NOT NULL,
    max_parents_per_student INTEGER NOT NULL DEFAULT 2,
    features TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE subscription_plans
    ADD COLUMN IF NOT EXISTS max_parents_per_student INTEGER NOT NULL DEFAULT 2;

CREATE TABLE IF NOT EXISTS tenant_subscriptions (
    subscription_id UUID PRIMARY KEY,
    tenant_id UUID NOT NULL,
    plan_id UUID NOT NULL REFERENCES subscription_plans(plan_id),
    status VARCHAR(50) NOT NULL,
    start_date TIMESTAMPTZ NOT NULL,
    end_date TIMESTAMPTZ,
    trial_end_date TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_tenant_subscriptions_tenant ON tenant_subscriptions(tenant_id);

-- ---------------------------------------------------------------------------
-- transport module (required by school-operations-service)
-- ---------------------------------------------------------------------------
ALTER TABLE schoolops.transport_route ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'ACTIVE';
ALTER TABLE schoolops.transport_route ADD COLUMN IF NOT EXISTS capacity INTEGER DEFAULT 40;
ALTER TABLE schoolops.transport_route ADD COLUMN IF NOT EXISTS conductor_name VARCHAR(255);
ALTER TABLE schoolops.transport_route ADD COLUMN IF NOT EXISTS conductor_phone VARCHAR(80);

CREATE TABLE IF NOT EXISTS schoolops.transport_stop (
    stop_id UUID PRIMARY KEY,
    route_id UUID NOT NULL REFERENCES schoolops.transport_route(route_id),
    school_id UUID NOT NULL,
    stop_name VARCHAR(255) NOT NULL,
    stop_order INTEGER NOT NULL,
    latitude NUMERIC(10,7),
    longitude NUMERIC(10,7),
    pickup_time VARCHAR(10),
    drop_time VARCHAR(10),
    created_at TIMESTAMPTZ NOT NULL
);

CREATE TABLE IF NOT EXISTS schoolops.transport_student_assignment (
    assignment_id UUID PRIMARY KEY,
    school_id UUID NOT NULL,
    student_user_id UUID NOT NULL,
    route_id UUID NOT NULL REFERENCES schoolops.transport_route(route_id),
    stop_id UUID REFERENCES schoolops.transport_stop(stop_id),
    created_at TIMESTAMPTZ NOT NULL
);

CREATE TABLE IF NOT EXISTS schoolops.transport_vehicle_position (
    position_id UUID PRIMARY KEY,
    route_id UUID NOT NULL REFERENCES schoolops.transport_route(route_id),
    school_id UUID NOT NULL,
    latitude NUMERIC(10,7) NOT NULL,
    longitude NUMERIC(10,7) NOT NULL,
    speed NUMERIC(6,2),
    heading NUMERIC(5,2),
    recorded_at TIMESTAMPTZ NOT NULL
);

CREATE TABLE IF NOT EXISTS schoolops.transport_pickup_log (
    log_id UUID PRIMARY KEY,
    school_id UUID NOT NULL,
    route_id UUID NOT NULL REFERENCES schoolops.transport_route(route_id),
    student_user_id UUID NOT NULL,
    stop_id UUID REFERENCES schoolops.transport_stop(stop_id),
    action VARCHAR(10) NOT NULL,
    marked_by VARCHAR(255) NOT NULL,
    trip_date DATE NOT NULL,
    marked_at TIMESTAMPTZ NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_transport_stop_route ON schoolops.transport_stop(route_id);
CREATE INDEX IF NOT EXISTS idx_transport_assignment_route ON schoolops.transport_student_assignment(route_id);
CREATE INDEX IF NOT EXISTS idx_transport_assignment_student ON schoolops.transport_student_assignment(student_user_id);
CREATE INDEX IF NOT EXISTS idx_transport_position_route ON schoolops.transport_vehicle_position(route_id, recorded_at DESC);
CREATE INDEX IF NOT EXISTS idx_transport_pickup_log_date ON schoolops.transport_pickup_log(route_id, trip_date);
