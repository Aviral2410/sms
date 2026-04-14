# Flyway Migration Guide

Flyway is now the recommended open source migration path for this repo.

## Why

The current application has a mix of:
- bootstrap SQL
- repair SQL
- runtime schema update behavior in some services

That is fine during early development, but it is not a strong long-term production posture.

## New repo location

- `infra/flyway/`

## What to do from now on

1. Add new schema changes as Flyway migrations.
2. Keep each schema in its own folder.
3. Use the provided Flyway scripts locally or in CI.
4. Gradually migrate away from `ddl-auto: update` in production.

## Example command

### Windows

```powershell
powershell -ExecutionPolicy Bypass -File .\infra\flyway\windows\run-flyway.ps1 -Schema identity -Locations filesystem:/flyway/sql/identity
```

### Ubuntu

```bash
bash ./infra/flyway/linux/run-flyway.sh identity filesystem:/flyway/sql/identity
```

## Target end state

Each service-owned schema should eventually have versioned migrations committed in Git and applied automatically as part of deployment.
