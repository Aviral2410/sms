# Epic 09: Communication, Notifications, and Parent Engagement

## Epic Intent

Enable school-wide announcements, threaded messaging, notification delivery, and role-aware communication across school stakeholders.

## Primary Users

- School admin
- Teacher
- Parent
- Student

## Current Implementation Requirements

- Announcement creation and listing must be supported, including a `v2` announcement surface.
- Announcement acknowledgement must be supported.
- Message threads must support create, list, detail, send message, and mark-read.
- Notification creation, user-notification retrieval, and notification mark-read must be supported.
- Student module and teacher module must support communication posting.
- Frontend must expose:
  communication center, teacher communication page, parent messages page, and student assembly updates page.

## Current Product Notes

- Communication is present as both a standalone service and role-specific in-product surfaces.
- Parent trust and school responsiveness depend on this module being reliable even if it is not the most complex technically.

## Known Gaps / Stabilization Needs

- Clarify overlap between communication service flows and role-module communication endpoints.
- Validate unread/read state accuracy across threads and notifications.
- End-to-end testing for parent-teacher-school messaging journeys.
- Ensure acknowledgements and notification delivery are audit-friendly.

## Success Metrics

- announcement publish success rate
- message send success rate
- notification read-state mismatch count
- parent communication response cycle time
