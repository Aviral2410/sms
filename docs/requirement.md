Inspect the existing repository and implement the backend first for a multi-tenant school landing page + school admin CMS.

Core requirements:
- tenant URL: http://[schoolCode].localhost:30080
- resolve tenant by schoolCode subdomain
- ask school admin to sign in
- create tenant-scoped admin APIs and public APIs
- support CMS for school profile, about, objective, mission/vision, founder/principal/leadership, admissions, fee structure, testimonials, achievements, upcoming events, gallery, infrastructure, branches, contact info, map location, social links, affiliation/compliance, notices/calendar, and enquiry forms
- public landing-page API should return only published content
- admin APIs should support draft/publish/unpublish
- strict tenant isolation everywhere
- extend onboarding to collect school code, address, map location, branding, branches, and public landing page readiness

Do this in backend-first order:
1. inspect project architecture
2. add tenant resolution middleware/interceptor
3. create entities/models and migrations
4. add DTOs/validators
5. add repositories/services
6. add admin APIs
7. add public APIs
8. add media linkage
9. add enquiry handling
10. add seed data for demo-school

Important:
- reuse existing auth and shared infrastructure
- keep code modular and production ready
- add meaningful indexes and constraints
- add loading-safe and cache-friendly public APIs
- provide implementation, not just explanation

At the end return:
- architecture summary
- created/updated files
- migration details
- new endpoints
- local testing steps


You are a senior backend architect and implementation engineer.

We already have an existing school management system. Your task is to design and implement the BACKEND FIRST for a multi-tenant school landing page and school-admin CMS module.

IMPORTANT:
- Focus on backend architecture, data models, APIs, tenancy, auth, media handling, publishing workflow, and admin/public content delivery.
- Do NOT start with frontend pages.
- Frontend will be built later on top of your APIs.
- Preserve compatibility with the existing platform architecture.
- Reuse existing auth, user, school, admin, and media infrastructure wherever possible.
- The school landing page UX will later match our existing platform landing page, so backend should support flexible content-driven sections.

==================================================
1. PRIMARY GOAL
==================================================
Build backend support for:
1. school-specific subdomain routing
2. school admin sign-in on tenant URL
3. school landing page content management
4. public school landing page content APIs
5. admission enquiry collection
6. testimonial, gallery, event, achievements, founder/principal, fee structure, branch, and contact management
7. publish/unpublish and draft workflow
8. onboarding support for school profile and location


==================================================
3. BACKEND MODULES TO BUILD
==================================================
Design backend modules/services for:

A. Tenant Management
- school tenant creation
- school code uniqueness
- active/inactive status
- domain/subdomain mapping
- onboarding completion state
- landing page publish status

B. School Profile CMS
- school basic info
- about content
- objective
- mission & vision
- history / legacy / origin
- why choose us
- contact details
- map location
- social links
- affiliation / compliance info

C. Leadership CMS
- founder
- founder chairman
- chairperson message
- director message
- principal page
- leadership / management committee entries

D. Admissions CMS
- admission overview
- process
- eligibility
- brochure/document upload
- admission contact details
- admission enquiry form config

E. Fee Structure CMS
- fee structures by class/category
- optional downloadable file
- academic year support
- publish status

F. Events CMS
- upcoming events
- featured event
- event datetime
- location
- description
- banner image
- registration/external link
- event status
- archive handling for past events

G. Gallery CMS
- albums
- media items
- images
- optional video entries
- event association
- tags
- ordering

H. Testimonials CMS
- text
- author name
- role/relationship
- image
- priority
- publish toggle

I. Achievements CMS
- title
- description
- year
- category
- image
- featured toggle

J. Co-curricular / Academics / Infrastructure CMS
- academics overview
- curriculum overview
- co-curricular activities
- infrastructure/facilities
- transport/facility highlights
- scholarship/results/notices/calendar entries if needed

K. Branch Management
- multiple branch support
- branch name
- address
- location
- contact details
- primary/default flag

