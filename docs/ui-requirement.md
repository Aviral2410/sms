Remeber hero page or platfrom landing page must be reference for the ux i means you must keep consistent ux throguhout, whether it is background or the moving objects, or the pretext.js animations

You are a senior product designer + senior frontend engineer working inside our existing school management system.

Your job is to generate, improve, connect, and bind the full UI/UX for ALL modules and pages discussed in this thread.

IMPORTANT GLOBAL REQUIREMENT:
- The UI/UX MUST match our existing platform design system exactly.
- Reuse the existing platform’s:
  - layout patterns
  - header/footer/sidebar behavior
  - spacing system
  - typography scale
  - cards
  - forms
  - tables
  - tabs
  - modals
  - buttons
  - colors
  - icons
  - empty states
  - loaders
  - filter bars
  - responsive behavior
  - animation/micro-interaction style
- Do NOT create a disconnected design language.
- Every new page must feel like a native extension of the current platform.
- Also inspect current pages and FIX any broken, inconsistent, outdated, clumsy, misaligned, non-responsive, or visually weak UI/UX already present in the system.
- If any existing page has broken UX/UI, refactor and align it with the platform standard while preserving functionality.

PRIMARY GOAL:
Create and bind complete UI/UX for all features/pages discussed in this thread, including:
1. school onboarding enhancements
2. realmName + subdomain + custom domain routing pages
3. school landing page CMS/admin pages
4. public school landing pages
5. student module pages
6. teacher module pages
7. role-aware navigation and feature access
8. transport/AI visualizer/library/forum/etc integration touchpoints where already implemented
9. repair current broken pages/components if needed

==================================================
1. WORKING MODE
==================================================
You must:
- inspect existing codebase first
- identify current design system and reusable UI primitives
- identify all existing layouts and shared components
- reuse them wherever possible
- improve existing weak screens if they do not meet quality
- connect UI to current routes/APIs/services/state flows
- create missing screens/components
- bind forms, tables, cards, filters, tabs, CTA flows, and navigation
- keep everything modular and production-ready

Do NOT only create static pages.
Do NOT only create mockups.
Implement actual UI flow binding with current app structure.

==================================================
2. GLOBAL UX RULES
==================================================
Follow these UX principles everywhere:
- premium modern school ERP feel
- clean hierarchy
- low clutter
- clear section grouping
- responsive across desktop/tablet/mobile
- form-first usability for admin workflows
- simple action-focused flows for students/teachers
- role-based navigation visibility
- minimal cognitive load
- consistent visual density with existing platform
- elegant empty states
- clear validation errors
- clear success feedback
- skeleton loaders where appropriate
- preserve deep links and navigation breadcrumbs
- support filter/search/sort where list pages exist
- make dashboards visually informative but not noisy

Also ensure:
- no overflow issues
- no broken spacing
- no inconsistent fonts
- no uneven card heights where avoidable
- no broken table responsiveness
- no inaccessible CTA placement
- no confusing multi-step flows
- no duplicate/unnecessary actions

==================================================
3. FIX EXISTING UI/UX IF BROKEN
==================================================
Before adding new pages:
- inspect current UI
- find any broken or low-quality pages
- fix:
  - misaligned layouts
  - broken responsiveness
  - inconsistent component usage
  - poor spacing
  - poor readability
  - bad form UX
  - cluttered data tables
  - weak empty/loading/error states
  - broken theme consistency
  - poor navigation flow
  - inconsistent modal/drawer usage
- align everything to the platform UX standard

==================================================
4. SCHOOL ONBOARDING UI/UX
==================================================
Build/improve onboarding flow for school setup.

Include screens/steps for:
- school basic information
- schoolCode
- realmName
- contact details
- address
- map/location selection
- branch information
- branding assets
- routing preference
  - platform subdomain
  - custom domain
  - both
