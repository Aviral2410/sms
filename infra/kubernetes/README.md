# Kubernetes Assets

Start here for the Kubernetes version of this repo.

## Main docs

- `docs/local-prerequisites.md`
- `docs/kubernetes-deployment.md`
- `docs/production-kubernetes-operations.md`
- `docs/ci-cd.md`
- `docs/flyway-migrations.md`
- `docs/secrets-and-key-vault.md`

## Main folders

- `base/`: shared Kubernetes manifests
- `overlays/local/`: local `kind` overlay
- `overlays/prod-ha/`: production-leaning HA overlay
- `windows/`: Windows helper scripts
- `linux/`: Ubuntu/Linux helper scripts
- `operations/`: migrations, backup/restore, monitoring, and secrets assets
- `examples/`: example secret manifests
