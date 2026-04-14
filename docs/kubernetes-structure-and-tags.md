# Kubernetes Structure and Image Tags

This document explains how the deployment model is organized now and how image tags are expected to work.

## Concept chain

App -> Container Image -> Pod -> Service -> Ingress -> Domain -> Internet

## In this repo now

- App code lives under `services/` and `frontend/`
- Container images are built from each service Dockerfile
- Pods are created by Helm-rendered `Deployment` or `StatefulSet` resources
- Services are created by Helm-rendered `Service` resources
- Ingress is created by the Helm chart when enabled
- Domain and Internet exposure come through ingress controller, DNS, and TLS

## Primary deployment structure

The main production structure is now:

```text
infra/helm/
  sms-platform/
    Chart.yaml
    values.yaml
    values-staging.yaml
    values-production.yaml
    templates/
      services/
      platform/
      jobs/
      networking/
      secrets/
```

## Where to look for what

- chart entrypoint: [Chart.yaml](D:\sms-1\infra\helm\sms-platform\Chart.yaml)
- shared values: [values.yaml](D:\sms-1\infra\helm\sms-platform\values.yaml)
- production values: [values-production.yaml](D:\sms-1\infra\helm\sms-platform\values-production.yaml)
- per-service deployments and services: `infra/helm/sms-platform/templates/services/`
- postgres and emqx: `infra/helm/sms-platform/templates/platform/`
- db repair job: `infra/helm/sms-platform/templates/jobs/db-repair/job.yaml`
- ingress: `infra/helm/sms-platform/templates/networking/ingress.yaml`

## If I change the tag of one service

There are two different cases.

### Remote cluster or real staging/production

The image normally must be in a registry the cluster can reach.

That registry can be:
- Docker Hub
- GHCR
- ECR
- ACR
- GCR
- any internal registry

Flow:
1. build the image
2. push it to the registry
3. update only that Helm value
4. run Helm upgrade

Example:

```powershell
docker build -t ghcr.io/your-org/sms-api-gateway:2026-04-08.1 -f services/api-gateway/Dockerfile .
docker push ghcr.io/your-org/sms-api-gateway:2026-04-08.1
powershell -ExecutionPolicy Bypass -File .\infra\helm\scripts\windows\set-service-image-tag.ps1 `
  -Service api-gateway `
  -ImageRepository ghcr.io/your-org/sms-api-gateway `
  -Tag 2026-04-08.1
```

### Local kind cluster

You do not need Docker Hub or another external registry if the image is built locally and loaded into `kind`.

Flow:
1. build the image locally
2. load it into `kind`
3. update only that service through Helm

Example:

```powershell
docker build -t sms-api-gateway:local -f services/api-gateway/Dockerfile .
D:\sms-k8s\tools\bin\kind.exe load docker-image sms-api-gateway:local --name sms-local
powershell -ExecutionPolicy Bypass -File .\infra\helm\scripts\windows\set-service-image-tag.ps1 `
  -Service api-gateway `
  -ImageRepository sms-api-gateway `
  -Tag local
```

## Current Helm usage

Helm is now used for:
- the application stack
- monitoring add-ons
- External Secrets Operator and other operator-grade add-ons

The raw Kubernetes YAML under `infra/kubernetes/` is no longer the primary app deployment path.

## Tag management options

Recommended approach:
1. CI builds and pushes service images
2. Helm release consumes those tags
3. hotfixes or canaries update one service value and roll forward with Helm

That keeps rollout history, release state, and image versions aligned in one place.