- custom domain setup
- domain verification instructions
- SSL/certificate/routing status
- landing page readiness/completeness
- final activation/publish state

UX requirements:
- multi-step wizard with progress indicator
- editable review screen before submit
- validation + inline help text
- domain setup instructions in clean step cards
- status chips for verified/pending/failed
- copyable DNS values
- strong success/failure state handling

==================================================
5. REALM / ROUTING / DOMAIN MANAGEMENT PAGES
==================================================
Create admin pages for:
- realmName setup
- subdomain selection
- custom domain addition
- domain verification
- canonical domain setting
- redirect mode setting
- routing health/status

Include:
- domain list table
- verification status badges
- DNS instructions panel
- domain health cards
- SSL status indicator
- re-verify action
- set primary/canonical domain action
- delete/disable domain flow
- warning UI for risky actions

==================================================
6. SCHOOL ADMIN CMS UI/UX
==================================================
Build a complete school admin CMS experience for managing school landing page content.

Include pages/sections for:
- school profile
- branding
- about school
- objective
- mission & vision
- history / legacy
- why choose us
- founder page
- founder chairman page
- chairperson message
- director message
- principal page
- leadership / SMC
- admission overview
- admission enquiry settings
- fee structure
- events
- gallery
- video gallery
- testimonials
- achievements
- academics/curriculum
- co-curricular activities
- infrastructure/facilities
- transport showcase
- notices / academic calendar
- results / performance highlights
- branches
- contact us
- social links
- affiliation / compliance
- newsletter CTA
- section visibility / ordering

UX expectations:
- CMS left sidebar navigation
- section-level forms
- reusable form layouts
- rich text editor areas where needed
- media upload with preview
- save draft / publish / unpublish flow
- list pages with filters, sort, search
- reorder sections UX
- preview mode
- clear published vs draft distinction
- content completeness indicator

==================================================
7. PUBLIC SCHOOL LANDING PAGE UI/UX
==================================================
Build public school landing pages matching existing platform landing page UX.

Must include:
- hero section
- About in header/nav
- admissions section
- co-curricular activities
- event gallery
- map location
- testimonials
- upcoming events
- achievements
- founders page
- principal page
- school objective
- contact us
- admission enquiry page
- fee structure page
- branches
- mission & vision
- why us
- history / legacy
- chairperson/director messages
- curriculum overview
- infrastructure showcase
- video gallery
- notices / academic calendar
- results/performance highlights
- newsletter CTA
- social links
- affiliation/compliance
- transport/facility highlight
- quick links footer

UX requirements:
- same premium feel as current platform landing page
- smooth responsive sections
- elegant content hierarchy
- sticky or smart nav if platform already uses it
- modern cards/carousels/grids consistent with platform
- strong CTA placement
- no template-like school-website feel; should feel product-grade

==================================================
8. STUDENT MODULE UI/UX
==================================================
Create/bind student-facing pages for:

A. Student Dashboard
- overview cards
- timetable snapshot
- homework snapshot
- attendance summary
- fee status summary
- upcoming events/assembly updates
- transport quick card if enabled
- AI visualizer shortcut
- library/forum shortcuts

B. Student Profile
- profile view
- limited editable fields
- disabled/locked fields clearly shown
- no delete option

C. Classroom
- own class only
- class teacher
- subject teachers
- principal info
- class details

D. Timetable
- day/week view
- clean period cards or grid
- subject, teacher, timing, room

E. Attendance
- table + calendar view
- filters by period/day/date range/month/time range
- summary cards
- absence reason/comment flow

F. Homework / Daily Diary
- date-wise subject-wise homework list
- status update actions
- completed / pending / in progress states
- teacher notes/attachments

G. Transport
- only if subscription supported
- route, vehicle, pickup/drop, live tracking entry points if already implemented

H. AI Visualizer
- entry page / CTA / integration page if already implemented

I. Results
- previous results
- subject-wise marks
- exam tabs
- performance cards/charts if supported

