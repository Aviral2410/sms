# Sprint 03: Operational Hardening

## Sprint Goal

Make differentiated operational modules trustworthy enough for pilot usage by hardening attendance depth, transport execution, communication, and finance-critical paths.

## Scope Principles

- No new product features.
- Focus on failure handling, realtime/reconciliation confidence, and operational observability.
- Prioritize modules that are visible to parents and field staff.

## Planned Outcomes

- Attendance deeper-path validation:
  policy, analytics, export, and session edge cases.
- Transport regression coverage for:
  route/staff/vehicle setup, trip lifecycle, subscriber state, and interruption flows.
- Communication regression coverage for announcements, threads, reads, and acknowledgements.
- Finance smoke coverage for fee creation, payment creation, dues retrieval, and provider configuration safety.
- Logging/traceability gaps are identified and improved for critical operational actions.

## Delivery Breakdown

### Day 1

- Define operational UAT cases for attendance and transport.

### Day 2

- Add transport backend tests and contract checks.

### Day 3

- Add communication and finance smoke/regression tests.

### Day 4

- Improve observability and repair the highest-severity failures uncovered.

### Day 5

- Run pilot-readiness review for attendance, transport, communication, and finance.

## Exit Criteria

- Operational modules have basic regression and audit confidence.
- Parent-visible and field-operator-visible failures are materially reduced.
- Team has clearer signal on which modules are safe for pilot usage.
