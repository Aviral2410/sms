# SQL Migration Workflow

This repo now includes a short-term Kubernetes-safe SQL migration pattern.

Use it when:
- you need a controlled schema/data change before full Flyway adoption
- you want migrations committed to the repo and applied as jobs
- you need an auditable step during cutover or recovery

## Short-term process

1. Create a versioned SQL file in the repo.
2. Create a ConfigMap from that SQL.
3. Apply a copy of `manual-sql-migration-job.example.yaml` with a unique job name.
4. Wait for completion.
5. Record the migration in your release notes.

## Recommended file naming

Store manual SQL under `infra/postgres/migrations/` using a date prefix, for example:
- `2026-04-08-add-alert-indexes.sql`
- `2026-04-10-backfill-subscription-flags.sql`

## Example commands

```powershell
kubectl -n sms create configmap sql-migration-001 `
  --from-file=migration.sql=infra/postgres/migrations/2026-04-08-example.sql `
  --dry-run=client -o yaml | kubectl apply -f -

kubectl apply -f infra/kubernetes/operations/migrations/manual-sql-migration-job.example.yaml
kubectl wait -n sms --for=condition=complete job/manual-sql-migration-001 --timeout=300s
kubectl logs -n sms job/manual-sql-migration-001
```

## Production recommendation

This job template is a safe bridge, not the end state.

For the 100-day production path, move each service-owned schema to Flyway or Liquibase so that:
- migrations ship with the service
- rollouts are repeatable
- rollback planning is explicit
- schema drift is reduced

Until then, keep every manual SQL migration in the repo and treat it like application code.
