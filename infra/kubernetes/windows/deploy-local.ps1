param(
    [string]$ClusterName = "sms-local",
    [string]$ToolsRoot = "D:\sms-k8s\tools",
    [string]$KubeRoot = "D:\sms-k8s",
    [int]$MaxParallel = 4
)

$ErrorActionPreference = "Stop"

$repoRoot = Split-Path -Parent (Split-Path -Parent (Split-Path -Parent $PSScriptRoot))
$kubectlExe = Join-Path $ToolsRoot "bin\kubectl.exe"
$kubeConfigDir = Join-Path $KubeRoot ".kube"
$kubeConfigPath = Join-Path $kubeConfigDir "config"
$overlayPath = Join-Path $repoRoot "infra\kubernetes\overlays\local"

New-Item -ItemType Directory -Force -Path $kubeConfigDir | Out-Null
$env:KUBECONFIG = $kubeConfigPath

& (Join-Path $PSScriptRoot "build-images.ps1") -ClusterName $ClusterName -ToolsRoot $ToolsRoot -MaxParallel $MaxParallel

# Ensure namespace exists before creating secrets or applying kustomize resources.
& $kubectlExe create namespace sms --dry-run=client -o yaml | & $kubectlExe apply -f -

if (-not (& $kubectlExe -n sms get secret sms-secrets 2>$null)) {
    throw "Missing secret 'sms/sms-secrets'. Create it via Vault+ESO (recommended) before deploying."
}

# The local overlay references SQL files outside the base directory; render with kubectl kustomize.
& $kubectlExe kustomize $overlayPath --load-restrictor LoadRestrictionsNone | & $kubectlExe apply -f -

& $kubectlExe rollout status statefulset/postgres -n sms --timeout=300s
& $kubectlExe wait --for=condition=complete job/db-repair -n sms --timeout=300s

$deployments = @(
    "auth-service",
    "school-onboarding-service",
    "school-operations-service",
    "communication-service",
    "finance-service",
    "subscription-service",
    "api-gateway",
    "ai-interaction-service",
    "mcp-server",
    "frontend"
)

foreach ($deployment in $deployments) {
    & $kubectlExe rollout status deployment/$deployment -n sms --timeout=300s
}

Write-Host ""
Write-Host "Local deployment is ready."
Write-Host "Frontend:    http://localhost:30080"
Write-Host "API Gateway: http://localhost:30000"
Write-Host "MCP Server:  http://localhost:30084/health"
