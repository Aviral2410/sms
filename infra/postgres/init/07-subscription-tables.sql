-- Subscription Service Tables
SET search_path TO subscription;

CREATE TABLE IF NOT EXISTS subscription_plans (
    plan_id UUID PRIMARY KEY,
    plan_name VARCHAR(100) NOT NULL UNIQUE,
    plan_code VARCHAR(50) NOT NULL UNIQUE,
    description TEXT,
    monthly_price DECIMAL(19,4) NOT NULL,
    max_students INTEGER NOT NULL,
    max_parents_per_student INTEGER NOT NULL DEFAULT 2,
    features TEXT NOT NULL, -- Comma-separated or JSON string of feature codes
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS tenant_subscriptions (
    subscription_id UUID PRIMARY KEY,
    tenant_id UUID NOT NULL,
    plan_id UUID NOT NULL REFERENCES subscription_plans(plan_id),
    status VARCHAR(50) NOT NULL,
    start_date TIMESTAMP WITH TIME ZONE NOT NULL,
    end_date TIMESTAMP WITH TIME ZONE,
    trial_end_date TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
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
    created_at TIMESTAMP WITH TIME ZONE NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX IF NOT EXISTS idx_upgrade_requests_tenant ON upgrade_requests(tenant_id);
CREATE INDEX IF NOT EXISTS idx_upgrade_requests_status ON upgrade_requests(status);
