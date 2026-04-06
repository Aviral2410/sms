-- Platform Global Settings
-- This table stores general platform preferences like active theme, trial limits, and system status.

CREATE TABLE IF NOT EXISTS identity.platform_settings (
    settings_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    theme_name VARCHAR(50) DEFAULT 'INDIGO_FLOW',
    accent_color VARCHAR(20) DEFAULT '#6366f1', -- Default Indigo base color
    default_trial_days INT DEFAULT 14,
    maintenance_mode BOOLEAN DEFAULT FALSE,
    platform_name VARCHAR(100) DEFAULT 'ElevateSmart',
    contact_email VARCHAR(100) DEFAULT 'support@elevatesmart.com',
    glass_intensity DOUBLE PRECISION DEFAULT 0.55,
    border_radius VARCHAR(20) DEFAULT '16px',
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE identity.platform_settings
    ADD COLUMN IF NOT EXISTS glass_intensity DOUBLE PRECISION DEFAULT 0.55,
    ADD COLUMN IF NOT EXISTS border_radius VARCHAR(20) DEFAULT '16px';

-- Seed initial settings
INSERT INTO identity.platform_settings (
    theme_name,
    accent_color,
    default_trial_days,
    maintenance_mode,
    platform_name,
    contact_email,
    glass_intensity,
    border_radius
)
SELECT
    'INDIGO_FLOW',
    '#6366f1',
    14,
    FALSE,
    'ElevateSmart',
    'support@elevatesmart.com',
    0.55,
    '16px'
WHERE NOT EXISTS (SELECT 1 FROM identity.platform_settings);

-- Documentation for deployment
COMMENT ON TABLE identity.platform_settings IS 'Central storage for platform-wide UI and business rule configurations.';
