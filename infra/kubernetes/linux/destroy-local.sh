#!/usr/bin/env bash
set -euo pipefail

CLUSTER_NAME="${1:-sms-local}"
TOOLS_ROOT="${TOOLS_ROOT:-/opt/sms-k8s/tools}"
"$TOOLS_ROOT/bin/kind" delete cluster --name "$CLUSTER_NAME"