J. Forums
- discussion list
- post detail
- reply composer
- class/subject discussion channels

K. Library
- browse/search resources/books
- issued books
- due date / status

L. Course Completion Timeline
- subject-wise progress/timeline tracker
- completed/pending topic progress UI

M. Co-curricular Activities
- activity cards
- participation status
- schedule

N. Daily Assembly Updates
- announcement feed
- daily highlights

O. Behaviour Monitoring
- remarks timeline
- positive/negative tags
- teacher comments

P. Fee Status
- paid/pending/overdue summary
- history
- receipts if available

==================================================
9. TEACHER MODULE UI/UX
==================================================
Create/bind teacher-facing pages for:

A. Teacher Dashboard
- attendance shortcuts
- classes taught
- pending homework/review tasks
- exam/marks tasks
- parent communication summary
- salary status summary
- resources/library shortcuts

B. Teacher Profile
- personal profile
- attendance summary
- assigned classes/subjects

C. Attendance Marking
- mark attendance by class
- mark attendance by period
- multiple marking patterns
- quick actions like present all / absent only / edit entries
- remarks support

D. Teacher Attendance View
- own attendance page
- filters and summary

E. Student Attendance View
- all classes taught
- class teacher gets full class attendance access
- table, filters, detailed drilldown

F. Homework Management
- create homework
- update homework
- list homework
- filter by class/subject/date
- attach resources
- completion tracking

G. Exam & Marks Management
- create test/exam/paper
- enter marks
- update marks
- view performance summary
- publish states if applicable

H. Behaviour Management
- add behaviour remarks
- tags/categories
- class/student history

I. Parent Communication
- chat/message UI
- send announcements
- send per-parent voice note if enabled
- conversation history

J. Library / Resources
- upload/view teaching resources
- browse digital library
- class-resource linking

K. Salary Status
- payslip/status/summary page

L. Class Teacher Actions
- request add student to class
- admin approval status tracking
- limited student data update forms
- class-level management tools

==================================================
10. ROLE-BASED NAVIGATION
==================================================
Implement role-aware navigation and information architecture for:
- platform admin
- school admin
- student
- teacher
- class teacher specific actions

Requirements:
- only show relevant menu items per role
- support subscription-aware items like transport
- support feature flags for AI visualizer, forum, library, etc.
- highlight current route properly
- use existing sidebar/topbar patterns
- support mobile nav cleanly

==================================================
11. COMMON PAGE TYPES TO IMPLEMENT/IMPROVE
==================================================
Make sure all these UI patterns are properly implemented and consistent:
- dashboard pages
- data table pages
- detail pages
- creation/edit forms
- wizards
- CMS pages
- calendar/timeline pages
- chat/messaging interfaces
- media galleries
- profile pages
- status/analytics widgets
- empty states
- no-data states
- access denied states
- loading states
- error states
- confirmation modals
- approval workflow screens

==================================================
12. DESIGN SYSTEM REUSE
==================================================
Inspect and reuse existing:
- button variants
- form fields
- selects
- chips/badges
- tabs
- accordions
- cards
- tables
- stat widgets
- sidebar/header shells
- drawers/modals
- loaders/skeletons
- toasts/alerts
- pagination
- breadcrumbs

Where current components are weak or inconsistent:
- improve them without breaking current app behavior

==================================================
13. UX QUALITY IMPROVEMENTS
==================================================
While implementing, improve:
- form completion flow
- admin content density
- dashboard readability
- CTA clarity
- search/filter discoverability
- mobile responsiveness
- page transition consistency
- visual hierarchy
- edit/view state clarity
- permission-based disabled states

For every page, ensure:
- obvious primary action
- obvious secondary action
- no dead space
- no action overload
- no hidden critical info
- no inconsistent spacing

==================================================
14. BINDING / INTEGRATION REQUIREMENTS
==================================================
Bind UI to actual logic/routes/state/APIs.

