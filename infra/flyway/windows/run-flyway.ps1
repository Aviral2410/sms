param(
    [string]$Schema = "identity",
    [string]$Locations = "filesystem:/flyway/sql/identity",
    [string]$DbHost = "localhost",
    [string]$DbPort = "5432",
    [string]$DbName = "sms_platform",
    [string]$DbUser = "sms_admin",
    [string]$DbPassword = "change-me"
)

$ErrorActionPreference = "Stop"
$repoRoot = Split-Path -Parent (Split-Path -Parent (Split-Path $PSScriptRoot -Parent))
$flywayRoot = Join-Path $repoRoot "infra\flyway"

$jdbcUrl = "jdbc:postgresql://$DbHost`:$DbPort/$DbName"

docker run --rm `
  -v "${flywayRoot}:/flyway" `
  flyway/flyway:10.17.3 `
  -url="$jdbcUrl" `
  -user="$DbUser" `
  -password="$DbPassword" `
  -schemas="$Schema" `
  -locations="$Locations" `
  migrate