L. Contact & Enquiry
- contact form submissions
- admission enquiry submissions
- optional newsletter subscriptions

M. Media Management
- upload
- metadata
- tenant ownership
- asset reuse
- media validation

N. Section Configuration
- enable/disable sections
- homepage ordering
- optional labels/headings/subheadings per section
- draft vs published configuration

==================================================
4. REQUIRED LANDING PAGE CONTENT SUPPORT
==================================================
Backend must support the following sections and pages for each school tenant:

- About
- Admission
- Co-curricular Activities
- Event Gallery
- Map location
- Testimonials
- Upcoming Events
- Achievements
- Founders Page
- Principal Page
- School Objective
- Contact Us
- Admission Enquiry Page
- Fee Structure Page
- Branches
- Mission & Vision
- Why Us
- History / Legacy
- Chairperson / Director messages
- Leadership / SMC
- Curriculum overview
- Scholarship / awards
- Infrastructure showcase
- Video gallery
- Notices / academic calendar
- Results / performance highlights
- Newsletter CTA
- Social links
- Affiliation / compliance
- Transport / facilities
- Quick-links/footer support

==================================================
5. SCHOOL ONBOARDING BACKEND CHANGES
==================================================
Extend school onboarding backend to capture:
- school code
- official school name
- short name
- tagline
- address
- city/state/country/pincode
- geo coordinates
- admission contact info
- phone/email
- logo/banner assets
- whether school has branches
- branch data
- whether landing page is public
- default content placeholders if needed

Also:
- validate schoolCode uniqueness
- generate tenant record on activation
- allow onboarding completion in steps
- mark landing page ready/published only when minimum data exists

==================================================
6. DATA MODEL / ENTITY DESIGN
==================================================
Design a clean normalized schema.

Create entities/models similar to:

1. SchoolTenant
- id
- schoolId
- schoolCode
- subdomain
- customDomain
- status
- isActive
- onboardingStatus
- landingPageStatus
- activatedAt

2. SchoolProfile
- id
- tenantId
- schoolName
- shortName
- tagline
- shortDescription
- aboutHtml/markdown/json
- objective
- mission
- vision
- history
- whyUs
- addressLine1
- addressLine2
- city
- state
- country
- pincode
- latitude
- longitude
- phone
- alternatePhone
- email
- website
- officeHours
- publishedVersion
- draftVersion if needed

3. SchoolBranding
- id
- tenantId
- logoMediaId
- faviconMediaId
- heroBannerMediaId
- themeAccent
- coverMediaId

4. SchoolLeaderProfile
- id
- tenantId
- type (founder, chairman, chairperson, director, principal, leadership)
- name
- title
- bio
- message
- imageMediaId
- displayOrder
- isPublished

5. SchoolBranch
- id
- tenantId
- branchName
- address
- city/state/country/pincode
- latitude
- longitude
- phone
- email
- isPrimary
- isPublished

6. SchoolAdmissionInfo
- id
- tenantId
- overview
- process
- eligibility
- brochureMediaId
- contactName
- contactPhone
- contactEmail
- isPublished

7. SchoolFeeStructure
- id
- tenantId
- academicYear
- title
- description
- structuredDataJson
- attachmentMediaId
- isPublished

8. SchoolEvent
- id
- tenantId
- title
- slug
- description
- startAt
- endAt
- location
- bannerMediaId
- registrationUrl
- isFeatured
- isPublished
- status
- sortOrder

9. SchoolGalleryAlbum
- id
- tenantId
- title
- description
- coverMediaId
- eventId nullable
- isPublished
- sortOrder

10. SchoolGalleryMedia
- id
- tenantId
- albumId
- mediaId
- mediaType
- caption
- altText
- tags
- takenAt
- isPublished
- sortOrder

11. SchoolTestimonial
- id
- tenantId
- authorName
- relationshipType
- designation
- content
- imageMediaId
- rating optional
- displayOrder
- isPublished

