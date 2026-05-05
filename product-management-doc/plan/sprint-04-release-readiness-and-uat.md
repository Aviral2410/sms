# Sprint 04: Release Readiness and UAT

## Sprint Goal

Turn the first month of stabilization work into a releasable operating baseline with UAT evidence, defect burn-down, and deployment confidence.

## Scope Principles

- No new product features.
- Focus on release readiness, UAT evidence, defect closure, and environment reliability.
- Only accept small hardening changes that improve readiness directly.

## Planned Outcomes

- Cross-role UAT scripts are completed for:
  platform admin, school admin, teacher, student, parent, and transport operator personas.
- Release candidate checklist covers:
  auth, onboarding, subscription, school-ops core, attendance, transport, finance, communication, AI, and dashboards.
- High-severity issues from sprints 1-3 are closed or explicitly deferred with owner and impact.
- CI/test execution expectations are documented for frontend and service modules.
- Deployment/runbook readiness is improved for local, staging, and Helm-based environments.

## Delivery Breakdown

### Day 1

- Build UAT packs and release checklist.

### Day 2

- Execute UAT for public/platform/school-admin flows.

### Day 3

- Execute UAT for teacher/student/parent/transport flows.

### Day 4

- Fix highest-priority release blockers.

### Day 5

- Release readiness review and month-end stabilization summary.

## Exit Criteria

- The platform has a defensible “stable baseline” release candidate.
- Each key role journey has been exercised end to end.
- Remaining defects are prioritized, not unknown.
