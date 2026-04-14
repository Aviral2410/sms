# CI/CD Guide

This repo now includes a Helm-oriented CI/CD skeleton under `.github/workflows`.

## Workflows included

- `ci.yml`
  - builds every service image
  - validates `docker-compose.yml`
  - lints and renders the Helm chart

- `publish-images.yml`
  - pushes all images to GHCR
  - supports manual tag input

- `deploy-kubernetes.yml`
  - deploys the Helm chart
  - updates all service images to one release tag

- `rollout-single-service.yml`
  - updates one service image through Helm and rolls it out

## Secrets needed in GitHub

At minimum:
- `KUBE_CONFIG_DATA`
  - base64-encoded kubeconfig for the target cluster

For GHCR with the built-in token, the publish workflow already uses `GITHUB_TOKEN`.

## Typical pipeline shape

1. Developer pushes branch or opens PR
2. `ci.yml` validates image builds and Helm rendering
3. Merge to `main`
4. `publish-images.yml` pushes tagged images
5. `deploy-kubernetes.yml` upgrades the target Helm release
6. `rollout-single-service.yml` is available for hotfix or canary-style single-service updates

## Recommendation

For serious production, pair these workflows with:
- branch protection
- environment approvals
- separate staging and production kubeconfigs
- image signing if your org requires it
- vulnerability scanning
