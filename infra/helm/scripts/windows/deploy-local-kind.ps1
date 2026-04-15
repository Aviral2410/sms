param(
    [string]$ClusterName = "sms-local",
    [string]$ToolsRoot = "D:\sms-k8s\tools",
    [string]$KubeRoot = "D:\sms-k8s",
    [string]$ReleaseName = "sms-platform",
    [string]$Namespace = "sms",
    [string]$EnvFile = ".env",
    [string]$ValuesFile = "infra\\helm\\sms-platform\\values-local-kind.yaml",
    [int]$MaxParallel = 4,
    [string]$Timeout = "20m"
)

$ErrorActionPreference = "Stop"

$repoRoot = Split-Path -Parent (Split-Path -Parent (Split-Path -Parent (Split-Path -Parent $PSScriptRoot)))
$kubectlExe = Join-Path $ToolsRoot "bin\\kubectl.exe"
$helmExe = Join-Path $ToolsRoot "bin\\helm.exe"
$kindExe = Join-Path $ToolsRoot "bin\\kind.exe"

$kubeConfigDir = Join-Path $KubeRoot ".kube"
$kubeConfigPath = Join-Path $kubeConfigDir "config"
New-Item -ItemType Directory -Force -Path $kubeConfigDir | Out-Null
$env:KUBECONFIG = $kubeConfigPath

if (-not (Get-Command docker -ErrorAction SilentlyContinue)) {
    throw "docker is required (Docker Desktop)."
}

try {
    docker version | Out-Null
}
catch {
    throw "Docker engine is not reachable. Start Docker Desktop and try again."
}

if (-not (Test-Path $kindExe)) { throw "kind not found: $kindExe" }
if (-not (Test-Path $kubectlExe)) { throw "kubectl not found: $kubectlExe" }
if (-not (Test-Path $helmExe)) { throw "helm not found: $helmExe" }

$existingClusters = & $kindExe get clusters 2>$null
if (-not ($existingClusters -contains $ClusterName)) {
    & (Join-Path $repoRoot "infra\\kubernetes\\windows\\create-kind-cluster.ps1") -ClusterName $ClusterName -ToolsRoot $ToolsRoot -KubeRoot $KubeRoot
}
else {
    & $kindExe export kubeconfig --name $ClusterName --kubeconfig $kubeConfigPath | Out-Null
}

& (Join-Path $repoRoot "infra\\kubernetes\\windows\\build-images.ps1") -ClusterName $ClusterName -ToolsRoot $ToolsRoot -MaxParallel $MaxParallel

& $kubectlExe create namespace $Namespace --dry-run=client -o yaml | & $kubectlExe apply -f -
& (Join-Path $repoRoot "infra\\kubernetes\\windows\\create-secrets-from-env.ps1") -EnvFile $EnvFile -ToolsRoot $ToolsRoot

$chartPath = Join-Path $repoRoot "infra\\helm\\sms-platform"
$resolvedValues = if ([System.IO.Path]::IsPathRooted($ValuesFile)) { $ValuesFile } else { Join-Path $repoRoot $ValuesFile }

& $helmExe upgrade --install $ReleaseName $chartPath `
  --namespace $Namespace `
  --create-namespace `
  --atomic `
  --wait `
  --timeout $Timeout `
  -f $resolvedValues

Write-Host ""
Write-Host "Helm deployment is ready."
Write-Host "Frontend:    http://localhost:30080"
Write-Host "API Gateway: http://localhost:30000"
Write-Host "MCP Server:  http://localhost:30084/health"

