# Onboarding Flow Guide

This document explains the current onboarding slice, how requests move through the system, and where to change behavior safely.

## What Exists Today

The first implemented slice is school onboarding.

It currently supports:

- school-facing onboarding request submission
- school-facing status lookup for a single school
- admin-only queue listing
- school-admin activation after approval
- one common login for school users after credentials exist
- tenant provisioning when a school is approved
- admin review actions
- status transitions from submitted to review to approved/rejected
- persisting records in PostgreSQL
- accessing the backend through the API gateway
- interacting through separate school and admin frontend views
- school operations for departments, subjects, classes, users, and role mappings
- school operations for admissions, timetable, fees, attendance, homework, notices, exam results, reporting, transport, reminders, library, notes, voice notes, and activities
- MCP resources and tools for platform admin, school admin, teacher, and student data access

## Request Flow

### Frontend

The frontend lives in `frontend/`.

- [App.tsx](../frontend/src/App.tsx): page logic, API calls, onboarding form, selected record state
- [styles.css](../frontend/src/styles.css): visual system, layout, responsive styling
- [vite.config.ts](../frontend/vite.config.ts): local dev proxy from `/api` to gateway on `8080`

The UI calls:

- `GET /api/v1/onboarding/schools`
- `GET /api/v1/onboarding/schools/status`
- `POST /api/v1/onboarding/schools`
- `PATCH /api/v1/onboarding/schools/{onboardingId}/review`
- `POST /api/v1/auth/admin/login`
- `POST /api/v1/auth/school/activate`
- `POST /api/v1/auth/school/login`
- `GET /api/v1/school-ops/dashboard`
- `GET /api/v1/school-ops/departments`
- `POST /api/v1/school-ops/departments`
- `GET /api/v1/school-ops/subjects`
- `POST /api/v1/school-ops/subjects`
- `GET /api/v1/school-ops/classes`
- `POST /api/v1/school-ops/classes`
- `GET /api/v1/school-ops/teacher-workspace`
- `GET /api/v1/school-ops/student-workspace`
- `GET /api/v1/school-ops/users`
- `POST /api/v1/school-ops/users`
- `GET /api/v1/school-ops/admissions`
- `POST /api/v1/school-ops/admissions`
- `GET /api/v1/school-ops/timetable`
- `POST /api/v1/school-ops/timetable`
- `GET /api/v1/school-ops/fees`
- `POST /api/v1/school-ops/fees`
- `GET /api/v1/school-ops/attendance`
- `POST /api/v1/school-ops/attendance`
- `GET /api/v1/school-ops/homework`
- `POST /api/v1/school-ops/homework`
- `GET /api/v1/school-ops/notices`
- `POST /api/v1/school-ops/notices`
- `GET /api/v1/school-ops/results`
- `POST /api/v1/school-ops/results`
- `GET /api/v1/school-ops/teacher-reports`
- `POST /api/v1/school-ops/teacher-reports`
- `GET /api/v1/school-ops/student-reports`
- `POST /api/v1/school-ops/student-reports`
- `GET /api/v1/school-ops/activities`
- `POST /api/v1/school-ops/activities`
- `GET /api/v1/school-ops/library`
- `POST /api/v1/school-ops/library`
- `GET /api/v1/school-ops/notes`
- `POST /api/v1/school-ops/notes`
- `GET /api/v1/school-ops/transport`
- `POST /api/v1/school-ops/transport`
- `GET /api/v1/school-ops/voice-notes`
- `POST /api/v1/school-ops/voice-notes`
- `GET /api/v1/school-ops/reminders`
- `POST /api/v1/school-ops/reminders`
- `POST /api/v1/school-ops/assignments/hod`
- `POST /api/v1/school-ops/assignments/teacher-subject`
- `POST /api/v1/school-ops/assignments/teacher-class`
- `POST /api/v1/school-ops/assignments/class-teacher`
- `POST /api/v1/school-ops/assignments/student-class`

When running through Docker, Nginx in the frontend container proxies `/api` to `api-gateway`.

### Current Screen Model

The frontend now has two clear views inside the same app:

- `Common Access`: public-facing request form, school status tracker, and one shared login entry for school users with inline first-time school-admin setup
- `Admin Portal`: login-gated internal queue and review screen used to process requests

Frontend session behavior:

- admin and school-user sessions auto-logout after a configurable inactivity window
- the timeout is controlled by `VITE_SESSION_TIMEOUT_MINUTES`
- the current implementation uses browser session state and local activity tracking

