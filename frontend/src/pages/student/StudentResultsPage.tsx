import React, { useEffect, useMemo, useState } from 'react';
import { BarChart3, Download, Loader, Medal } from 'lucide-react';
import { PortalPageHeader, PortalSection, PortalStatePanel, PortalStatCard } from '../../components/portal/PortalPagePrimitives';
import { schoolOpsApi, type ExamResponse, type ExamScheduleItemResponse, type SubjectResponse } from '../../lib/api';
import { studentPortalApi, type StudentResultResponse } from '../../lib/schoolPortalApi';
import { useStore } from '../../store/useStore';

type ExamBucket = {
  key: string;
  examId?: string | null;
  examName: string;
  academicYear?: string | null;
  items: StudentResultResponse[];
};

export default function StudentResultsPage() {
  const { session } = useStore();
  const [results, setResults] = useState<StudentResultResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [activeExamKey, setActiveExamKey] = useState('');
  const [downloading, setDownloading] = useState(false);
  const [examCatalog, setExamCatalog] = useState<ExamResponse[]>([]);
  const [examSchedules, setExamSchedules] = useState<Record<string, ExamScheduleItemResponse[]>>({});
  const [subjectsById, setSubjectsById] = useState<Record<string, SubjectResponse>>({});

  useEffect(() => {
    let active = true;
    studentPortalApi.getResults()
      .then((response) => {
        if (!active) return;
        setResults(response);
        const first = response[0];
        setActiveExamKey(first ? `${first.examId || first.examName}-${first.academicYear || 'current'}` : '');
      })
      .catch((error: any) => {
        if (active) setMessage(error?.message || 'Unable to load results.');
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    let active = true;
    const schoolId = session.schoolId;
    if (!schoolId) return () => { active = false; };

    (async () => {
      try {
        const [exams, subjects] = await Promise.all([
          schoolOpsApi.listExams(schoolId),
          schoolOpsApi.listSubjects(schoolId),
        ]);
        if (!active) return;
        const publishedOrScheduled = exams.filter((exam) => exam.status !== 'DRAFT');
        setExamCatalog(publishedOrScheduled);
        setSubjectsById(Object.fromEntries(subjects.map((subject) => [subject.subjectId, subject])));

        const schedules = await Promise.all(
          publishedOrScheduled.slice(0, 6).map(async (exam) => [exam.examId, await schoolOpsApi.listExamSchedule(exam.examId, schoolId)] as const),
        );
        if (!active) return;
        setExamSchedules(Object.fromEntries(schedules));
      } catch (error: any) {
        if (active) {
          setMessage((current) => current || error?.message || 'Unable to load examination schedule.');
        }
      }
    })();

    return () => {
      active = false;
    };
  }, [session.schoolId]);

  const examBuckets = useMemo<ExamBucket[]>(() => {
    const byKey = new Map<string, ExamBucket>();
    for (const item of results) {
      const key = `${item.examId || item.examName}-${item.academicYear || 'current'}`;
      if (!byKey.has(key)) {
        byKey.set(key, {
          key,
          examId: item.examId,
          examName: item.examName,
          academicYear: item.academicYear,
          items: [],
        });
      }
      byKey.get(key)?.items.push(item);
    }
    return Array.from(byKey.values());
  }, [results]);

  const activeExam = useMemo(() => examBuckets.find((item) => item.key === activeExamKey) || examBuckets[0] || null, [activeExamKey, examBuckets]);
  const activeResults = activeExam?.items || [];
  const visibleExams = useMemo(() => examCatalog.slice(0, 4), [examCatalog]);
  const totalMarks = useMemo(() => activeResults.reduce((sum, item) => sum + item.marksObtained, 0), [activeResults]);
  const totalMax = useMemo(() => activeResults.reduce((sum, item) => sum + item.maxMarks, 0), [activeResults]);
  const percentage = totalMax ? ((totalMarks / totalMax) * 100).toFixed(1) : '0.0';
  const formatDate = (value?: string | null) => value ? new Date(value).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : 'Date not published';
  const formatStatus = (value: string) => value.charAt(0) + value.slice(1).toLowerCase();

  const downloadReportCard = async () => {
    if (!activeExam?.examId || !session.schoolId || !session.userId) {
      setMessage('This exam does not have a publishable report card yet.');
      return;
    }
    setDownloading(true);
    setMessage('');
    try {
      const reportCard = await schoolOpsApi.getStudentReportCard(activeExam.examId, session.schoolId, session.userId);
      const rows = reportCard.entries.map((entry) => `
        <tr>
          <td style="padding:10px;border-bottom:1px solid #e2e8f0;">${entry.subjectName}</td>
          <td style="padding:10px;border-bottom:1px solid #e2e8f0;">${entry.marksObtained}</td>
          <td style="padding:10px;border-bottom:1px solid #e2e8f0;">${entry.maxMarks}</td>
          <td style="padding:10px;border-bottom:1px solid #e2e8f0;">${entry.percentage}%</td>
          <td style="padding:10px;border-bottom:1px solid #e2e8f0;">${entry.grade}</td>
        </tr>
      `).join('');

      const html = `
        <html>
          <head>
            <title>${reportCard.examName} Report Card</title>
          </head>
          <body style="font-family:Inter,Arial,sans-serif;background:#f8fafc;color:#0f172a;padding:32px;">
            <div style="max-width:900px;margin:0 auto;background:#fff;border-radius:24px;padding:32px;box-shadow:0 20px 60px rgba(15,23,42,0.08);">
              <h1 style="margin:0 0 8px;">${reportCard.examName} Report Card</h1>
              <p style="margin:0 0 24px;color:#475569;">Academic year: ${reportCard.academicYear} ${reportCard.term ? `· Term: ${reportCard.term}` : ''}</p>
              <div style="display:flex;gap:18px;flex-wrap:wrap;margin-bottom:24px;">
                <div style="padding:16px 18px;border-radius:16px;background:#ecfeff;">Total scored: <strong>${reportCard.totalMarksObtained}</strong></div>
                <div style="padding:16px 18px;border-radius:16px;background:#f5f3ff;">Out of: <strong>${reportCard.totalMaxMarks}</strong></div>
                <div style="padding:16px 18px;border-radius:16px;background:#f0fdf4;">Overall: <strong>${reportCard.overallPercentage}% · ${reportCard.overallGrade}</strong></div>
              </div>
              <table style="width:100%;border-collapse:collapse;">
                <thead>
                  <tr style="text-align:left;background:#f8fafc;">
                    <th style="padding:10px;">Subject</th>
                    <th style="padding:10px;">Scored</th>
                    <th style="padding:10px;">Max</th>
                    <th style="padding:10px;">Percent</th>
                    <th style="padding:10px;">Grade</th>
                  </tr>
                </thead>
                <tbody>${rows}</tbody>
              </table>
            </div>
          </body>
        </html>
      `;

      const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      window.open(url, '_blank', 'noopener,noreferrer');
      window.setTimeout(() => URL.revokeObjectURL(url), 60_000);
    } catch (error: any) {
      setMessage(error?.message || 'Unable to prepare the report card.');
    } finally {
      setDownloading(false);
    }
  };

  if (loading) {
    return <PortalStatePanel icon={Loader} title="Loading results" description="Fetching exam tabs and subject marks." accent="#ffb663" />;
  }

  if (!results.length) {
    return <PortalStatePanel title="No published results" description={message || 'Results will appear here when teachers publish them.'} />;
  }

  return (
    <div className="space-y-6 pb-16">
      <PortalPageHeader
        eyebrow="Results"
        title="Subject marks and exam performance"
        description="Results are grouped by exam session, and the report-card action now opens a print-ready summary instead of a dead button."
      />

      <div className="grid gap-4 md:grid-cols-4">
        <PortalStatCard label="Exams" value={examBuckets.length} icon={Medal} accent="#ffb663" />
        <PortalStatCard label="Total scored" value={totalMarks} icon={BarChart3} accent="#22d3ee" />
        <PortalStatCard label="Out of" value={totalMax} icon={Download} accent="#a78bfa" />
        <PortalStatCard label="Overall %" value={`${percentage}%`} icon={Medal} accent="#34d399" />
      </div>

      <PortalSection title="Exam tabs" description="Switch between exam sessions to inspect subject-level marks.">
        <div className="flex flex-wrap gap-3">
          {examBuckets.map((exam) => (
            <button key={exam.key} type="button" className={exam.key === activeExam?.key ? 'primary-button' : 'secondary-button'} onClick={() => setActiveExamKey(exam.key)}>
              {exam.examName}
              {exam.academicYear ? ` · ${exam.academicYear}` : ''}
            </button>
          ))}
        </div>
      </PortalSection>

      <PortalSection
        title={activeExam?.examName || 'Exam details'}
        description="Subject-level rows stay responsive, and the report-card action uses the student report card endpoint when the exam is mapped."
        action={(
          <button type="button" className="secondary-button" onClick={downloadReportCard} disabled={downloading || !activeExam?.examId}>
            <Download size={16} /> {downloading ? 'Preparing...' : 'Report card'}
          </button>
        )}
      >
        <div className="grid gap-4">
          {activeResults.map((item, index) => (
            <div key={`${item.examId || item.examName}-${item.subjectName}-${index}`} className="glass-panel" style={{ padding: 20, display: 'flex', justifyContent: 'space-between', gap: 18, flexWrap: 'wrap' }}>
              <div>
                <div style={{ color: 'var(--text-strong)', fontWeight: 800 }}>{item.subjectName}</div>
                <div style={{ color: 'var(--text-dim)', fontSize: '0.82rem' }}>{item.academicYear || 'Current academic year'}</div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 24, flexWrap: 'wrap' }}>
                <div style={{ color: 'var(--text-dim)' }}>{item.marksObtained} / {item.maxMarks}</div>
                <div style={{ color: '#22d3ee', fontWeight: 800 }}>{item.grade || `${((item.marksObtained / item.maxMarks) * 100).toFixed(1)}%`}</div>
              </div>
            </div>
          ))}
        </div>
        {message ? <div style={{ color: 'var(--text-dim)' }}>{message}</div> : null}
      </PortalSection>

      <PortalSection title="Examination schedule" description="Upcoming and published exam slots stay visible so students can plan before results are released.">
        <div className="grid gap-4 xl:grid-cols-2">
          {visibleExams.length ? visibleExams.map((exam) => {
            const schedule = examSchedules[exam.examId] || [];
            return (
              <div key={exam.examId} className="glass-panel" style={{ padding: 20, display: 'grid', gap: 14 }}>
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div style={{ color: 'var(--text-strong)', fontWeight: 800, fontSize: '1.05rem' }}>{exam.examName}</div>
                    <div style={{ color: 'var(--text-dim)', fontSize: '0.82rem' }}>
                      {exam.academicYear} {exam.term ? `· ${exam.term}` : ''}
                    </div>
                  </div>
                  <div style={{ color: '#22d3ee', fontWeight: 800, fontSize: '0.78rem' }}>{formatStatus(exam.status)}</div>
                </div>
                <div style={{ color: 'var(--text-dim)', fontSize: '0.84rem' }}>
                  Window: {formatDate(exam.startDate)} - {formatDate(exam.endDate)}
                </div>
                <div className="grid gap-3">
                  {schedule.length ? schedule.map((slot) => (
                    <div key={slot.scheduleItemId} style={{ padding: '12px 14px', borderRadius: 16, background: 'rgba(255,255,255,0.03)' }}>
                      <div style={{ color: 'var(--text-strong)', fontWeight: 700 }}>
                        {subjectsById[slot.subjectId]?.subjectName || 'Subject details syncing'}
                      </div>
                      <div style={{ color: 'var(--text-dim)', fontSize: '0.82rem' }}>
                        {formatDate(slot.examDate)} · {slot.startTime || 'Time not published'} - {slot.endTime || 'Time not published'}
                      </div>
                      <div style={{ color: 'var(--text-dim)', fontSize: '0.82rem' }}>
                        {slot.roomName || 'Room not assigned yet'} · Max marks {slot.maxMarks}
                      </div>
                    </div>
                  )) : (
                    <div style={{ padding: '12px 14px', borderRadius: 16, background: 'rgba(255,255,255,0.03)', color: 'var(--text-dim)' }}>
                      The school has created this exam, but the per-subject schedule is not published yet.
                    </div>
                  )}
                </div>
              </div>
            );
          }) : (
            <div className="glass-panel" style={{ padding: 20, color: 'var(--text-dim)' }}>
              Examination schedules will appear here once the school publishes the exam calendar.
            </div>
          )}
        </div>
      </PortalSection>
    </div>
  );
}
