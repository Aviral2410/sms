#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"

services=(
  auth-service
  school-onboarding-service
  school-operations-service
  communication-service
  finance-service
  subscription-service
  api-gateway
  ai-interaction-service
)

for service in "${services[@]}"; do
  echo "[backend-tests] Running tests for ${service}"
  (cd "$ROOT_DIR/services/${service}" && bash ./gradlew --no-daemon test)
done

echo "[backend-tests] All backend suites passed"
