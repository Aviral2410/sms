CREATE TABLE IF NOT EXISTS communication.announcement (
    announcement_id UUID PRIMARY KEY,
    school_id UUID NOT NULL,
    title VARCHAR(255) NOT NULL,
    content VARCHAR(2000) NOT NULL,
    target_audience VARCHAR(80) NOT NULL,
    target_class_id UUID,
    created_by UUID NOT NULL,
    published_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL,
    expires_at TIMESTAMPTZ,
    priority VARCHAR(40),
    type VARCHAR(40)
);

ALTER TABLE communication.announcement
    ADD COLUMN IF NOT EXISTS published_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_communication_announcement_school_created
    ON communication.announcement (school_id, created_at DESC);

CREATE TABLE IF NOT EXISTS communication.announcement_ack (
    ack_id UUID PRIMARY KEY,
    school_id UUID NOT NULL,
    announcement_id UUID NOT NULL,
    user_id UUID NOT NULL,
    acknowledged_at TIMESTAMPTZ NOT NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS uq_communication_announcement_ack
    ON communication.announcement_ack (announcement_id, user_id);

CREATE INDEX IF NOT EXISTS idx_communication_announcement_ack_school_user
    ON communication.announcement_ack (school_id, user_id, acknowledged_at DESC);

CREATE TABLE IF NOT EXISTS communication.notification (
    notification_id UUID PRIMARY KEY,
    school_id UUID NOT NULL,
    recipient_id UUID NOT NULL,
    title VARCHAR(255) NOT NULL,
    message VARCHAR(1000) NOT NULL,
    type VARCHAR(80) NOT NULL,
    channel VARCHAR(40) NOT NULL,
    channel_address VARCHAR(255),
    delivery_status VARCHAR(40),
    provider_reference VARCHAR(255),
    metadata_json VARCHAR(4000),
    is_read BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_communication_notification_recipient_created
    ON communication.notification (recipient_id, created_at DESC);

-- Two-way messaging ---------------------------------------------------------

CREATE TABLE IF NOT EXISTS communication.message_thread (
    thread_id UUID PRIMARY KEY,
    school_id UUID NOT NULL,
    subject VARCHAR(255),
    created_by_user_id UUID NOT NULL,
    created_at TIMESTAMPTZ NOT NULL,
    updated_at TIMESTAMPTZ NOT NULL,
    last_message_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_communication_thread_school_updated
    ON communication.message_thread (school_id, updated_at DESC);

CREATE TABLE IF NOT EXISTS communication.message_thread_participant (
    participant_id UUID PRIMARY KEY,
    school_id UUID NOT NULL,
    thread_id UUID NOT NULL,
    user_id UUID NOT NULL,
    role_name VARCHAR(80),
    joined_at TIMESTAMPTZ NOT NULL,
    last_read_at TIMESTAMPTZ
);

ALTER TABLE communication.message_thread_participant
    ADD COLUMN IF NOT EXISTS last_read_at TIMESTAMPTZ;

CREATE UNIQUE INDEX IF NOT EXISTS uq_communication_thread_participant
    ON communication.message_thread_participant (thread_id, user_id);

CREATE INDEX IF NOT EXISTS idx_communication_thread_participant_user
    ON communication.message_thread_participant (school_id, user_id, joined_at DESC);

CREATE TABLE IF NOT EXISTS communication.message (
    message_id UUID PRIMARY KEY,
    school_id UUID NOT NULL,
    thread_id UUID NOT NULL,
    sender_user_id UUID NOT NULL,
    body TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_communication_message_thread_created
    ON communication.message (thread_id, created_at ASC);
