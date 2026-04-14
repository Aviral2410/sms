#!/usr/bin/env bash
set -euo pipefail

if [[ $# -lt 3 ]]; then
  echo "Usage: $0 <service> <image-repository> <tag> [namespace]"
  exit 1
fi

SERVICE="$1"
IMAGE_REPOSITORY="$2"
TAG="$3"
NAMESPACE="${4:-sms}"
TOOLS_ROOT="${TOOLS_ROOT:-/opt/sms-k8s/tools}"
FULL_IMAGE="${IMAGE_REPOSITORY}:${TAG}"

"$TOOLS_ROOT/bin/kubectl" -n "$NAMESPACE" set image deployment/"$SERVICE" "$SERVICE"="$FULL_IMAGE"
"$TOOLS_ROOT/bin/kubectl" -n "$NAMESPACE" rollout status deployment/"$SERVICE" --timeout=300s