12. SchoolAchievement
- id
- tenantId
- title
- description
- year
- category
- imageMediaId
- isFeatured
- displayOrder
- isPublished

13. SchoolInfrastructureItem
- id
- tenantId
- type
- title
- description
- imageMediaId
- icon
- displayOrder
- isPublished

14. SchoolAcademicContent
- id
- tenantId
- curriculum
- coCurricular
- scholarshipInfo
- resultHighlights
- notices
- calendarData
- isPublished

15. SchoolSectionConfig
- id
- tenantId
- sectionKey
- isEnabled
- displayOrder
- titleOverride
- subtitleOverride
- configJson
- publishedState

16. SchoolEnquiry
- id
- tenantId
- type (contact, admission)
- studentName
- parentName
- phone
- email
- classInterested
- message
- status
- source
- createdAt

17. SchoolNewsletterSubscription
- id
- tenantId
- email
- status
- subscribedAt

18. MediaAsset
- id
- tenantId nullable if shared
- storagePath
- mimeType
- size
- width
- height
- uploadedBy
- category
- altText
- metadataJson

19. SchoolSocialLink
- id
- tenantId
- platform
- url
- displayOrder
- isPublished

20. SchoolAffiliationInfo
- id
- tenantId
- boardName
- affiliationNumber
- complianceText
- recognitionDetails
- isPublished

Use proper indexing, foreign keys, unique constraints, soft delete where appropriate, and createdAt/updatedAt/audit fields everywhere.

==================================================
7. MULTI-TENANCY & SECURITY
==================================================
Apply strict tenant isolation.

Requirements:
- Every CMS/admin read/write API must be tenant-scoped
- Authenticated user must only manage allowed school tenant(s)
- Public APIs must only expose published content
- No cross-tenant media leakage
- Validate tenant ownership on every entity mutation
- Add role-based access:
  - platform super admin
  - school admin
  - school content manager if supported

Add:
- middleware/interceptor for tenant context
- authorization policy layer
- audit logging for content changes
- rate limiting for public enquiry endpoints
- validation and sanitization for rich text content

==================================================
8. PUBLISHING WORKFLOW
==================================================
Support content lifecycle:
- draft
- published
- unpublished
- archived where relevant

Implement:
- save draft
- publish
- unpublish
- preview token or preview mode API if feasible
- public APIs must return only published content
- admin APIs can return draft + published versions

At minimum:
- section-level publish status
- entity-level publish status for events, testimonials, galleries, achievements, etc.

==================================================
9. API DESIGN
==================================================
Design REST APIs or equivalent modular service APIs.

A. Admin APIs
Examples:
- POST /admin/schools/:tenantId/profile
- GET /admin/schools/:tenantId/profile
- PATCH /admin/schools/:tenantId/profile

- CRUD for leaders
- CRUD for testimonials
- CRUD for events
- CRUD for gallery albums/media
- CRUD for achievements
- CRUD for infrastructure items
- CRUD for branches
- CRUD for fee structures
- CRUD for social links
- CRUD for affiliation info
- GET /admin/schools/:tenantId/enquiries
- PATCH /admin/schools/:tenantId/enquiries/:id/status
- GET /admin/schools/:tenantId/section-config
- PATCH /admin/schools/:tenantId/section-config

B. Public APIs
Examples:
- GET /public/schools/:schoolCode/landing-page
- GET /public/schools/:schoolCode/profile
- GET /public/schools/:schoolCode/events/upcoming
- GET /public/schools/:schoolCode/gallery
- GET /public/schools/:schoolCode/testimonials
- GET /public/schools/:schoolCode/achievements
- GET /public/schools/:schoolCode/leadership
- GET /public/schools/:schoolCode/branches
- GET /public/schools/:schoolCode/fee-structure
- POST /public/schools/:schoolCode/admission-enquiry
- POST /public/schools/:schoolCode/contact-enquiry
- POST /public/schools/:schoolCode/newsletter-subscribe

