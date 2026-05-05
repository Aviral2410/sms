# Role: Platform Admin

## Role Intent

Own platform-wide operations, commercial controls, school onboarding governance, and system-level visibility.

## Current Access Surface

- Command center dashboard
- Onboarding queue
- All schools
- Platform analytics
- AI governance
- Pricing control
- Public inquiry inbox
- LUMINA Studio
- System logs
- Platform engine/settings
- Profile

## Current Capabilities

- Log in through platform admin login.
- Review school onboarding records and take review actions.
- Trigger onboarding-related activation flows.
- View and act on public inquiries and support intake.
- Manage platform pricing and subscription plan configuration.
- View all school tenants and subscription-level platform views.
- Manage platform settings and runtime service configurations.
- Access platform AI briefing/governance surfaces.
- Provision schools and provision tenant users through admin/internal auth APIs.
- Retrieve and regenerate activation details for school accounts.
- Manage tenant routing domains:
  add domain, verify domain, set primary domain.

## Backend Capability References

- `auth-service`
- `school-onboarding-service`
- `subscription-service`
- `ai-interaction-service`

## Product Constraints / Notes

- This is the highest-risk role because it can affect onboarding, monetization, and platform behavior.
- Changes in this flow should be reviewed for auditability, authorization, and rollback safety.
