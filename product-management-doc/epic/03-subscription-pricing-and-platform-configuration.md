# Epic 03: Subscription, Pricing, and Platform Configuration

## Epic Intent

Control commercial packaging, tenant subscription state, feature entitlement checks, and platform runtime/service configuration.

## Primary Users

- Platform admin
- Finance / ops owner
- School admin consuming plans and feature gates

## Current Implementation Requirements

- Public subscription APIs must expose plans and overview.
- Internal subscription APIs must support:
  plan listing, plan patch/update, current subscription, tenant subscription update, all subscriptions, stats, status update, feature check, upgrade request, and initialization.
- Pricing control must be exposed in platform admin UI.
- Platform settings must be retrievable and patchable.
- Platform configs must support list, update by service, and runtime retrieval by service.
- Frontend navigation must conditionally surface features based on required feature flags such as `SCHOOL_OPS`, `ATTENDANCE`, and `TRANSPORT_BASE`.

## Current Product Notes

- This epic is the control plane for monetization and entitlement.
- Feature gating is already tied into navigation and service behavior, which is a strong foundation for packaging.
- Because pricing and runtime config can materially alter platform behavior, this area needs strict change discipline.

## Known Gaps / Stabilization Needs

- Add confidence around entitlement consistency between frontend visibility and backend authorization.
- Improve audit logging and rollback safety for plan/config changes.
- Validate upgrade request lifecycle and downstream feature activation timing.
- Test runtime config impacts on finance, school ops, and AI integrations.

## Success Metrics

- feature entitlement mismatch count
- pricing/configuration change failure rate
- upgrade request fulfillment time
- subscription initialization success rate
