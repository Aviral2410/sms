import React, { useState } from 'react';
import { MessageSquare, Send } from 'lucide-react';
import Button from '../../components/ui/Button';
import { PortalPageHeader, PortalSection } from '../../components/portal/PortalPagePrimitives';
import { teacherPortalApi } from '../../lib/schoolPortalApi';

export default function TeacherCommunicationPage() {
  const [form, setForm] = useState({ studentUserId: '', subject: '', message: '' });
  const [sending, setSending] = useState(false);
  const [status, setStatus] = useState('');

  const handleSend = async () => {
    if (!form.studentUserId || !form.subject || !form.message) {
      setStatus('Student id, subject, and message are required.');
      return;
    }
    setSending(true);
    setStatus('');
    try {
      await teacherPortalApi.sendCommunication(form);
      setForm({ studentUserId: '', subject: '', message: '' });
      setStatus('Message queued for parent/student communication.');
    } catch (error: any) {
      setStatus(error?.message || 'Unable to send communication.');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="space-y-6 pb-16">
      <PortalPageHeader
        eyebrow="Parent communication"
        title="Send a direct communication"
        description="A lightweight teacher communication composer that fits the existing shell and binds to the teacher messaging endpoint."
      />

      <PortalSection title="Compose message" description="Use a student user id to target the correct family or student thread.">
        <div className="grid gap-4 xl:grid-cols-2">
          <label className="grid gap-2">
            <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)', fontWeight: 700 }}>Student user id</span>
            <input className="input-field" value={form.studentUserId} onChange={(event) => setForm((current) => ({ ...current, studentUserId: event.target.value }))} />
          </label>
          <label className="grid gap-2">
            <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)', fontWeight: 700 }}>Subject</span>
            <input className="input-field" value={form.subject} onChange={(event) => setForm((current) => ({ ...current, subject: event.target.value }))} />
          </label>
          <label className="grid gap-2 xl:col-span-2">
            <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)', fontWeight: 700 }}>Message</span>
            <textarea className="input-field" rows={6} value={form.message} onChange={(event) => setForm((current) => ({ ...current, message: event.target.value }))} />
          </label>
          <div className="flex items-end">
            <Button onClick={handleSend} isLoading={sending}>
              <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Send size={16} />
                Send message
              </span>
            </Button>
          </div>
        </div>
        {status ? <div style={{ color: 'var(--text-dim)' }}>{status}</div> : null}
      </PortalSection>

      <PortalSection title="Usage note" description="This is the direct teacher-facing message entry point; richer thread history can still live in the broader communication center.">
        <div className="glass-panel" style={{ padding: 18, display: 'flex', alignItems: 'center', gap: 12, color: 'var(--text-dim)' }}>
          <MessageSquare size={18} color="#22d3ee" />
          Conversation history remains available in the shared communication module while this page keeps the teacher action quick.
        </div>
      </PortalSection>
    </div>
  );
}
