param(
    [string]$ClusterName = "sms-local",
    [switch]$SkipDockerInstall,
    [switch]$SkipMonitoring,
    [switch]$SkipExternalSecrets,
    [switch]$SkipSmokeTest,
    [switch]$RegisterStartup
)

$ErrorActionPreference = "Stop"
$scriptRoot = Split-Path -Parent $PSCommandPath
$repoRoot = Split-Path -Parent (Split-Path -Parent (Split-Path -Parent $scriptRoot))

function Command-Exists {
    param([string]$Name)
    return $null -ne (Get-Command $Name -ErrorAction SilentlyContinue)
}

function Ensure-Windows-Docker {
    if (Command-Exists 'docker') {
        return
    }

    $dockerCli = 'C:\Program Files\Docker\Docker\resources\bin\docker.exe'
    if (Test-Path $dockerCli) {
        $env:Path = ('C:\Program Files\Docker\Docker\resources\bin;') + $env:Path
        if (Command-Exists 'docker') {
            return
        }
    }

    if ($SkipDockerInstall) {
        throw 'Docker is not available and -SkipDockerInstall was specified.'
    }

    if (-not (Command-Exists 'winget')) {
        throw 'winget is required to install Docker Desktop automatically on Windows.'
    }

    winget install --id Docker.DockerDesktop --accept-package-agreements --accept-source-agreements
    throw 'Docker Desktop installation was started. Launch Docker Desktop once, let it finish setup, then rerun this script.'
}

function Ensure-Windows-Tools {
    $kubectl = 'D:\sms-k8s\tools\bin\kubectl.exe'
    $kind = 'D:\sms-k8s\tools\bin\kind.exe'
    $helm = 'D:\sms-k8s\tools\bin\helm.exe'

    if (-not ((Test-Path $kubectl) -and (Test-Path $kind) -and (Test-Path $helm))) {
        & (Join-Path $repoRoot 'infra\kubernetes\windows\install-k8s-tools-d-drive.ps1')
    }

    $env:Path = 'D:\sms-k8s\tools\bin;' + $env:Path
}

function Ensure-Linux-Tools {
    if (-not (Command-Exists 'docker')) {
        if ($SkipDockerInstall) {
            throw 'Docker is not available and -SkipDockerInstall was specified.'
        }
        sudo apt-get update
        sudo apt-get install -y docker.io curl ca-certificates
        sudo systemctl enable --now docker
    }

    if (-not (Test-Path '/opt/sms-k8s/tools/bin/kubectl') -or -not (Test-Path '/opt/sms-k8s/tools/bin/kind') -or -not (Test-Path '/opt/sms-k8s/tools/bin/helm')) {
        bash (Join-Path $repoRoot 'infra/kubernetes/linux/install-k8s-tools.sh')
    }

    $env:PATH = '/opt/sms-k8s/tools/bin:' + $env:PATH
}

function Register-Startup {
    $startupDir = Join-Path $env:APPDATA 'Microsoft\Windows\Start Menu\Programs\Startup'
    $launcherPath = Join-Path $startupDir 'sms-day0-bootstrap.cmd'
    $content = '@echo off`r`npowershell -ExecutionPolicy Bypass -File "' + (Join-Path $repoRoot 'infra\kubernetes\day0\day0-bootstrap.ps1') + '" -SkipDockerInstall -SkipSmokeTest`r`n'
    Set-Content -Path $launcherPath -Value $content -Encoding ASCII
    Write-Host "Startup launcher written to $launcherPath"
}

if ($IsWindows -or $env:OS -eq 'Windows_NT') {
    Ensure-Windows-Tools
    Ensure-Windows-Docker
    & (Join-Path $repoRoot 'infra\kubernetes\windows\create-kind-cluster.ps1') -ClusterName $ClusterName
    & (Join-Path $repoRoot 'infra\kubernetes\windows\deploy-local.ps1') -ClusterName $ClusterName
    if (-not $SkipMonitoring) {
        & (Join-Path $repoRoot 'infra\kubernetes\windows\install-monitoring.ps1')
    }
    if (-not $SkipExternalSecrets) {
        & (Join-Path $repoRoot 'infra\kubernetes\windows\install-external-secrets.ps1')
    }
    if (-not $SkipSmokeTest) {
        & (Join-Path $repoRoot 'infra\kubernetes\windows\smoke-test.ps1')
    }
    if ($RegisterStartup) {
        Register-Startup
    }
    exit 0
}

if ($IsLinux) {
    Ensure-Linux-Tools
    bash (Join-Path $repoRoot 'infra/kubernetes/linux/create-kind-cluster.sh') $ClusterName
    bash (Join-Path $repoRoot 'infra/kubernetes/linux/deploy-local.sh') $ClusterName
    if (-not $SkipMonitoring) {
        bash (Join-Path $repoRoot 'infra/kubernetes/linux/install-monitoring.sh')
    }
    if (-not $SkipExternalSecrets) {
        bash (Join-Path $repoRoot 'infra/kubernetes/linux/install-external-secrets.sh')
    }
    if (-not $SkipSmokeTest) {
        bash (Join-Path $repoRoot 'infra/kubernetes/linux/smoke-test.sh')
    }
    exit 0
}

throw 'Unsupported operating system for day0-bootstrap.ps1'
