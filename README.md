# School Management System

Monorepo for a school management platform with a microservice-oriented backend, a clean admin UI, and local Docker-based development.

## Stack

- Java 21
- Spring Boot 3
- Gradle
- PostgreSQL 16
- React + Vite + TypeScript (Premium Design System)
- Docker Compose
- Google Gemini 1.5 Flash (AI Intelligence)

## Repository Layout

```text
.
├── docs
├── frontend
├── infra
└── services
    ├── api-gateway
    ├── auth-service
    ├── mcp-server
    ├── school-onboarding-service
    └── school-operations-service
```

## Services

- `school-onboarding-service`: school registration, onboarding workflow state, approval, and tenant activation trigger
- `auth-service`: platform admin login, school account activation, tenant-aware login, and internal user provisioning
- `mcp-server`: stateless MCP server exposing platform, school-admin, teacher, and student read models over HTTP transport
- `school-operations-service`: school admin workspace for academic setup, attendance, results, etc.
- `finance-service`: handling fee structures, multi-gateway payments (Razorpay/Stripe), and notifications.
- `subscription-service`: platform-level school subscription and plan management.
- `api-gateway`: centralized edge entry point routing all microservice traffic.

## Local Development

### 1. Start infrastructure

```bash
docker compose up -d postgres
```

### 2. Run backend services

In separate terminals:

```bash
cd services/school-onboarding-service && gradle bootRun
cd services/auth-service && gradle bootRun
cd services/school-operations-service && gradle bootRun
cd services/api-gateway && gradle bootRun
```

### 3. Run frontend

```bash
cd frontend
npm install
npm run dev
```

### Full stack with Docker

```bash
docker compose up --build
```

Main app URL:

- `http://localhost:3000`

Main API URL through gateway:

- `http://localhost:8080/api/v1/onboarding/schools`

School status lookup URL through gateway:

- `http://localhost:8080/api/v1/onboarding/schools/status?schoolCode=SPS-001&adminEmail=admin@school.edu`

Admin login API:

- `http://localhost:8080/api/v1/auth/admin/login`

Auth notes:

- For protected routes, send `Authorization: Bearer <jwt>`. The API gateway validates the JWT and injects `X-User-Role`, `X-Tenant-ID`, and `X-School-ID` for downstream services.
- Only `POST /api/v1/onboarding/schools`, `GET /api/v1/onboarding/schools/status`, and `GET /api/v1/onboarding/schools/public/{schoolCode}` are public onboarding endpoints. Admin actions like review/approve/delete require a Platform Admin token.

School activation API:

- `http://localhost:8080/api/v1/auth/school/activate`

School login API:

- `http://localhost:8080/api/v1/auth/school/login`

School operations APIs:

- `http://localhost:8080/api/v1/school-ops/departments`
- `http://localhost:8080/api/v1/school-ops/subjects`
- `http://localhost:8080/api/v1/school-ops/classes`
- `http://localhost:8080/api/v1/school-ops/users`
- `http://localhost:8080/api/v1/school-ops/dashboard`
- `http://localhost:8080/api/v1/school-ops/admissions`
- `http://localhost:8080/api/v1/school-ops/timetable`
- `http://localhost:8080/api/v1/school-ops/fees`
- `http://localhost:8080/api/v1/school-ops/attendance`
- `http://localhost:8080/api/v1/school-ops/homework`
- `http://localhost:8080/api/v1/school-ops/notices`
- `http://localhost:8080/api/v1/school-ops/results`
- `http://localhost:8080/api/v1/school-ops/teacher-reports`
- `http://localhost:8080/api/v1/school-ops/student-reports`
- `http://localhost:8080/api/v1/school-ops/activities`
- `http://localhost:8080/api/v1/school-ops/library`
- `http://localhost:8080/api/v1/school-ops/notes`
- `http://localhost:8080/api/v1/school-ops/transport`
- `http://localhost:8080/api/v1/school-ops/voice-notes`
- `http://localhost:8080/api/v1/school-ops/reminders`

