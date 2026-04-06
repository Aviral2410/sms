-- Default Subscription Plans for SaaS Platform
SET search_path TO subscription;

-- 1. FREE Plan: Basic needs
INSERT INTO subscription_plans (plan_id, plan_name, plan_code, description, monthly_price, max_students, features, created_at)
VALUES (
    'e0a1b2c3-d4e5-f6a7-b8c9-d0e1f2a3b4c5',
    'FREE',
    'FREE',
    'Basic needs for new institutions.',
    0.00,
    50,
    'ONBOARDING,AUTH',
    CURRENT_TIMESTAMP
) ON CONFLICT (plan_code) DO UPDATE SET 
    plan_name = EXCLUDED.plan_name,
    description = EXCLUDED.description,
    monthly_price = EXCLUDED.monthly_price,
    features = EXCLUDED.features;

-- 2. BASIC Plan: Entry level add-ons
INSERT INTO subscription_plans (plan_id, plan_name, plan_code, description, monthly_price, max_students, features, created_at)
VALUES (
    'f1a2b3c4-d5e6-f7a8-b9c0-d1e2f3a4b5c6',
    'BASIC',
    'BASIC',
    'Essential school operations with attendance.',
    49.99,
    500,
    'ONBOARDING,AUTH,SCHOOL_OPS,ATTENDANCE',
    CURRENT_TIMESTAMP
) ON CONFLICT (plan_code) DO UPDATE SET 
    plan_name = EXCLUDED.plan_name,
    description = EXCLUDED.description,
    monthly_price = EXCLUDED.monthly_price,
    features = EXCLUDED.features;

-- 3. PREMIUM Plan: Full access + AI
INSERT INTO subscription_plans (plan_id, plan_name, plan_code, description, monthly_price, max_students, features, created_at)
VALUES (
    'a2b3c4d5-e6f7-a8b9-c0d1-e2f3a4b5c6d7',
    'PREMIUM',
    'PREMIUM',
    'Full access with real-time AI and finance.',
    199.99,
    10000,
    '*', 
    CURRENT_TIMESTAMP
) ON CONFLICT (plan_code) DO UPDATE SET 
    plan_name = EXCLUDED.plan_name,
    description = EXCLUDED.description,
    monthly_price = EXCLUDED.monthly_price,
    features = EXCLUDED.features;
