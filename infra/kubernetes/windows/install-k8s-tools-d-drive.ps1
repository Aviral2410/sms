param(
    [string]$ToolsRoot = "D:\sms-k8s\tools"
)

$ErrorActionPreference = "Stop"

New-Item -ItemType Directory -Force -Path $ToolsRoot | Out-Null
New-Item -ItemType Directory -Force -Path (Join-Path $ToolsRoot "bin") | Out-Null
New-Item -ItemType Directory -Force -Path (Join-Path $ToolsRoot "downloads") | Out-Null

$binDir = Join-Path $ToolsRoot "bin"
$downloadsDir = Join-Path $ToolsRoot "downloads"

function Download-File {
    param(
        [string]$Url,
        [string]$Destination
    )

    Write-Host "Downloading $Url"
    Invoke-WebRequest -Uri $Url -OutFile $Destination
}

$kubectlVersion = (Invoke-RestMethod -Uri "https://dl.k8s.io/release/stable.txt").Trim()
$kubectlPath = Join-Path $binDir "kubectl.exe"
Download-File -Url "https://dl.k8s.io/release/$kubectlVersion/bin/windows/amd64/kubectl.exe" -Destination $kubectlPath

$kindPath = Join-Path $binDir "kind.exe"
Download-File -Url "https://kind.sigs.k8s.io/dl/v0.23.0/kind-windows-amd64" -Destination $kindPath

$helmZip = Join-Path $downloadsDir "helm-v3.15.4-windows-amd64.zip"
Download-File -Url "https://get.helm.sh/helm-v3.15.4-windows-amd64.zip" -Destination $helmZip
Expand-Archive -Path $helmZip -DestinationPath $downloadsDir -Force
Copy-Item -Path (Join-Path $downloadsDir "windows-amd64\helm.exe") -Destination (Join-Path $binDir "helm.exe") -Force

Write-Host ""
Write-Host "Tools installed under $binDir"
Write-Host "Recommended PATH update for the current shell:"
Write-Host "`$env:Path = '$binDir;' + `$env:Path"
