# Stability Baseline Suite

This suite groups the Sprint 01 stability checks into one entrypoint so we can re-run the same baseline before touching deeper product logic.

## Included suites

- backend Gradle tests through `tests/ci/run-backend-tests.sh`
- frontend Vitest coverage through `tests/ci/run-frontend-tests.sh`
- optional black-box onboarding flow through `tests/functional-api/run.sh onboarding`

## Usage

Run the automated baseline only:

```bash
bash tests/stability/run-baseline.sh
```

Run the automated baseline plus the functional onboarding smoke flow:

```bash
bash tests/stability/run-baseline.sh --with-functional
```

## Notes

- The functional flow requires `tests/functional-api/.env`.
- The functional runner is intentionally opt-in because it depends on a reachable environment and seeded admin credentials.
- Sprint 01 treats this as the repeatable go/no-go suite for public inquiry, onboarding, auth, and system-of-record creation regressions.
