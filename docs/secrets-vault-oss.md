# Secrets: HashiCorp Vault OSS (Vault → External Secrets Operator → `Secret/sms-secrets`)

## Goal

Centralize all runtime keys/config in Vault, and expose them to workloads only via the Kubernetes Secret `sms-secrets` (namespace `sms`).

Apps never talk to Vault directly in this setup.

## What this repo expects

- Vault KV v2 mount: `secret`
- Vault paths (KV v2 UI paths):
  - `secret/sms/platform` (all platform keys + internal URLs)
  - `secret/sms/ghcr` (GHCR pull credentials)
- Kubernetes Secret produced by External Secrets Operator:
  - `Secret/sms-secrets` in namespace `sms`
  - `Secret/ghcr-pull-secret` in namespace `sms`

The Helm chart creates the SecretStore + ExternalSecret at install time:
- `infra/helm/sms-platform/templates/secrets/external-secrets.yaml`

## Local (kind) dev flow

1) Run Vault in dev mode (example values file):
- `infra/kubernetes/operations/vault/vault-values-local.yaml`

2) Seed Vault:
- Windows: `infra/kubernetes/windows/seed-vault.ps1`

3) Deploy the platform Helm chart (this will apply the ExternalSecret):
- `infra/helm/sms-platform`

## Production note

The chart currently uses a **static token** (`Secret/vault-token`) for local simplicity.

For real environments, replace this with Vault Kubernetes auth or AppRole and lock down policies by namespace/service account.
