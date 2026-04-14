#!/usr/bin/env bash
set -euo pipefail

TOOLS_ROOT="${TOOLS_ROOT:-/opt/sms-k8s/tools}"
HELM_BIN="$TOOLS_ROOT/bin/helm"
KUBECTL_BIN="$TOOLS_ROOT/bin/kubectl"
SCRIPT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd -- "$SCRIPT_DIR/../../.." && pwd)"
VALUES_FILE="$REPO_ROOT/infra/kubernetes/operations/monitoring/kube-prometheus-stack-values.yaml"
RULES_FILE="$REPO_ROOT/infra/kubernetes/operations/monitoring/prometheus-rules.yaml"

"$HELM_BIN" repo add prometheus-community https://prometheus-community.github.io/helm-charts
"$HELM_BIN" repo update
"$HELM_BIN" upgrade --install monitoring prometheus-community/kube-prometheus-stack --namespace monitoring --create-namespace -f "$VALUES_FILE"
"$KUBECTL_BIN" apply -f "$RULES_FILE"