This includes:
- existing routes
- existing auth guards
- role checks
- feature toggles
- subscription gating
- current service/API contracts
- public vs admin view separation
- published vs draft content state
- domain/routing status data
- transport/AI visualizer/library/forum integrations where already available

If APIs are missing:
- create frontend-ready integration points/stubs aligned with existing architecture

==================================================
15. RESPONSIVENESS REQUIREMENTS
==================================================
Every page must work for:
- desktop
- tablet
- mobile

Ensure:
- no broken tables on small screens
- cards stack cleanly
- forms become mobile-friendly
- sidebars collapse correctly
- filters adapt cleanly
- timelines/calendars remain usable

==================================================
16. ACCESSIBILITY / USABILITY
==================================================
Improve:
- contrast
- labels
- field descriptions
- focus states
- keyboard usability where practical
- readable form validation
- icon + text balance
- long-content readability

==================================================
17. IMPLEMENTATION ORDER
==================================================
Implement in this order:

1. inspect current app and design system
2. identify broken/inconsistent current pages and fix them
3. strengthen shared layout/components
4. build school onboarding and domain/routing management UI
5. build school admin CMS UI
6. build public school landing pages
7. build student module UI
8. build teacher module UI
9. bind role-based navigation and permissions
10. polish states, responsiveness, and edge cases

==================================================
18. DELIVERABLES
==================================================
Provide:
1. list of existing pages/components fixed
2. list of new pages created
3. list of shared components reused/extended
4. updated navigation structure by role
5. all route bindings
6. API/service bindings used
7. responsive behavior notes
8. summary of UI/UX improvements made

==================================================
19. IMPORTANT OUTPUT EXPECTATION
==================================================
Do not just describe UI ideas.
Actually implement or scaffold production-ready UI code aligned with the existing codebase.

At the end, summarize:
- pages created
- pages fixed
- components added/updated
- routes added/updated
- UI consistency improvements
- broken UX/UI issues resolved


You are working on our existing school management system. 

Implement a multi-tenant school landing-page module and school admin CMS enhancements with the following requirements.

IMPORTANT UX REQUIREMENT:
- The UX, visual language, spacing, typography, component styling, responsiveness, and overall premium feel of the school landing page must match our existing platform landing page.
- Reuse existing design tokens, layout grid, navbar/footer patterns, buttons, cards, animation style, and section spacing.
- Do not create a disconnected theme. It should feel like the school landing page is a branded extension of the current platform.

==================================================
1. SCHOOL SUBDOMAIN / URL ACTIVATION FLOW
==================================================
When a school admin activates their school code from the platform page:
- Redirect to: http://[schoolCode].localhost:30080
- Land on a school-specific sign-in page
- Resolve tenant by subdomain / schoolCode
- Persist tenant context across auth and page load
- Show school branding if available (logo, name, theme accent, cover image)

Implement:
- subdomain-based tenant resolver
- middleware / request interceptor for tenant detection
- fallback error page if schoolCode is invalid or inactive
- auth-aware redirect so unauthenticated school admins are asked to sign in
- environment-friendly config so localhost works now and can later move to production domains

==================================================
2. SCHOOL ADMIN CMS / CONTENT MANAGEMENT
==================================================
Create a school admin page/dashboard where admin can manage school landing-page content.

Admin should be able to create/update:
- School basic profile
  - school name
  - school code
  - tagline
  - short intro
  - full about content
  - school objective
  - address
  - contact numbers
  - email
  - website/social links
  - map location (lat/lng + full address)
  - branch information (if multiple branches)
- Branding
  - logo
  - favicon
  - hero/banner images
  - school theme accent if supported
- Testimonials
  - testimonial text
  - student/parent/alumni name
  - designation/relationship
  - optional image
  - publish toggle
  - display priority
- Founders / leadership pages
  - founder
  - founder chairman
  - chairperson message
  - director message
  - principal page
  - photos + rich text content
