param(
    [string]$ToolsRoot = "D:\sms-k8s\tools",
    [string]$KubeRoot = "D:\sms-k8s",
    [string]$Namespace = "sms",
    # GHCR pull secret — provide a GitHub PAT with read:packages scope
    [string]$GhcrUsername = "Aviral2410",
    [string]$GhcrToken = "",
    # Postgres
    [string]$PostgresUser = "sms_admin",
    [string]$PostgresPassword = "change-me",
    # JWT
    [string]$JwtSecretKey = "change_me_change_me_change_me_2026",
    # Internal
    [string]$InternalApiKey = "dev-internal-api-key",
    [string]$PlatformConfigEncryptionKey = "dev-platform-config-encryption-key",
    # MCP
    [string]$McpRequireAuth = "true",
    [string]$McpEnableDockerInsights = "false",
    # Superadmin bootstrap  (set Enabled to "false" after first deploy to lock it down)
    [string]$BootstrapEnabled = "true",
    [string]$BootstrapEmail = "superadmin@sms.local",
    [string]$BootstrapPassword = "SuperAdmin@2026!",
    [string]$BootstrapFullName = "Platform Super Admin",
    # AI providers (leave empty if not used)
    [string]$LlmProvider = "",
    [string]$OpenaiApiKey = "",
    [string]$OpenaiModel = "",
    [string]$GeminiApiKey = "",
    [string]$OpenrouterApiKey = "",
    [string]$AnthropicApiKey = "",
    # EMQX dashboard (leave empty to skip)
    [string]$EmqxDashboardUsername = "admin",
    [string]$EmqxDashboardPassword = "",
    # AI rate limits JSON (leave empty to disable)
    [string]$AiToolRateLimitsJson = ""
)

$ErrorActionPreference = "Stop"
$kubectlExe = Join-Path $ToolsRoot "bin\kubectl.exe"
$kubeConfigPath = Join-Path $KubeRoot ".kube\config"
$env:KUBECONFIG = $kubeConfigPath

Write-Host "=== SMS Secrets Bootstrap ===" -ForegroundColor Cyan

# 1. Ensure namespace exists
Write-Host "`n[1/3] Ensuring namespace '$Namespace'..."
& $kubectlExe create namespace $Namespace --dry-run=client -o yaml | & $kubectlExe apply -f -

# 2. Create GHCR imagePullSecret (if credentials provided)
if (-not [string]::IsNullOrWhiteSpace($GhcrToken) -and -not [string]::IsNullOrWhiteSpace($GhcrUsername)) {
    Write-Host "`n[2a] Creating GHCR pull secret 'ghcr-pull-secret'..."
    & $kubectlExe create secret docker-registry ghcr-pull-secret `
        -n $Namespace `
        --docker-server=ghcr.io `
        --docker-username=$GhcrUsername `
        --docker-password=$GhcrToken `
        --dry-run=client -o yaml | & $kubectlExe apply -f -
    Write-Host "     ghcr-pull-secret created/updated." -ForegroundColor Green
}
else {
    Write-Host "`n[2a] Skipping ghcr-pull-secret (no -GhcrUsername / -GhcrToken provided)." -ForegroundColor Yellow
    Write-Host "     Private GHCR images will fail to pull without this secret." -ForegroundColor Yellow
    Write-Host "     Re-run with -GhcrUsername <github-user> -GhcrToken <PAT> to create it."
}

# 3. Create sms-secrets
Write-Host "`n[2b] Creating/updating secret 'sms-secrets'..."
& $kubectlExe create secret generic sms-secrets `
    -n $Namespace `
    --from-literal=POSTGRES_USER=$PostgresUser `
    --from-literal=POSTGRES_PASSWORD=$PostgresPassword `
    --from-literal=JWT_SECRET_KEY=$JwtSecretKey `
    --from-literal=INTERNAL_API_KEY=$InternalApiKey `
    --from-literal=PLATFORM_CONFIG_ENCRYPTION_KEY=$PlatformConfigEncryptionKey `
    --from-literal=MCP_REQUIRE_AUTH=$McpRequireAuth `
    --from-literal=MCP_ENABLE_DOCKER_INSIGHTS=$McpEnableDockerInsights `
    --from-literal=BOOTSTRAP_SUPERADMIN_ENABLED=$BootstrapEnabled `
    --from-literal=BOOTSTRAP_SUPERADMIN_EMAIL=$BootstrapEmail `
    --from-literal=BOOTSTRAP_SUPERADMIN_PASSWORD=$BootstrapPassword `
    --from-literal=BOOTSTRAP_SUPERADMIN_FULL_NAME=$BootstrapFullName `
    --from-literal=LLM_PROVIDER=$LlmProvider `
    --from-literal=OPENAI_API_KEY=$OpenaiApiKey `
    --from-literal=OPENAI_MODEL=$OpenaiModel `
    --from-literal=GEMINI_API_KEY=$GeminiApiKey `
    --from-literal=OPENROUTER_API_KEY=$OpenrouterApiKey `
    --from-literal=ANTHROPIC_API_KEY=$AnthropicApiKey `
    --from-literal=EMQX_DASHBOARD_USERNAME=$EmqxDashboardUsername `
    --from-literal=EMQX_DASHBOARD_PASSWORD=$EmqxDashboardPassword `
    --from-literal=AI_TOOL_RATE_LIMITS_JSON=$AiToolRateLimitsJson `
    --dry-run=client -o yaml | & $kubectlExe apply -f -

Write-Host "     sms-secrets created/updated." -ForegroundColor Green

Write-Host "`n[3/3] Done." -ForegroundColor Cyan
Write-Host ""
Write-Host "Next steps:"
Write-Host "  - Trigger ArgoCD sync via the UI (https://localhost:30443)" 
Write-Host "    or re-enable auto-sync once GHCR pull secret is configured."
Write-Host ""
Write-Host "Production note for BOOTSTRAP_SUPERADMIN_ENABLED:"
Write-Host "  - The superadmin account is created ONCE on first auth-service startup."
Write-Host "  - After verifying login works, update the secret with BOOTSTRAP_SUPERADMIN_ENABLED=false"
Write-Host "  - This prevents any re-seeding on pod restarts."
Write-Host "  - The password is bcrypt-hashed in the DB; rotate it via the admin API after first login."
