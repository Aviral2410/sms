# Production Deployment Notes (EC2 + k3s + Argo CD + Vault)

This repo can be deployed in a production-like way on EC2 with:

- **GitHub Actions** → build/push images to GHCR and bump immutable image tags in Git
- **Argo CD** → pull-based auto-deploy from Git (no kubeconfig in GitHub)
- **Vault** → source of truth for secrets/URLs
- **External Secrets Operator (ESO)** → sync Vault → Kubernetes Secrets

## What’s already “good” in this repo

- Internal service-to-service routing is centralized in Vault (`secret/sms/platform`) and can point to **Kubernetes Service DNS** (recommended).
- GitHub Actions workflow `.github/workflows/pipeline.yml` builds/pushes images to GHCR and can bump image tags in:
  - `infra/helm/sms-platform/values-gitops-ec2.yaml`
- Helm chart supports ESO-based secrets via `global.secrets.create=false` + `global.secrets.existingSecret=sms-secrets`.

## Not production-ready by default (must fix)

1) Vault “dev mode” + static root token
- Dev mode is not acceptable for production.
- Replace with a real Vault:
  - HCP Vault or self-managed Vault HA, with backups and restricted access.
  - Use **Vault Kubernetes auth** for ESO instead of a long-lived token secret.

2) TLS + real domains
- `sslip.io` is fine for temporary testing, not for production.
- Use a real domain and enable TLS at Ingress (cert-manager recommended).

3) Image immutability
- Production should deploy **immutable tags** (`<git-sha>`), not `latest`.
- Argo CD should deploy with `infra/helm/sms-platform/values-gitops-ec2.yaml` (and override only environment-specific hosts via `helm.parameters`).

4) Data durability and backups
- If Postgres runs in-cluster, ensure PV backup/restore exists and storage is reliable.
- For simpler operations, use a managed Postgres (RDS) and disable in-chart Postgres.

## Minimal “production-ish” checklist for this EC2

- Argo CD manages the release via `infra/kubernetes/operations/argocd/apps/sms-platform-ec2-*.yaml`.
- ESO is healthy and `externalsecret/sms-secrets` is `SecretSynced=True`.
- `secret/sms/platform` contains strong values:
  - `JWT_SECRET_KEY`, `INTERNAL_API_KEY`, `PLATFORM_CONFIG_ENCRYPTION_KEY`, `POSTGRES_PASSWORD`
- Ingress hosts are set and resolve:
  - platform (`sms.<domain>`) + wildcard schools (`*.sms.<domain>`)
  - API (`api.<domain>`) and MCP (`mcp.<domain>`)

