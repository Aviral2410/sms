# Local Prerequisites

This document lists what additionally needs to be installed on an operator or developer machine before running the Helm-based Kubernetes deployment in this repo.

## Minimum required on Windows or Ubuntu

1. Docker or another compatible container runtime if you want local image builds or a local `kind` cluster
2. Git
3. Enough free disk space
4. A shell:
   - Windows PowerShell or PowerShell 7 on Windows
   - bash on Ubuntu

## Kubernetes tools

This repo includes installers for:
- `kubectl`
- `kind`
- `helm`

Windows installer:

```powershell
powershell -ExecutionPolicy Bypass -File .\infra\kubernetes\windows\install-k8s-tools-d-drive.ps1
```

Ubuntu installer:

```bash
bash ./infra/kubernetes/linux/install-k8s-tools.sh
```

## Do I need Docker?

For remote cluster deployment only: no, not if images are already built in CI and stored in a registry.

For local cluster work with `kind`: yes.

## Do I need Kubernetes installed locally?

For a remote cluster: no.

For local testing: use `kind`.

## Primary runtime path

For staging or production-style operation, the main client-side tools you need are:
- `kubectl`
- `helm`
- access to a container registry
- kubeconfig for the target cluster

The app itself should be deployed through:
- [deploy.ps1](D:\sms-1\infra\helm\scripts\windows\deploy.ps1)
- [deploy.sh](D:\sms-1\infra\helm\scripts\linux\deploy.sh)

## Single-click local kind + Helm deployment (Windows)

If you want a portable “one command” local setup (create/use `kind`, build images, create secrets, then Helm deploy), run:

```powershell
powershell -ExecutionPolicy Bypass -File .\infra\helm\scripts\windows\deploy-local-kind.ps1 -EnvFile .env
```

It deploys the chart using `infra\helm\sms-platform\values-local-kind.yaml` and exposes:
- Frontend: `http://localhost:30080`
- API Gateway: `http://localhost:30000`
- MCP Server health: `http://localhost:30084/health`

## Day-0 bootstrap (Vault + ESO + Argo CD)

No paid subscriptions are required. These components are installed from public Helm chart repositories (internet access required).

```powershell
powershell -ExecutionPolicy Bypass -File .\infra\kubernetes\windows\day0-bootstrap.ps1 `
  -InstallTools `
  -InstallVaultAndEso `
  -InstallArgoCd `
  -InstallMonitoring
```

For GitOps deployment via Argo CD (auto-fills Argo repo URL from `git remote origin`):

```powershell
powershell -ExecutionPolicy Bypass -File .\infra\kubernetes\windows\day0-bootstrap.ps1 -DeploySmsViaArgoCd
```

## D drive note

Everything this repo creates directly on Windows is designed to default to `D:`.

Recommended Windows layout:
- tools: `D:\sms-k8s\tools`
- kubeconfig: `D:\sms-k8s\.kube\config`
- repo: `D:\sms-1`

Container runtime internals may still use their own configured storage location unless you change that in the runtime settings.

## Local school subdomain testing

The frontend now supports school portal routing on wildcard dev hosts.

Recommended local host patterns:
- `http://localhost:3000` for the platform root
- `http://bmps.lvh.me:3000` for a school portal
- `http://demo.localtest.me:3000` as an alternative wildcard dev host

Why `lvh.me` or `localtest.me`:
- they resolve wildcard subdomains to localhost without editing your hosts file
- they let us exercise the same school-subdomain routing logic used in production

If you still want to force a school portal on plain localhost, the frontend also supports:
- `http://localhost:3000/?schoolCode=BMPS`
