# Role: Transport Manager

## Role Intent

Own transport operations while still retaining visibility into selected school management surfaces that affect routing, students, and scheduling.

## Current Access Surface

- Dashboard
- Students
- Teachers
- Admissions
- Class
- Department / academic structure
- Attendance
- Examinations
- Timetable
- Transport hub
- Profile

## Current Capabilities

- Access the transport hub and transport operations workflows when `TRANSPORT_BASE` is enabled.
- Manage or monitor transport-related school operations.
- Access students, teachers, admissions, class, and structure pages that influence transport planning.
- View attendance, exam, and timetable surfaces relevant to operational coordination.
- Access transport AI/status assistance and subscriber-related transport views where applicable.

## Backend Capability References

- `school-operations-service`
- especially transport management endpoints

## Product Constraints / Notes

- This role has a mixed surface today:
  partly school-ops visibility, partly transport specialization.
- A future refinement may reduce non-transport edit access if operational boundaries need tightening.
