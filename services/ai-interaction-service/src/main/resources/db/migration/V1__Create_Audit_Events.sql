CREATE SCHEMA IF NOT EXISTS aiinteraction;

CREATE TABLE IF NOT EXISTS aiinteraction.audit_events (
    id UUID PRIMARY KEY,
    timestamp TIMESTAMPTZ NOT NULL,
    event_type VARCHAR(255) NOT NULL,
    user_id VARCHAR(255) NOT NULL,
    school_id UUID,
    payload TEXT,
    status VARCHAR(50) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_audit_timestamp ON aiinteraction.audit_events(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_audit_user ON aiinteraction.audit_events(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_school ON aiinteraction.audit_events(school_id);

