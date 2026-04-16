CREATE TABLE IF NOT EXISTS identity.admin_account (
    email VARCHAR(255) PRIMARY KEY,
    tenant_id UUID NOT NULL,
    password VARCHAR(255) NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    role_name VARCHAR(80) NOT NULL,
    active BOOLEAN NOT NULL DEFAULT TRUE,
    theme VARCHAR(40) DEFAULT 'dark',
    active_theme VARCHAR(60) DEFAULT 'indigo-flow',
    vibe VARCHAR(40) DEFAULT 'visual',
    accent_color VARCHAR(20) DEFAULT '#6366f1',
    glass_intensity NUMERIC DEFAULT 0.4,
    border_radius VARCHAR(40) DEFAULT '24px'
);

CREATE TABLE IF NOT EXISTS identity.tenant (
    tenant_id UUID PRIMARY KEY,
    school_id UUID NOT NULL UNIQUE,
    school_name VARCHAR(255) NOT NULL,
    school_code VARCHAR(100) NOT NULL UNIQUE,
    active BOOLEAN NOT NULL DEFAULT TRUE,
    activated_at TIMESTAMPTZ NOT NULL
);

ALTER TABLE identity.tenant
    ADD COLUMN IF NOT EXISTS realm_name VARCHAR(255);

ALTER TABLE identity.tenant
    ADD COLUMN IF NOT EXISTS routing_status VARCHAR(80);

ALTER TABLE identity.tenant
    ADD COLUMN IF NOT EXISTS onboarding_status VARCHAR(80);

CREATE UNIQUE INDEX IF NOT EXISTS idx_tenant_school_code
    ON identity.tenant (LOWER(school_code));

