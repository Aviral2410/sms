#!/usr/bin/env bash
set -euo pipefail

ENV_FILE="${1:-.env}"
NAMESPACE="${NAMESPACE:-sms}"
TOOLS_ROOT="${TOOLS_ROOT:-/opt/sms-k8s/tools}"
SCRIPT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd -- "$SCRIPT_DIR/../../.." && pwd)"

if [[ "$ENV_FILE" != /* ]]; then
  ENV_FILE="$REPO_ROOT/$ENV_FILE"
fi

FALLBACK_ENV_FILE="$REPO_ROOT/.env.example"
TMP_FILE="$(mktemp)"
declare -A values

load_existing_secret() {
  if "$TOOLS_ROOT/bin/kubectl" get secret sms-secrets -n "$NAMESPACE" >/dev/null 2>&1; then
    while IFS='=' read -r key value || [[ -n "$key" ]]; do
      [[ -z "$key" ]] && continue
      values["$key"]="$value"
    done < <("$TOOLS_ROOT/bin/kubectl" get secret sms-secrets -n "$NAMESPACE" -o go-template='{{range $k,$v := .data}}{{printf "%s=%s\n" $k ($v | base64decode)}}{{end}}')
  fi
}

load_env_file() {
  local file="$1"
  [[ -f "$file" ]] || return 0
  while IFS= read -r line || [[ -n "$line" ]]; do
    line="${line%%$'\r'}"
    [[ -z "$line" || "$line" =~ ^# ]] && continue
    [[ "$line" == *=* ]] || continue
    local key="${line%%=*}"
    local value="${line#*=}"
    values["$key"]="$value"
  done < "$file"
}

yaml_escape() {
  printf "%s" "$1" | sed "s/'/''/g"
}

load_env_file "$FALLBACK_ENV_FILE"
load_existing_secret
load_env_file "$ENV_FILE"

cat > "$TMP_FILE" <<EOF
apiVersion: v1
kind: Secret
metadata:
  name: sms-secrets
  namespace: $NAMESPACE
type: Opaque
stringData:
  POSTGRES_USER: '$(yaml_escape "${values[POSTGRES_USER]:-sms_admin}")'
  POSTGRES_PASSWORD: '$(yaml_escape "${values[POSTGRES_PASSWORD]:-change-me}")'
  JWT_SECRET_KEY: '$(yaml_escape "${values[JWT_SECRET_KEY]:-change_me_change_me_change_me_2026}")'
  EMQX_DASHBOARD_USERNAME: '$(yaml_escape "${values[EMQX_DASHBOARD_USERNAME]:-admin}")'
  EMQX_DASHBOARD_PASSWORD: '$(yaml_escape "${values[EMQX_DASHBOARD_PASSWORD]:-change-me}")'
  BOOTSTRAP_SUPERADMIN_ENABLED: '$(yaml_escape "${values[BOOTSTRAP_SUPERADMIN_ENABLED]:-false}")'
  BOOTSTRAP_SUPERADMIN_EMAIL: '$(yaml_escape "${values[BOOTSTRAP_SUPERADMIN_EMAIL]:-superadmin@sms.local}")'
  BOOTSTRAP_SUPERADMIN_PASSWORD: '$(yaml_escape "${values[BOOTSTRAP_SUPERADMIN_PASSWORD]:-}")'
  BOOTSTRAP_SUPERADMIN_FULL_NAME: '$(yaml_escape "${values[BOOTSTRAP_SUPERADMIN_FULL_NAME]:-Platform Super Admin}")'
  INTERNAL_API_KEY: '$(yaml_escape "${values[INTERNAL_API_KEY]:-dev-internal-api-key}")'
  PLATFORM_CONFIG_ENCRYPTION_KEY: '$(yaml_escape "${values[PLATFORM_CONFIG_ENCRYPTION_KEY]:-dev-platform-config-encryption-key}")'
  MCP_REQUIRE_AUTH: '$(yaml_escape "${values[MCP_REQUIRE_AUTH]:-true}")'
  MCP_ENABLE_DOCKER_INSIGHTS: '$(yaml_escape "${values[MCP_ENABLE_DOCKER_INSIGHTS]:-false}")'
  LLM_PROVIDER: '$(yaml_escape "${values[LLM_PROVIDER]:-auto}")'
  GEMINI_API_KEY: '$(yaml_escape "${values[GEMINI_API_KEY]:-}")'
  OPENAI_API_KEY: '$(yaml_escape "${values[OPENAI_API_KEY]:-}")'
  OPENROUTER_API_KEY: '$(yaml_escape "${values[OPENROUTER_API_KEY]:-}")'
  ANTHROPIC_API_KEY: '$(yaml_escape "${values[ANTHROPIC_API_KEY]:-}")'
EOF

if ((${#values[@]} > 0)); then
  for key in "${!values[@]}"; do
    case "$key" in
      POSTGRES_USER|POSTGRES_PASSWORD|JWT_SECRET_KEY|EMQX_DASHBOARD_USERNAME|EMQX_DASHBOARD_PASSWORD|BOOTSTRAP_SUPERADMIN_ENABLED|BOOTSTRAP_SUPERADMIN_EMAIL|BOOTSTRAP_SUPERADMIN_PASSWORD|BOOTSTRAP_SUPERADMIN_FULL_NAME|INTERNAL_API_KEY|PLATFORM_CONFIG_ENCRYPTION_KEY|MCP_REQUIRE_AUTH|MCP_ENABLE_DOCKER_INSIGHTS|LLM_PROVIDER|GEMINI_API_KEY|OPENAI_API_KEY|OPENROUTER_API_KEY|ANTHROPIC_API_KEY)
        continue
        ;;
      *)
        printf "  %s: '%s'\n" "$key" "$(yaml_escape "${values[$key]}")" >> "$TMP_FILE"
        ;;
    esac
  done
fi

"$TOOLS_ROOT/bin/kubectl" apply -f "$TMP_FILE"
rm -f "$TMP_FILE"
