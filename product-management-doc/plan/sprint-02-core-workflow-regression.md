# Sprint 02: Core Workflow Regression

## Sprint Goal

Lock down the core system-of-record workflows used by school admins and teachers so the product stops regressing in day-to-day operations.

## Scope Principles

- No new product features.
- Focus on create/update/submit flows that affect records schools rely on.
- Cover both happy-path and high-frequency error-path behavior.

## Planned Outcomes

- Regression coverage for:
  admissions, students, teacher assignments, class/subject mappings, timetable create/bulk flows.
- Attendance session lifecycle is covered from creation through submission and correction.
- Role-boundary verification is added for school admin vs teacher vs student access.
- Frontend forms for admissions/student/admin workflows are exercised against realistic payloads.
- Data validation issues found in core school-ops flows are fixed or explicitly backlog-ranked.

## Delivery Breakdown

### Day 1

- Finalize core workflow acceptance cases.
- Add backend tests for admissions and students.

### Day 2

- Add backend tests for assignments and timetable flows.
- Add role-access assertions for sensitive endpoints.

### Day 3

- Add frontend regression tests for admin flows with highest usage.

### Day 4

- Fix broken validations, error states, and contract mismatches uncovered by tests.

### Day 5

- Demo the admin operating baseline and capture remaining defects.

## Exit Criteria

- Core school admin flows are covered by automated regression tests.
- Known data integrity issues are reduced and visible.
- Teachers and non-admins cannot drift into admin-only paths unnoticed.