- Admissions
  - admission overview
  - admission enquiry CTA
  - eligibility / process
  - downloadable brochure if supported
- Fee structure
  - structured fee table
  - downloadable PDF option
- Achievements
  - title
  - description
  - year
  - media/image
  - featured toggle
- Upcoming events
  - title
  - date/time
  - location
  - description
  - banner image
  - featured toggle
  - registration/enquiry CTA if needed
- Event gallery
  - albums
  - images
  - optional video gallery support
  - event tags / dates
- Co-curricular activities
  - title
  - icon/image
  - description
- Campus / infrastructure
  - labs
  - library
  - cafeteria
  - transport
  - sports facilities
  - special infrastructure cards
- Curriculum / academics overview
- Mission & Vision
- Why Choose Us
- Origin / History / Legacy
- Affiliation / compliance info
- Notices / academic calendar / important links
- Newsletter CTA content
- Contact us / enquiry messages
- Admission enquiry form submissions

CMS requirements:
- rich text editor where needed
- media uploader for images/docs
- preview mode
- publish/unpublish
- section reorder support if feasible
- validation and empty-state handling
- audit-friendly updated timestamps

==================================================
3. SCHOOL LANDING PAGE SECTIONS
==================================================
Build the public school landing page with these sections.

Required from product requirements:
- Header with About section
- Admission section
- Co-curricular Activities
- Event Gallery on side or footer
- Map locating the school
- Testimonials
- Upcoming Events section
  - latest upcoming event on top
  - remaining upcoming events in modern card/list view
- Achievements
- Founders Page
- Principal Page
- School Objective on landing page
- Contact Us page
- Admission Enquiry page
- Fee Structure page
- Branch information if school has branches

Also include SPSEC-inspired sections/features:
- Mission & Vision
- Why Us
- Origin / History / Legacy
- Chairperson / Director message blocks
- School Management / leadership highlight
- Curriculum overview
- Scholarship / awards highlights
- Campus infrastructure showcase
- Video gallery support
- Parent notices / academic calendar / important announcements
- Results / performance highlight
- Newsletter subscription CTA
- Social links
- Affiliation / CBSE / compliance information
- Transport / facilities showcase
- Quick links footer

==================================================
4. LANDING PAGE INFORMATION ARCHITECTURE
==================================================
Suggested public navigation:
- Home
- About
  - About School
  - Mission & Vision
  - History / Legacy
  - Why Us
  - Founder
  - Founder Chairman
  - Chairperson Message
  - Director Message
  - Principal
  - Leadership / SMC
- Academics
  - Curriculum
  - Co-curricular Activities
  - Achievements
  - Results
  - Scholarship / awards
- Admissions
  - Admission Overview
  - Admission Enquiry
  - Fee Structure
- Campus Life
  - Infrastructure
  - Gallery
  - Video Gallery
  - Transport
  - Branches
- Events
  - Upcoming Events
  - Notices / Calendar
- Contact

==================================================
5. PAGE / SECTION BEHAVIOR
==================================================
Homepage behavior:
- Hero section with school branding, headline, CTA buttons
- Sticky nav matching existing platform style
- Smooth section scrolling
- Responsive mobile/tablet/desktop layout
- Fast-loading media with lazy loading where appropriate

Upcoming events:
- Sort by nearest future date first
- Show featured/latest upcoming event in large highlighted card
- Show remaining events in modern grid/list cards
- Auto-hide past events from “upcoming” and optionally move them to archive

Gallery:
- Masonry/grid gallery with lightbox
- Album/category filters if feasible
- Optional mixed photo/video support

Testimonials:
- carousel or premium grid
- admin-configurable ordering
- graceful fallback if no image

Map:
- render from onboarding/admin-saved location
- show address and directions CTA
- if multiple branches exist, support branch-wise map markers or branch switcher

