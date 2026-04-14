-- Platform Global Configuration Seed
-- This table centralizes all third-party API keys and service states.

CREATE SCHEMA IF NOT EXISTS identity;

CREATE TABLE IF NOT EXISTS identity.platform_config (
    config_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    service_name VARCHAR(100) NOT NULL UNIQUE, -- e.g., 'TWILIO_SMS', 'SENDGRID_EMAIL', 'GEMINI_LLM'
    api_key_secret VARCHAR(255),
    api_base_url VARCHAR(255),
    is_enabled BOOLEAN DEFAULT TRUE,
    metadata JSONB, -- For service-specific config like from_phone_number, from_email, etc.
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Seeding consistent, cost-effective third-party placeholders
INSERT INTO identity.platform_config (service_name, api_base_url, metadata)
VALUES 
('TWILIO_UNIFIED', 'https://api.twilio.com', '{"from_phone": "+123456789", "whatsapp_enabled": true}'),
('SENDGRID_EMAIL', 'https://api.sendgrid.com', '{"from_email": "notifications@sms-platform.com"}'),
('GEMINI_LLM', 'https://generativelanguage.googleapis.com', '{"model": "gemini-1.5-flash", "temperature": 0.7}'),
('GOOGLE_TTS', 'https://texttospeech.googleapis.com', '{"default_voice": "en-IN-Wavenet-B"}')
ON CONFLICT (service_name) DO NOTHING;

-- Documentation for deployment
COMMENT ON TABLE identity.platform_config IS 'Central repository for third-party SaaS integration secrets and settings.';
