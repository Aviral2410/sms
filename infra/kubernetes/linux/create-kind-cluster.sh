#!/usr/bin/env bash
set -euo pipefail

CLUSTER_NAME="${1:-sms-local}"
TOOLS_ROOT="${TOOLS_ROOT:-/opt/sms-k8s/tools}"
KUBE_ROOT="${KUBE_ROOT:-/opt/sms-k8s}"
SCRIPT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd -- "$SCRIPT_DIR/../../.." && pwd)"

mkdir -p "$KUBE_ROOT/.kube"
export KUBECONFIG="$KUBE_ROOT/.kube/config"

"$TOOLS_ROOT/bin/kind" create cluster --name "$CLUSTER_NAME" --config "$REPO_ROOT/infra/kubernetes/kind/kind-config.yaml" --kubeconfig "$KUBECONFIG"
"$TOOLS_ROOT/bin/kubectl" cluster-info

echo "Cluster $CLUSTER_NAME is ready"
echo "KUBECONFIG=$KUBECONFIG"