Branches:
- show only if school has branches
- each branch should include address, contact, map, and quick CTA

Admission enquiry:
- public form with validations
- save submissions in admin panel
- success state + optional email/notification hook

Fee structure:
- render clean responsive table/cards
- support downloadable attachment if uploaded

Contact page:
- school address
- phone
- email
- office timings if available
- contact form
- map embed

==================================================
6. SCHOOL ONBOARDING CHANGES
==================================================
Extend school onboarding to capture:
- school code
- official school name
- short name
- map location
- complete address
- contact details
- branding assets
- whether school has branches
- branch list
- admission contact info
- social links
- whether landing page is public/published

==================================================
7. DATA MODEL / BACKEND EXPECTATIONS
==================================================
Design normalized backend models or equivalent schema for:
- SchoolTenant
- SchoolProfile
- SchoolBranding
- SchoolLandingPageSectionConfig
- SchoolTestimonial
- SchoolEvent
- SchoolGalleryAlbum
- SchoolGalleryMedia
- SchoolAchievement
- SchoolLeaderProfile
- SchoolBranch
- SchoolAdmissionInfo
- SchoolFeeStructure
- SchoolInfrastructureItem
- SchoolNotice
- SchoolEnquiry
- SchoolNewsletterSubscription
- SchoolSocialLink
- SchoolAffiliationInfo

Ensure:
- tenant isolation by school
- media references are tenant-safe
- public API fetches only published content
- admin APIs are authenticated + authorized

==================================================
8. ADMIN UX REQUIREMENTS
==================================================
School admin content manager should include:
- left nav by section
- section-wise forms
- inline media preview
- save draft / publish actions
- list pages for testimonials, events, achievements, gallery items, enquiries
- search/filter/sort in admin lists
- branch management UI
- reorder controls for homepage sections if enabled

==================================================
9. FRONTEND / COMPONENT GUIDELINES
==================================================
Build reusable components:
- SchoolHero
- SchoolAboutSection
- MissionVisionSection
- WhyChooseUsSection
- LeadershipCards
- PrincipalMessageSection
- FounderStorySection
- ObjectiveSection
- CurriculumHighlights
- CoCurricularGrid
- AchievementCards
- UpcomingEventsShowcase
- GallerySection
- VideoGallerySection
- TestimonialsSection
- InfrastructureSection
- BranchesSection
- AffiliationSection
- NoticesAndCalendarSection
- FeeStructureSection
- AdmissionCTASection
- AdmissionEnquiryForm
- ContactSection
- MapSection
- FooterQuickLinks

Keep all components aligned with existing platform landing page UX.

==================================================
10. TECHNICAL EXPECTATIONS
==================================================
Please:
- inspect current codebase first
- reuse existing layout and shared UI components wherever possible
- avoid breaking current platform landing page
- wire routes cleanly for tenant/public/admin flows
- add seed/mock data for one school tenant
- include loading, error, and empty states
- keep code modular and production-ready

==================================================
11. DELIVERABLES
==================================================
Provide:
1. schema/model changes
2. API/backend changes
3. route changes
4. admin CMS pages
5. public school landing pages
6. reusable UI components
7. sample seeded data
8. notes for local testing:
   - example tenant URL: http://demo-school.localhost:30080

Also include a short summary of what was added and any migration/setup steps required.


You are a senior product designer and frontend engineer working inside an existing School Management System platform.

Your task is to design and implement the complete UI/UX for the Student and Teacher modules and bind them to the system.

CRITICAL REQUIREMENTS

1. The UI/UX MUST match the existing platform design system exactly.
2. Reuse existing:
   - layout shell
   - sidebar navigation
   - header components
   - buttons
   - form fields
   - tables
   - cards
   - filters
   - modals
   - typography
   - spacing system
   - color tokens
