#!/usr/bin/env bash

set -euo pipefail

FUNCTIONAL_BASE_URL="${FUNCTIONAL_BASE_URL:-http://localhost:30000/api/v1}"
FUNCTIONAL_SCHOOL_ADMIN_PASSWORD="${FUNCTIONAL_SCHOOL_ADMIN_PASSWORD:-ChangeMe!123}"
FUNCTIONAL_DELETE_APPROVED_ONBOARDING="${FUNCTIONAL_DELETE_APPROVED_ONBOARDING:-false}"

LAST_STATUS=""
LAST_BODY_FILE=""
LAST_HEADERS_FILE=""

TMP_ROOT="$(mktemp -d)"
trap 'rm -rf "$TMP_ROOT"' EXIT

log_step() {
  printf '\n[%s] %s\n' "$(date '+%H:%M:%S')" "$*"
}

fail() {
  echo "FAIL: $*" >&2
  if [[ -n "${LAST_STATUS:-}" ]]; then
    echo "Last status: $LAST_STATUS" >&2
  fi
  if [[ -n "${LAST_BODY_FILE:-}" && -f "$LAST_BODY_FILE" ]]; then
    echo "Last body:" >&2
    cat "$LAST_BODY_FILE" >&2
    echo >&2
  fi
  exit 1
}

require_command() {
  command -v "$1" >/dev/null 2>&1 || fail "Missing required command: $1"
}

require_env() {
  local name="$1"
  [[ -n "${!name:-}" ]] || fail "Missing required environment variable: $name"
}

json_compact() {
  jq -c . <<<"$1"
}

json_get() {
  local filter="$1"
  jq -r "$filter // empty" "$LAST_BODY_FILE"
}

json_query_file() {
  local file="$1"
  local filter="$2"
  jq -r "$filter // empty" "$file"
}

assert_status() {
  local expected="$1"
  [[ "$LAST_STATUS" == "$expected" ]] || fail "Expected status $expected but got $LAST_STATUS"
}

assert_json_eq() {
  local filter="$1"
  local expected="$2"
  local actual
  actual="$(json_get "$filter")"
  [[ "$actual" == "$expected" ]] || fail "Expected $filter to equal '$expected' but got '$actual'"
}

assert_json_not_empty() {
  local filter="$1"
  local actual
  actual="$(json_get "$filter")"
  [[ -n "$actual" && "$actual" != "null" ]] || fail "Expected $filter to be non-empty"
}

assert_json_contains() {
  local filter="$1"
  local expected_fragment="$2"
  local actual
  actual="$(json_get "$filter")"
  [[ "$actual" == *"$expected_fragment"* ]] || fail "Expected $filter to contain '$expected_fragment' but got '$actual'"
}

assert_body_contains() {
  local expected_fragment="$1"
  grep -Fq "$expected_fragment" "$LAST_BODY_FILE" || fail "Expected response body to contain '$expected_fragment'"
}

request_json() {
  local method="$1"
  local path="$2"
  local body="${3:-}"
  local token="${4:-}"
  local request_id="${5:-req-$(openssl rand -hex 6)}"

  LAST_BODY_FILE="$TMP_ROOT/body-$(openssl rand -hex 6).json"
  LAST_HEADERS_FILE="$TMP_ROOT/headers-$(openssl rand -hex 6).txt"

  local curl_args=(
    -sS
    -X "$method"
    -D "$LAST_HEADERS_FILE"
    -o "$LAST_BODY_FILE"
    -H "Accept: application/json"
    -H "Content-Type: application/json"
    -H "X-Request-ID: $request_id"
  )

  if [[ -n "$token" ]]; then
    curl_args+=(-H "Authorization: Bearer $token")
  fi

  if [[ -n "$body" ]]; then
    curl_args+=(-d "$body")
  fi

  LAST_STATUS="$(curl "${curl_args[@]}" "${FUNCTIONAL_BASE_URL}${path}" -w '%{http_code}')"
}

request_form() {
  local method="$1"
  local path="$2"
  local token="$3"
  local request_id="$4"
  shift 4

  LAST_BODY_FILE="$TMP_ROOT/body-$(openssl rand -hex 6).json"
  LAST_HEADERS_FILE="$TMP_ROOT/headers-$(openssl rand -hex 6).txt"

  local curl_args=(
    -sS
    -X "$method"
    -D "$LAST_HEADERS_FILE"
    -o "$LAST_BODY_FILE"
    -H "Accept: application/json"
    -H "X-Request-ID: $request_id"
  )

  if [[ -n "$token" ]]; then
    curl_args+=(-H "Authorization: Bearer $token")
  fi

  while [[ $# -gt 0 ]]; do
    curl_args+=(-F "$1")
    shift
  done

  LAST_STATUS="$(curl "${curl_args[@]}" "${FUNCTIONAL_BASE_URL}${path}" -w '%{http_code}')"
}

create_png_fixture() {
  local target="$1"
  printf '%s' 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO7Z0ioAAAAASUVORK5CYII=' | base64 -d >"$target"
}

generate_suffix() {
  printf '%(%Y%m%d%H%M%S)T' -1
  printf '%s' "-$(openssl rand -hex 2)"
}

cleanup_onboarding() {
  local onboarding_id="$1"
  local token="$2"
  if [[ -z "$onboarding_id" || -z "$token" ]]; then
    return 0
  fi

  request_json "DELETE" "/onboarding/schools/${onboarding_id}" "" "$token"
  if [[ "$LAST_STATUS" != "204" ]]; then
    echo "WARN: cleanup delete for onboarding ${onboarding_id} returned $LAST_STATUS" >&2
  fi
}

admin_login() {
  require_env FUNCTIONAL_ADMIN_EMAIL
  require_env FUNCTIONAL_ADMIN_PASSWORD

  request_json "POST" "/auth/admin/login" "$(json_compact "$(cat <<JSON
{"email":"${FUNCTIONAL_ADMIN_EMAIL}","password":"${FUNCTIONAL_ADMIN_PASSWORD}"}
JSON
)")"
  assert_status "200"
  assert_json_not_empty '.token'
  json_get '.token'
}