This is the intended product flow for the first onboarding slice.

### Gateway

The gateway lives in `services/api-gateway/`.

- [application.yml](../services/api-gateway/src/main/resources/application.yml): route definitions

Current routes:

- `/api/v1/onboarding/**` -> onboarding service
- `/api/v1/auth/**` -> auth service
- `/api/v1/school-ops/**` -> school operations service

If you add a new service later, add another route here.

### Onboarding Service

The onboarding backend lives in `services/school-onboarding-service/`.

Important files:

- [SchoolOnboardingController.java](../services/school-onboarding-service/src/main/java/com/sms/onboarding/api/SchoolOnboardingController.java): REST endpoints
- [SchoolOnboardingRequest.java](../services/school-onboarding-service/src/main/java/com/sms/onboarding/api/SchoolOnboardingRequest.java): request payload validation
- [SchoolStatusLookupResponse.java](../services/school-onboarding-service/src/main/java/com/sms/onboarding/api/SchoolStatusLookupResponse.java): school-facing status response
- [OnboardingReviewRequest.java](../services/school-onboarding-service/src/main/java/com/sms/onboarding/api/OnboardingReviewRequest.java): admin review action payload
- [SchoolOnboardingResponse.java](../services/school-onboarding-service/src/main/java/com/sms/onboarding/api/SchoolOnboardingResponse.java): response contract sent to UI
- [SchoolOnboardingService.java](../services/school-onboarding-service/src/main/java/com/sms/onboarding/service/SchoolOnboardingService.java): service layer
- [SchoolOnboardingJpaRepository.java](../services/school-onboarding-service/src/main/java/com/sms/onboarding/repository/SchoolOnboardingJpaRepository.java): Spring Data JPA repository
- [RequiredDocumentTemplateJpaRepository.java](../services/school-onboarding-service/src/main/java/com/sms/onboarding/repository/RequiredDocumentTemplateJpaRepository.java): startup document template lookup
- [SchoolOnboardingEntity.java](../services/school-onboarding-service/src/main/java/com/sms/onboarding/domain/SchoolOnboardingEntity.java): onboarding aggregate mapping
- [SchoolOnboardingDocumentEntity.java](../services/school-onboarding-service/src/main/java/com/sms/onboarding/domain/SchoolOnboardingDocumentEntity.java): required document row mapping
- [RequiredDocumentTemplateEntity.java](../services/school-onboarding-service/src/main/java/com/sms/onboarding/domain/RequiredDocumentTemplateEntity.java): day-zero document template mapping
- [ApiExceptionHandler.java](../services/school-onboarding-service/src/main/java/com/sms/onboarding/api/ApiExceptionHandler.java): problem-detail error responses
- [application.yml](../services/school-onboarding-service/src/main/resources/application.yml): datasource and startup config

Flow inside the service:

1. School submits the intake form from the school portal.
2. Controller validates the request and creates a new onboarding record.
3. The service loads required document templates inserted by day-zero SQL.
4. Spring Data JPA persists the onboarding aggregate and child document rows.
5. New records enter the queue with status `SUBMITTED`.
6. School can return to the school portal and check status using school code and admin email.
7. The school-facing tracker returns a sanitized public status message and does not expose internal admin approval notes or activation codes.
8. Admin opens the admin portal and selects a request from the queue.
9. Admin moves the request to `UNDER_REVIEW`, then either `APPROVED` or `REJECTED`.
10. On approval, the onboarding service provisions the tenant and school admin through auth service.
11. Reviewer name, comment, and review timestamp are stored on the onboarding record.
12. The platform admin uses the admin-only activation panel to copy, regenerate, or email the one-time activation code.
13. The school admin uses the activation code to set a password before first login.

### Auth Service

The auth backend lives in `services/auth-service/`.

Important files:

