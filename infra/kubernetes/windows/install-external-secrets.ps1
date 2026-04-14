param(
    [switch]$ApplyExamples,
    [string]$ToolsRoot = "D:\sms-k8s\tools"
)

$ErrorActionPreference = "Stop"
$helmExe = Join-Path $ToolsRoot "bin\helm.exe"
$kubectlExe = Join-Path $ToolsRoot "bin\kubectl.exe"
$repoRoot = Split-Path -Parent (Split-Path -Parent (Split-Path -Parent $PSScriptRoot))

& $helmExe repo add external-secrets https://charts.external-secrets.io
& $helmExe repo update
& $helmExe upgrade --install external-secrets external-secrets/external-secrets --namespace external-secrets --create-namespace

if ($ApplyExamples) {
    & $kubectlExe apply -f (Join-Path $repoRoot 'infra\kubernetes\operations\secrets\azure-key-vault-clustersecretstore.example.yaml')
    & $kubectlExe apply -f (Join-Path $repoRoot 'infra\kubernetes\operations\secrets\sms-external-secret.example.yaml')
}
