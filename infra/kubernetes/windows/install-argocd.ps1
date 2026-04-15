param(
    [string]$ToolsRoot = "D:\sms-k8s\tools",
    [string]$Namespace = "argocd"
)

$ErrorActionPreference = "Stop"
$helmExe = Join-Path $ToolsRoot "bin\helm.exe"
$kubectlExe = Join-Path $ToolsRoot "bin\kubectl.exe"

& $helmExe repo add argo https://argoproj.github.io/argo-helm
& $helmExe repo update
& $helmExe upgrade --install argocd argo/argo-cd --namespace $Namespace --create-namespace

Write-Host ""
Write-Host "Argo CD installed."
Write-Host "UI: kubectl -n $Namespace port-forward svc/argocd-server 30443:443"
Write-Host "URL: https://localhost:30443"
Write-Host "Initial admin password:"
Write-Host "  kubectl -n $Namespace get secret argocd-initial-admin-secret -o jsonpath=\"{.data.password}\" | base64 -d"

