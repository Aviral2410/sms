#!/usr/bin/env bash
set -euo pipefail

RELEASE_NAME="${1:-sms-platform}"
VALUES_FILE="${2:-infra/helm/sms-platform/values-production.yaml}"
TOOLS_ROOT="${TOOLS_ROOT:-/opt/sms-k8s/tools}"
SCRIPT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd -- "$SCRIPT_DIR/../../../.." && pwd)"
CHART_PATH="$REPO_ROOT/infra/helm/sms-platform"

if [[ "$VALUES_FILE" != /* ]]; then
  VALUES_FILE="$REPO_ROOT/$VALUES_FILE"
fi

"$TOOLS_ROOT/bin/helm" template "$RELEASE_NAME" "$CHART_PATH" -f "$VALUES_FILE"
