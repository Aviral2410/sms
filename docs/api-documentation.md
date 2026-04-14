# API Documentation

Swagger / OpenAPI is enabled directly on each Spring service.

## Local service docs

- Gateway entrypoint: `http://localhost:8080`
- School onboarding: `http://localhost:8081/swagger-ui.html`
- Auth: `http://localhost:8082/swagger-ui.html`
- School operations: `http://localhost:8083/swagger-ui.html`
- Finance: `http://localhost:8085/swagger-ui.html`
- Subscription: `http://localhost:8086/swagger-ui.html`
- Communication: `http://localhost:8089/swagger-ui.html`

## Raw OpenAPI documents

- School onboarding: `http://localhost:8081/v3/api-docs`
- Auth: `http://localhost:8082/v3/api-docs`
- School operations: `http://localhost:8083/v3/api-docs`
- Finance: `http://localhost:8085/v3/api-docs`
- Subscription: `http://localhost:8086/v3/api-docs`
- Communication: `http://localhost:8089/v3/api-docs`

## Notes

- Platform-managed third-party configuration now lives under `/api/v1/platform/configs`.
- Internal runtime config is exposed to trusted backend services through `/api/v1/platform/configs/runtime/{serviceName}`.
- Gateway rate limiting now prefers Redis-backed counters and falls back to local in-memory counters if Redis is unavailable.
