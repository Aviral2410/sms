# Secrets Management Patterns

This folder contains production-oriented examples for moving secrets out of plain Kubernetes Secrets and into a key-vault style system.

## Recommended path

Use External Secrets Operator plus one of:
- Azure Key Vault
- HashiCorp Vault
- AWS Secrets Manager

The operator syncs secrets from the vault into the Kubernetes namespace.

## What is included

- Azure Key Vault `ClusterSecretStore` example
- `ExternalSecret` example that creates `sms-secrets`

## Why this matters

- secrets rotation becomes easier
- fewer manual secret updates in clusters
- production secrets are not kept in Git
