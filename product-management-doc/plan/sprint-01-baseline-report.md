# Sprint 01 Baseline Report

## Objective

Establish a repeatable stability baseline for the highest-risk platform journeys before deeper module work begins.

## Critical Journey Inventory

| Journey | Primary backend modules | Primary frontend routes | Current baseline coverage |
| --- | --- | --- | --- |
| Public inquiry | `school-onboarding-service` public site content APIs | `/`, `/contact`, `/support` | Controller tests present for public site content; route checklist documented |
| School onboarding | `school-onboarding-service` | `/signup`, `/onboarding`, `/activate` | WebMvc smoke coverage plus functional onboarding runner |
| Review and activation | `school-onboarding-service`, `auth-service` | `/admin/onboarding`, `/activate`, `/login`, `/join` | Review, activation email, activation details, join, and password reset smoke coverage |
| Platform admin login | `auth-service` | `/login/admin`, `/login` | WebMvc smoke coverage |
| School login and dashboard access | `auth-service`, `school-operations-service` | `/login`, `/dashboard` | Auth controller tests plus protected-route inventory |
| System-of-record creation | `school-operations-service`, `subscription-service` | `/admissions`, `/students`, `/admin/pricing` | Admission/student/subscription smoke coverage added in Sprint 01 |

## Module Ownership Map

| Area | Baseline owner for Sprint 01 | Reason |
| --- | --- | --- |
| Auth and activation | `services/auth-service` | Login, activation, password reset, admin profile, user provisioning |
| Onboarding and public site | `services/school-onboarding-service` | Public inquiry, onboarding, branding, review lifecycle |
| School operations core | `services/school-operations-service` | Admissions, students, classes, operational records |
| Subscription and feature access | `services/subscription-service` | Plan state, tenant subscription state, feature checks |
| Frontend routing and access | `frontend/src/AppRoutes.tsx`, `frontend/src/components/auth/ProtectedRoute.tsx` | Role coverage and route gating |
| Stability orchestration | `tests/stability`, `tests/ci`, `tests/functional-api` | Repeatable baseline execution |

## Backend Smoke Matrix

| Module | Critical smoke coverage in repo | Gaps still visible |
| --- | --- | --- |
| Auth | admin login, school login, activation, activation details, regenerate activation, password reset flow, public join, admin profile authz | internal provision success path, tenant resolution controller |
| Onboarding | create, validation, admin list/detail, public status, public profile, review, activation email, branding, delete | explicit public logo upload assertion |
| School operations | admissions list/create/update/delete, next admission number, students list/create/update/delete | create class/department/subject smoke still thin |
| Subscription | public plans/overview, current tenant subscription, feature check, update/initialize/list authz | platform stats/status endpoints not yet smoked |

## Frontend Route Inventory

### Public

- `/`, `/pricing`, `/contact`, `/support`, `/vision`, `/founders-message`
- `/login`, `/login/admin`, `/signup`, `/onboarding`, `/join`, `/activate`, `/forgot-password`
- `/assistant`, `/ai-assistant`

### Protected but role-agnostic after authentication

- `/dashboard`, `/profile`, `/settings`
- `/students`, `/students/:id`, `/classes`, `/notices`
- `/exams`, `/timetable`, `/library`, `/forum`, `/forum/:id`, `/communication`
- `/school/analytics`, `/school/structure`, `/school/classes`, `/learn`

### Protected with explicit role expectations

- School admin or leadership: `/admissions`, `/admissions/new/enroll`, `/admissions/:id`, `/admissions/:id/enroll`, `/school/cms`, `/school/routing`
- Attendance staff paths: `/attendance`, `/attendance/teacher`, `/attendance/student`, `/attendance/:classId/mark`
- School admin billing: `/billing`, `/billing/:invoiceId`
- School admin teacher management: `/teachers`
- Platform admin: `/admin/onboarding`, `/admin/logs`, `/admin/schools`, `/admin/analytics`, `/admin/ai-briefing`, `/admin/ai-governance`, `/admin/inquiries`, `/admin/pricing`
- Transport manager: `/transport`
- Driver: `/transport/driver`
- Conductor: `/transport/conductor`
- Parent, student, teacher transport subscriber: `/transport/my`
- Student-only: `/student/profile`, `/student/classroom`, `/student/timetable`, `/student/attendance`, `/student/homework`, `/student/results`, `/student/assembly`, `/student/fees`
- Teacher-only: `/teacher/profile`, `/teacher/homework`, `/teacher/communication`, `/teacher/behaviour`, `/teacher/marks`
- Parent-only: `/parents/children`, `/parents/messages`
- Shared HR roles: `/hr/leaves`

## Seed And Demo Data Health

- Functional onboarding relies on `tests/functional-api/.env` and seeded platform admin credentials.
- Local super-admin bootstrap is environment-driven in `auth-service` rather than fixed SQL seed data, which is safer but means smoke environments must be configured intentionally.
- Onboarding and subscription seed/repair SQL exists under `infra/helm/sms-platform/files/postgres-init`, so data drift between local and cluster repair jobs is a risk to watch.
- The public site no longer depends purely on hard-coded demo content for media assets, but public/demo UX still assumes sample-rich content in some frontend experiences.

## Known Stability Risks

1. Route authorization is documented but not yet enforced by dedicated frontend route tests; current confidence is mostly static inspection plus a few component tests.
2. Functional API coverage is strong for onboarding but remains environment-dependent, so local green tests alone do not guarantee deploy-time readiness.
3. School-operations breadth is large; Sprint 01 now covers admissions and student creation, but many adjacent create/update controllers remain lightly smoked.
4. Subscription admin endpoints rely on header-based role checks without broader integration coverage, so authz regressions outside controller tests may still slip through.

## Go / No-Go Readout

- `Go` for Sprint 02 only if the grouped stability suite is green in CI and the onboarding functional runner is green in a configured environment.
- `No-Go` if functional onboarding cannot run, if admissions/student smoke tests fail, or if admin/public auth flows become flaky.

## Day 6 Extension

- Platform settings now include a released-feature list that the platform admin can use to control which entitled capabilities are visible in the UI.
- Public pricing hides unreleased plan features while preserving plan definitions, and it now shows a rollout notice telling users to contact their admin when some included capabilities are not yet enabled.
- Billing upgrade cards apply the same visibility filter so unreleased capabilities are not advertised as live.
- Authenticated navigation now requires both plan entitlement and platform release visibility before feature-gated items appear.
- Backend verification passed for `PlatformSettingsControllerTest`, `PublicSiteContentControllerTest`, and `SchoolOnboardingControllerTest`.
- Frontend package execution is still blocked by missing `npm`, but `frontend` TypeScript compilation passed through `./node_modules/.bin/tsc -b`.
