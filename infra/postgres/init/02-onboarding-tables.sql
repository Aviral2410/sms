CREATE TABLE IF NOT EXISTS onboarding.required_document_template (
    template_id BIGSERIAL PRIMARY KEY,
    document_name VARCHAR(255) NOT NULL,
    display_order INTEGER NOT NULL,
    active BOOLEAN NOT NULL DEFAULT TRUE
);

CREATE TABLE IF NOT EXISTS onboarding.school_onboarding (
    onboarding_id UUID PRIMARY KEY,
    school_name VARCHAR(255) NOT NULL,
    school_code VARCHAR(100) NOT NULL UNIQUE,
    board_affiliation VARCHAR(100) NOT NULL,
    contact_phone VARCHAR(30) NOT NULL,
    contact_email VARCHAR(255) NOT NULL,
    address_line VARCHAR(255) NOT NULL,
    city VARCHAR(120) NOT NULL,
    state VARCHAR(120) NOT NULL,
    country VARCHAR(120) NOT NULL,
    postal_code VARCHAR(20) NOT NULL,
    admin_first_name VARCHAR(120) NOT NULL,
    admin_last_name VARCHAR(120) NOT NULL,
    admin_email VARCHAR(255) NOT NULL,
    status VARCHAR(40) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL,
    reviewed_by VARCHAR(255),
    review_comment TEXT,
    reviewed_at TIMESTAMPTZ,
    tenant_id UUID,
    school_id UUID,
    activated_at TIMESTAMPTZ,
    activation_sent_at TIMESTAMPTZ,
    activation_code VARCHAR(40),
    selected_plan_code VARCHAR(50) NOT NULL DEFAULT 'BASIC',
    logo_url TEXT,
    vision VARCHAR(2000),
    mission VARCHAR(2000),
    achievements VARCHAR(3000),
    houses VARCHAR(3000),
    version BIGINT DEFAULT 0
);

