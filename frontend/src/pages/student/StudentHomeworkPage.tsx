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
  const [noteDrafts, setNoteDrafts] = useState<Record<string, string>>({});

  useEffect(() => {
    let active = true;
    studentPortalApi.getHomework()
      .then((response) => {
        if (!active) return;
        setItems(response);
        setNoteDrafts(Object.fromEntries(response.map((item) => [item.homeworkId, item.studentNote || ''])));
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

  const persistHomeworkState = async (homeworkId: string, status: string, note: string) => {
    setSavingId(homeworkId);
    setMessage('');
    try {
      await studentPortalApi.updateHomeworkStatus(homeworkId, { status, notes: note.trim() || undefined });
      setItems((current) => current.map((item) => (item.homeworkId === homeworkId ? { ...item, status, studentNote: note } : item)));
    } catch (error: any) {
      setMessage(error?.message || 'Unable to update homework status.');
    } finally {
      setSavingId(null);
    }
  };

  const updateStatus = async (homeworkId: string, status: string) => {
    await persistHomeworkState(homeworkId, status, noteDrafts[homeworkId] || '');
  };

  const saveNote = async (item: StudentHomeworkResponse) => {
    await persistHomeworkState(item.homeworkId, item.status, noteDrafts[item.homeworkId] || '');
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
                  <div style={{ marginTop: 6, color: 'var(--text-dim)', fontSize: '0.82rem' }}>Assigned by {item.teacherName}</div>
                </div>
                <div style={{ color: 'var(--text-dim)', fontSize: '0.82rem' }}>Due {item.dueDate}</div>
              </div>
              <div style={{ color: 'var(--text-dim)', lineHeight: 1.65 }}>{item.description}</div>
              <label className="grid gap-2">
                <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)', fontWeight: 700 }}>My progress note</span>
                <textarea
                  className="input-field"
                  rows={3}
                  value={noteDrafts[item.homeworkId] || ''}
                  onChange={(event) => setNoteDrafts((current) => ({ ...current, [item.homeworkId]: event.target.value }))}
                  placeholder="Add what you finished, where you are stuck, or what you still need to revise."
                />
              </label>
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
                <Button variant="secondary" onClick={() => saveNote(item)} disabled={savingId === item.homeworkId}>
                  Save note
                </Button>
              </div>
            </div>
          ))}
        </div>
        {message ? <div style={{ color: 'var(--text-dim)' }}>{message}</div> : null}
      </PortalSection>
    </div>
  );
}
