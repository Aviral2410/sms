# Epic 12: Analytics, Dashboards, and HR Operations

## Epic Intent

Give platform and school operators actionable visibility into system health, business performance, school operations, and staff leave workflows.

## Primary Users

- Platform admin
- School admin
- Principal / manager
- Teacher / staff

## Current Implementation Requirements

- Platform admin must have access to:
  onboarding queue, all schools, platform analytics, system logs, public inquiry inbox, pricing control, AI briefing, AI governance, and platform settings.
- School-level dashboards must exist for school admin, student, parent, and teacher.
- School analytics page must be available.
- Attendance analytics, transport analytics, and AI risk analysis endpoints must exist.
- HR leave workflows must support:
  leave request create, my leaves, list leaves, approve, reject, and cancel.
- Frontend must expose leave request page and multiple dashboard surfaces.

## Current Product Notes

- This epic combines two different value layers:
  decision visibility and internal operations workflow.
- Dashboards are already important for product perception, but they only create value if underlying source data is trustworthy.

## Known Gaps / Stabilization Needs

- Define which dashboards are authoritative vs illustrative.
- Validate analytics correctness for attendance, transport, school, and platform views.
- Strengthen HR role and lifecycle coverage.
- Add error-state handling and empty-state clarity for operator pages.

## Success Metrics

- dashboard load success rate
- analytics trust incidents reported
- leave request turnaround time
- operator page regression count
