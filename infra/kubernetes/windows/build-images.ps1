param(
    [string]$ClusterName = "sms-local",
    [int]$MaxParallel = 4,
    [string]$ToolsRoot = "D:\sms-k8s\tools"
)

$ErrorActionPreference = "Stop"
$kindExe = Join-Path $ToolsRoot "bin\kind.exe"
$repoRoot = Split-Path -Parent (Split-Path -Parent $PSScriptRoot)

$images = @(
    @{ name = "sms/auth-service:local"; dockerfile = "services/auth-service/Dockerfile"; context = "." },
    @{ name = "sms/school-onboarding-service:local"; dockerfile = "services/school-onboarding-service/Dockerfile"; context = "." },
    @{ name = "sms/school-operations-service:local"; dockerfile = "services/school-operations-service/Dockerfile"; context = "." },
    @{ name = "sms/communication-service:local"; dockerfile = "services/communication-service/Dockerfile"; context = "." },
    @{ name = "sms/finance-service:local"; dockerfile = "services/finance-service/Dockerfile"; context = "." },
    @{ name = "sms/subscription-service:local"; dockerfile = "services/subscription-service/Dockerfile"; context = "." },
    @{ name = "sms/api-gateway:local"; dockerfile = "services/api-gateway/Dockerfile"; context = "." },
    @{ name = "sms/ai-interaction-service:local"; dockerfile = "services/ai-interaction-service/Dockerfile"; context = "." },
    @{ name = "sms/mcp-server:local"; dockerfile = "services/mcp-server/Dockerfile"; context = "." },
    @{ name = "sms/frontend:local"; dockerfile = "frontend/Dockerfile"; context = "frontend" }
)

Write-Host "Building images in parallel (limit: $MaxParallel)..."
Push-Location $repoRoot

$jobs = @()
foreach ($img in $images) {
    while (($jobs | Where-Object { $_.State -eq 'Running' }).Count -ge $MaxParallel) {
        Start-Sleep -Seconds 1
    }
    
    $job = Start-Job -ScriptBlock {
        param($name, $dockerfile, $context)
        docker build --progress=plain -t $name -f $dockerfile $context
    } -ArgumentList $img.name, $img.dockerfile, $img.context
    $jobs += $job
}

Wait-Job $jobs
Receive-Job $jobs

foreach ($img in $images) {
    Write-Host "Loading $($img.name) into kind cluster '$ClusterName'..."
    & $kindExe load docker-image $img.name --name $ClusterName
}

Pop-Location
Write-Host "Build and load complete."
