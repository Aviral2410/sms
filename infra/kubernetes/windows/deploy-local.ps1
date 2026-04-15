param(
    [string]$ClusterName = "sms-local",
    [string]$ToolsRoot = "D:\sms-k8s\tools",
    [string]$KubeRoot = "D:\sms-k8s",
    [int]$MaxParallel = 4
)

$ErrorActionPreference = "Stop"
$kubectlExe = Join-Path $ToolsRoot "bin\kubectl.exe"
$env:KUBECONFIG = Join-Path $KubeRoot ".kube\config"
$scriptDir = $PSScriptRoot
$repoRoot = Split-Path -Parent (Split-Path -Parent $PSScriptRoot)

# 1. Build and Load Images
& "$scriptDir\build-images.ps1" -ClusterName $ClusterName -MaxParallel $MaxParallel -ToolsRoot $ToolsRoot

# 2. Ensure namespace exists
& $kubectlExe create namespace sms --dry-run=client -o yaml | & $kubectlExe apply -f -

# 3. Check for secrets
if (-not (& $kubectlExe -n sms get secret sms-secrets -ErrorAction SilentlyContinue)) {
    Write-Error "Missing secret 'sms/sms-secrets'. Create it via bootstrap script or Vault+ESO before deploying."
    exit 1
}

# 4. Deploy applying the local overlay
& $kubectlExe apply -f "$repoRoot\infra\kubernetes\overlays\local\kustomization.yaml"

# 5. Wait for readiness
Write-Host "Waiting for database initialization..."
& $kubectlExe rollout status statefulset/postgres -n sms --timeout=300s
& $kubectlExe wait --for=condition=complete job/db-repair -n sms --timeout=300s

$deployments = @(
    "auth-service", "school-onboarding-service", "school-operations-service", 
    "communication-service", "finance-service", "subscription-service", 
    "api-gateway", "ai-interaction-service", "mcp-server", "frontend"
)

foreach ($dep in $deployments) {
    Write-Host "Waiting for $dep..."
    & $kubectlExe rollout status deployment/$dep -n sms --timeout=300s
}

Write-Host "`nDeployment Complete!"
Write-Host "Frontend:    http://localhost:30080"
Write-Host "API Gateway: http://localhost:30000"
Write-Host "MCP Server:  http://localhost:30084/health"
