param(
    [string]$ClusterName = "sms-local",
    [string]$ToolsRoot = "D:\sms-k8s\tools",
    [int]$MaxParallel = 4
)

$ErrorActionPreference = "Stop"

$repoRoot = Split-Path -Parent (Split-Path -Parent (Split-Path -Parent $PSScriptRoot))
$kindExe = Join-Path $ToolsRoot "bin\kind.exe"

$images = @(
    @{ Name = "sms/auth-service:local"; Dockerfile = "services/auth-service/Dockerfile"; Context = "." },
    @{ Name = "sms/school-onboarding-service:local"; Dockerfile = "services/school-onboarding-service/Dockerfile"; Context = "." },
    @{ Name = "sms/school-operations-service:local"; Dockerfile = "services/school-operations-service/Dockerfile"; Context = "." },
    @{ Name = "sms/communication-service:local"; Dockerfile = "services/communication-service/Dockerfile"; Context = "." },
    @{ Name = "sms/finance-service:local"; Dockerfile = "services/finance-service/Dockerfile"; Context = "." },
    @{ Name = "sms/subscription-service:local"; Dockerfile = "services/subscription-service/Dockerfile"; Context = "." },
    @{ Name = "sms/api-gateway:local"; Dockerfile = "services/api-gateway/Dockerfile"; Context = "." },
    @{ Name = "sms/mcp-server:local"; Dockerfile = "services/mcp-server/Dockerfile"; Context = "." },
    @{ Name = "sms/frontend:local"; Dockerfile = "frontend/Dockerfile"; Context = "frontend" }
)

Push-Location $repoRoot
try {
    $jobs = @()
    foreach ($image in $images) {
        while (($jobs | Where-Object { $_.State -eq "Running" }).Count -ge $MaxParallel) {
            $finished = Wait-Job -Job $jobs -Any
            if ($finished) {
                Receive-Job -Job $finished
                if ($finished.State -ne "Completed") {
                    throw "Build job failed for $($finished.Name)"
                }
            }
            $jobs = $jobs | Where-Object { $_.State -eq "Running" }
        }

        $jobs += Start-Job -Name $image.Name -ScriptBlock {
            param($root, $name, $dockerfile, $context)
            Set-Location $root
            Write-Host "Building $name"
            & docker build --progress plain -t $name -f $dockerfile $context 2>&1 | ForEach-Object {
                Write-Host $_
            }
            if ($LASTEXITCODE -ne 0) {
                throw "docker build failed for $name"
            }
        } -ArgumentList $repoRoot, $image.Name, $image.Dockerfile, $image.Context
    }

    if ($jobs.Count -gt 0) {
        Wait-Job -Job $jobs | Out-Null
        $failedJobs = @()
        foreach ($job in $jobs) {
            Receive-Job -Job $job
            if ($job.State -ne "Completed") {
                $failedJobs += $job.Name
            }
        }
        if ($failedJobs.Count -gt 0) {
            throw ("Build job(s) failed: " + ($failedJobs -join ", "))
        }
    }

    foreach ($image in $images) {
        Write-Host "Loading $($image.Name) into kind"
        & $kindExe load docker-image $image.Name --name $ClusterName
    }
}
finally {
    Get-Job -ErrorAction SilentlyContinue | Remove-Job -Force -ErrorAction SilentlyContinue
    Pop-Location
}