- [AuthController.java](../services/auth-service/src/main/java/com/sms/auth/api/AuthController.java): admin login, activation, school login, and internal provisioning endpoints
- [SchoolAuthService.java](../services/auth-service/src/main/java/com/sms/auth/service/SchoolAuthService.java): school and tenant-user login handling
- [AccountActivationService.java](../services/auth-service/src/main/java/com/sms/auth/service/AccountActivationService.java): activation code verification and password setup
- [SchoolProvisioningService.java](../services/auth-service/src/main/java/com/sms/auth/service/SchoolProvisioningService.java): tenant, school-admin, and tenant-user provisioning
- [AdminAuthService.java](../services/auth-service/src/main/java/com/sms/auth/service/AdminAuthService.java): credential verification
- [AdminAccountEntity.java](../services/auth-service/src/main/java/com/sms/auth/domain/AdminAccountEntity.java): admin account mapping
- [AdminAccountRepository.java](../services/auth-service/src/main/java/com/sms/auth/repository/AdminAccountRepository.java): admin lookup
- [TenantEntity.java](../services/auth-service/src/main/java/com/sms/auth/domain/TenantEntity.java): tenant identity mapping
- [SchoolAccountEntity.java](../services/auth-service/src/main/java/com/sms/auth/domain/SchoolAccountEntity.java): school-admin identity mapping
- [TenantUserAccountEntity.java](../services/auth-service/src/main/java/com/sms/auth/domain/TenantUserAccountEntity.java): principal/manager/teacher/staff/student identity mapping
- [AccountActivationTokenEntity.java](../services/auth-service/src/main/java/com/sms/auth/domain/AccountActivationTokenEntity.java): activation code mapping
- [04-identity-admin.sql](../infra/postgres/init/04-identity-admin.sql): seeded super admin startup data

Seeded startup admin:

- email: `superadmin@sms.local`
- role: `SUPER_ADMIN`

Provisioned school admin and school-user flow:

- school admin is created in `PENDING_ACTIVATION`
- the admin portal has a dedicated activation-delivery panel for the one-time code
- the school admin activates with `schoolCode + email + activationCode + newPassword`
- teachers, students, staff, principals, and managers are created by the school admin with direct login credentials
- later logins use one common entry with `schoolCode + email + password`
- the frontend routes users to the correct portal shell based on their authenticated role

### School Operations Service

The school-operations backend lives in `services/school-operations-service/`.

Important files:

- [SchoolOperationsController.java](../services/school-operations-service/src/main/java/com/sms/schoolops/api/SchoolOperationsController.java): REST endpoints for setup and mappings
- [SchoolOperationsDtos.java](../services/school-operations-service/src/main/java/com/sms/schoolops/api/SchoolOperationsDtos.java): request and response contracts
- [SchoolOperationsService.java](../services/school-operations-service/src/main/java/com/sms/schoolops/service/SchoolOperationsService.java): school-side business logic
- [05-schoolops-tables.sql](../infra/postgres/init/05-schoolops-tables.sql): schema bootstrap for departments, subjects, classes, users, and assignments
- [06-schoolops-extended-modules.sql](../infra/postgres/init/06-schoolops-extended-modules.sql): schema bootstrap for operational school modules

Current operations support:

- create departments
- create subjects
- create classes and sections
- create school users for principal, manager, teacher, staff, and student roles with direct login credentials
- create student admissions with guardian and previous-school details
- schedule timetable slots by class, subject, and teacher
- track fee dues and payment status
- mark daily attendance for any school role
- publish homework and notices
- store exam result history
- store monthly teacher biometric/performance reports
- store student monitoring reports
- store co-curricular activities
- store digital library resources
- store shared notes
- store transport routes
- store voice notes for parent communication
- store reminders for homework, fees, or general alerts
- assign HOD
- map teacher to subject
- map teacher to class
- assign class teacher
- enroll student into class
- fetch dashboard totals for school admin
- fetch teacher workspace data with live scheduling status
- fetch student workspace data with live scheduling status

### MCP Server

The MCP backend lives in `services/mcp-server/`.

Important files:

- [package.json](../services/mcp-server/package.json): MCP runtime dependencies
- [index.js](../services/mcp-server/src/index.js): stateless MCP HTTP transport, tools, and resources
- [Dockerfile](../services/mcp-server/Dockerfile): container image for local and cloud deployment

Current MCP coverage:

- `platform_onboarding_overview`: platform admin onboarding totals and approved-school stats
- `school_admin_dashboard`: school admin dashboard summary
- `teacher_workspace`: assigned classes and subjects for a teacher
- `student_workspace`: enrolled class, class teacher, and subject teachers for a student
- `ask_school_data`: deterministic text-question tool that routes a typed question to the right database-backed query without any LLM

Current MCP resources:

- `platform://onboarding/overview`
- `school://{schoolId}/dashboard`
- `teacher://{schoolId}/{email}/workspace`
- `student://{schoolId}/{email}/workspace`

HTTP helper endpoints exposed by the MCP service:

- `GET /health`
- `GET /insights/platform-overview`
- `POST /insights/ask`

Example ask payload:

