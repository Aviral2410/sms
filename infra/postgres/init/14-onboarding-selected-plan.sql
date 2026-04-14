ALTER TABLE onboarding.school_onboarding
    ADD COLUMN IF NOT EXISTS activation_code VARCHAR(40);

ALTER TABLE onboarding.school_onboarding
    ADD COLUMN IF NOT EXISTS selected_plan_code VARCHAR(50) NOT NULL DEFAULT 'BASIC';
