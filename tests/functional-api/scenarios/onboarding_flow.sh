#!/usr/bin/env bash

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck disable=SC1091
source "$SCRIPT_DIR/../lib/common.sh"

run_onboarding_flow() {
  require_command curl
  require_command jq
  require_command openssl

  local suffix school_code reject_school_code school_email reject_school_email admin_token
  local approved_onboarding_id="" rejected_onboarding_id="" deleted_rejected_onboarding_id=""
  local activation_code school_admin_token school_id public_logo_file
  local public_logo_url updated_logo_url

  suffix="$(generate_suffix)"
  school_code="AUTO${suffix//-/}"
  reject_school_code="REJ${suffix//-/}"
  school_email="admin-${suffix}@example.edu"
  reject_school_email="reject-${suffix}@example.edu"
  public_logo_file="$TMP_ROOT/logo-${suffix}.png"
  create_png_fixture "$public_logo_file"

  trap 'cleanup_onboarding "$rejected_onboarding_id" "$admin_token"' RETURN

  log_step "Checking public onboarding validation"
  request_json "POST" "/onboarding/schools" '{"schoolCode":"BAD-ONLY"}'
  assert_status "400"
  assert_body_contains "Request validation failed"
  assert_body_contains "schoolName"

  log_step "Uploading public logo without authentication"
  request_form "POST" "/onboarding/schools/public/logo" "" "req-public-logo-${suffix}" \
    "file=@${public_logo_file};type=image/png" \
    "schoolCode=${school_code}"
  assert_status "200"
  assert_json_eq '.assetKey' "$school_code"
  assert_json_not_empty '.publicUrl'
  public_logo_url="$(json_get '.publicUrl')"

  log_step "Creating onboarding record for approval flow"
  request_json "POST" "/onboarding/schools" "$(json_compact "$(cat <<JSON
{
  "schoolName": "Automation Academy ${suffix}",
  "schoolCode": "${school_code}",
  "realmName": "automation-academy-${suffix}",
  "boardAffiliation": "CBSE",
  "contactPhone": "+91-9999999999",
  "contactEmail": "${school_email}",
  "addressLine": "1 Test Avenue",
  "city": "Bengaluru",
  "state": "Karnataka",
  "country": "India",
  "postalCode": "560001",
  "selectedPlanCode": "premium",
  "logoUrl": "${public_logo_url}",
  "usePlatformSubdomain": true,
  "customDomain": "",
  "tagline": "Functional test onboarding",
  "latitude": 12.9716,
  "longitude": 77.5946,
  "hasBranches": true
}
JSON
)")"
  assert_status "201"
  assert_json_eq '.status' "SUBMITTED"
  assert_json_eq '.schoolCode' "$school_code"
  assert_json_eq '.selectedPlanCode' "PREMIUM"
  assert_json_eq '.tagline' "Functional test onboarding"
  assert_json_eq '.hasBranches' "true"
  assert_json_eq '.usePlatformSubdomain' "true"
  assert_json_not_empty '.onboardingId'
  approved_onboarding_id="$(json_get '.onboardingId')"

  log_step "Rejecting duplicate school codes"
  request_json "POST" "/onboarding/schools" "$(json_compact "$(cat <<JSON
{
  "schoolName": "Automation Duplicate ${suffix}",
  "schoolCode": "${school_code}",
  "boardAffiliation": "ICSE",
  "contactPhone": "+91-8888888888",
  "contactEmail": "dup-${suffix}@example.edu",
  "addressLine": "2 Test Avenue",
  "city": "Mumbai",
  "state": "Maharashtra",
  "country": "India",
  "postalCode": "400001"
}
JSON
)")"
  assert_status "409"
  assert_body_contains "same code already exists"

  log_step "Looking up submitted public status"
  request_json "GET" "/onboarding/schools/status?schoolCode=${school_code}&adminEmail=${school_email}"
  assert_status "200"
  assert_json_eq '.status' "SUBMITTED"
  assert_json_eq '.activated' "false"
  assert_json_contains '.statusMessage' "submitted successfully"

  log_step "Loading the public school profile"
  request_json "GET" "/onboarding/schools/public/${school_code}"
  assert_status "200"
  assert_json_eq '.schoolCode' "$school_code"
  assert_json_eq '.schoolName' "Automation Academy ${suffix}"
  assert_json_eq '.logoUrl' "$public_logo_url"

  log_step "Rejecting a missing public school profile"
  request_json "GET" "/onboarding/schools/public/UNKNOWN-${suffix}"
  assert_status "404"
  assert_body_contains "Public school profile not found"

  log_step "Verifying admin endpoints are protected"
  request_json "GET" "/onboarding/schools"
  assert_status "401"

  log_step "Authenticating as platform admin"
  admin_token="$(admin_login)"

  log_step "Listing onboarding queue with admin access"
  request_json "GET" "/onboarding/schools" "" "$admin_token"
  assert_status "200"
  jq -e --arg onboarding_id "$approved_onboarding_id" '.[] | select(.onboardingId == $onboarding_id)' "$LAST_BODY_FILE" >/dev/null \
    || fail "Expected approved onboarding to appear in admin list"

  log_step "Fetching a single onboarding record"
  request_json "GET" "/onboarding/schools/${approved_onboarding_id}" "" "$admin_token"
  assert_status "200"
  assert_json_eq '.status' "SUBMITTED"
  assert_json_eq '.schoolCode' "$school_code"

  log_step "Moving onboarding into review"
  request_json "PATCH" "/onboarding/schools/${approved_onboarding_id}/review" "$(json_compact "$(cat <<JSON
{"action":"START_REVIEW","reviewerName":"Functional Test Runner","comment":"Initial review started"}
JSON
)")" "$admin_token"
  assert_status "200"
  assert_json_eq '.status' "UNDER_REVIEW"
  assert_json_eq '.reviewedBy' "Functional Test Runner"

  log_step "Blocking activation email before approval"
  request_json "POST" "/onboarding/schools/${approved_onboarding_id}/activation-email" "" "$admin_token"
  assert_status "409"
  assert_body_contains "Activation email can only be sent for approved schools"

  log_step "Approving onboarding and verifying provisioning fields"
  request_json "PATCH" "/onboarding/schools/${approved_onboarding_id}/review" "$(json_compact "$(cat <<JSON
{"action":"APPROVE","reviewerName":"Functional Test Runner","comment":"All checks passed"}
JSON
)")" "$admin_token"
  assert_status "200"
  assert_json_eq '.status' "APPROVED"
  assert_json_not_empty '.tenantId'
  assert_json_not_empty '.schoolId'
  assert_json_not_empty '.activationCode'
  assert_json_contains '.reviewComment' "Approved. School login is enabled"
  school_id="$(json_get '.schoolId')"

  log_step "Sending activation email after approval"
  request_json "POST" "/onboarding/schools/${approved_onboarding_id}/activation-email" "" "$admin_token"
  assert_status "202"

  log_step "Fetching activation details from auth service"
  request_json "GET" "/auth/admin/activation-details?schoolCode=${school_code}&email=${school_email}" "" "$admin_token"
  assert_status "200"
  assert_json_eq '.schoolCode' "$school_code"
  assert_json_eq '.email' "$school_email"
  assert_json_not_empty '.activationCode'
  activation_code="$(json_get '.activationCode')"

  log_step "Activating the provisioned school admin account"
  request_json "POST" "/auth/school/activate" "$(json_compact "$(cat <<JSON
{
  "schoolCode": "${school_code}",
  "email": "${school_email}",
  "activationCode": "${activation_code}",
  "newPassword": "${FUNCTIONAL_SCHOOL_ADMIN_PASSWORD}"
}
JSON
)")"
  assert_status "200"
  assert_json_eq '.schoolCode' "$school_code"
  assert_json_eq '.email' "$school_email"

  log_step "Logging in as the newly activated school admin"
  request_json "POST" "/auth/school/login" "$(json_compact "$(cat <<JSON
{
  "schoolCode": "${school_code}",
  "email": "${school_email}",
  "password": "${FUNCTIONAL_SCHOOL_ADMIN_PASSWORD}"
}
JSON
)")"
  assert_status "200"
  assert_json_eq '.schoolCode' "$school_code"
  assert_json_eq '.role' "SCHOOL_ADMIN"
  assert_json_eq '.schoolId' "$school_id"
  assert_json_not_empty '.token'
  school_admin_token="$(json_get '.token')"

  log_step "Reading school branding through authenticated school context"
  request_json "GET" "/onboarding/schools/branding/current" "" "$school_admin_token"
  assert_status "200"
  assert_json_eq '.schoolCode' "$school_code"
  assert_json_eq '.schoolId' "$school_id"

  log_step "Updating current school logo through the branding endpoint"
  request_form "POST" "/onboarding/schools/branding/current/logo" "$school_admin_token" "req-branding-logo-${suffix}" \
    "file=@${public_logo_file};type=image/png"
  assert_status "200"
  assert_json_eq '.schoolCode' "$school_code"
  assert_json_not_empty '.logoUrl'
  updated_logo_url="$(json_get '.logoUrl')"

  log_step "Reading branding again to confirm the logo update persisted"
  request_json "GET" "/onboarding/schools/branding/current" "" "$school_admin_token"
  assert_status "200"
  assert_json_eq '.schoolCode' "$school_code"
  assert_json_eq '.logoUrl' "$updated_logo_url"

  log_step "Confirming approved public status now reports activation readiness"
  request_json "GET" "/onboarding/schools/status?schoolCode=${school_code}&adminEmail=${school_email}"
  assert_status "200"
  assert_json_eq '.status' "APPROVED"
  assert_json_eq '.activated' "true"
  assert_json_contains '.statusMessage' "approved"

  log_step "Creating a second onboarding record for rejection and cleanup coverage"
  request_json "POST" "/onboarding/schools" "$(json_compact "$(cat <<JSON
{
  "schoolName": "Rejection Academy ${suffix}",
  "schoolCode": "${reject_school_code}",
  "boardAffiliation": "STATE",
  "contactPhone": "+91-7777777777",
  "contactEmail": "${reject_school_email}",
  "addressLine": "9 Reject Lane",
  "city": "Mysuru",
  "state": "Karnataka",
  "country": "India",
  "postalCode": "570001",
  "selectedPlanCode": "FREE"
}
JSON
)")"
  assert_status "201"
  rejected_onboarding_id="$(json_get '.onboardingId')"

  log_step "Rejecting the second onboarding record"
  request_json "PATCH" "/onboarding/schools/${rejected_onboarding_id}/review" "$(json_compact "$(cat <<JSON
{"action":"REJECT","reviewerName":"Functional Test Runner","comment":"Missing compliance documents"}
JSON
)")" "$admin_token"
  assert_status "200"
  assert_json_eq '.status' "REJECTED"
  assert_json_eq '.reviewComment' "Missing compliance documents"

  log_step "Checking rejected status lookup messaging"
  request_json "GET" "/onboarding/schools/status?schoolCode=${reject_school_code}&adminEmail=${reject_school_email}"
  assert_status "200"
  assert_json_eq '.status' "REJECTED"
  assert_json_contains '.statusMessage' "Missing compliance documents"

  log_step "Deleting the rejected onboarding record"
  deleted_rejected_onboarding_id="$rejected_onboarding_id"
  cleanup_onboarding "$rejected_onboarding_id" "$admin_token"
  rejected_onboarding_id=""

  log_step "Confirming deleted onboarding is no longer retrievable"
  request_json "GET" "/onboarding/schools/${deleted_rejected_onboarding_id}" "" "$admin_token"
  assert_status "404"

  if [[ "${FUNCTIONAL_DELETE_APPROVED_ONBOARDING,,}" == "true" ]]; then
    log_step "Deleting approved onboarding because FUNCTIONAL_DELETE_APPROVED_ONBOARDING=true"
    cleanup_onboarding "$approved_onboarding_id" "$admin_token"
    approved_onboarding_id=""
  fi

  log_step "Onboarding functional suite completed successfully"
  echo "Approved onboarding: ${approved_onboarding_id}"
  echo "School code: ${school_code}"
  echo "Branding logo URL: ${updated_logo_url}"
}
