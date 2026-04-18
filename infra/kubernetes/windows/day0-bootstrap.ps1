param(
    [string]$ClusterName = "sms-local",
    [string]$ToolsRoot = "D:\sms-k8s\tools",
    [string]$KubeRoot = "D:\sms-k8s",
    [string]$RepoRoot = "",
    [switch]$InstallTools,
    [switch]$InstallMonitoring,
    [switch]$InstallArgoCd,
    [switch]$InstallVaultAndEso,
    [switch]$DeploySmsViaArgoCd
)

$ErrorActionPreference = "Stop"

if ([string]::IsNullOrWhiteSpace($RepoRoot)) {
    $RepoRoot = Split-Path -Parent (Split-Path -Parent (Split-Path -Parent $PSScriptRoot))
}

Write-Host "RepoRoot: $RepoRoot"

if (-not (Get-Command docker -ErrorAction SilentlyContinue)) {
    throw "Docker Desktop is required. Install Docker Desktop and ensure the engine is running."
}

try { docker version | Out-Null } catch { throw "Docker engine not reachable. Start Docker Desktop." }

if ($InstallTools) {
    & (Join-Path $RepoRoot "infra\\kubernetes\\windows\\install-k8s-tools-d-drive.ps1")
}

$kindExe = Join-Path $ToolsRoot "bin\\kind.exe"
$kubectlExe = Join-Path $ToolsRoot "bin\\kubectl.exe"
$helmExe = Join-Path $ToolsRoot "bin\\helm.exe"

if (-not (Test-Path $kindExe)) { throw "kind not found: $kindExe (run with -InstallTools once)" }
if (-not (Test-Path $kubectlExe)) { throw "kubectl not found: $kubectlExe (run with -InstallTools once)" }
if (-not (Test-Path $helmExe)) { throw "helm not found: $helmExe (run with -InstallTools once)" }

$kubeConfigDir = Join-Path $KubeRoot ".kube"
$kubeConfigPath = Join-Path $kubeConfigDir "config"
New-Item -ItemType Directory -Force -Path $kubeConfigDir | Out-Null
$env:KUBECONFIG = $kubeConfigPath

$existingClusters = & $kindExe get clusters 2>$null
if (-not ($existingClusters -contains $ClusterName)) {
    & (Join-Path $RepoRoot "infra\\kubernetes\\windows\\create-kind-cluster.ps1") -ClusterName $ClusterName -ToolsRoot $ToolsRoot -KubeRoot $KubeRoot
} else {
    & $kindExe export kubeconfig --name $ClusterName --kubeconfig $kubeConfigPath | Out-Null
}

if ($InstallVaultAndEso) {
    & (Join-Path $RepoRoot "infra\\kubernetes\\windows\\install-external-secrets.ps1")
    & (Join-Path $RepoRoot "infra\\kubernetes\\windows\\install-vault.ps1") -ToolsRoot $ToolsRoot

    & $kubectlExe apply -f (Join-Path $RepoRoot "infra\\kubernetes\\operations\\secrets\\vault\\vault-clustersecretstore.local-token.yaml")
    & $kubectlExe apply -f (Join-Path $RepoRoot "infra\\kubernetes\\operations\\secrets\\vault\\sms-externalsecret.vault-kv2.yaml")

    Write-Host ""
    Write-Host "Next: put values into Vault KV v2 at path secret/sms/platform (see docs/keys-and-urls.md)."
}

if ($InstallMonitoring) {
    & (Join-Path $RepoRoot "infra\\kubernetes\\windows\\install-monitoring.ps1") -ToolsRoot $ToolsRoot
}

if ($InstallArgoCd) {
    & (Join-Path $RepoRoot "infra\\kubernetes\\windows\\install-argocd.ps1") -ToolsRoot $ToolsRoot
}

if ($DeploySmsViaArgoCd) {
    if (-not (Get-Command git -ErrorAction SilentlyContinue)) {
        throw "git is required to auto-fill Argo CD repoURL placeholders."
    }

    $origin = (git -C $RepoRoot remote get-url origin) 2>$null
    if ([string]::IsNullOrWhiteSpace($origin)) {
        throw "Could not detect git remote 'origin'. Set it or edit infra/argocd/* repoURL manually."
    }

    # Argo CD repoURL should be HTTPS for public repos (simplest for local kind).
    if ($origin -match '^git@github\.com:(.+?)\.git$') {
        $origin = "https://github.com/$($Matches[1]).git"
    }

    $paths = @(
        (Join-Path $RepoRoot "infra\\argocd\\root-app.yaml"),
        (Join-Path $RepoRoot "infra\\argocd\\apps\\sms-platform.yaml")
    )
    foreach ($path in $paths) {
        (Get-Content $path) -replace "REPLACE_ME_GIT_REPO_URL", $origin | Set-Content $path
    }

    & $kubectlExe apply -f (Join-Path $RepoRoot "infra\\argocd\\project.yaml")
    & $kubectlExe apply -f (Join-Path $RepoRoot "infra\\argocd\\root-app.yaml")

    Write-Host ""
    Write-Host "Argo CD root app applied. Open Argo CD UI to watch sync."
}

Write-Host ""
Write-Host "Done."
Write-Host "App URLs:"
Write-Host "  Frontend:    http://localhost:30080"
Write-Host "  API Gateway: http://localhost:30000"
Write-Host "  MCP Health:  http://localhost:30084/health"
Write-Host ""
Write-Host "Docs:"
Write-Host "  docs/secrets-vault-oss.md"
Write-Host "  docs/gitops-argocd-local.md"
Write-Host "  docs/endpoints.md"
