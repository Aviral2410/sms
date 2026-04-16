param(
    [string]$VaultAddr = "http://127.0.0.1:30200",
    [string]$VaultToken = "root",
    [string]$GhcrUsername = "Aviral2410",
    [string]$GhcrToken = "", # Pass your new PAT here: -GhcrToken "ghp_..."
    [string]$PostgresUser = "sms_admin",
    [string]$PostgresPassword = "change-me",
    [string]$JwtSecretKey = "change_me_change_me_change_me_2026",
    [string]$BootstrapPassword = "SuperAdmin@2026!"
)

$ErrorActionPreference = "Stop"

Write-Host "=== SMS Vault Seeder ===" -ForegroundColor Cyan

# Define the Rate Limit JSON
$rateLimitJson = @{
    default = @{
        requestsPerMinute = 20
        tokensPerMinute = 40000
    }
    providers = @{
        openai = @{ requestsPerMinute = 10 }
        gemini = @{ requestsPerMinute = 15 }
    }
} | ConvertTo-Json -Compress

# 1. Seed GHCR Pull Credentials
if (-not [string]::IsNullOrWhiteSpace($GhcrToken)) {
    Write-Host "`n[1/2] Seeding GHCR credentials to 'secret/data/sms/ghcr'..."
    $body = @{
        data = @{
            username = $GhcrUsername
            token = $GhcrToken
        }
    } | ConvertTo-Json
    
    Invoke-RestMethod -Uri "$VaultAddr/v1/secret/data/sms/ghcr" -Method Post -Headers @{"X-Vault-Token"=$VaultToken} -Body $body -ContentType "application/json"
    Write-Host "     GHCR seeded successfully." -ForegroundColor Green
}

# 2. Seed Platform Secrets & JSONs
Write-Host "`n[2/2] Seeding Platform secrets to 'secret/data/sms/platform'..."
$platformData = @{
    data = @{
        POSTGRES_USER = $PostgresUser
        POSTGRES_PASSWORD = $PostgresPassword
        JWT_SECRET_KEY = $JwtSecretKey
        INTERNAL_API_KEY = "dev-internal-api-key"
        PLATFORM_CONFIG_ENCRYPTION_KEY = "dev-platform-config-encryption-key"
        BOOTSTRAP_SUPERADMIN_PASSWORD = $BootstrapPassword
        AI_TOOL_RATE_LIMITS_JSON = $rateLimitJson
        # Placeholders for AI Providers
        LLM_PROVIDER = "ollama"
        OLLAMA_BASE_URL = "http://ollama:11434"
        OLLAMA_MODEL = "llama3.2:1b"
        OPENAI_API_KEY = ""
        OPENAI_MODEL = "gpt-4o-mini"
        GEMINI_API_KEY = ""
        OPENROUTER_API_KEY = ""
        ANTHROPIC_API_KEY = ""
    }
} | ConvertTo-Json

Invoke-RestMethod -Uri "$VaultAddr/v1/secret/data/sms/platform" -Method Post -Headers @{"X-Vault-Token"=$VaultToken} -Body $platformData -ContentType "application/json"
Write-Host "     Platform secrets seeded successfully." -ForegroundColor Green

Write-Host "`nDone. All secrets are now in Vault." -ForegroundColor Cyan
Write-Host "Next: Run 'bootstrap-sms-secrets.ps1' (after my upcoming fix) to sync these to your cluster."
