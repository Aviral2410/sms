ALTER TABLE identity.platform_config
    ALTER COLUMN api_key_secret TYPE TEXT;

INSERT INTO identity.platform_config (service_name, api_base_url, metadata)
VALUES
    ('RAZORPAY', 'https://api.razorpay.com', '{"refreshRequired": true, "provider": "payments"}'),
    ('STRIPE', 'https://api.stripe.com', '{"refreshRequired": true, "provider": "payments"}'),
    ('OPENAI', 'https://api.openai.com', '{"refreshRequired": true, "provider": "ai", "model": "gpt-4o-mini"}'),
    ('OPENROUTER', 'https://openrouter.ai/api', '{"refreshRequired": true, "provider": "ai", "model": "openai/gpt-4o-mini"}'),
    ('ANTHROPIC', 'https://api.anthropic.com', '{"refreshRequired": true, "provider": "ai", "model": "claude-3-haiku-20240307"}')
ON CONFLICT (service_name) DO NOTHING;
