import React, { useEffect, useMemo, useState } from 'react';
import { BookOpen, BookText, CheckCircle2, Clock3, Loader } from 'lucide-react';
import Button from '../../components/ui/Button';
import { PortalPageHeader, PortalSection, PortalStatePanel, PortalStatCard } from '../../components/portal/PortalPagePrimitives';
import { studentPortalApi, type StudentHomeworkResponse } from '../../lib/schoolPortalApi';

const STATUS_OPTIONS = ['PENDING', 'IN_PROGRESS', 'COMPLETED'];

export default function StudentHomeworkPage() {
  const [items, setItems] = useState<StudentHomeworkResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [savingId, setSavingId] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    studentPortalApi.getHomework()
      .then((response) => {
        if (active) setItems(response);
      })
      .catch((error: any) => {
        if (active) setMessage(error?.message || 'Unable to load homework.');
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  const counts = useMemo(() => ({
    pending: items.filter((item) => item.status === 'PENDING').length,
    progress: items.filter((item) => item.status === 'IN_PROGRESS').length,
    completed: items.filter((item) => item.status === 'COMPLETED').length,
  }), [items]);

  const updateStatus = async (homeworkId: string, status: string) => {
    setSavingId(homeworkId);
    setMessage('');
    try {
      await studentPortalApi.updateHomeworkStatus(homeworkId, { status });
      setItems((current) => current.map((item) => (item.homeworkId === homeworkId ? { ...item, status } : item)));
    } catch (error: any) {
      setMessage(error?.message || 'Unable to update homework status.');
    } finally {
      setSavingId(null);
    }
  };

  if (loading) {
    return <PortalStatePanel icon={Loader} title="Loading homework" description="Fetching daily diary and assignment status." accent="#a78bfa" />;
  }

  if (!items.length) {
    return <PortalStatePanel title="No homework yet" description={message || 'Homework and daily diary items will appear here as teachers assign them.'} />;
  }

  return (
    <div className="space-y-6 pb-16">
      <PortalPageHeader
        eyebrow="Homework / daily diary"
        title="Track work by subject and due date"
        description="Each homework card keeps the task lightweight to scan, with a direct status action instead of a buried submission flow."
      />

      <div className="grid gap-4 md:grid-cols-4">
        <PortalStatCard label="Total tasks" value={items.length} icon={BookOpen} accent="#22d3ee" />
        <PortalStatCard label="Pending" value={counts.pending} icon={Clock3} accent="#ffb663" />
        <PortalStatCard label="In progress" value={counts.progress} icon={BookText} accent="#a78bfa" />
        <PortalStatCard label="Completed" value={counts.completed} icon={CheckCircle2} accent="#34d399" />
      </div>

      <PortalSection title="Assignment stream" description="Assignments are grouped as cards for clean desktop and mobile readability.">
        <div className="grid gap-4 xl:grid-cols-2">
          {items.map((item) => (
            <div key={item.homeworkId} className="glass-panel" style={{ padding: 22, display: 'grid', gap: 14 }}>
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div style={{ fontSize: '0.72rem', color: '#22d3ee', textTransform: 'uppercase', letterSpacing: '0.12em', fontWeight: 800 }}>
                    {item.subjectName}
                  </div>
                  <div style={{ marginTop: 8, color: 'var(--text-strong)', fontWeight: 800, fontSize: '1.1rem' }}>{item.title}</div>
                </div>
                <div style={{ color: 'var(--text-dim)', fontSize: '0.82rem' }}>Due {item.dueDate}</div>
              </div>
              <div style={{ color: 'var(--text-dim)', lineHeight: 1.65 }}>{item.description}</div>
              {item.teacherRemarks ? (
                <div style={{ padding: '12px 14px', borderRadius: 16, background: 'rgba(255,255,255,0.03)', color: 'var(--text-dim)' }}>
                  Teacher note: {item.teacherRemarks}
                </div>
              ) : null}
              {item.attachments.length ? (
                <div className="flex flex-wrap gap-2">
                  {item.attachments.map((attachment) => (
                    <a key={attachment} href={attachment} target="_blank" rel="noreferrer" className="secondary-button">
                      Attachment
                    </a>
                  ))}
                </div>
              ) : null}
              <div className="flex flex-wrap gap-2">
                {STATUS_OPTIONS.map((status) => (
                  <Button
                    key={status}
                    variant={item.status === status ? 'primary' : 'secondary'}
                    onClick={() => updateStatus(item.homeworkId, status)}
                    disabled={savingId === item.homeworkId}
                  >
                    {status.replace('_', ' ')}
                  </Button>
                ))}
              </div>
            </div>
          ))}
        </div>
        {message ? <div style={{ color: 'var(--text-dim)' }}>{message}</div> : null}
      </PortalSection>
    </div>
  );
}
