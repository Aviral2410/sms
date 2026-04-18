# Deploy to EC2 (Kubernetes on the instance) + GitOps + Vault

This repo is designed to run on Kubernetes (kind locally, or k3s/microk8s/self-managed on EC2).

## Target architecture

- **Ingress** → `Service/frontend`, `Service/api-gateway`, `Service/mcp-server`
- **Internal routing** between services via **Kubernetes Service DNS**
- **Config/secrets** stored in Vault (`secret/sms/platform`, `secret/sms/ghcr`)
- **External Secrets Operator** syncs Vault → `Secret/sms-secrets` + `Secret/ghcr-pull-secret`
- **GitHub Actions** builds/pushes images and bumps image tags in:
  - `infra/helm/sms-platform/values-gitops-ec2.yaml`
- **Argo CD** auto-sync deploys the chart when Git changes

## What you must edit (one-time)

1) Helm values for your public DNS:
- `infra/helm/sms-platform/values-gitops-ec2.yaml` (`networking.ingress.*`)

2) Argo CD app manifest:
- `infra/kubernetes/operations/argocd/apps/sms-platform-ec2.yaml` (`spec.source.repoURL`, optionally `targetRevision`)

3) Vault keys (change anytime, centralized):
- `secret/sms/platform` (see `docs/keys-and-urls.md`)

## High-level bootstrap steps (EC2)

1) Create a Kubernetes cluster on the instance (commonly k3s).
2) Install an Ingress controller (class must match `values-gitops-ec2.yaml`, e.g. `nginx` or `traefik`).
3) Install External Secrets Operator (ESO).
4) Install Vault (or connect to an existing Vault reachable from the cluster).
5) Seed Vault with `sms/platform` + `sms/ghcr`:
   - Example dev seeder: `infra/kubernetes/windows/seed-vault.ps1`
6) Install Argo CD and apply:
   - `infra/kubernetes/operations/argocd/apps/sms-platform-ec2.yaml`

## Changing URLs tomorrow (Vault-only)

1) Update keys in Vault under `secret/sms/platform` (example: `AUTH_SERVICE_URL`).
2) ESO refreshes `Secret/sms-secrets` (default refresh interval in chart: `1m`).
3) Pods need a restart to pick up new env values:
   - Recommended: install **Stakater Reloader** and keep `reloader.stakater.com/auto: "true"` enabled in `values-gitops-ec2.yaml`.