CREATE TABLE IF NOT EXISTS onboarding.school_onboarding_document (
    document_id BIGSERIAL PRIMARY KEY,
    onboarding_id UUID NOT NULL REFERENCES onboarding.school_onboarding(onboarding_id) ON DELETE CASCADE,
    document_name VARCHAR(255) NOT NULL,
    display_order INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_school_onboarding_created_at
    ON onboarding.school_onboarding (created_at DESC);

CREATE INDEX IF NOT EXISTS idx_school_onboarding_document_onboarding_id
    ON onboarding.school_onboarding_document (onboarding_id);

-- CMS: Academic content blocks (required by school-onboarding-service)
CREATE TABLE IF NOT EXISTS onboarding.school_academic_content (
    id UUID PRIMARY KEY,
    tenant_id UUID NOT NULL,
    curriculum TEXT,
    co_curricular TEXT,
    scholarship_info TEXT,
    result_highlights TEXT,
    notices TEXT,
    calendar_data TEXT,
    is_published BOOLEAN DEFAULT FALSE,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- CMS: Remaining public landing tables (required by school-onboarding-service)
CREATE TABLE IF NOT EXISTS onboarding.school_landing_profile (
    id UUID PRIMARY KEY,
    tenant_id UUID NOT NULL,
    school_name VARCHAR(255) NOT NULL,
    short_name VARCHAR(255),
    tagline VARCHAR(255),
    short_description TEXT,
    about_html TEXT,
    objective TEXT,
    mission TEXT,
    vision TEXT,
    history TEXT,
    why_us TEXT,
    address_line1 VARCHAR(255),
    address_line2 VARCHAR(255),
    city VARCHAR(120),
    state VARCHAR(120),
    country VARCHAR(120),
    pincode VARCHAR(30),
    latitude DOUBLE PRECISION,
    longitude DOUBLE PRECISION,
    phone VARCHAR(80),
    alternate_phone VARCHAR(80),
    email VARCHAR(255),
    website VARCHAR(255),
    office_hours TEXT,
    is_published BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS onboarding.school_leader (
    id UUID PRIMARY KEY,
    tenant_id UUID NOT NULL,
    type VARCHAR(80) NOT NULL,
    name VARCHAR(255) NOT NULL,
    title VARCHAR(255),
    bio TEXT,
    message TEXT,
    image_media_id UUID,
    display_order INTEGER DEFAULT 0,
    is_published BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS onboarding.school_event (
    id UUID PRIMARY KEY,
    tenant_id UUID NOT NULL,
    title VARCHAR(255) NOT NULL,
    slug VARCHAR(255),
    description TEXT,
    start_at TIMESTAMPTZ,
    end_at TIMESTAMPTZ,
    location VARCHAR(255),
    banner_media_id UUID,
    registration_url TEXT,
    is_featured BOOLEAN DEFAULT FALSE,
    is_published BOOLEAN DEFAULT FALSE,
    status VARCHAR(40),
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS onboarding.school_gallery_album (
    id UUID PRIMARY KEY,
    tenant_id UUID NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    cover_media_id UUID,
    event_id UUID,
    is_published BOOLEAN DEFAULT FALSE,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS onboarding.school_gallery_media (
    id UUID PRIMARY KEY,
    tenant_id UUID NOT NULL,
    album_id UUID NOT NULL,
    media_id UUID NOT NULL,
    media_type VARCHAR(40) NOT NULL,
    caption TEXT,
    alt_text TEXT,
    tags VARCHAR(1000),
    taken_at TIMESTAMPTZ,
    is_published BOOLEAN DEFAULT FALSE,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS onboarding.school_testimonial (
    id UUID PRIMARY KEY,
    tenant_id UUID NOT NULL,
    author_name VARCHAR(255) NOT NULL,
    relationship_type VARCHAR(80),
    designation VARCHAR(255),
    content TEXT NOT NULL,
    image_media_id UUID,
    rating INTEGER,
    display_order INTEGER DEFAULT 0,
    is_published BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS onboarding.school_achievement (
    id UUID PRIMARY KEY,
    tenant_id UUID NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    achievement_year VARCHAR(40),
    category VARCHAR(120),
    image_media_id UUID,
    is_featured BOOLEAN DEFAULT FALSE,
    display_order INTEGER DEFAULT 0,
    is_published BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS onboarding.school_infrastructure_item (
    id UUID PRIMARY KEY,
    tenant_id UUID NOT NULL,
    type VARCHAR(80),
    title VARCHAR(255) NOT NULL,
    description TEXT,
    image_media_id UUID,
    icon VARCHAR(80),
    display_order INTEGER DEFAULT 0,
    is_published BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS onboarding.school_social_link (
    id UUID PRIMARY KEY,
    tenant_id UUID NOT NULL,
    platform VARCHAR(80) NOT NULL,
    url TEXT NOT NULL,
    display_order INTEGER DEFAULT 0,
    is_published BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS onboarding.school_section_config (
    id UUID PRIMARY KEY,
    tenant_id UUID NOT NULL,
    section_key VARCHAR(80) NOT NULL,
    is_enabled BOOLEAN DEFAULT TRUE,
    display_order INTEGER DEFAULT 0,
    title_override VARCHAR(255),
    subtitle_override TEXT,
    config_json TEXT,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS onboarding.school_affiliation_info (
    id UUID PRIMARY KEY,
    tenant_id UUID NOT NULL,
    board_name VARCHAR(255) NOT NULL,
    affiliation_number VARCHAR(255),
    compliance_text TEXT,
    recognition_details TEXT,
    is_published BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS onboarding.school_branch (
    id UUID PRIMARY KEY,
    tenant_id UUID NOT NULL,
    branch_name VARCHAR(255) NOT NULL,
    address TEXT,
    city VARCHAR(120),
    state VARCHAR(120),
    pincode VARCHAR(30),
    latitude DOUBLE PRECISION,
    longitude DOUBLE PRECISION,
    phone VARCHAR(80),
    email VARCHAR(255),
    is_primary BOOLEAN DEFAULT FALSE,
    is_published BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS onboarding.school_enquiry (
    id UUID PRIMARY KEY,
    tenant_id UUID NOT NULL,
    type VARCHAR(40) NOT NULL,
    student_name VARCHAR(255),
    parent_name VARCHAR(255),
    phone VARCHAR(80) NOT NULL,
    email VARCHAR(255),
    class_interested VARCHAR(120),
    message TEXT,
    status VARCHAR(40) DEFAULT 'NEW',
    source VARCHAR(120),
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS onboarding.school_newsletter_subscription (
    id UUID PRIMARY KEY,
    tenant_id UUID NOT NULL,
    email VARCHAR(255) NOT NULL,
    status VARCHAR(40) NOT NULL DEFAULT 'ACTIVE',
    subscribed_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS onboarding.school_admission_info (
    id UUID PRIMARY KEY,
    tenant_id UUID NOT NULL,
    overview TEXT,
    process TEXT,
    eligibility TEXT,
    brochure_media_id UUID,
    contact_name VARCHAR(255),
    contact_phone VARCHAR(80),
    contact_email VARCHAR(255),
    is_published BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS onboarding.school_fee_structure (
    id UUID PRIMARY KEY,
    tenant_id UUID NOT NULL,
    academic_year VARCHAR(40) NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    structured_data_json TEXT,
    attachment_media_id UUID,
    is_published BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);
