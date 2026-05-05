# Functional API Tests

This module provides black-box functional coverage for the SMS backend APIs, starting with the full onboarding flow.

It is dependency-light by design:

- `bash`
- `curl`
- `jq`
- `openssl`

No Node or Gradle test harness is required to run it.

## Covered flow

The onboarding scenario exercises:

- invalid onboarding submission validation
- public logo upload
- onboarding creation
- duplicate school code rejection
- public status lookup
- public school profile lookup
- admin authentication
- admin-only onboarding listing
- admin-only onboarding lookup
- review transition to `UNDER_REVIEW`
- activation email rejection before approval
- approval and downstream provisioning checks
- activation email dispatch after approval
- activation details lookup
- school admin activation
- school admin login
- school branding retrieval
- school branding logo update
- public profile 404 handling
- rejection flow for a second onboarding record
- rejected status lookup
- admin delete of rejected onboarding

## Setup

1. Copy `.env.example` to `.env`.
2. Fill in:
   - `FUNCTIONAL_ADMIN_EMAIL`
   - `FUNCTIONAL_ADMIN_PASSWORD`
   - optionally `FUNCTIONAL_BASE_URL`
3. Run:

```bash
bash tests/functional-api/run.sh onboarding
```

## Configuration

- `FUNCTIONAL_BASE_URL`
  - Full API base prefix, for example `http://localhost:30000/api/v1`
  - The runner appends endpoint paths such as `/onboarding/schools`
- `FUNCTIONAL_SCHOOL_ADMIN_PASSWORD`
  - Password assigned during the activation step for the newly approved school
- `FUNCTIONAL_DELETE_APPROVED_ONBOARDING`
  - Defaults to `false`
  - Keep this `false` unless you explicitly want the runner to delete approved onboarding rows after provisioning

## Remote execution notes

If your environment is only reachable from the EC2 host, establish a tunnel first and point the runner at the forwarded port:

```bash
ssh -i ~/Downloads/sms-app.pem -o StrictHostKeyChecking=no -L 30000:localhost:30000 ubuntu@3.109.156.68
```

Then use:

```bash
FUNCTIONAL_BASE_URL=http://localhost:30000/api/v1 bash tests/functional-api/run.sh onboarding
```

## Exit behavior

- Exit `0`: all assertions passed
- Non-zero exit: at least one request or assertion failed

The runner prints each step as it progresses and leaves the approved onboarding record intact by default so downstream provisioned data is not silently destroyed.
