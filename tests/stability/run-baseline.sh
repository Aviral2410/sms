#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
RUN_FUNCTIONAL=false

if [[ "${1:-}" == "--with-functional" ]]; then
  RUN_FUNCTIONAL=true
fi

echo "[stability-baseline] Running backend controller and service suites"
bash "$ROOT_DIR/tests/ci/run-backend-tests.sh"

echo "[stability-baseline] Running frontend route and onboarding suites"
bash "$ROOT_DIR/tests/ci/run-frontend-tests.sh"

if [[ "$RUN_FUNCTIONAL" == "true" ]]; then
  if [[ -f "$ROOT_DIR/tests/functional-api/.env" ]]; then
    echo "[stability-baseline] Running functional onboarding smoke flow"
    bash "$ROOT_DIR/tests/functional-api/run.sh" onboarding
  else
    echo "[stability-baseline] tests/functional-api/.env is missing; skipping functional onboarding flow"
    exit 1
  fi
else
  echo "[stability-baseline] Functional onboarding flow skipped. Re-run with --with-functional once tests/functional-api/.env is configured."
fi

echo "[stability-baseline] Baseline suite completed"
