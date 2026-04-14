#!/usr/bin/env bash
set -euo pipefail

if [[ $# -lt 2 ]]; then
  echo "Usage: $0 <service-name> <tag> [image-repository] [registry] [release-name] [namespace] [values-file]"
  exit 1
fi

SERVICE="$1"
TAG="$2"
IMAGE_REPOSITORY="${3:-}"
REGISTRY="${4:-}"
RELEASE_NAME="${5:-sms-platform}"
NAMESPACE="${6:-sms}"
VALUES_FILE="${7:-infra/helm/sms-platform/values-production.yaml}"
TOOLS_ROOT="${TOOLS_ROOT:-/opt/sms-k8s/tools}"
SCRIPT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd -- "$SCRIPT_DIR/../../../.." && pwd)"
CHART_PATH="$REPO_ROOT/infra/helm/sms-platform"

case "$SERVICE" in
  auth-service) KEY="authService" ;;
  school-onboarding-service) KEY="schoolOnboardingService" ;;
  school-operations-service) KEY="schoolOperationsService" ;;
  communication-service) KEY="communicationService" ;;
  finance-service) KEY="financeService" ;;
  subscription-service) KEY="subscriptionService" ;;
  api-gateway) KEY="apiGateway" ;;
  mcp-server) KEY="mcpServer" ;;
  frontend) KEY="frontend" ;;
  *) echo "Unknown service: $SERVICE"; exit 1 ;;
esac

if [[ "$VALUES_FILE" != /* ]]; then
  VALUES_FILE="$REPO_ROOT/$VALUES_FILE"
fi

cmd=("$TOOLS_ROOT/bin/helm" upgrade --install "$RELEASE_NAME" "$CHART_PATH" --namespace "$NAMESPACE" --create-namespace -f "$VALUES_FILE" --reuse-values --atomic --wait --timeout 15m --set-string "services.${KEY}.image.tag=${TAG}")
if [[ -n "$IMAGE_REPOSITORY" ]]; then
  cmd+=(--set-string "services.${KEY}.image.repository=${IMAGE_REPOSITORY}")
fi
if [[ -n "$REGISTRY" ]]; then
  cmd+=(--set-string "global.imageRegistry=${REGISTRY}")
fi
"${cmd[@]}"
