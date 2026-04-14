param(
    [string]$ReleaseName = "sms-platform",
    [string]$Namespace = "sms",
    [string]$ValuesFile = "infra\helm\sms-platform\values-production.yaml",
    [string]$Registry = "",
    [switch]$Wait = $true,
    [string]$Timeout = "15m"
)

$ErrorActionPreference = "Stop"
$repoRoot = Split-Path -Parent (Split-Path -Parent (Split-Path -Parent (Split-Path -Parent $PSScriptRoot)))
$helmExe = Join-Path 'D:\sms-k8s\tools\bin' 'helm.exe'
$chartPath = Join-Path $repoRoot 'infra\helm\sms-platform'
$resolvedValues = if ([System.IO.Path]::IsPathRooted($ValuesFile)) { $ValuesFile } else { Join-Path $repoRoot $ValuesFile }

$args = @('upgrade','--install',$ReleaseName,$chartPath,'--namespace',$Namespace,'--create-namespace','-f',$resolvedValues,'--atomic')
if ($Wait) {
    $args += @('--wait','--timeout',$Timeout)
}
if ($Registry) {
    $args += @('--set-string',"global.imageRegistry=$Registry")
}

& $helmExe @args
