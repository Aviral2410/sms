#!/usr/bin/env bash
set -euo pipefail

CLUSTER_NAME="${1:-sms-local}"
TOOLS_ROOT="${TOOLS_ROOT:-/opt/sms-k8s/tools}"
KUBE_ROOT="${KUBE_ROOT:-/opt/sms-k8s}"
MAX_PARALLEL="${MAX_PARALLEL:-4}"
SCRIPT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd -- "$SCRIPT_DIR/../../.." && pwd)"
export KUBECONFIG="$KUBE_ROOT/.kube/config"

MAX_PARALLEL="$MAX_PARALLEL" "$SCRIPT_DIR/build-images.sh" "$CLUSTER_NAME"
"$TOOLS_ROOT/bin/kubectl" create namespace sms --dry-run=client -o yaml | "$TOOLS_ROOT/bin/kubectl" apply -f -
if ! "$TOOLS_ROOT/bin/kubectl" -n sms get secret sms-secrets >/dev/null 2>&1; then
  echo "Missing secret 'sms/sms-secrets'. Create it via Vault+ESO (recommended) before deploying."
  exit 1
fi
"$TOOLS_ROOT/bin/kubectl" apply -k "$REPO_ROOT/infra/kubernetes/overlays/local"
"$TOOLS_ROOT/bin/kubectl" rollout status statefulset/postgres -n sms --timeout=300s
"$TOOLS_ROOT/bin/kubectl" wait --for=condition=complete job/db-repair -n sms --timeout=300s

for deployment in auth-service school-onboarding-service school-operations-service communication-service finance-service subscription-service api-gateway ai-interaction-service mcp-server frontend; do
  "$TOOLS_ROOT/bin/kubectl" rollout status deployment/$deployment -n sms --timeout=300s
done

echo "Frontend:    http://localhost:30080"
echo "API Gateway: http://localhost:30000"
echo "MCP Server:  http://localhost:30084/health"
