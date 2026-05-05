#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"

echo "[frontend-tests] Installing frontend dependencies"
(cd "$ROOT_DIR/frontend" && npm ci)

echo "[frontend-tests] Running Vitest suite"
(cd "$ROOT_DIR/frontend" && npm run test)

echo "[frontend-tests] Frontend suite passed"
