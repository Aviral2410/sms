-- Multi-Tenant School CMS Tables

-- 1. School Profile (Extended or Separate - using separate table for versioning/published state)
CREATE TABLE IF NOT EXISTS onboarding.school_landing_profile (
    id UUID PRIMARY KEY,
    tenant_id UUID NOT NULL,
    school_name VARCHAR(255) NOT NULL,
    short_name VARCHAR(100),
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
    city VARCHAR(100),
    state VARCHAR(100),
    country VARCHAR(100),
    pincode VARCHAR(20),
    latitude DOUBLE PRECISION,
    longitude DOUBLE PRECISION,
    phone VARCHAR(50),
    alternate_phone VARCHAR(50),
    email VARCHAR(255),
    website VARCHAR(255),
    office_hours TEXT,
    is_published BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_landing_profile_tenant ON onboarding.school_landing_profile(tenant_id);

-- 2. School Leadership
CREATE TABLE IF NOT EXISTS onboarding.school_leader (
    id UUID PRIMARY KEY,
    tenant_id UUID NOT NULL,
    type VARCHAR(50) NOT NULL, -- founder, chairman, principal, etc.
    name VARCHAR(255) NOT NULL,
    title VARCHAR(255),
    bio TEXT,
    message TEXT,
    image_media_id UUID,
    display_order INTEGER DEFAULT 0,
    is_published BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_school_leader_tenant ON onboarding.school_leader(tenant_id);

-- 3. School Branches
CREATE TABLE IF NOT EXISTS onboarding.school_branch (
    id UUID PRIMARY KEY,
    tenant_id UUID NOT NULL,
    branch_name VARCHAR(255) NOT NULL,
    address TEXT,
    city VARCHAR(100),
    state VARCHAR(100),
    pincode VARCHAR(20),
    latitude DOUBLE PRECISION,
    longitude DOUBLE PRECISION,
    phone VARCHAR(50),
    email VARCHAR(255),
    is_primary BOOLEAN DEFAULT FALSE,
    is_published BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_school_branch_tenant ON onboarding.school_branch(tenant_id);

-- 4. School Admission Info
CREATE TABLE IF NOT EXISTS onboarding.school_admission_info (
    id UUID PRIMARY KEY,
    tenant_id UUID NOT NULL,
    overview TEXT,
    process TEXT,
    eligibility TEXT,
    brochure_media_id UUID,
    contact_name VARCHAR(255),
    contact_phone VARCHAR(50),
    contact_email VARCHAR(255),
    is_published BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_school_admission_tenant ON onboarding.school_admission_info(tenant_id);

-- 5. School Fee Structure
CREATE TABLE IF NOT EXISTS onboarding.school_fee_structure (
    id UUID PRIMARY KEY,
    tenant_id UUID NOT NULL,
    academic_year VARCHAR(50) NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    structured_data_json TEXT, -- JSON for table data
    attachment_media_id UUID,
    is_published BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_school_fee_tenant ON onboarding.school_fee_structure(tenant_id);

-- 6. Events
CREATE TABLE IF NOT EXISTS onboarding.school_event (
    id UUID PRIMARY KEY,
    tenant_id UUID NOT NULL,
    title VARCHAR(255) NOT NULL,
    slug VARCHAR(255),
    description TEXT,
    start_at TIMESTAMP WITH TIME ZONE,
    end_at TIMESTAMP WITH TIME ZONE,
    location VARCHAR(255),
    banner_media_id UUID,
    registration_url TEXT,
    is_featured BOOLEAN DEFAULT FALSE,
    is_published BOOLEAN DEFAULT FALSE,
    status VARCHAR(50), -- UPCOMING, ONGOING, COMPLETED, CANCELLED
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_school_event_tenant ON onboarding.school_event(tenant_id);
CREATE INDEX idx_school_event_published ON onboarding.school_event(tenant_id, is_published, start_at);

-- 7. Gallery Album
CREATE TABLE IF NOT EXISTS onboarding.school_gallery_album (
    id UUID PRIMARY KEY,
    tenant_id UUID NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    cover_media_id UUID,
    event_id UUID,
    is_published BOOLEAN DEFAULT FALSE,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_school_gallery_album_tenant ON onboarding.school_gallery_album(tenant_id);

-- 8. Gallery Media
CREATE TABLE IF NOT EXISTS onboarding.school_gallery_media (
    id UUID PRIMARY KEY,
    tenant_id UUID NOT NULL,
    album_id UUID NOT NULL REFERENCES onboarding.school_gallery_album(id) ON DELETE CASCADE,
    media_id UUID NOT NULL,
    media_type VARCHAR(50) NOT NULL, -- IMAGE, VIDEO
    caption TEXT,
    alt_text TEXT,
    tags VARCHAR(255),
    taken_at TIMESTAMP WITH TIME ZONE,
    is_published BOOLEAN DEFAULT FALSE,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_school_gallery_media_tenant ON onboarding.school_gallery_media(tenant_id);
CREATE INDEX idx_school_gallery_media_album ON onboarding.school_gallery_media(album_id);

-- 9. Testimonials
CREATE TABLE IF NOT EXISTS onboarding.school_testimonial (
    id UUID PRIMARY KEY,
    tenant_id UUID NOT NULL,
    author_name VARCHAR(255) NOT NULL,
    relationship_type VARCHAR(100), -- Parent, Alumni, Student, Teacher
    designation VARCHAR(255),
    content TEXT NOT NULL,
    image_media_id UUID,
    rating INTEGER,
    display_order INTEGER DEFAULT 0,
    is_published BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_school_testimonial_tenant ON onboarding.school_testimonial(tenant_id);

-- 10. Achievements
CREATE TABLE IF NOT EXISTS onboarding.school_achievement (
    id UUID PRIMARY KEY,
    tenant_id UUID NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    achievement_year VARCHAR(10),
    category VARCHAR(100),
    image_media_id UUID,
    is_featured BOOLEAN DEFAULT FALSE,
    display_order INTEGER DEFAULT 0,
    is_published BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_school_achievement_tenant ON onboarding.school_achievement(tenant_id);

-- 11. Infrastructure / Facilities
CREATE TABLE IF NOT EXISTS onboarding.school_infrastructure_item (
    id UUID PRIMARY KEY,
    tenant_id UUID NOT NULL,
    type VARCHAR(50),
    title VARCHAR(255) NOT NULL,
    description TEXT,
    image_media_id UUID,
    icon VARCHAR(50),
    display_order INTEGER DEFAULT 0,
    is_published BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_school_infra_tenant ON onboarding.school_infrastructure_item(tenant_id);

-- 12. Academic Content (Curriculum, Co-curricular)
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
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_school_acad_tenant ON onboarding.school_academic_content(tenant_id);

-- 13. Section Config
CREATE TABLE IF NOT EXISTS onboarding.school_section_config (
    id UUID PRIMARY KEY,
    tenant_id UUID NOT NULL,
    section_key VARCHAR(100) NOT NULL, -- about, events, gallery, etc.
    is_enabled BOOLEAN DEFAULT TRUE,
    display_order INTEGER DEFAULT 0,
    title_override VARCHAR(255),
    subtitle_override TEXT,
    config_json TEXT, -- any extra configuration
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_school_section_cfg_tenant ON onboarding.school_section_config(tenant_id);
CREATE UNIQUE INDEX idx_school_section_cfg_unique ON onboarding.school_section_config(tenant_id, section_key);

-- 14. Enquiries
CREATE TABLE IF NOT EXISTS onboarding.school_enquiry (
    id UUID PRIMARY KEY,
    tenant_id UUID NOT NULL,
    type VARCHAR(50) NOT NULL, -- CONTACT, ADMISSION
    student_name VARCHAR(255),
    parent_name VARCHAR(255),
    phone VARCHAR(50) NOT NULL,
    email VARCHAR(255),
    class_interested VARCHAR(100),
    message TEXT,
    status VARCHAR(50) DEFAULT 'NEW', -- NEW, IN_PROGRESS, RESOLVED, SPAM
    source VARCHAR(100),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_school_enquiry_tenant ON onboarding.school_enquiry(tenant_id);
CREATE INDEX idx_school_enquiry_status ON onboarding.school_enquiry(tenant_id, status);

-- 15. Social Links
CREATE TABLE IF NOT EXISTS onboarding.school_social_link (
    id UUID PRIMARY KEY,
    tenant_id UUID NOT NULL,
    platform VARCHAR(50) NOT NULL, -- FACEBOOK, TWITTER, INSTAGRAM, LINKEDIN, YOUTUBE
    url TEXT NOT NULL,
    display_order INTEGER DEFAULT 0,
    is_published BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_school_social_link_tenant ON onboarding.school_social_link(tenant_id);

-- 16. Affiliation Info
CREATE TABLE IF NOT EXISTS onboarding.school_affiliation_info (
    id UUID PRIMARY KEY,
    tenant_id UUID NOT NULL,
    board_name VARCHAR(255) NOT NULL,
    affiliation_number VARCHAR(100),
    compliance_text TEXT,
    recognition_details TEXT,
    is_published BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_school_affiliation_tenant ON onboarding.school_affiliation_info(tenant_id);