CREATE TABLE IF NOT EXISTS identity.school_account (
    account_id UUID PRIMARY KEY,
    tenant_id UUID NOT NULL REFERENCES identity.tenant(tenant_id) ON DELETE CASCADE,
    school_id UUID NOT NULL,
    school_name VARCHAR(255) NOT NULL,
    school_code VARCHAR(100) NOT NULL,
    email VARCHAR(255) NOT NULL,
    password VARCHAR(255) NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    role_name VARCHAR(80) NOT NULL,
    account_status VARCHAR(40) NOT NULL DEFAULT 'PENDING_ACTIVATION',
    active BOOLEAN NOT NULL DEFAULT TRUE,
    theme VARCHAR(40) DEFAULT 'dark',
    active_theme VARCHAR(60) DEFAULT 'indigo-flow',
    vibe VARCHAR(40) DEFAULT 'visual',
    accent_color VARCHAR(20) DEFAULT '#6366f1',
    glass_intensity NUMERIC DEFAULT 0.4,
    border_radius VARCHAR(40) DEFAULT '24px'
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_school_account_login
    ON identity.school_account (LOWER(school_code), LOWER(email));

CREATE TABLE IF NOT EXISTS identity.tenant_user_account (
    account_id UUID PRIMARY KEY,
    tenant_id UUID NOT NULL REFERENCES identity.tenant(tenant_id) ON DELETE CASCADE,
    school_id UUID NOT NULL,
    school_code VARCHAR(100) NOT NULL,
    school_name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL,
    password VARCHAR(255) NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    role_name VARCHAR(80) NOT NULL,
    account_status VARCHAR(40) NOT NULL DEFAULT 'PENDING_ACTIVATION',
    active BOOLEAN NOT NULL DEFAULT TRUE,
    theme VARCHAR(40) DEFAULT 'dark',
    active_theme VARCHAR(60) DEFAULT 'indigo-flow',
    vibe VARCHAR(40) DEFAULT 'visual',
    accent_color VARCHAR(20) DEFAULT '#6366f1',
    glass_intensity NUMERIC DEFAULT 0.4,
    border_radius VARCHAR(40) DEFAULT '24px'
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_tenant_user_account_login
    ON identity.tenant_user_account (LOWER(school_code), LOWER(email));

CREATE TABLE IF NOT EXISTS identity.account_activation_token (
    token_id UUID PRIMARY KEY,
    tenant_id UUID NOT NULL,
    account_id UUID NOT NULL,
    school_code VARCHAR(100) NOT NULL,
    email VARCHAR(255) NOT NULL,
    activation_code VARCHAR(40) NOT NULL UNIQUE,
    expires_at TIMESTAMPTZ NOT NULL,
    consumed_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS identity.password_reset_token (
    token_id UUID PRIMARY KEY,
    tenant_id UUID NOT NULL REFERENCES identity.tenant(tenant_id) ON DELETE CASCADE,
    account_id UUID NOT NULL,
    account_type VARCHAR(40) NOT NULL,
    school_id UUID NOT NULL,
    school_code VARCHAR(100) NOT NULL,
    email VARCHAR(255) NOT NULL,
    code_hash VARCHAR(255) NOT NULL,
    expires_at TIMESTAMPTZ NOT NULL,
    verified_at TIMESTAMPTZ,
    consumed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_password_reset_token_school_email
    ON identity.password_reset_token (LOWER(school_code), LOWER(email));
CREATE INDEX IF NOT EXISTS idx_password_reset_token_expires_at
    ON identity.password_reset_token (expires_at);

CREATE TABLE IF NOT EXISTS identity.tenant_domain (
    domain_id UUID PRIMARY KEY,
    tenant_id UUID NOT NULL REFERENCES identity.tenant(tenant_id) ON DELETE CASCADE,
    domain VARCHAR(255) NOT NULL UNIQUE,
    host VARCHAR(255) NOT NULL UNIQUE,
    domain_type VARCHAR(80) NOT NULL,
    is_primary BOOLEAN NOT NULL DEFAULT FALSE,
    is_canonical BOOLEAN NOT NULL DEFAULT FALSE,
    is_active BOOLEAN NOT NULL DEFAULT FALSE,
    verification_status VARCHAR(80) NOT NULL DEFAULT 'PENDING',
    verification_method VARCHAR(80) NOT NULL DEFAULT 'DNS_TXT',
    verification_token VARCHAR(255),
    verification_details_json JSONB,
    ssl_mode VARCHAR(80) NOT NULL DEFAULT 'PLATFORM_MANAGED',
    ssl_status VARCHAR(80) DEFAULT 'PENDING',
    dns_status VARCHAR(80) DEFAULT 'PENDING',
    last_verified_at TIMESTAMPTZ,
    last_dns_check_at TIMESTAMPTZ,
    last_ssl_check_at TIMESTAMPTZ,
    redirect_target_domain_id UUID,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_tenant_domain_tenant_id
    ON identity.tenant_domain (tenant_id);

CREATE TABLE IF NOT EXISTS identity.tenant_routing_config (
    config_id UUID PRIMARY KEY,
    tenant_id UUID NOT NULL UNIQUE REFERENCES identity.tenant(tenant_id) ON DELETE CASCADE,
    preferred_host VARCHAR(255),
    fallback_host VARCHAR(255),
    redirect_mode VARCHAR(80) NOT NULL DEFAULT 'NONE',
    enforce_https BOOLEAN NOT NULL DEFAULT TRUE,
    allow_multiple_hosts BOOLEAN NOT NULL DEFAULT TRUE,
    host_match_strategy VARCHAR(80) NOT NULL DEFAULT 'STRICT',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- NOTE:
-- Do not seed fixed admin credentials in SQL.
-- For local/dev, bootstrap a SUPER_ADMIN using auth-service env vars:
--   BOOTSTRAP_SUPERADMIN_ENABLED=true
--   BOOTSTRAP_SUPERADMIN_EMAIL=superadmin@sms.local
--   BOOTSTRAP_SUPERADMIN_PASSWORD=<set a strong password>
