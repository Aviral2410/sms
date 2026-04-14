param(
    [switch]$Unregister,
    [string]$BootstrapArgs = '-SkipDockerInstall -SkipSmokeTest'
)

$ErrorActionPreference = "Stop"
$repoRoot = Split-Path -Parent (Split-Path -Parent (Split-Path -Parent $PSScriptRoot))
$startupDir = Join-Path $env:APPDATA 'Microsoft\Windows\Start Menu\Programs\Startup'
$launcherPath = Join-Path $startupDir 'sms-day0-bootstrap.cmd'

if ($Unregister) {
    if (Test-Path $launcherPath) {
        Remove-Item $launcherPath -Force
        Write-Host "Removed $launcherPath"
    }
    exit 0
}

$content = '@echo off`r`npowershell -ExecutionPolicy Bypass -File "' + (Join-Path $repoRoot 'infra\kubernetes\day0\day0-bootstrap.ps1') + '" ' + $BootstrapArgs + '`r`n'
Set-Content -Path $launcherPath -Value $content -Encoding ASCII
Write-Host "Startup launcher written to $launcherPath"
