# Secrets: HashiCorp Vault OSS (local now, cloud later)

## Goal

Centralize secret values in Vault, and expose them to workloads only via the Kubernetes Secret `sms/sms-secrets`.

Apps never read Vault directly in this setup.

## Key concepts

- **Key**: the name used by workloads, e.g. `POSTGRES_PASSWORD`.
- **Value**: the secret string stored in Vault.
- **Canonical key inventory**: `infra/secrets/day0keyvaultseed.yaml`.
- **Kubernetes interface**: `Secret/sms-secrets` in namespace `sms`.

## Local kind (quick start)

1) Install External Secrets Operator:

```powershell
powershell -ExecutionPolicy Bypass -File .\infra\kubernetes\windows\install-external-secrets.ps1
```

2) Install Vault (dev mode):

```powershell
powershell -ExecutionPolicy Bypass -File .\infra\kubernetes\windows\install-vault.ps1
```

3) Apply the Vault store + ExternalSecret:

```powershell
kubectl apply -f .\infra\kubernetes\operations\secrets\vault\vault-clustersecretstore.local-token.yaml
kubectl apply -f .\infra\kubernetes\operations\secrets\vault\sms-externalsecret.vault-kv2.yaml
```

4) Put secret data into Vault under KV v2:

- mount: `kv` (already configured in the local chart values)
- secret path: `sms/sms-secrets`
- add keys matching `infra/secrets/day0keyvaultseed.yaml`

5) Confirm `sms-secrets` exists:

```powershell
kubectl -n sms get secret sms-secrets
```

## Production note

Local uses a static token for speed. For real environments, replace the local store with Vault Kubernetes auth or AppRole, and restrict policies by namespace/service account.

