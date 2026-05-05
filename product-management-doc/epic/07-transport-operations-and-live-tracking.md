# Epic 07: Transport Operations and Live Tracking

## Epic Intent

Provide a full transport operating layer covering route planning, fleet and staff management, live trip execution, subscriber visibility, and optimization workflows.

## Primary Users

- Transport manager
- School admin
- Driver
- Conductor
- Parent / student / teacher subscriber

## Current Implementation Requirements

- Transport policy must support get and patch.
- Management dashboard, live map, route list/detail, alerts, analytics, trip replay, and route clusters must be supported.
- Route management must support create, update, delete, and route detail retrieval.
- Stop management must support create, update, and delete.
- Vehicle management must support list, create, update, delete, and vehicle document upload.
- Staff management must support staff retrieval and staff profile creation.
- Student assignment management must support create and remove.
- Subscription management must support list, create, and remove.
- Assignment management must support list, route assignment create/remove, backup options, and substitute assignment.
- Subscriber-facing “my transport” must support:
  current state, timeline, preferences get/patch.
- Driver/conductor trip execution must support:
  get active trip, onboard, start, end, offboard, GPS update, halt, delay, SOS, stop completion, boarding, boarding scan, and boarding voice.
- Optimization must support run, retrieval, approve, and discard.
- Internal device-location ingestion must be supported.
- Frontend must expose:
  transport hub, driver console, conductor panel, and subscriber page.
- A second/legacy school-ops transport surface is also present for route listing, full route view, student assignment, GPS updates, and pickup/drop actions.

## Current Product Notes

- Transport is one of the product’s most differentiated modules and potentially one of the highest commercial-value stories.
- It is also one of the most operationally complex areas with the highest real-world failure visibility.

## Known Gaps / Stabilization Needs

- Consolidate or clearly define legacy vs advanced transport flows.
- Reliability testing for live actions under delayed or partial realtime conditions.
- Better incident handling and operator recovery for missed scans, GPS failure, and route substitution.
- Parent/subscriber trust layer should be validated carefully because messaging timing matters as much as raw data.

## Success Metrics

- trip start/end success rate
- live location freshness
- boarding/offboarding event accuracy
- transport incident rate
- subscriber notification timeliness
