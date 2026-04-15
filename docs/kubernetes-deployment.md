# Kubernetes Deployment Guide

This repo is now Helm-first for application deployment.

The production deployment source of truth is:
- [sms-platform chart](D:\sms-1\infra\helm\sms-platform)

The `infra/kubernetes/` raw manifests remain in the repo as reference and bootstrap material, but the intended operating path is Helm for the app and Helm for cluster add-ons.

## Direct answers

### Do we need Helm?

Yes.

For this repo, Helm is now the primary deployment mechanism for:
- the full application stack
- ingress
- PostgreSQL bootstrap
- EMQX
- rollout updates by image tag

Helm is also used for cluster add-ons such as monitoring and External Secrets Operator.

### Do we have separate deployments for all services?

Yes.

The chart deploys each workload separately:
- `frontend`
- `api-gateway`
- `auth-service`
- `school-onboarding-service`
- `school-operations-service`
- `communication-service`
- `finance-service`
- `subscription-service`
- `mcp-server`
- `postgres`
- `emqx`

That means a single service image tag can be changed independently without rebuilding the whole release definition.

### Is Docker still necessary?

For a production or staging cluster: not necessarily.

If CI builds and pushes images to a registry, operators only need:
- `kubectl`
- `helm`
- kubeconfig access

Docker is still needed when you want to:
- build images locally
- run a local `kind` cluster
- run Docker-based local migration helpers

### Do I need to install Kubernetes on Windows?

Not for a remote cluster.

For a managed Kubernetes cluster, Windows only needs client tools:
- `kubectl`
- `helm`

For a local cluster, use `kind` rather than a heavyweight standalone Kubernetes install.

## Primary deployment commands

### Windows

Deploy or upgrade the full platform:

```powershell
powershell -ExecutionPolicy Bypass -File .\infra\helm\scripts\windows\deploy.ps1 `
  -ReleaseName sms-platform `
  -Namespace sms `
  -ValuesFile infra\helm\sms-platform\values-production.yaml `
  -Registry ghcr.io/your-org
```

Change one service image tag:

```powershell
powershell -ExecutionPolicy Bypass -File .\infra\helm\scripts\windows\set-service-image-tag.ps1 `
  -Service api-gateway `
  -Tag 2026-04-08.1 `
  -Registry ghcr.io/your-org
```

Change one service repository and tag:

```powershell
powershell -ExecutionPolicy Bypass -File .\infra\helm\scripts\windows\set-service-image-tag.ps1 `
  -Service api-gateway `
  -ImageRepository ghcr.io/your-org/sms-api-gateway `
  -Tag 2026-04-08.1
```

### Ubuntu

Deploy or upgrade the full platform:

```bash
bash ./infra/helm/scripts/linux/deploy.sh sms-platform sms infra/helm/sms-platform/values-production.yaml ghcr.io/your-org
```

Change one service image tag:

```bash
bash ./infra/helm/scripts/linux/set-service-image-tag.sh api-gateway 2026-04-08.1 "" ghcr.io/your-org
```

## If I want to build just one image

Build it, push it to a registry the cluster can reach, then change only that service value.

Example:

```powershell
docker build -t ghcr.io/your-org/sms-api-gateway:2026-04-08.1 -f services/api-gateway/Dockerfile .
docker push ghcr.io/your-org/sms-api-gateway:2026-04-08.1
powershell -ExecutionPolicy Bypass -File .\infra\helm\scripts\windows\set-service-image-tag.ps1 `
  -Service api-gateway `
  -ImageRepository ghcr.io/your-org/sms-api-gateway `
  -Tag 2026-04-08.1
```

For local `kind`, you can still build locally and load the image into the cluster instead of pushing to a registry.

## Local parallel builds

The local `kind` deployment helpers now support parallel image builds.

Windows:

```powershell
powershell -ExecutionPolicy Bypass -File .\infra\kubernetes\windows\deploy-local.ps1 -MaxParallel 4
```

Ubuntu or WSL:

```bash
MAX_PARALLEL=4 bash ./infra/kubernetes/linux/deploy-local.sh sms-local
```

Behavior:
- image builds run in parallel
- `kind load docker-image` still runs one image at a time for stability
- if one build fails, the deployment stops before the Kubernetes apply step
- reruns still invoke Docker builds, but unchanged layers should come from Docker cache

## Production characteristics already in the chart

The Helm chart includes:
- per-service `Deployment`
- per-service `Service`
- optional per-service `HorizontalPodAutoscaler`
- optional per-service `PodDisruptionBudget`
- `Ingress`
- PostgreSQL `StatefulSet`
- EMQX `Deployment`
- DB repair `Job`
- configurable secret source through `global.secrets.existingSecret`
- resource requests and limits
- atomic Helm upgrades with wait and timeout in the helper scripts

## High availability

The chart is production-oriented for stateless workloads:
- multiple replicas for key services
- HPAs for the busiest services
- PDBs for protected rollouts and node maintenance

Important note:
- PostgreSQL and EMQX are still single-instance inside this app chart
- for real production HA, prefer managed PostgreSQL and either managed or clustered EMQX

So the chart gives the app production structure, while data-plane HA should usually come from managed infrastructure.

## Monitoring

Monitoring remains under:
- `infra/kubernetes/operations/monitoring/`

Recommended install path:
- install `kube-prometheus-stack` with Helm
- apply the repo's alerting and rule customizations

## Secrets and key vault pattern

Production secret flow should be:
1. external vault
2. External Secrets Operator
3. Kubernetes secret materialized into the namespace
4. chart points to that secret through `global.secrets.existingSecret`

Examples live under:
- `infra/kubernetes/operations/secrets/`
- [secrets-and-key-vault.md](D:\sms-1\docs\secrets-and-key-vault.md)

## Migrations and recovery

This repo also contains:
- Flyway scaffolding under `infra/flyway/`
- backup and restore assets under `infra/kubernetes/operations/backup/`
- production operations notes under [production-kubernetes-operations.md](D:\sms-1\docs\production-kubernetes-operations.md)

## Recommended operating model

For a serious deployment, use:
1. managed Kubernetes
2. GHCR, ACR, ECR, or another reachable registry
3. Helm chart from this repo as the app release definition
4. External Secrets Operator for secret sync
5. monitoring stack with alerting
6. managed HA database if possible
