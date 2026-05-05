# Product Management Docs

This folder captures the current platform feature set as product epics and translates the next phase into a delivery plan that is realistic for the codebase as it exists today.

## Structure

- `epic/`: feature-wise epics with current implementation requirements derived from the existing frontend routes, backend APIs, and supporting services.
- `epic/roles/`: role-based current capability documents showing what each user type can do today.
- `plan/`: sprint-wise plans for the next 4 one-week sprints. Each sprint assumes 5 development days and is intentionally stability-first with no net-new feature scope in the first month.
- `six-month-product-analysis.md`: PM-level view of product maturity, priorities, risks, and a suggested six-month roadmap.

## Planning Assumptions

- Current state was inferred from implemented UI routes, controller APIs, service boundaries, and available tests in the repository.
- “Requirement” in epic docs means “behavior already represented in code or exposed through API/UI,” not necessarily fully hardened or fully production-ready.
- The first 4 sprints are stabilization-only:
  no new modules, no major scope expansion, and testing/observability/data quality take priority over roadmap acceleration.

## Epic Index

1. `epic/01-auth-identity-and-tenant-routing.md`
2. `epic/02-school-onboarding-public-site-and-cms.md`
3. `epic/03-subscription-pricing-and-platform-configuration.md`
4. `epic/04-school-operations-core-admin.md`
5. `epic/05-attendance-and-compliance.md`
6. `epic/06-exams-results-and-academic-evaluation.md`
7. `epic/07-transport-operations-and-live-tracking.md`
8. `epic/08-finance-billing-and-fee-collection.md`
9. `epic/09-communication-notifications-and-parent-engagement.md`
10. `epic/10-library-forum-and-learning-experience.md`
11. `epic/11-ai-assistant-workspaces-and-governance.md`
12. `epic/12-analytics-dashboards-and-hr-operations.md`

## Role Capability Index

1. `epic/roles/README.md`
2. `epic/roles/platform-admin.md`
3. `epic/roles/school-admin.md`
4. `epic/roles/principal.md`
5. `epic/roles/manager.md`
6. `epic/roles/transport-manager.md`
7. `epic/roles/teacher.md`
8. `epic/roles/student.md`
9. `epic/roles/parent.md`
10. `epic/roles/driver.md`
11. `epic/roles/conductor.md`
12. `epic/roles/staff.md`
