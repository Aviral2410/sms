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
    auth_service_url VARCHAR(255) DEFAULT 'http://auth-service:8082',
    communication_service_url VARCHAR(255) DEFAULT 'http://communication-service:8089',
    released_feature_codes TEXT DEFAULT '*',
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE identity.platform_settings
    ADD COLUMN IF NOT EXISTS glass_intensity DOUBLE PRECISION DEFAULT 0.55,
    ADD COLUMN IF NOT EXISTS border_radius VARCHAR(20) DEFAULT '16px',
    ADD COLUMN IF NOT EXISTS auth_service_url VARCHAR(255) DEFAULT 'http://auth-service:8082',
    ADD COLUMN IF NOT EXISTS communication_service_url VARCHAR(255) DEFAULT 'http://communication-service:8089',
    ADD COLUMN IF NOT EXISTS released_feature_codes TEXT DEFAULT '*';

-- Seed initial settings
INSERT INTO identity.platform_settings (
    theme_name,
    accent_color,
    default_trial_days,
    maintenance_mode,
    platform_name,
    contact_email,
    glass_intensity,
    border_radius,
    auth_service_url,
    communication_service_url,
    released_feature_codes
)
SELECT
    'INDIGO_FLOW',
    '#6366f1',
    14,
    FALSE,
    'ElevateSmart',
    'support@elevatesmart.com',
    0.55,
    '16px',
    'http://auth-service:8082',
    'http://communication-service:8089',
    '*'
WHERE NOT EXISTS (SELECT 1 FROM identity.platform_settings);

-- Documentation for deployment
COMMENT ON TABLE identity.platform_settings IS 'Central storage for platform-wide UI and business rule configurations.';
