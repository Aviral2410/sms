param(
    [Parameter(Mandatory = $true)]
    [string]$Service,
    [Parameter(Mandatory = $true)]
    [string]$Tag,
    [string]$ImageRepository = "",
    [string]$Registry = "",
    [string]$ReleaseName = "sms-platform",
    [string]$Namespace = "sms",
    [string]$ValuesFile = "infra\helm\sms-platform\values-production.yaml",
    [string]$Timeout = "15m"
)

$ErrorActionPreference = "Stop"
$repoRoot = Split-Path -Parent (Split-Path -Parent (Split-Path -Parent (Split-Path -Parent $PSScriptRoot)))
$helmExe = Join-Path 'D:\sms-k8s\tools\bin' 'helm.exe'
$chartPath = Join-Path $repoRoot 'infra\helm\sms-platform'
$resolvedValues = if ([System.IO.Path]::IsPathRooted($ValuesFile)) { $ValuesFile } else { Join-Path $repoRoot $ValuesFile }

$map = @{
    'auth-service' = 'authService'
    'school-onboarding-service' = 'schoolOnboardingService'
    'school-operations-service' = 'schoolOperationsService'
    'communication-service' = 'communicationService'
    'finance-service' = 'financeService'
    'subscription-service' = 'subscriptionService'
    'api-gateway' = 'apiGateway'
    'mcp-server' = 'mcpServer'
    'frontend' = 'frontend'
}

if (-not $map.ContainsKey($Service)) {
    throw "Unknown service '$Service'"
}

$key = $map[$Service]
$args = @('upgrade','--install',$ReleaseName,$chartPath,'--namespace',$Namespace,'--create-namespace','-f',$resolvedValues,'--reuse-values','--atomic','--wait','--timeout',$Timeout,"--set-string","services.$key.image.tag=$Tag")
if ($ImageRepository) {
    $args += @('--set-string',"services.$key.image.repository=$ImageRepository")
}
if ($Registry) {
    $args += @('--set-string',"global.imageRegistry=$Registry")
}

& $helmExe @args
