# Epic 04: School Operations Core Admin

## Epic Intent

Provide the school administration system of record for academic structure, users, students, admissions, classes, timetable setup, and day-to-day administrative operations.

## Primary Users

- School admin
- Principal
- Manager
- Teacher

## Current Implementation Requirements

- Department management must support list, create, update, delete, and HOD retrieval.
- Subject management must support list, create, update, and delete.
- Class management must support list and create.
- User directory and user management must support:
  list users, create users, update users, delete users, internal profile creation, document upload, document listing, and preference updates.
- Student management must support:
  directory, list, create, update, delete, analytics, promotion, and class/parent assignment flows.
- Teacher-related assignment flows must support:
  HOD assignment, teacher-subject assignment, teacher-class assignment, class-teacher assignment, and class-subject-teacher assignment.
- Admissions must support:
  list, next admission number, create, detail, update, delete, and enrollment flow from frontend.
- Timetable must support retrieval, create, bulk create, and optimize.
- Dashboard/workspace retrieval must support school dashboard, teacher workspace, student workspace, parent workspace, and “me” scoped student/parent workspace endpoints.
- Frontend must expose admin pages for:
  admissions, students, teachers, classes, academic structure, timetable, dashboard, routing, and profile.

## Current Product Notes

- This epic is the operational backbone of the product for school admins.
- It contains the highest concentration of system-of-record data changes.
- The product should treat data integrity here as more important than adding adjacent admin conveniences.

## Known Gaps / Stabilization Needs

- Cross-entity integrity checks:
  classes, students, teacher assignments, admissions, and profile/document records.
- Admin journey end-to-end tests from admission to enrolled/managed student.
- Timetable validation and optimization predictability.
- Better UI resilience for empty, partial, and inconsistent data states.

## Success Metrics

- admission-to-student conversion success rate
- student create/update failure rate
- assignment conflict rate
- timetable publish/edit error rate
