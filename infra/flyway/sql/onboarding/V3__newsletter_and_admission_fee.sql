-- V3: Newsletter subscriptions + seed data schema

CREATE TABLE IF NOT EXISTS onboarding.school_newsletter_subscription (
    id UUID PRIMARY KEY,
    tenant_id UUID NOT NULL,
    email VARCHAR(255) NOT NULL,
    status VARCHAR(50) DEFAULT 'ACTIVE', -- ACTIVE, UNSUBSCRIBED
    subscribed_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_newsletter_tenant_email UNIQUE (tenant_id, email)
);

CREATE INDEX idx_newsletter_tenant ON onboarding.school_newsletter_subscription(tenant_id);
CREATE INDEX idx_newsletter_email ON onboarding.school_newsletter_subscription(tenant_id, email);
