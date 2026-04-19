CREATE TABLE audit_events (
    id UUID PRIMARY KEY,
    timestamp TIMESTAMPTZ NOT NULL,
    event_type VARCHAR(255) NOT NULL,
    user_id VARCHAR(255) NOT NULL,
    school_id UUID,
    payload TEXT,
    status VARCHAR(50) NOT NULL
);

CREATE INDEX idx_audit_timestamp ON audit_events(timestamp DESC);
CREATE INDEX idx_audit_user ON audit_events(user_id);
CREATE INDEX idx_audit_school ON audit_events(school_id);
