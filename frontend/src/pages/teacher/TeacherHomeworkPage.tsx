import React, { useState } from 'react';
import { BookPlus, BookText, Loader, Send } from 'lucide-react';
import Button from '../../components/ui/Button';
import { PortalPageHeader, PortalSection } from '../../components/portal/PortalPagePrimitives';
import { teacherPortalApi, type TeacherHomeworkResponse } from '../../lib/schoolPortalApi';

const INITIAL_FORM = {
  classId: '',
  subjectId: '',
  title: '',
  description: '',
  dueDate: '',
};

export default function TeacherHomeworkPage() {
  const [form, setForm] = useState(INITIAL_FORM);
  const [created, setCreated] = useState<TeacherHomeworkResponse[]>([]);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  const handleCreate = async () => {
    if (!form.classId || !form.subjectId || !form.title || !form.description || !form.dueDate) {
      setMessage('Complete class, subject, title, description, and due date.');
      return;
    }
    setSaving(true);
    setMessage('');
    try {
      const response = await teacherPortalApi.createHomework(form);
      setCreated((current) => [response, ...current]);
      setForm(INITIAL_FORM);
      setMessage('Homework created and pushed to the student workspace.');
    } catch (error: any) {
      setMessage(error?.message || 'Unable to create homework.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 pb-16">
      <PortalPageHeader
        eyebrow="Homework management"
        title="Create and track homework"
        description="This teacher flow keeps homework creation compact, then surfaces the most recent published items in a clean list for review."
      />

      <PortalSection title="Create homework" description="A focused composer for class, subject, due date, and description.">
        <div className="grid gap-4 xl:grid-cols-2">
          <label className="grid gap-2">
            <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)', fontWeight: 700 }}>Class id</span>
            <input className="input-field" value={form.classId} onChange={(event) => setForm((current) => ({ ...current, classId: event.target.value }))} placeholder="UUID or class identifier" />
          </label>
          <label className="grid gap-2">
            <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)', fontWeight: 700 }}>Subject id</span>
            <input className="input-field" value={form.subjectId} onChange={(event) => setForm((current) => ({ ...current, subjectId: event.target.value }))} placeholder="UUID or subject identifier" />
          </label>
          <label className="grid gap-2 xl:col-span-2">
            <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)', fontWeight: 700 }}>Title</span>
            <input className="input-field" value={form.title} onChange={(event) => setForm((current) => ({ ...current, title: event.target.value }))} placeholder="Homework title" />
          </label>
          <label className="grid gap-2 xl:col-span-2">
            <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)', fontWeight: 700 }}>Description</span>
            <textarea className="input-field" rows={5} value={form.description} onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))} placeholder="Outline the activity, attachments, or student expectations." />
          </label>
          <label className="grid gap-2">
            <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)', fontWeight: 700 }}>Due date</span>
            <input className="input-field" type="date" value={form.dueDate} onChange={(event) => setForm((current) => ({ ...current, dueDate: event.target.value }))} />
          </label>
          <div className="flex items-end">
            <Button onClick={handleCreate} isLoading={saving}>
              <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                {saving ? <Loader size={16} className="animate-spin" /> : <Send size={16} />}
                Publish homework
              </span>
            </Button>
          </div>
        </div>
        {message ? <div style={{ color: 'var(--text-dim)' }}>{message}</div> : null}
      </PortalSection>

      <PortalSection title="Recent homework created here" description="Newly created homework stays visible for quick follow-up.">
        <div className="grid gap-4 xl:grid-cols-2">
          {created.map((item) => (
            <div key={item.homeworkId} className="glass-panel" style={{ padding: 20, display: 'grid', gap: 10 }}>
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div style={{ fontSize: '0.72rem', color: '#22d3ee', textTransform: 'uppercase', letterSpacing: '0.12em', fontWeight: 800 }}>
                    {item.className} - {item.subjectName}
                  </div>
                  <div style={{ marginTop: 8, color: 'var(--text-strong)', fontWeight: 800 }}>{item.title}</div>
                </div>
                <div style={{ color: 'var(--text-dim)', fontSize: '0.82rem' }}>{item.dueDate}</div>
              </div>
              <div style={{ color: 'var(--text-dim)', lineHeight: 1.65 }}>{item.description}</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#94a3b8', fontSize: '0.82rem' }}>
                <BookText size={14} />
                {item.submissionCount} submissions tracked
              </div>
            </div>
          ))}
          {!created.length ? (
            <div className="glass-panel" style={{ padding: 20, color: 'var(--text-dim)', display: 'flex', alignItems: 'center', gap: 10 }}>
              <BookPlus size={16} color="#22d3ee" />
              Create homework to populate this stream.
            </div>
          ) : null}
        </div>
      </PortalSection>
    </div>
  );
}
