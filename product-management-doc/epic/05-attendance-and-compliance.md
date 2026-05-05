# Epic 05: Attendance and Compliance

## Epic Intent

Enable attendance capture, review, analytics, and intervention across admins, teachers, and students, including richer input modes and policy-aware workflows.

## Primary Users

- Teacher
- School admin
- Student
- Principal / manager

## Current Implementation Requirements

- Attendance context retrieval must be supported.
- Attendance sessions must support create, detail retrieval, per-student patch, bulk-present action, submit action, and record updates.
- Attendance capture modes must include:
  voice commands, GPS verification, and face-scan submission endpoints.
- Absence reasons must be supported.
- Attendance policy must support get and patch.
- Analytics must support:
  overview, heatmap, calendar, risk, export, and student attendance summary.
- Legacy/general school-ops attendance retrieval and bulk attendance posting are present and must continue to function until consolidated.
- Frontend must expose:
  attendance dashboard, teacher attendance manager, student attendance view, and marking flow.
- Student-specific APIs must support attendance analytics and absence-reason updates.

## Current Product Notes

- Attendance is a differentiated workflow area because it combines compliance, analytics, and multimodal input.
- It is also one of the most sensitive operational trust areas because incorrect attendance quickly becomes a parent-facing and administrative issue.

## Known Gaps / Stabilization Needs

- Reliability testing for session lifecycle:
  create, mark, verify, submit, export.
- Clarify overlap between specialized attendance controller flows and generic school-ops attendance endpoints.
- Role/permission hardening for teacher vs admin operations.
- UAT for voice/GPS/face-scan failure behavior and fallbacks.

## Success Metrics

- attendance submission success rate
- post-submission correction rate
- attendance analytics load reliability
- multimodal attendance failure rate
