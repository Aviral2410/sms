param(
    [string]$ToolsRoot = "D:\sms-k8s\tools"
)

$ErrorActionPreference = "Stop"
$helmExe = Join-Path $ToolsRoot "bin\helm.exe"
$kubectlExe = Join-Path $ToolsRoot "bin\kubectl.exe"
$repoRoot = Split-Path -Parent (Split-Path -Parent (Split-Path -Parent $PSScriptRoot))
$valuesFile = Join-Path $repoRoot "infra\kubernetes\operations\monitoring\kube-prometheus-stack-values.yaml"
$rulesFile = Join-Path $repoRoot "infra\kubernetes\operations\monitoring\prometheus-rules.yaml"

& $helmExe repo add prometheus-community https://prometheus-community.github.io/helm-charts
& $helmExe repo update
& $helmExe upgrade --install monitoring prometheus-community/kube-prometheus-stack --namespace monitoring --create-namespace -f $valuesFile
& $kubectlExe apply -f $rulesFile