MCP server URLs:

- Health: `http://localhost:8084/health`
- MCP transport endpoint: `http://localhost:8084/mcp`
- MCP ask endpoint: `http://localhost:8084/insights/ask`

Frontend session timeout:

- `VITE_SESSION_TIMEOUT_MINUTES` controls auto-logout for admin and school-user sessions
- default example value: `30`

Notes:

- `docker compose up --build` is the first command to use in a fresh folder.
- `docker start` only works after the containers have already been created once.
- **Data Persistence**: PostgreSQL data is stored in the `postgres_data` volume.
- **Database Cleanup**: To start with a completely fresh database, run `docker compose down -v` to remove persistent volumes.
- Startup SQL seed scripts run automatically on every fresh volume creation.

## Ports

- `3000`: Frontend (React/Vite)
- `8080`: API Gateway (Edge)
- `8081`: School Onboarding Service
- `8082`: Auth Service (Identity)
- `8083`: School Operations Service
- `8084`: MCP AI Server (Gemini Powered)
- `8085`: Finance Service (Billing/Notifications)
- `8086`: Subscription Service
- `5432`: PostgreSQL (Centralized DB)

## Third-Party Configuration

The platform is integrated with production-grade providers for consistency and cost-effectiveness. Configuration is managed in the `identity.platform_config` table:

- **Notifications (Twilio)**: Unified API for SMS and WhatsApp.
- **Email (SendGrid)**: High-deliverability transactional mail.
- **AI (Gemini 1.5 Flash)**: High-performance institutional analytics and accessibility.
- **TTS (Google Cloud)**: Multi-language parent notification accessibility.

To seed/update keys:
1. Edit `infra/postgres/init/10-platform-config.sql`.
2. Or use the Platform Admin dashboard (internal).

## Institutional Intelligence

- **On-Demand AI**: AI features like Quiz generation and analytical insights are strictly "On-Demand" and must be triggered by teachers/admins to ensure privacy and control.
- **Context Awareness**: The AI is aware of timetables, syllabus depth, and historical teacher performance metrics.
- **Enhanced Aesthetics**: The platform uses a high-performance glassmorphism design system with fluid micro-animations and a vibrant dark-mode palette.

## First Product Slice

The current slice covers school onboarding plus the first school-operations foundation:

- register school profile
- review and approve or reject onboarding requests
- activate only the first school admin account with an activation code
- sign in through one tenant-aware common login for school users
- create school users for principals, managers, teachers, staff, and students
- create departments, subjects, and classes
- create student admissions and guardian-linked intake records
- schedule timetable periods by class, subject, and teacher
- track fees, payment state, and due dates
- mark daily attendance for staff or students
- publish homework and school notices
- store past results and monthly teacher or student monitoring reports
- prepare co-curricular activities, digital library entries, note sharing, voice notes, transport records, and reminders
- assign HOD, teacher-subject, teacher-class, class-teacher, and student-class mappings
- expose structured role data through MCP for platform admin, school admin, teacher, and student use cases
- ask deterministic text questions through MCP without using an LLM, for example school stats, class teacher lookup, or teacher schedule lookup

## Next Recommended Steps

1. Add Flyway migrations for each service-owned schema.
2. Introduce shared API contracts or OpenAPI specs.
3. Add JWT authentication and role-based access.
4. Add Redis and async messaging once workflow complexity grows.
5. Add CI for backend and frontend validation.

## Developer Guides

- [Architecture Notes](/home/aviral/sms/docs/architecture.md)
- [Onboarding Flow Guide](/home/aviral/sms/docs/onboarding-flow.md)

## Login Notes

- Platform admin login exists for internal onboarding review
- Approved school admins activate their account once from the common login area before first login
- School-created users receive direct login credentials from the school admin and use the same common login page
- Teachers, staff, managers, principals, and students all use the same common login entry
- The frontend no longer displays seeded credentials directly
