# Production Kubernetes Operations

This document focuses on what needs to be true if this platform is going toward production over the next 100 days.

## Non-negotiables now represented in the repo

1. migration path with Flyway workspace and Kubernetes migration templates
2. disaster recovery scaffolding with backup and restore examples
3. cluster health monitoring stack and alert rules
4. secrets-management path using External Secrets Operator and Azure Key Vault examples
5. CI/CD workflow skeleton for build, publish, deploy, and single-service rollout

## What is production-ready in principle

The repo now has the structure and operational assets for:
- Kubernetes deployment
- local and remote cluster workflows
- HA-oriented stateless scaling
- backup and restore process templates
- monitoring install and alert rules
- key-vault style secret management

## What still needs environment-specific completion

These are intentionally left as environment-specific decisions:
- the real Kubernetes cluster
- DNS records and TLS certificates
- the real container registry naming convention
- the real kubeconfig secret in CI
- managed PostgreSQL or clustered database choice
- production EMQX topology
- alert delivery destinations
- the final key vault identity wiring

## Production advice

### Database

Use managed PostgreSQL if you can.

### Messaging

Use clustered or managed EMQX if messaging is mission-critical.

### HA

Use `infra/kubernetes/overlays/prod-ha/` as the starting point for stateless services.

### Secrets

Move from plain Kubernetes Secrets to External Secrets plus a vault-backed store.

### Migrations

Use Flyway for all new schema changes from now on.

### CI/CD

Promote images through environments instead of rebuilding them differently in each environment.

## Restore drill recommendation

Before calling the system production-ready, run this routine:
- take a backup
- restore it to a non-production environment
- verify login, gateway routing, and at least one workflow from each critical domain
- record timing and owners

This should become a repeating operational drill, not a one-time exercise.
