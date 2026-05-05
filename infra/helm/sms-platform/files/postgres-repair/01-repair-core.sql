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
    ADD COLUMN IF NOT EXISTS auth_service_url VARCHAR(255) DEFAULT 'http://auth-service:8082',
    ADD COLUMN IF NOT EXISTS communication_service_url VARCHAR(255) DEFAULT 'http://communication-service:8089',
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

CREATE SCHEMA IF NOT EXISTS onboarding;

ALTER TABLE onboarding.school_onboarding
    ADD COLUMN IF NOT EXISTS logo_url TEXT,
    ADD COLUMN IF NOT EXISTS vision VARCHAR(2000),
    ADD COLUMN IF NOT EXISTS mission VARCHAR(2000),
    ADD COLUMN IF NOT EXISTS achievements VARCHAR(3000),
    ADD COLUMN IF NOT EXISTS houses VARCHAR(3000);

-- ---------------------------------------------------------------------------
-- finance.fee_structure (required by finance-service)
-- ---------------------------------------------------------------------------
CREATE SCHEMA IF NOT EXISTS finance;

CREATE TABLE IF NOT EXISTS finance.fee_structure (
    fee_id UUID PRIMARY KEY,
    school_id UUID NOT NULL,
    fee_name VARCHAR(100) NOT NULL,
    amount DECIMAL(12,2) NOT NULL,
    fee_type VARCHAR(50) NOT NULL,
    academic_year VARCHAR(20) NOT NULL,
    due_date TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE finance.fee_structure
    ADD COLUMN IF NOT EXISTS due_date TIMESTAMPTZ;

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

CREATE TABLE IF NOT EXISTS schoolops.class_subject_teacher_mapping (
    mapping_id UUID PRIMARY KEY,
    school_id UUID NOT NULL,
    class_id UUID NOT NULL,
    subject_id UUID NOT NULL,
    teacher_user_id UUID NOT NULL,
    created_at TIMESTAMPTZ NOT NULL
);

ALTER TABLE schoolops.student_admission
    ADD COLUMN IF NOT EXISTS student_full_name VARCHAR(255),
    ADD COLUMN IF NOT EXISTS student_email VARCHAR(255);

ALTER TABLE schoolops.school_user
    ADD COLUMN IF NOT EXISTS profile_photo_url TEXT;

ALTER TABLE schoolops.school_user
    ALTER COLUMN glass_intensity TYPE DOUBLE PRECISION
    USING glass_intensity::DOUBLE PRECISION;

CREATE TABLE IF NOT EXISTS schoolops.school_user_document (
    document_id UUID PRIMARY KEY,
    school_id UUID NOT NULL,
    user_id UUID NOT NULL,
    document_type VARCHAR(120) NOT NULL,
    document_name VARCHAR(255) NOT NULL,
    access_url TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL
);

CREATE TABLE IF NOT EXISTS schoolops.resource_bookmark (
    bookmark_id UUID PRIMARY KEY,
    school_id UUID NOT NULL,
    user_id UUID NOT NULL,
    resource_id UUID NOT NULL,
    created_at TIMESTAMPTZ NOT NULL
);

CREATE TABLE IF NOT EXISTS schoolops.resource_view_log (
    log_id UUID PRIMARY KEY,
    school_id UUID NOT NULL,
    user_id UUID NOT NULL,
    resource_id UUID NOT NULL,
    viewed_at TIMESTAMPTZ NOT NULL
);

CREATE TABLE IF NOT EXISTS schoolops.forum_question (
    question_id UUID PRIMARY KEY,
    school_id UUID NOT NULL,
    author_id UUID NOT NULL,
    author_name VARCHAR(255) NOT NULL,
    title VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    subject VARCHAR(255),
    status VARCHAR(40) NOT NULL,
    upvotes INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL,
    updated_at TIMESTAMPTZ NOT NULL
);

CREATE TABLE IF NOT EXISTS schoolops.forum_answer (
    answer_id UUID PRIMARY KEY,
    question_id UUID NOT NULL,
    author_id UUID NOT NULL,
    author_name VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    is_correct BOOLEAN NOT NULL DEFAULT FALSE,
    upvotes INTEGER NOT NULL DEFAULT 0,
    status VARCHAR(40) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL
);

CREATE TABLE IF NOT EXISTS schoolops.forum_flag (
    flag_id UUID PRIMARY KEY,
    target_id UUID NOT NULL,
    reporter_id UUID NOT NULL,
    reason VARCHAR(500) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL
);

CREATE TABLE IF NOT EXISTS schoolops.forum_vote (
    vote_id UUID PRIMARY KEY,
    target_id UUID NOT NULL,
    voter_id UUID NOT NULL,
    vote_type INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS schoolops.forum_point_log (
    log_id UUID PRIMARY KEY,
    user_id UUID NOT NULL,
    school_id UUID NOT NULL,
    points INTEGER NOT NULL,
    point_type VARCHAR(80) NOT NULL,
    reference_id UUID,
    "timestamp" TIMESTAMPTZ NOT NULL
);

ALTER TABLE schoolops.library_resource
    ADD COLUMN IF NOT EXISTS description TEXT,
    ADD COLUMN IF NOT EXISTS subject VARCHAR(255),
    ADD COLUMN IF NOT EXISTS grade_level VARCHAR(255),
    ADD COLUMN IF NOT EXISTS tags TEXT,
    ADD COLUMN IF NOT EXISTS uploaded_by_user_id UUID,
    ADD COLUMN IF NOT EXISTS file_size BIGINT;

ALTER TABLE schoolops.voice_note
    ADD COLUMN IF NOT EXISTS translations TEXT;

-- ---------------------------------------------------------------------------
-- schoolops.staff_leave_request (HR / Operations - phase 1)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS schoolops.staff_leave_request (
    leave_request_id UUID PRIMARY KEY,
    school_id UUID NOT NULL,
    requester_user_id UUID NOT NULL,
    requester_role VARCHAR(80) NOT NULL,
    leave_type VARCHAR(40) NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    reason TEXT,
    status VARCHAR(40) NOT NULL,
    reviewed_by_user_id UUID,
    review_note TEXT,
    reviewed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL,
    updated_at TIMESTAMPTZ NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_staff_leave_school_created
    ON schoolops.staff_leave_request (school_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_staff_leave_school_requester
    ON schoolops.staff_leave_request (school_id, requester_user_id, created_at DESC);

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

-- Enforce one active/trial subscription per tenant
CREATE UNIQUE INDEX IF NOT EXISTS idx_tenant_subscriptions_active_unique 
ON tenant_subscriptions (tenant_id) 
WHERE status IN ('ACTIVE', 'TRIAL');

-- Upgrade requests (used by subscription-service)
CREATE TABLE IF NOT EXISTS upgrade_requests (
    request_id UUID PRIMARY KEY,
    tenant_id UUID NOT NULL,
    requested_plan_id UUID NOT NULL REFERENCES subscription_plans(plan_id),
    status VARCHAR(50) NOT NULL,
    request_notes TEXT,
    created_at TIMESTAMPTZ NOT NULL,
    updated_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_upgrade_requests_tenant ON upgrade_requests(tenant_id);
CREATE INDEX IF NOT EXISTS idx_upgrade_requests_status ON upgrade_requests(status);

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

-- ---------------------------------------------------------------------------
-- identity.public_site_content + identity.public_inquiry_requests
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS identity.public_site_content (
    content_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    brand_label VARCHAR(120) DEFAULT 'ElevateSmart',
    hero_eyebrow VARCHAR(160),
    hero_headline VARCHAR(500),
    hero_subheadline TEXT,
    vision_title VARCHAR(200),
    vision_body TEXT,
    why_title VARCHAR(200),
    why_body TEXT,
    pricing_headline VARCHAR(200),
    pricing_body TEXT,
    contact_headline VARCHAR(200),
    contact_body TEXT,
    support_headline VARCHAR(200),
    support_body TEXT,
    founder_title VARCHAR(200),
    founder_name VARCHAR(160),
    founder_role VARCHAR(160),
    founder_message_title VARCHAR(220),
    founder_message_body TEXT,
    founder_signoff VARCHAR(200),
    primary_cta_label VARCHAR(120),
    primary_cta_url VARCHAR(255),
    secondary_cta_label VARCHAR(120),
    secondary_cta_url VARCHAR(255),
    feature_cards_json TEXT,
    role_benefits_json TEXT,
    media_gallery_json TEXT,
    testimonials_json TEXT,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE identity.public_site_content
    ADD COLUMN IF NOT EXISTS testimonials_json TEXT;

INSERT INTO identity.public_site_content (
    content_id,
    brand_label,
    hero_eyebrow,
    hero_headline,
    hero_subheadline,
    vision_title,
    vision_body,
    why_title,
    why_body,
    pricing_headline,
    pricing_body,
    contact_headline,
    contact_body,
    support_headline,
    support_body,
    founder_title,
    founder_name,
    founder_role,
    founder_message_title,
    founder_message_body,
    founder_signoff,
    primary_cta_label,
    primary_cta_url,
    secondary_cta_label,
    secondary_cta_url,
    feature_cards_json,
    role_benefits_json,
    media_gallery_json,
    testimonials_json,
    updated_at
)
SELECT
    '00000000-0000-0000-0000-000000000001',
    'ElevateSmart',
    'The operational intelligence layer for modern education',
    'One connected campus system for admissions, academics, finance, communication, transport, and AI-assisted teaching.',
    'ElevateSmart helps institutions replace fragmented tools with a living operating system. Every workflow stays connected, every role sees the right intelligence, and every school grows with more clarity.',
    'Why we built ElevateSmart',
    'Schools should not need separate systems for onboarding, billing, communication, classroom operations, transport, and analytics. We built ElevateSmart to give institutions one shared operational language so leaders can move faster, teachers can teach better, and families can stay informed without friction.',
    'Built for institutional momentum',
    'The platform is designed to turn scattered admin effort into coordinated motion. When onboarding, subscriptions, student records, announcements, attendance, performance, and support all flow through one platform, institutions can scale without losing trust or operational control.',
    'Commercial plans aligned to rollout depth and operational capacity',
    'Choose the pricing lane that matches launch speed, institution size, and how much workflow depth you want live from day one.',
    'Talk to the team behind the platform',
    'Use this route for real conversations about rollout planning, partnerships, implementation timing, or whether the platform fits your operating model.',
    'Raise support without losing context',
    'Bring rollout blockers, production issues, access failures, and operational questions here so the platform team can triage with full context.',
    'Vision',
    'ElevateSmart Product Team',
    'Platform builders for institutions that want continuity, operational depth, and fewer disconnected systems.',
    'Education software should feel like infrastructure, not admin debt.',
    'We created ElevateSmart after seeing how often good schools were slowed down by disconnected systems and duplicate effort. The goal was never just dashboards. It was to build a dependable operating layer that helps institutions lead with more visibility, more empathy, and more follow-through across every role in the campus ecosystem.',
    'Built for schools that want operational depth, not surface-level software.',
    'Start school onboarding',
    '/onboarding',
    'See the vision',
    '/vision',
    $$[{"title":"Admissions and onboarding","description":"Launch new institutions, provision school access, and move from registration to activation with one coordinated flow.","category":"Growth","imageUrl":"/admissions-story.svg","accentColor":"#ffb663","sortOrder":1,"bullets":["Structured school onboarding","Activation workflows","Platform review visibility"]},{"title":"Academic operations","description":"Manage attendance, classes, exams, report cards, timetables, and student records from a connected operational core.","category":"Academics","imageUrl":"/academics-story.svg","accentColor":"#22d3ee","sortOrder":2,"bullets":["Attendance intelligence","Exam and timetable workflows","Student and teacher records"]},{"title":"Finance and subscriptions","description":"Track plans, billing structures, and institutional capacity with commercial data that stays connected to rollout decisions.","category":"Commercial","imageUrl":"/operational-viewpoint.svg","accentColor":"#34d399","sortOrder":3,"bullets":["Plan-aware onboarding","Fee structures","Commercial visibility for platform teams"]},{"title":"Communication and announcements","description":"Deliver parent-facing and institution-facing updates through public notices, internal announcements, and workflow-linked messaging.","category":"Communication","imageUrl":"/admissions-story.svg","accentColor":"#a78bfa","sortOrder":4,"bullets":["Public announcements","Workflow notifications","Role-aware communication paths"]},{"title":"Transport and movement visibility","description":"Coordinate routes, live movement, assignment workflows, and transport experiences across school operations.","category":"Transport","imageUrl":"/transport-network.svg","accentColor":"#f97316","sortOrder":5,"bullets":["Route and stop management","Driver and conductor views","Subscriber-facing transport access"]},{"title":"AI-assisted teaching and decision support","description":"Use AI copilot patterns for planning, visualization, examples, and institutional insight without fragmenting the main workflow.","category":"AI","imageUrl":"/ai-story.svg","accentColor":"#60a5fa","sortOrder":6,"bullets":["Teaching assistance","Learning visualizations","Decision support inside operational flows"]}]$$,
    $$[{"roleKey":"PLATFORM_ADMIN","roleLabel":"Platform Admin","headline":"Control rollout, provisioning, and system posture.","description":"View institutional growth, manage onboarding queues, control platform settings, and supervise health from a central command layer.","accentColor":"#ffb663","outcomes":["Platform-wide visibility","Commercial and onboarding control","Operational decision support"]},{"roleKey":"SCHOOL_ADMIN","roleLabel":"School Admin","headline":"Run the institution without juggling disconnected systems.","description":"Handle admissions, billing, classes, staff, transport, and communication through one operating surface.","accentColor":"#22d3ee","outcomes":["Unified school operations","Fewer fragmented tools","Cleaner institutional oversight"]},{"roleKey":"TEACHER","roleLabel":"Teachers","headline":"Stay inside the teaching flow while the system handles complexity.","description":"Access classes, attendance, analytics, resources, communication, and AI assistance without bouncing between products.","accentColor":"#a78bfa","outcomes":["Faster class execution","Better student visibility","AI support built into the workflow"]},{"roleKey":"STUDENT","roleLabel":"Students","headline":"Get a clearer picture of progress and learning access.","description":"Students can see attendance, classroom signals, resources, and learning support in a structured digital workspace.","accentColor":"#34d399","outcomes":["Progress visibility","Resource access","More consistent learning support"]},{"roleKey":"PARENT","roleLabel":"Parents","headline":"Stay informed without chasing the institution for updates.","description":"Parents gain transparent access to student context, communication, and role-specific services such as transport updates.","accentColor":"#f472b6","outcomes":["Better transparency","Faster updates","Stronger school-family trust"]},{"roleKey":"STAFF","roleLabel":"Staff and Operations","headline":"Keep support functions inside the same institutional rhythm.","description":"Administrative and support teams can work inside the same campus system rather than maintaining side channels.","accentColor":"#f59e0b","outcomes":["Less operational drift","Shared context across teams","Clearer support workflows"]},{"roleKey":"TRANSPORT","roleLabel":"Transport Teams","headline":"Operate movement and safety workflows with real context.","description":"Drivers, conductors, and transport managers work with route-aware views designed for live operational use.","accentColor":"#38bdf8","outcomes":["Route visibility","Role-specific consoles","Safer day-to-day coordination"]}]$$,
    $$[{"sectionKey":"hero","imageUrl":"/operational-viewpoint.svg","fallbackImageUrl":"/operational-viewpoint.svg","altText":"Platform operational illustration","caption":"A text-free visual that mirrors the connected operating model described on the landing page."},{"sectionKey":"story","imageUrl":"/institution-flow.svg","fallbackImageUrl":"/institution-flow.svg","altText":"Institutional workflow illustration","caption":"Signals moving across onboarding, academics, communication, transport, and finance."},{"sectionKey":"founder","imageUrl":"/institution-flow.svg","fallbackImageUrl":"/institution-flow.svg","altText":"Institutional systems illustration","caption":"A connected systems visual for the platform vision story."}]$$,
    $$[{"quote":"We finally stopped stitching together admissions spreadsheets, transport chats, and fee follow-ups. The platform gave our leadership team one operational picture.","authorName":"Asha Nair","authorRole":"Principal","organization":"North Ridge Academy","avatarUrl":"/operational-viewpoint.svg","accentColor":"#22d3ee","sortOrder":1},{"quote":"The rollout felt grounded because the platform team understood institutional workflow, not just software setup. That made the difference for our staff adoption.","authorName":"Rohan Bedi","authorRole":"Operations Lead","organization":"Bakshi Memorial Public School","avatarUrl":"/institution-flow.svg","accentColor":"#ffb663","sortOrder":2},{"quote":"Teachers got clarity instead of another admin portal. Attendance, notices, and learning support now feel connected instead of fragmented.","authorName":"Meera Joshi","authorRole":"Academic Coordinator","organization":"Summit Public School","avatarUrl":"/ai-story.svg","accentColor":"#a78bfa","sortOrder":3}]$$,
    CURRENT_TIMESTAMP
WHERE NOT EXISTS (SELECT 1 FROM identity.public_site_content);

UPDATE identity.public_site_content
SET testimonials_json = $$[{"quote":"We finally stopped stitching together admissions spreadsheets, transport chats, and fee follow-ups. The platform gave our leadership team one operational picture.","authorName":"Asha Nair","authorRole":"Principal","organization":"North Ridge Academy","avatarUrl":"/operational-viewpoint.svg","accentColor":"#22d3ee","sortOrder":1},{"quote":"The rollout felt grounded because the platform team understood institutional workflow, not just software setup. That made the difference for our staff adoption.","authorName":"Rohan Bedi","authorRole":"Operations Lead","organization":"Bakshi Memorial Public School","avatarUrl":"/institution-flow.svg","accentColor":"#ffb663","sortOrder":2},{"quote":"Teachers got clarity instead of another admin portal. Attendance, notices, and learning support now feel connected instead of fragmented.","authorName":"Meera Joshi","authorRole":"Academic Coordinator","organization":"Summit Public School","avatarUrl":"/ai-story.svg","accentColor":"#a78bfa","sortOrder":3}]$$
WHERE content_id = '00000000-0000-0000-0000-000000000001'
  AND (testimonials_json IS NULL OR btrim(testimonials_json) = '');

UPDATE identity.public_site_content
SET pricing_headline = 'Commercial plans aligned to rollout depth and operational capacity',
    pricing_body = 'Choose the pricing lane that matches launch speed, institution size, and how much workflow depth you want live from day one.',
    contact_body = 'Use this route for real conversations about rollout planning, partnerships, implementation timing, or whether the platform fits your operating model.',
    support_body = 'Bring rollout blockers, production issues, access failures, and operational questions here so the platform team can triage with full context.',
    founder_title = 'Vision',
    founder_role = 'Platform builders for institutions that want continuity, operational depth, and fewer disconnected systems.',
    secondary_cta_label = 'See the vision',
    secondary_cta_url = '/vision'
WHERE content_id = '00000000-0000-0000-0000-000000000001';

CREATE TABLE IF NOT EXISTS identity.public_inquiry_requests (
    inquiry_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    inquiry_type VARCHAR(30) NOT NULL,
    status VARCHAR(30) NOT NULL DEFAULT 'OPEN',
    full_name VARCHAR(160) NOT NULL,
    email VARCHAR(160) NOT NULL,
    organization VARCHAR(160),
    school_name VARCHAR(160),
    phone VARCHAR(60),
    subject VARCHAR(220) NOT NULL,
    message TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS identity.public_media_assets (
    asset_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    asset_key VARCHAR(120) NOT NULL,
    file_name VARCHAR(255) NOT NULL,
    content_type VARCHAR(120) NOT NULL,
    file_size BIGINT NOT NULL,
    content_data BYTEA NOT NULL,
    created_by VARCHAR(160),
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE UNIQUE INDEX IF NOT EXISTS ux_public_media_assets_asset_key
    ON identity.public_media_assets(asset_key);

