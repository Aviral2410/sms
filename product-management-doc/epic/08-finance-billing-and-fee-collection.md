# Epic 08: Finance, Billing, and Fee Collection

## Epic Intent

Support fee structure management, payment capture, student dues visibility, and school billing operations.

## Primary Users

- School admin
- Finance operator
- Student / parent as viewers

## Current Implementation Requirements

- Finance service must support:
  list fees, create fees, create payments, list student payments, and list student dues.
- Frontend must expose:
  billing overview, invoice detail, payment gateway component, and student fee status page.
- Finance service includes payment-provider abstraction with Stripe and Razorpay provider implementations.
- Runtime platform configuration can influence finance behavior.

## Current Product Notes

- The domain exists, but current API scope appears smaller than the breadth suggested by the UI.
- This is a revenue-sensitive module, so operational correctness is more important than expanding into advanced finance reporting immediately.

## Known Gaps / Stabilization Needs

- End-to-end payment and dues reconciliation tests.
- Verify invoice detail and payment history accuracy against backend contract.
- Provider configuration safety and failure handling.
- Clarify whether invoicing is first-class or represented indirectly through fee/payment records today.

## Success Metrics

- payment creation success rate
- dues accuracy issues reported
- failed provider transaction rate
- billing page data mismatch count
