param(
    [string]$ClusterName = "sms-local",
    [string]$ToolsRoot = "D:\sms-k8s\tools",
    [string]$KubeRoot = "D:\sms-k8s"
)

$ErrorActionPreference = "Stop"

$kindExe = Join-Path $ToolsRoot "bin\kind.exe"
$kubeConfigPath = Join-Path (Join-Path $KubeRoot ".kube") "config"
$env:KUBECONFIG = $kubeConfigPath

& $kindExe delete cluster --name $ClusterName