3. Do NOT introduce a new design language.
4. Inspect the current platform UI and FIX any broken, inconsistent, or outdated UI/UX while implementing these modules.
5. Ensure all pages are responsive for desktop, tablet, and mobile.
6. Bind UI to routes, APIs, role guards, and feature flags.

The goal is to create a clean, modern, student-friendly and teacher-friendly experience without deviating from the platform's UI.

====================================================
GLOBAL UX PRINCIPLES
====================================================

Follow these UX principles:

- Minimal cognitive load
- Clear hierarchy
- Card-based dashboards
- Clean tables for data
- Quick actions
- Simple navigation
- Clear role-based access
- Informative but not cluttered dashboards
- Strong empty states
- Good loading states
- Good error states
- Smart filtering

Avoid:
- overcrowded screens
- deep navigation
- unnecessary clicks
- inconsistent components

====================================================
STUDENT MODULE UI/UX
====================================================

Create the complete Student experience.

----------------------------------------------------
Student Navigation Structure
----------------------------------------------------

Student sidebar should include:

Dashboard
Profile
Classroom
Timetable
Attendance
Homework / Daily Diary
Results
Forums
Library
Course Progress
Co-Curricular Activities
Assembly Updates
Behaviour Monitoring
Fee Status
Transport (if enabled)
AI Visualizer (if enabled)

Only show modules allowed by school subscription.

----------------------------------------------------
Student Dashboard
----------------------------------------------------

Design a modern dashboard with cards and quick insights.

Sections should include:

Academic Overview
- attendance percentage
- upcoming classes
- homework pending

Today's Schedule
- period cards

Announcements
- daily assembly updates
- school notices

Quick Access
- AI Visualizer
- Library
- Forums

Performance Snapshot
- latest exam marks
- grade trend indicator

Fee Status
- paid/pending indicator

Transport Status
- pickup/drop info if enabled

Dashboard should feel lightweight and quick to scan.

----------------------------------------------------
Student Profile Page
----------------------------------------------------

Profile page should show:

Profile photo
Name
Admission number
Class
Section
Roll number
Contact details
Address
Parent details

Editable fields must be clearly marked.

Restricted fields must be shown as locked.

No delete profile option.

----------------------------------------------------
Student Classroom Page
----------------------------------------------------

Show:

Class name
Section
Class teacher
Subject teachers
Principal

Display teacher cards with:

photo
name
subject
contact button if allowed

----------------------------------------------------
Timetable UI
----------------------------------------------------

Provide two views:

Day view
Week view

Display timetable as period cards or grid.

Each period should show:

subject
teacher
time
room

Highlight current period.

----------------------------------------------------
Attendance Page
----------------------------------------------------

Provide:

Calendar view
Table view

Filters:

period
day
date range
month

Show:

present
absent
late
leave

Add option:

"Add absence reason"

Student can comment on absence.

Use a simple modal form.

----------------------------------------------------
Homework / Daily Diary
----------------------------------------------------

Homework should be shown:

date wise
subject wise

Homework card should include:

subject
teacher
description
attachments

Student can:

mark completed
mark in progress
add notes

Include status indicators.

----------------------------------------------------
Results Page
----------------------------------------------------

Show results in tabs by exam.

Each exam should show:

subject
marks
grade

Include optional performance graph.

Allow report card download.

----------------------------------------------------
Forums UI
----------------------------------------------------

Forum should include:

discussion categories
class discussions
subject discussions

Pages:

forum list
post detail
reply thread

Allow:

create post
reply
report content

----------------------------------------------------
Library UI
----------------------------------------------------

Library page should include:

search bar
filters
book cards
resource cards

Student can:

view issued books
see due dates
reserve books

----------------------------------------------------
Course Completion Timeline
----------------------------------------------------

Show subject-wise progress.

Use a progress tracker showing:

completed chapters
pending chapters

Timeline view recommended.

----------------------------------------------------
Co-Curricular Activities
----------------------------------------------------

Show activities as cards.

