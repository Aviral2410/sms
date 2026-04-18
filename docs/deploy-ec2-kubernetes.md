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

1) Argo CD app manifest:
- Copy `infra/kubernetes/operations/argocd/apps/sms-platform-ec2.yaml` and fill:
  - `spec.source.repoURL`
  - `spec.source.targetRevision`
  - `spec.source.helm.parameters[*]` (Ingress hosts)
- Example for the current EC2: `infra/kubernetes/operations/argocd/apps/sms-platform-ec2-3.109.156.68.yaml`

2) Vault keys (change anytime, centralized):
- `secret/sms/platform` (see `docs/keys-and-urls.md`)

3) (Optional) If you don’t want to use `helm.parameters`:
- Hardcode Ingress hosts in `infra/helm/sms-platform/values-gitops-ec2.yaml` (`networking.ingress.*`)

## High-level bootstrap steps (EC2)

1) Create a Kubernetes cluster on the instance (commonly k3s).
2) Install an Ingress controller (class must match `values-gitops-ec2.yaml`, e.g. `nginx` or `traefik`).
3) Install External Secrets Operator (ESO).
4) Install Vault (or connect to an existing Vault reachable from the cluster).
5) Seed Vault with `sms/platform` + `sms/ghcr`:
   - Example dev seeder: `infra/kubernetes/windows/seed-vault.ps1`
6) Install Argo CD and apply:
   - Your instance-specific app manifest (example: `infra/kubernetes/operations/argocd/apps/sms-platform-ec2-3.109.156.68.yaml`)

## Changing URLs tomorrow (Vault-only)

1) Update keys in Vault under `secret/sms/platform` (example: `AUTH_SERVICE_URL`).
2) ESO refreshes `Secret/sms-secrets` (default refresh interval in chart: `1m`).
3) Pods need a restart to pick up new env values:
   - Recommended: install **Stakater Reloader** and keep `reloader.stakater.com/auto: "true"` enabled in `values-gitops-ec2.yaml`.

## URLs (current EC2)

- Frontend (platform): `http://sms.3.109.156.68.sslip.io`
- Frontend (schools): `http://<school>.sms.3.109.156.68.sslip.io`
- API (direct): `http://api.3.109.156.68.sslip.io` (health: `/health`)
- MCP: `http://mcp.3.109.156.68.sslip.io/health`
- Argo CD: `http://argocd.3.109.156.68.sslip.io`

## Bringing up a second EC2 instance

1) Repeat the bootstrap steps (k3s + ingress + ESO + Vault + Argo CD).
2) Pick a base host scheme:
   - Platform: `sms.<EC2_PUBLIC_IP>.sslip.io`
   - Schools: `*.sms.<EC2_PUBLIC_IP>.sslip.io`
   - API: `api.<EC2_PUBLIC_IP>.sslip.io`
   - MCP: `mcp.<EC2_PUBLIC_IP>.sslip.io`
3) Copy `infra/kubernetes/operations/argocd/apps/sms-platform-ec2.yaml` → `sms-platform-ec2-<EC2_PUBLIC_IP>.yaml` and update:
   - `repoURL`
   - the 4 Ingress host parameters
4) Seed Vault for that cluster (or point the cluster at your centralized Vault):
   - `secret/sms/platform`
   - `secret/sms/ghcr`
