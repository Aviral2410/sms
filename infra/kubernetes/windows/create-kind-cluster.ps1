param(
    [string]$ClusterName = "sms-local",
    [string]$ToolsRoot = "D:\sms-k8s\tools",
    [string]$KubeRoot = "D:\sms-k8s"
)

$ErrorActionPreference = "Stop"

$repoRoot = Split-Path -Parent (Split-Path -Parent (Split-Path -Parent $PSScriptRoot))
$kindExe = Join-Path $ToolsRoot "bin\kind.exe"
$kubectlExe = Join-Path $ToolsRoot "bin\kubectl.exe"
$kindConfig = Join-Path $repoRoot "infra\kubernetes\kind\kind-config.yaml"
$kubeConfigDir = Join-Path $KubeRoot ".kube"
$kubeConfigPath = Join-Path $kubeConfigDir "config"

New-Item -ItemType Directory -Force -Path $KubeRoot | Out-Null
New-Item -ItemType Directory -Force -Path $kubeConfigDir | Out-Null

$env:KUBECONFIG = $kubeConfigPath

& $kindExe create cluster --name $ClusterName --config $kindConfig --kubeconfig $kubeConfigPath
& $kubectlExe cluster-info

Write-Host ""
Write-Host "Cluster '$ClusterName' is ready."
Write-Host "KUBECONFIG: $kubeConfigPath"
