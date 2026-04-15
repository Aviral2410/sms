# HashiCorp Vault (OSS) + External Secrets Operator (ESO)

This repo standardizes on a single in-cluster Secret interface: `sms/sms-secrets`.

Vault is the source of truth for secret values, ESO syncs them into Kubernetes.

## Local kind (recommended dev path)

1) Install ESO:

```powershell
powershell -ExecutionPolicy Bypass -File .\infra\kubernetes\windows\install-external-secrets.ps1
```

2) Install Vault (dev, in-cluster):

```powershell
powershell -ExecutionPolicy Bypass -File .\infra\kubernetes\windows\install-vault.ps1
```

3) Create `ClusterSecretStore` + `ExternalSecret`:

```powershell
kubectl apply -f .\infra\kubernetes\operations\secrets\vault\vault-clustersecretstore.local-token.yaml
kubectl apply -f .\infra\kubernetes\operations\secrets\vault\sms-externalsecret.vault-kv2.yaml
```

4) Put the values in Vault under a single KV v2 secret:
- mount: `kv` (KV v2)
- secret path: `sms/sms-secrets`
- keys: match `infra/secrets/day0keyvaultseed.yaml`

## Future cloud clusters

For non-local clusters, do not use static tokens. Use Vault Kubernetes auth or AppRole and restrict policies by namespace/service account.
This repo keeps local manifests simple, and provides a clean place to add hardened cluster-specific overlays later.

