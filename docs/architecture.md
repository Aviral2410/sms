# Architecture Notes

## Starting Direction

We are intentionally starting with a lean microservice foundation instead of a fully distributed platform on day one.

### Principles

- one bounded context per service
- independently deployable services
- shared infra kept minimal in the first phase
- synchronous HTTP first, eventing later when justified
- tenant awareness designed in early

## Initial Services

### API Gateway

- single entry point for the frontend
- request routing
- future authentication and rate limiting hooks

### School Onboarding Service

- school registration
- primary admin registration payload
- onboarding lifecycle state
- document checklist metadata

### Auth Service

- user identity domain placeholder
- authentication flows later
- tenant-scoped access control later

## Data Ownership

Each service should own its schema and migration lifecycle. For local simplicity, all schemas live in the same PostgreSQL instance for now.

### Suggested schemas

- `onboarding`
- `identity`

## Cross-Cutting Concerns To Add Later

- Flyway migrations
- OpenAPI documentation
- centralized configuration
- structured logging
- metrics and tracing
- async workflows with Kafka or RabbitMQ
