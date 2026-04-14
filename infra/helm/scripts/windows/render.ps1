param(
    [string]$ReleaseName = "sms-platform",
    [string]$ValuesFile = "infra\helm\sms-platform\values-production.yaml"
)

$ErrorActionPreference = "Stop"
$repoRoot = Split-Path -Parent (Split-Path -Parent (Split-Path -Parent (Split-Path -Parent $PSScriptRoot)))
$helmExe = Join-Path 'D:\sms-k8s\tools\bin' 'helm.exe'
$chartPath = Join-Path $repoRoot 'infra\helm\sms-platform'
$resolvedValues = if ([System.IO.Path]::IsPathRooted($ValuesFile)) { $ValuesFile } else { Join-Path $repoRoot $ValuesFile }

& $helmExe template $ReleaseName $chartPath -f $resolvedValues
