#!/usr/bin/env bash
set -euo pipefail

RELEASE_NAME="${1:-sms-platform}"
NAMESPACE="${2:-sms}"
VALUES_FILE="${3:-infra/helm/sms-platform/values-production.yaml}"
REGISTRY="${4:-}"
TOOLS_ROOT="${TOOLS_ROOT:-/opt/sms-k8s/tools}"
SCRIPT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd -- "$SCRIPT_DIR/../../../.." && pwd)"
CHART_PATH="$REPO_ROOT/infra/helm/sms-platform"

if [[ "$VALUES_FILE" != /* ]]; then
  VALUES_FILE="$REPO_ROOT/$VALUES_FILE"
fi

cmd=("$TOOLS_ROOT/bin/helm" upgrade --install "$RELEASE_NAME" "$CHART_PATH" --namespace "$NAMESPACE" --create-namespace -f "$VALUES_FILE" --atomic --wait --timeout 15m)
if [[ -n "$REGISTRY" ]]; then
  cmd+=(--set-string "global.imageRegistry=${REGISTRY}")
fi
"${cmd[@]}"
