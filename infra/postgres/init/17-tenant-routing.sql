-- 17-tenant-routing.sql
-- Extension to support platform subdomains and custom domains

-- 1. Extend identity.tenant
ALTER TABLE identity.tenant 
ADD COLUMN IF NOT EXISTS realm_name VARCHAR(100) UNIQUE,
ADD COLUMN IF NOT EXISTS routing_status VARCHAR(40) NOT NULL DEFAULT 'PENDING',
ADD COLUMN IF NOT EXISTS onboarding_status VARCHAR(40) NOT NULL DEFAULT 'COMPLETED';

-- 2. Create Reserved Realms table
CREATE TABLE IF NOT EXISTS identity.reserved_realm (
    realm_name VARCHAR(100) PRIMARY KEY,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO identity.reserved_realm (realm_name, description) VALUES
('admin', 'Platform administration portal'),
('portal', 'Common portal access'),
('api', 'System API endpoint'),
('system', 'Internal system services'),
('www', 'Default landing page'),
('support', 'Support portal'),
('auth', 'Shared authentication services'),
('static', 'Static asset serving'),
('mcp', 'Model Context Protocol server')
ON CONFLICT (realm_name) DO NOTHING;

-- 3. Tenant Domains table
CREATE TABLE IF NOT EXISTS identity.tenant_domain (
    domain_id UUID PRIMARY KEY,
    tenant_id UUID NOT NULL REFERENCES identity.tenant(tenant_id) ON DELETE CASCADE,
    domain VARCHAR(255) NOT NULL UNIQUE,
    host VARCHAR(255) NOT NULL UNIQUE,
    domain_type VARCHAR(40) NOT NULL, -- PLATFORM_SUBDOMAIN, CUSTOM, CUSTOM_WWW, ALIAS
    is_primary BOOLEAN NOT NULL DEFAULT FALSE,
    is_canonical BOOLEAN NOT NULL DEFAULT FALSE,
    is_active BOOLEAN NOT NULL DEFAULT FALSE,
    verification_status VARCHAR(40) NOT NULL DEFAULT 'PENDING', -- PENDING, VERIFIED, FAILED
    verification_method VARCHAR(40) NOT NULL DEFAULT 'DNS_TXT', -- DNS_TXT, DNS_CNAME
    verification_token VARCHAR(255),
    verification_details_json JSONB,
    ssl_mode VARCHAR(40) NOT NULL DEFAULT 'PLATFORM_MANAGED', -- PLATFORM_MANAGED, EXTERNAL
    ssl_status VARCHAR(40) DEFAULT 'PENDING',
    dns_status VARCHAR(40) DEFAULT 'PENDING',
    last_verified_at TIMESTAMPTZ,
    last_dns_check_at TIMESTAMPTZ,
    last_ssl_check_at TIMESTAMPTZ,
    redirect_target_domain_id UUID REFERENCES identity.tenant_domain(domain_id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_tenant_domain_tenant_id ON identity.tenant_domain(tenant_id);
CREATE INDEX IF NOT EXISTS idx_tenant_domain_host ON identity.tenant_domain(host);

-- 4. Tenant Routing Config
CREATE TABLE IF NOT EXISTS identity.tenant_routing_config (
    config_id UUID PRIMARY KEY,
    tenant_id UUID NOT NULL UNIQUE REFERENCES identity.tenant(tenant_id) ON DELETE CASCADE,
    preferred_host VARCHAR(255),
    fallback_host VARCHAR(255),
    redirect_mode VARCHAR(40) NOT NULL DEFAULT 'NONE', -- NONE, TO_PRIMARY, TO_CUSTOM, TO_PLATFORM
    enforce_https BOOLEAN NOT NULL DEFAULT TRUE,
    allow_multiple_hosts BOOLEAN NOT NULL DEFAULT TRUE,
    host_match_strategy VARCHAR(40) NOT NULL DEFAULT 'STRICT',
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 5. Tenant Domain Verification Log
CREATE TABLE IF NOT EXISTS identity.tenant_domain_verification_log (
    log_id UUID PRIMARY KEY,
    domain_id UUID NOT NULL REFERENCES identity.tenant_domain(domain_id) ON DELETE CASCADE,
    check_type VARCHAR(40) NOT NULL,
    status VARCHAR(40) NOT NULL,
    response_summary TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 6. Indices and Constraints
-- Ensure only one primary domain per tenant (partial index)
CREATE UNIQUE INDEX IF NOT EXISTS idx_tenant_domain_primary_one 
ON identity.tenant_domain (tenant_id) 
WHERE is_primary = TRUE;

CREATE UNIQUE INDEX IF NOT EXISTS idx_tenant_domain_canonical_one 
ON identity.tenant_domain (tenant_id) 
WHERE is_canonical = TRUE;
