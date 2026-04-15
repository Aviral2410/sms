# Argo CD (GitOps) layout

This folder contains the “app-of-apps” scaffolding for Argo CD.

## Local kind quickstart

1) Install Argo CD:

```powershell
powershell -ExecutionPolicy Bypass -File .\infra\kubernetes\windows\install-argocd.ps1
```

2) Create the AppProject + root app:

Edit `infra/argocd/root-app.yaml` and set `spec.source.repoURL` to your Git repo URL.

```powershell
kubectl apply -f .\infra\argocd\project.yaml
kubectl apply -f .\infra\argocd\root-app.yaml
```

Argo CD will then reconcile the child applications in `infra/argocd/apps/`.

## Future clusters

Keep the same folder structure. Only adjust:
- `repoURL` (or use Argo CD repo credentials)
- `destination.server` and namespaces
- values files/overlays per environment

