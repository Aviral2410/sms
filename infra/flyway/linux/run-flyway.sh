#!/usr/bin/env bash
set -euo pipefail

SCHEMA="${1:-identity}"
LOCATIONS="${2:-filesystem:/flyway/sql/identity}"
DB_HOST="${DB_HOST:-localhost}"
DB_PORT="${DB_PORT:-5432}"
DB_NAME="${DB_NAME:-sms_platform}"
DB_USER="${DB_USER:-sms_admin}"
DB_PASSWORD="${DB_PASSWORD:-change-me}"
SCRIPT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd -- "$SCRIPT_DIR/../../.." && pwd)"
FLYWAY_ROOT="$REPO_ROOT/infra/flyway"
JDBC_URL="jdbc:postgresql://${DB_HOST}:${DB_PORT}/${DB_NAME}"

docker run --rm \
  -v "$FLYWAY_ROOT:/flyway" \
  flyway/flyway:10.17.3 \
  -url="$JDBC_URL" \
  -user="$DB_USER" \
  -password="$DB_PASSWORD" \
  -schemas="$SCHEMA" \
  -locations="$LOCATIONS" \
  migrate
