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
