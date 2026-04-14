-- Add read tracking to message thread participants for unread counters.
ALTER TABLE IF EXISTS communication.message_thread_participant
    ADD COLUMN IF NOT EXISTS last_read_at TIMESTAMPTZ;
