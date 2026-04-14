param(
    [string]$EnvFile = ".env",
    [string]$Namespace = "sms",
    [string]$ToolsRoot = "D:\sms-k8s\tools"
)

$ErrorActionPreference = "Stop"

$repoRoot = Split-Path -Parent (Split-Path -Parent (Split-Path -Parent $PSScriptRoot))
$kubectlExe = Join-Path $ToolsRoot "bin\kubectl.exe"
$resolvedEnvFile = if ([System.IO.Path]::IsPathRooted($EnvFile)) { $EnvFile } else { Join-Path $repoRoot $EnvFile }
$fallbackEnvFile = Join-Path $repoRoot ".env.example"

function Read-DotEnv {
    param([string]$Path)

    $values = @{}
    if (-not (Test-Path $Path)) {
        return $values
    }

    foreach ($line in Get-Content $Path) {
        $trimmed = $line.Trim()
        if ([string]::IsNullOrWhiteSpace($trimmed) -or $trimmed.StartsWith("#")) {
            continue
        }

        $parts = $trimmed -split "=", 2
        if ($parts.Count -eq 2) {
            $values[$parts[0].Trim()] = $parts[1].Trim()
        }
    }

    return $values
}

function Escape-YamlSingleQuote {
    param([string]$Value)
    return $Value.Replace("'", "''")
}

function Decode-Base64String {
    param([string]$Value)

    if ([string]::IsNullOrWhiteSpace($Value)) {
        return ""
    }

    return [Text.Encoding]::UTF8.GetString([Convert]::FromBase64String($Value))
}

function Get-ExistingSecretValues {
    param(
        [string]$KubectlExe,
        [string]$SecretName,
        [string]$SecretNamespace
    )

    $values = @{}

    try {
        $json = & $KubectlExe get secret $SecretName -n $SecretNamespace -o json 2>$null
        if (-not [string]::IsNullOrWhiteSpace($json)) {
            $secret = $json | ConvertFrom-Json
            if ($null -ne $secret.data) {
                foreach ($property in $secret.data.PSObject.Properties) {
                    $values[$property.Name] = Decode-Base64String -Value ([string]$property.Value)
                }
            }
        }
    }
    catch {
        # Secret does not exist yet or the cluster is not reachable.
    }

    return $values
}

$managedDefaults = [ordered]@{
    POSTGRES_USER = "sms_admin"
    POSTGRES_PASSWORD = "change-me"
    JWT_SECRET_KEY = "change_me_change_me_change_me_2026"
    EMQX_DASHBOARD_USERNAME = "admin"
    EMQX_DASHBOARD_PASSWORD = "change-me"
    BOOTSTRAP_SUPERADMIN_ENABLED = "false"
    BOOTSTRAP_SUPERADMIN_EMAIL = "superadmin@sms.local"
    BOOTSTRAP_SUPERADMIN_PASSWORD = ""
    BOOTSTRAP_SUPERADMIN_FULL_NAME = "Platform Super Admin"
    INTERNAL_API_KEY = "dev-internal-api-key"
    PLATFORM_CONFIG_ENCRYPTION_KEY = "dev-platform-config-encryption-key"
    MCP_REQUIRE_AUTH = "true"
    MCP_ENABLE_DOCKER_INSIGHTS = "false"
    LLM_PROVIDER = "auto"
    GEMINI_API_KEY = ""
    OPENAI_API_KEY = ""
    OPENROUTER_API_KEY = ""
    ANTHROPIC_API_KEY = ""
}

$existingSecretValues = Get-ExistingSecretValues -KubectlExe $kubectlExe -SecretName "sms-secrets" -SecretNamespace $Namespace
$envValues = Read-DotEnv -Path $fallbackEnvFile
$primaryValues = Read-DotEnv -Path $resolvedEnvFile
foreach ($entry in $primaryValues.GetEnumerator()) {
    $envValues[$entry.Key] = $entry.Value
}

$secretValues = [ordered]@{}

foreach ($entry in $existingSecretValues.GetEnumerator()) {
    $secretValues[$entry.Key] = $entry.Value
}

foreach ($entry in $managedDefaults.GetEnumerator()) {
    if ($envValues.ContainsKey($entry.Key)) {
        $secretValues[$entry.Key] = $envValues[$entry.Key]
    }
    elseif ($existingSecretValues.ContainsKey($entry.Key)) {
        $secretValues[$entry.Key] = $existingSecretValues[$entry.Key]
    }
    else {
        $secretValues[$entry.Key] = $entry.Value
    }
}

$yamlLines = @(
    "apiVersion: v1",
    "kind: Secret",
    "metadata:",
    "  name: sms-secrets",
    "  namespace: $Namespace",
    "type: Opaque",
    "stringData:"
)

foreach ($entry in $secretValues.GetEnumerator()) {
    $yamlLines += "  $($entry.Key): '$([string](Escape-YamlSingleQuote $entry.Value))'"
}

$tempFile = Join-Path ([System.IO.Path]::GetTempPath()) "sms-secrets.yaml"
Set-Content -Path $tempFile -Value ($yamlLines -join "`n")

& $kubectlExe apply -f $tempFile
Remove-Item $tempFile -Force
