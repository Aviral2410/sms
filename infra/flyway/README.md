# Flyway

This repo now includes a Flyway-based migration workspace so schema changes can be versioned with an open source tool instead of ad hoc SQL jobs.

## Why Flyway here

- open source and simple
- works well with PostgreSQL
- easy to run from Docker, CI, or Kubernetes Jobs
- gives a clear migration history table in the database

## Current recommendation

Short term:
- use Flyway for new schema changes from now on
- keep the existing init SQL for first-time bootstrap only
- stop adding new manual repair SQL unless it is a one-off recovery step

Long term:
- move service-owned schemas into dedicated Flyway locations
- remove runtime `ddl-auto: update` from production paths

## Layout

- `sql/onboarding/`
- `sql/identity/`
- `sql/schoolops/`
- `sql/subscription/`
- `sql/finance/`
- `sql/communication/`

## Run locally with Docker

Windows:

```powershell
powershell -ExecutionPolicy Bypass -File .\infra\flyway\windows\run-flyway.ps1 -Schema identity -Locations filesystem:/flyway/sql/identity
```

Ubuntu:

```bash
./infra/flyway/linux/run-flyway.sh identity filesystem:/flyway/sql/identity
```

## Important note

The Flyway workspace is the forward path. It does not automatically convert every existing bootstrap SQL file into versioned migrations for you.

That conversion should happen incrementally and carefully, schema by schema.
