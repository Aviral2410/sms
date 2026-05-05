# Epic 01: Auth, Identity, and Tenant Routing

## Epic Intent

Provide secure access, user activation, password recovery, tenant-aware login, and custom domain routing across platform and school roles.

## Primary Users

- Platform admin
- School admin
- Teacher
- Student
- Parent
- Driver / conductor / transport staff

## Current Implementation Requirements

- Platform admin login must be supported.
- School login must require `schoolCode`, `email`, and `password`.
- School account activation must require `schoolCode`, `email`, `activationCode`, and `newPassword`.
- Public password reset must support:
  forgot password, reset-code verification, and password reset completion.
- Public join flow must support school-code-based joining for role-based accounts.
- Platform admin must be able to retrieve activation details and regenerate activation codes.
- Internal provisioning must support school provisioning and tenant user provisioning.
- User preference updates are supported through auth/user profile APIs.
- Tenant resolution must support public tenant lookup and routing.
- Domain management must support:
  add custom domain, verify domain, and set primary domain.
- Frontend must expose public login, admin login, onboarding signup, join school, activation, and forgot password pages.
- Protected routing must enforce role-specific access in the frontend.

## Current Product Notes

- Identity is one of the highest-leverage platform foundations because every major module depends on role and tenant context.
- Product risk is not lack of functionality; it is confidence in role enforcement, token validation, and lifecycle edge cases.
- Comments in implementation suggest at least some temporary allowance around preference updates without strict token-email validation, which should be treated as a product hardening gap.

## Known Gaps / Stabilization Needs

- End-to-end validation of role access across frontend route protection and backend controller authorization.
- Activation and recovery flow regression coverage.
- Better auditability around admin-triggered provisioning and profile changes.
- Domain routing verification lifecycle needs operational playbooks.

## Success Metrics

- login success rate by role
- activation completion rate
- password reset completion rate
- unauthorized access defect count
- tenant routing resolution success rate
