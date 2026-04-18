# GitOps: Argo CD (kind or EC2 Kubernetes)

This repo’s GitHub Actions workflow builds/pushes images and then **bumps image tags** in Git-tracked Helm values files. Argo CD auto-sync then rolls out the new images.

Workflow:
- `.github/workflows/pipeline.yml`
- Values files updated on `develop`:
  - `infra/helm/sms-platform/values-gitops-kind.yaml`
  - `infra/helm/sms-platform/values-gitops-ec2.yaml`

## Argo CD apps in this repo

- kind: `infra/kubernetes/operations/argocd/apps/sms-platform-kind.yaml`
- EC2 cluster: `infra/kubernetes/operations/argocd/apps/sms-platform-ec2.yaml`

Both files require you to replace `REPLACE_ME_REPO_URL`.

## Install Argo CD (high level)

Install Argo CD in the `argocd` namespace (Helm is the usual approach), then apply one of the app manifests above.

After install, you can port-forward the UI:

```bash
kubectl -n argocd port-forward svc/argocd-server 30443:443
```

Initial admin password (default install):

```bash
kubectl -n argocd get secret argocd-initial-admin-secret -o jsonpath="{.data.password}" | base64 -d
```

## Notes

- If your repo is private, add repo credentials in Argo CD (Settings → Repositories).
- The app manifests use `syncPolicy.automated` (prune + selfHeal). Remove `automated` if you want manual syncs.
