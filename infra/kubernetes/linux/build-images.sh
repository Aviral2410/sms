#!/usr/bin/env bash
set -euo pipefail

CLUSTER_NAME="${1:-sms-local}"
MAX_PARALLEL="${MAX_PARALLEL:-4}"
SCRIPT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd -- "$SCRIPT_DIR/../../.." && pwd)"
TOOLS_ROOT="${TOOLS_ROOT:-/opt/sms-k8s/tools}"

images=(
  "sms/auth-service:local services/auth-service/Dockerfile ."
  "sms/school-onboarding-service:local services/school-onboarding-service/Dockerfile ."
  "sms/school-operations-service:local services/school-operations-service/Dockerfile ."
  "sms/communication-service:local services/communication-service/Dockerfile ."
  "sms/finance-service:local services/finance-service/Dockerfile ."
  "sms/subscription-service:local services/subscription-service/Dockerfile ."
  "sms/api-gateway:local services/api-gateway/Dockerfile ."
  "sms/ai-interaction-service:local services/ai-interaction-service/Dockerfile ."
  "sms/mcp-server:local services/mcp-server/Dockerfile ."
  "sms/frontend:local frontend/Dockerfile frontend"
)

cd "$REPO_ROOT"
build_one() {
  local item="$1"
  read -r name dockerfile context <<<"$item"
  echo "Building $name"
  docker build --progress=plain -t "$name" -f "$dockerfile" "$context"
}

declare -a pids=()
for item in "${images[@]}"; do
  build_one "$item" &
  pids+=("$!")
  if (( ${#pids[@]} >= MAX_PARALLEL )); then
    if ! wait "${pids[0]}"; then
      exit 1
    fi
    pids=("${pids[@]:1}")
  fi
done

for pid in "${pids[@]}"; do
  wait "$pid"
done

for item in "${images[@]}"; do
  read -r name _ <<<"$item"
  echo "Loading $name into kind"
  "$TOOLS_ROOT/bin/kind" load docker-image "$name" --name "$CLUSTER_NAME"
done
