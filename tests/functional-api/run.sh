#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

if [[ -f "$SCRIPT_DIR/.env" ]]; then
  # shellcheck disable=SC1091
  source "$SCRIPT_DIR/.env"
fi

SCENARIO="${1:-onboarding}"

case "$SCENARIO" in
  onboarding)
    # shellcheck disable=SC1091
    source "$SCRIPT_DIR/scenarios/onboarding_flow.sh"
    run_onboarding_flow
    ;;
  *)
    echo "Unknown scenario: $SCENARIO" >&2
    echo "Available scenarios: onboarding" >&2
    exit 2
    ;;
esac
