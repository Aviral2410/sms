#!/usr/bin/env bash
set -euo pipefail

APPLY_EXAMPLES="${APPLY_EXAMPLES:-false}"
TOOLS_ROOT="${TOOLS_ROOT:-/opt/sms-k8s/tools}"
HELM_BIN="$TOOLS_ROOT/bin/helm"
KUBECTL_BIN="$TOOLS_ROOT/bin/kubectl"
SCRIPT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd -- "$SCRIPT_DIR/../../.." && pwd)"

"$HELM_BIN" repo add external-secrets https://charts.external-secrets.io
"$HELM_BIN" repo update
"$HELM_BIN" upgrade --install external-secrets external-secrets/external-secrets --namespace external-secrets --create-namespace

if [[ "$APPLY_EXAMPLES" == "true" ]]; then
  "$KUBECTL_BIN" apply -f "$REPO_ROOT/infra/kubernetes/operations/secrets/azure-key-vault-clustersecretstore.example.yaml"
  "$KUBECTL_BIN" apply -f "$REPO_ROOT/infra/kubernetes/operations/secrets/sms-external-secret.example.yaml"
fi
