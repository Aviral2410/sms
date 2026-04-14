# Secrets and Key Vault Guide

This repo includes a production-oriented key vault integration pattern.

## Included pattern

- External Secrets Operator
- Azure Key Vault example `ClusterSecretStore`
- Example `ExternalSecret` that materializes `sms-secrets`

## Repo paths

- `infra/kubernetes/operations/secrets/README.md`
- `infra/kubernetes/operations/secrets/azure-key-vault-clustersecretstore.example.yaml`
- `infra/kubernetes/operations/secrets/sms-external-secret.example.yaml`

## Why use this

- secrets rotation is easier
- less manual Kubernetes secret management
- safer than storing real credentials in repo-managed YAML

## Install helpers

### Windows

```powershell
powershell -ExecutionPolicy Bypass -File .\infra\kubernetes\windows\install-external-secrets.ps1
```

### Ubuntu

```bash
bash ./infra/kubernetes/linux/install-external-secrets.sh
```

## Recommendation

For production, use a vault-backed secret source and treat plain Kubernetes Secrets as synchronized runtime material, not as the source of truth.
