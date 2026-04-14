#!/usr/bin/env bash
set -euo pipefail

check_url() {
  local name="$1"
  local url="$2"
  echo "Checking $name: $url"
  local code
  code="$(curl -o /dev/null -s -w '%{http_code}' "$url")"
  [[ "$code" == "200" ]] || { echo "Expected 200 for $name, got $code"; exit 1; }
}

check_url frontend http://localhost:30080
check_url gateway-health http://localhost:30000/actuator/health
check_url mcp-health http://localhost:30084/health

echo "Smoke test passed."
