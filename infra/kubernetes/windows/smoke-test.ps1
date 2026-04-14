param(
    [string]$ToolsRoot = "D:\sms-k8s\tools"
)

$ErrorActionPreference = "Stop"
$kubectlExe = Join-Path $ToolsRoot "bin\kubectl.exe"

$checks = @(
    @{ Name = 'frontend'; Url = 'http://localhost:30080'; Expected = 200 },
    @{ Name = 'gateway-health'; Url = 'http://localhost:30000/actuator/health'; Expected = 200 },
    @{ Name = 'mcp-health'; Url = 'http://localhost:30084/health'; Expected = 200 }
)

foreach ($check in $checks) {
    Write-Host "Checking $($check.Name): $($check.Url)"
    $response = Invoke-WebRequest -Uri $check.Url -UseBasicParsing -TimeoutSec 20
    if ($response.StatusCode -ne $check.Expected) {
        throw "Expected status $($check.Expected) for $($check.Name), got $($response.StatusCode)"
    }
}

& $kubectlExe get pods -n sms
Write-Host "Smoke test passed."