Include:

activity name
schedule
participation status

Student can register if allowed.

----------------------------------------------------
Assembly Updates
----------------------------------------------------

Show announcements feed.

Cards should include:

date
announcement
highlight message

----------------------------------------------------
Behaviour Monitoring
----------------------------------------------------

Display behaviour records.

Use timeline format.

Include:

teacher remarks
positive or negative tags
date

----------------------------------------------------
Fee Status
----------------------------------------------------

Show:

paid amount
pending amount
due date

Include:

receipt download
payment history table

----------------------------------------------------
Transport Page
----------------------------------------------------

Show if subscription allows.

Include:

route
vehicle
driver
pickup/drop point

Optional live location placeholder if already implemented.

----------------------------------------------------
AI Visualizer Entry
----------------------------------------------------

Provide a simple entry page or shortcut to AI visualizer.

====================================================
TEACHER MODULE UI/UX
====================================================

Teacher navigation should include:

Dashboard
Profile
My Timetable
Attendance
Homework
Exams & Marks
Behaviour
Parent Communication
Library Resources
Salary
Classes

If teacher is class teacher also include:

Class Management
Student Management

----------------------------------------------------
Teacher Dashboard
----------------------------------------------------

Dashboard cards:

Classes today
Attendance tasks
Homework pending
Exam marking tasks
Parent messages
Salary status

Quick shortcuts:

Mark attendance
Create homework
Enter marks

----------------------------------------------------
Teacher Profile
----------------------------------------------------

Display:

profile
subjects taught
assigned classes
attendance summary

----------------------------------------------------
Attendance Marking Page
----------------------------------------------------

Provide an efficient UI.

Steps:

select class
select subject
select period

Attendance grid should show:

student list
present/absent toggle

Provide quick actions:

mark all present
mark absent only
edit entries

Allow remarks.

----------------------------------------------------
Teacher Attendance Page
----------------------------------------------------

Teacher can view:

own attendance

Filters:

month
date range

Show summary cards.

----------------------------------------------------
Student Attendance View
----------------------------------------------------

Teacher can see attendance of classes they teach.

Class teacher can see entire class attendance.

Use:

table view
calendar view

----------------------------------------------------
Homework Management
----------------------------------------------------

Homework creation form should include:

class
subject
description
attachments
due date

Homework list page should allow:

edit
delete
view submissions

----------------------------------------------------
Exams & Marks
----------------------------------------------------

Teacher can:

create exam
create test
enter marks

Marks entry UI should use:

editable table

Allow bulk save.

----------------------------------------------------
Behaviour Monitoring
----------------------------------------------------

Teacher can:

add behaviour remark
select category

Show behaviour history timeline.

----------------------------------------------------
Parent Communication
----------------------------------------------------

Provide messaging interface.

Allow:

send text message
send voice note if enabled

Show conversation history.

----------------------------------------------------
Library Resources
----------------------------------------------------

Teacher can:

upload resources
browse resources

Resource card should include:

title
subject
download option

----------------------------------------------------
Salary Status
----------------------------------------------------

Show:

salary summary
payment status
payslip download

----------------------------------------------------
Class Teacher Actions
----------------------------------------------------

If teacher is class teacher allow:

add student request
update limited student data

Show approval status from admin.

====================================================
ROLE BASED ACCESS
====================================================

Ensure navigation changes based on role.

Student should not see teacher modules.

Teacher should not see student-only modules.

Class teacher gets additional permissions.

====================================================
RESPONSIVE REQUIREMENTS
====================================================

Ensure UI works for:

desktop
tablet
mobile

Tables should convert to cards on mobile.

====================================================
DELIVERABLES
====================================================

Provide:

1. Student module page list
2. Teacher module page list
3. navigation structure
4. reusable UI components used
5. improvements made to existing UI
6. route binding plan
7. responsive behavior notes

Also fix any broken UI in the current platform while implementing.