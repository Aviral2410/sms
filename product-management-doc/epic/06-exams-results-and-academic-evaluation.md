# Epic 06: Exams, Results, and Academic Evaluation

## Epic Intent

Support exam lifecycle management, scheduling, marks capture, report-card generation, and teacher/student result journeys.

## Primary Users

- School admin
- Teacher
- Student

## Current Implementation Requirements

- Exam management must support:
  list exams, create exam, publish exam, get schedule, set schedule, submit marks, and generate/report student report cards.
- Generic school-ops endpoints must support results retrieval and result creation.
- Teacher module must support marks submission.
- Student module must support results retrieval.
- Frontend must expose:
  exam management, teacher marks, and student results pages.

## Current Product Notes

- The implemented footprint suggests the domain is present but narrower than attendance or transport.
- This epic should be treated as “core academic workflow” rather than “fully mature assessment platform” until grading, moderation, and publication reliability are proven.

## Known Gaps / Stabilization Needs

- End-to-end regression for schedule, marks entry, publish, and student result consumption.
- Data consistency validation between exam-specific and generic result endpoints.
- Permission validation for who can publish vs who can enter marks.

## Success Metrics

- marks submission success rate
- exam publish success rate
- student result retrieval success rate
- report-card generation error rate