```json
{
  "role": "student",
  "schoolId": "00000000-0000-0000-0000-000000000000",
  "email": "student@school.edu",
  "question": "Who is my class teacher?"
}
```

## Database Ownership

The onboarding service currently owns:

- schema: `onboarding`
- table: `school_onboarding`
- table: `school_onboarding_document`
- table: `required_document_template`

Bootstrap SQL:

- [01-create-schemas.sql](../infra/postgres/init/01-create-schemas.sql)
- [02-onboarding-tables.sql](../infra/postgres/init/02-onboarding-tables.sql)
- [03-onboarding-seed.sql](../infra/postgres/init/03-onboarding-seed.sql)

### When Changing Database Fields

If you add or rename onboarding fields, update these places together:

1. [SchoolOnboardingRequest.java](../services/school-onboarding-service/src/main/java/com/sms/onboarding/api/SchoolOnboardingRequest.java)
2. [SchoolOnboardingResponse.java](../services/school-onboarding-service/src/main/java/com/sms/onboarding/api/SchoolOnboardingResponse.java)
3. [SchoolOnboardingEntity.java](../services/school-onboarding-service/src/main/java/com/sms/onboarding/domain/SchoolOnboardingEntity.java)
4. [SchoolOnboardingDocumentEntity.java](../services/school-onboarding-service/src/main/java/com/sms/onboarding/domain/SchoolOnboardingDocumentEntity.java)
5. [SchoolOnboardingService.java](../services/school-onboarding-service/src/main/java/com/sms/onboarding/service/SchoolOnboardingService.java)
6. [02-onboarding-tables.sql](../infra/postgres/init/02-onboarding-tables.sql)
7. [03-onboarding-seed.sql](../infra/postgres/init/03-onboarding-seed.sql)
8. [App.tsx](../frontend/src/App.tsx) if the field is shown or submitted in UI

## How To Change The UI

For quick UI work:

- change layout or components in [App.tsx](../frontend/src/App.tsx)
- change the look and feel in [styles.css](../frontend/src/styles.css)

If you want to split the UI into reusable components later, a good next refactor is:

- `src/components/OnboardingForm.tsx`
- `src/components/OnboardingList.tsx`
- `src/components/OnboardingDetails.tsx`

## How To Change Backend Behavior

Common changes and where to make them:

- validation rules: [SchoolOnboardingRequest.java](../services/school-onboarding-service/src/main/java/com/sms/onboarding/api/SchoolOnboardingRequest.java)
- endpoint paths: [SchoolOnboardingController.java](../services/school-onboarding-service/src/main/java/com/sms/onboarding/api/SchoolOnboardingController.java)
- business rules: [SchoolOnboardingService.java](../services/school-onboarding-service/src/main/java/com/sms/onboarding/service/SchoolOnboardingService.java)
- entity mapping and persistence: [SchoolOnboardingEntity.java](../services/school-onboarding-service/src/main/java/com/sms/onboarding/domain/SchoolOnboardingEntity.java)
- JPA repository layer: [SchoolOnboardingJpaRepository.java](../services/school-onboarding-service/src/main/java/com/sms/onboarding/repository/SchoolOnboardingJpaRepository.java)
- startup SQL and seed data: [02-onboarding-tables.sql](../infra/postgres/init/02-onboarding-tables.sql) and [03-onboarding-seed.sql](../infra/postgres/init/03-onboarding-seed.sql)
- error responses: [ApiExceptionHandler.java](../services/school-onboarding-service/src/main/java/com/sms/onboarding/api/ApiExceptionHandler.java)
- gateway routing: [application.yml](../services/api-gateway/src/main/resources/application.yml)
- school/admin UI flow: [App.tsx](../frontend/src/App.tsx)

## Validation Strategy

Validation is split between local Gradle execution, frontend builds, and Docker-based startup.

Validation targets:

- backend services run Gradle tests locally or during image build
- frontend image runs a production build during image creation
- full stack can be started on local `kind` with Helm + Argo CD

## Local kind behavior

The local kind stack uses in-cluster PostgreSQL with a PVC. If you delete the `sms` namespace, you reset the environment state.

## Recommended Next Backend Steps

1. Replace the day-zero SQL bootstrap with Flyway migrations once the schema stabilizes.
2. Add JWT-based backend authorization so admin-only and tenant-only APIs are protected server-side.
3. Add document metadata status and upload tracking on top of the seeded template table.
4. Split the frontend into dedicated school, student, and platform-admin shells once workflows grow.
5. Add integration tests against Postgres containers.