C. Tenant resolution
- GET /public/tenant/resolve?host=demo-school.localhost:30080

D. Media APIs
- POST /admin/media/upload
- GET /public/media/:id or signed URL generation

Return stable response shapes suitable for future frontend integration.

==================================================
10. LANDING PAGE AGGREGATION API
==================================================
Create one optimized public endpoint to assemble the school landing page.

Example:
GET /public/schools/:schoolCode/landing-page

This should return:
- tenant info
- branding
- enabled sections
- profile/about/objective
- leadership snippets
- admissions info
- testimonials
- featured + upcoming events
- achievements
- gallery preview
- branch info
- contact/map info
- fee structure summary
- notices/highlights
- social/footer links

Ensure:
- only published content is returned
- sections are returned in display order
- empty/disabled sections are omitted or clearly marked
- response is cacheable

==================================================
11. EVENT LOGIC
==================================================
Implement event rules:
- latest nearest future event should appear first
- featured event should be separately retrievable
- past events should move to archive or be filtered from upcoming
- support timezone-safe date handling

Provide service methods for:
- getFeaturedUpcomingEvent
- getUpcomingEvents
- getArchivedEvents

==================================================
12. MAP / LOCATION SUPPORT
==================================================
Backend should store:
- full address
- latitude
- longitude
- branch-wise locations

Support:
- onboarding capture
- admin update
- public retrieval for map embed/frontend map rendering

==================================================
13. MEDIA HANDLING
==================================================
Support admin uploads for:
- logos
- testimonials
- leadership photos
- gallery images
- event banners
- brochures
- fee structure PDFs

Requirements:
- validate file type and size
- tenant ownership
- optional image variants/thumbnails
- logical folders/namespacing per tenant
- alt text / caption support
- soft delete or media reference checks

==================================================
14. ENQUIRY / CONTACT FLOW
==================================================
Admission enquiry and contact us backend:
- accept public form submissions
- validate required fields
- save tenant-scoped records
- status flow: new, in_progress, resolved, spam
- optional webhook/email trigger hooks
- admin can list/filter/update enquiry status

==================================================
15. ADMIN DASHBOARD SUPPORT APIS
==================================================
Create APIs to support future school admin CMS pages:
- content completeness status
- pending enquiries count
- upcoming events count
- unpublished sections count
- onboarding progress
- recent updates summary

==================================================
16. PERFORMANCE / OPERATIONS
==================================================
Ensure:
- pagination for admin list endpoints
- filtering/sorting/search
- DB indexes for tenantId + publish/status/date columns
- caching for public landing page API
- structured logging
- error handling with meaningful codes
- migrations/seeders
- testable service boundaries

==================================================
17. WHAT TO OUTPUT
==================================================
Provide backend implementation plan in this order:

1. architecture overview
2. module breakdown
3. database schema/entities
4. relationships and constraints
5. auth + tenancy strategy
6. API contracts
7. service-layer responsibilities
8. publish workflow
9. media handling strategy
10. validation rules
11. migration plan
12. sample seed data
13. implementation order
14. edge cases
15. code scaffolding / starter implementation

==================================================
18. CODE GENERATION EXPECTATION
==================================================
Generate production-quality backend code scaffolding for the stack inferred from the project.
If stack is unclear, first inspect the repository and then align with existing conventions.

Prefer:
- modular architecture
- DTO/request validation
- service/repository separation
- tenant-aware middleware
- clean entity definitions
- admin/public route separation
- reusable enums/constants
- migration files
- seed scripts
- example tests where feasible

Do not give only theory.
Start implementing the backend foundation first.
Prioritize:
1. tenant resolution
2. entities/models
3. admin/public APIs
4. publishing and enquiry flow
5. media integration

At the end, summarize:
- files created/modified
- APIs added
- migrations added
- setup steps to run locally

Use example tenant:
- schoolCode: demo-school
- local URL: http://demo-school.localhost:30080