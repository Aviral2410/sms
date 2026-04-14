import React, { useEffect, useMemo, useState } from 'react';
import { BarChart3, Download, Loader, Medal } from 'lucide-react';
import { PortalPageHeader, PortalSection, PortalStatePanel, PortalStatCard } from '../../components/portal/PortalPagePrimitives';
import { studentPortalApi, type StudentResultResponse } from '../../lib/schoolPortalApi';

export default function StudentResultsPage() {
  const [results, setResults] = useState<StudentResultResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [activeExam, setActiveExam] = useState('');

  useEffect(() => {
    let active = true;
    studentPortalApi.getResults()
      .then((response) => {
        if (!active) return;
        setResults(response);
        setActiveExam(response[0]?.examName || '');
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

  const exams = useMemo(() => Array.from(new Set(results.map((item) => item.examName))), [results]);
  const activeResults = useMemo(() => results.filter((item) => item.examName === activeExam), [activeExam, results]);
  const totalMarks = useMemo(() => activeResults.reduce((sum, item) => sum + item.marksObtained, 0), [activeResults]);
  const totalMax = useMemo(() => activeResults.reduce((sum, item) => sum + item.maxMarks, 0), [activeResults]);

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
        description="Results are organized by exam tabs so students can compare performance without leaving the main academic flow."
      />

      <div className="grid gap-4 md:grid-cols-3">
        <PortalStatCard label="Exams" value={exams.length} icon={Medal} accent="#ffb663" />
        <PortalStatCard label="Total scored" value={totalMarks} icon={BarChart3} accent="#22d3ee" />
        <PortalStatCard label="Out of" value={totalMax} icon={Download} accent="#a78bfa" />
      </div>

      <PortalSection title="Exam tabs" description="Switch between exam sessions to inspect subject-level marks.">
        <div className="flex flex-wrap gap-3">
          {exams.map((exam) => (
            <button key={exam} type="button" className={exam === activeExam ? 'primary-button' : 'secondary-button'} onClick={() => setActiveExam(exam)}>
              {exam}
            </button>
          ))}
        </div>
      </PortalSection>

      <PortalSection
        title={activeExam || 'Exam details'}
        description="Subject-level rows stay responsive, and the download action remains visible without taking over the whole page."
        action={<button type="button" className="secondary-button"><Download size={16} /> Report card</button>}
      >
        <div className="grid gap-4">
          {activeResults.map((item, index) => (
            <div key={`${item.examName}-${item.subjectName}-${index}`} className="glass-panel" style={{ padding: 20, display: 'flex', justifyContent: 'space-between', gap: 18, flexWrap: 'wrap' }}>
              <div>
                <div style={{ color: 'var(--text-strong)', fontWeight: 800 }}>{item.subjectName}</div>
                <div style={{ color: 'var(--text-dim)', fontSize: '0.82rem' }}>{item.academicYear || 'Current academic year'}</div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 24, flexWrap: 'wrap' }}>
                <div style={{ color: 'var(--text-dim)' }}>{item.marksObtained} / {item.maxMarks}</div>
                <div style={{ color: '#22d3ee', fontWeight: 800 }}>{item.grade || 'Grade pending'}</div>
              </div>
            </div>
          ))}
        </div>
      </PortalSection>
    </div>
  );
}
