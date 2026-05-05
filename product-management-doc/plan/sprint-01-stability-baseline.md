# Sprint 01: Stability Baseline

## Sprint Goal

Establish a measurable quality baseline for the existing platform and remove the highest-risk blind spots before touching deeper module logic.

## Scope Principles

- No new product features.
- Focus only on stability, test harnesses, contract clarity, and triage.
- Prioritize flows that block onboarding, login, and system-of-record data creation.

## Planned Outcomes

- Critical journey inventory is documented and agreed:
  public inquiry -> onboarding -> review -> activation -> login -> dashboard.
- Test matrix is created by module and role.
- Existing automated tests are grouped into a runnable stability suite.
- API contract smoke coverage is added for the most business-critical controllers:
  auth, onboarding, subscription, school-ops create/update flows.
- Frontend route inventory is mapped to role coverage and protected-route expectations.
- Top production-risk bugs and inconsistencies are logged and ranked.

## Delivery Breakdown

### Day 1

- Status: `completed`
- Audit current test coverage and missing areas.
- Define critical flows and module owners.
- Output: `product-management-doc/plan/sprint-01-baseline-report.md` critical journey inventory, module ownership map, and smoke matrix.

### Day 2

- Status: `completed`
- Add smoke tests for auth and onboarding APIs.
- Add frontend route access regression checklist.
- Output: expanded `AuthControllerTest`, existing onboarding controller suite confirmed, and frontend route inventory documented in `product-management-doc/plan/sprint-01-baseline-report.md`.

### Day 3

- Status: `completed`
- Add smoke tests for admissions, student creation, and subscription feature checks.
- Review seed/demo data health.
- Output: expanded `SchoolOperationsControllerTest`, new `SubscriptionControllerTest`, and seed/demo data health notes in `product-management-doc/plan/sprint-01-baseline-report.md`.

### Day 4

- Status: `completed`
- Triage failures, normalize fixtures, and stabilize flaky tests.
- Output: grouped baseline runner at `tests/stability/run-baseline.sh` plus stability suite documentation in `tests/stability/README.md`.

### Day 5

- Status: `completed with environment blockers noted`
- Sprint hardening review and go/no-go report for next sprint.
- Output: targeted backend verification passed locally; frontend Vitest execution is blocked in this shell because `npm` is unavailable, and the functional onboarding flow still requires `tests/functional-api/.env`.

### Day 6

- Status: `completed`
- Add a platform-admin-controlled feature visibility flag list for the live UI.
- Keep plan entitlements intact even when some features are not yet released to customers.
- Show plan-page messaging when a plan includes capabilities that are still hidden from the live rollout.
- Make the change on both backend and frontend without breaking existing plan/subscription behavior.
- Output: platform settings now carry `releasedFeatureCodes`, public pricing and billing views hide unreleased features, and navigation gating respects both entitlement and platform release state.

## Sprint Artifacts

- `product-management-doc/plan/sprint-01-baseline-report.md`
- `tests/stability/run-baseline.sh`
- `tests/stability/README.md`
- backend smoke suite extensions in auth, school-operations, and subscription service tests
- CI-safe backend suite runner in `tests/ci/run-backend-tests.sh`
- platform feature visibility controls across platform settings, pricing, billing, and gated navigation

## Exit Criteria

- We can run a baseline test suite with predictable outcomes.
- We have a known list of top stability defects.
- Critical public/auth/onboarding/admin create flows are no longer untested.
