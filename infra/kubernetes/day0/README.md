# Day 0 Bootstrap

Single entrypoint for initial setup.

## What it does

- detects Windows or Linux
- checks and installs prerequisites where possible
- creates the local cluster
- deploys the full app
- installs monitoring
- installs the External Secrets Operator
- runs the first smoke test

## Windows

```powershell
powershell -ExecutionPolicy Bypass -File .\infra\kubernetes\day0\day0-bootstrap.ps1
```

Register in Startup folder:

```powershell
powershell -ExecutionPolicy Bypass -File .\infra\kubernetes\day0\day0-bootstrap.ps1 -RegisterStartup -SkipSmokeTest
```

## Ubuntu

Run the same script in PowerShell 7:

```bash
pwsh ./infra/kubernetes/day0/day0-bootstrap.ps1
```

## Notes

- On Windows, Docker Desktop may need to be installed and launched once before the rest of the bootstrap can finish.
- On Linux, the script installs Docker if needed.
- The External Secrets Operator is installed by default, but fake vault examples are not applied automatically.
