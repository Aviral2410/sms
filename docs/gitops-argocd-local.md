# GitOps: Argo CD (local kind first)

## Install

```powershell
powershell -ExecutionPolicy Bypass -File .\infra\kubernetes\windows\install-argocd.ps1
```

Port-forward:

```powershell
kubectl -n argocd port-forward svc/argocd-server 30443:443
```

Initial admin password:

```powershell
kubectl -n argocd get secret argocd-initial-admin-secret -o jsonpath="{.data.password}" | base64 -d
```

## Bootstrap apps (app-of-apps)

1) Edit the repo URL placeholders:
- `infra/argocd/root-app.yaml`
- `infra/argocd/apps/sms-platform.yaml`

2) Apply:

```powershell
kubectl apply -f .\infra\argocd\project.yaml
kubectl apply -f .\infra\argocd\root-app.yaml
```

Argo CD will deploy:
- `sms-platform` Helm release using `infra/helm/sms-platform/values-local-kind.yaml`
- `monitoring` (kube-prometheus-stack) with NodePorts on `30090/30091/30093`

## GitHub Actions auto-sync

Workflow: `.github/workflows/argocd-autosync.yml`

Add repo secrets:
- `ARGOCD_SERVER` (example: `localhost:30443` for local tunnels, or your real ingress host)
- `ARGOCD_AUTH_TOKEN` (a token created in Argo CD)

For real environments, expose Argo CD via ingress and use a stable DNS name.

