param(
    [string]$ToolsRoot = "D:\sms-k8s\tools",
    [string]$Namespace = "vault"
)

$ErrorActionPreference = "Stop"
$helmExe = Join-Path $ToolsRoot "bin\helm.exe"
$kubectlExe = Join-Path $ToolsRoot "bin\kubectl.exe"
$repoRoot = Split-Path -Parent (Split-Path -Parent (Split-Path -Parent $PSScriptRoot))
$valuesFile = Join-Path $repoRoot "infra\\kubernetes\\operations\\vault\\vault-values-local.yaml"

& $helmExe repo add hashicorp https://helm.releases.hashicorp.com
& $helmExe repo update
& $helmExe upgrade --install vault hashicorp/vault --namespace $Namespace --create-namespace -f $valuesFile

# For local-only dev, we use the dev root token from values as a Kubernetes Secret for ESO to reference.
& $kubectlExe -n $Namespace create secret generic vault-root-token --from-literal=token=root --dry-run=client -o yaml | & $kubectlExe apply -f -

Write-Host ""
Write-Host "Vault installed (dev mode)."
Write-Host "UI: kubectl -n $Namespace port-forward svc/vault-ui 30200:8200"
Write-Host "Vault UI URL: http://localhost:30200"
Write-Host "Root token: root"

