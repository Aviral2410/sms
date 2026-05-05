# Epic 02: School Onboarding, Public Site, and CMS

## Epic Intent

Enable a school to discover the platform, submit onboarding data, be reviewed by platform admins, launch a public-facing school site, and manage school-brand content after provisioning.

## Primary Users

- Prospective school operators
- Platform admin reviewers
- School admins / marketing operators
- Parents and public visitors

## Current Implementation Requirements

- Public marketing site content must be retrievable from platform public site APIs.
- Public contact and support requests must be captured.
- Platform public inquiries must be viewable and updatable by platform operators.
- School onboarding must support:
  list, create, detail, status lookup, review action, activation email trigger, and delete.
- Public onboarding branding context must be retrievable.
- Current branding must be retrievable and logo upload must be supported.
- Platform settings and platform configs must be manageable via dedicated APIs.
- Public school CMS must support retrieval of:
  landing page, profile, leaders, upcoming events, gallery, testimonials, achievements, branches, fee structure, admission info, academic content, social links, and affiliation.
- Public school CMS must support public enquiries and newsletter subscription.
- Admin school CMS must support management of:
  dashboard stats, profile, publish state, leaders, events, gallery albums/media, testimonials, achievements, infrastructure, social links, affiliation, branches, admission info, fee structures, academic content, section configuration, and school enquiries.
- Frontend must expose landing, contact, pricing, support, founders message, school portal landing, registration wizard, and school CMS administration surfaces.

## Current Product Notes

- This epic is the product’s acquisition-to-brand-presence bridge.
- It already spans both platform-owned and school-owned content layers, which is strategically powerful for reducing fragmented tooling.
- Publishing safety matters here because incorrect or incomplete public content affects brand credibility directly.

## Known Gaps / Stabilization Needs

- Stronger publish workflow validation for school CMS.
- Regression tests for enquiry intake, media upload, and public-school-content rendering.
- Clearer review-state and operational SLA handling for onboarding queue management.
- Asset lifecycle governance:
  replacement, deletion, broken references, and fallback behavior.

## Success Metrics

- onboarding form completion rate
- onboarding approval turnaround time
- public enquiry submission success rate
- CMS publish success rate
- public school page availability and error rate
