import React, { useState } from 'react';
import { Flag, ShieldAlert } from 'lucide-react';
import Button from '../../components/ui/Button';
import { PortalPageHeader, PortalSection } from '../../components/portal/PortalPagePrimitives';
import { teacherPortalApi } from '../../lib/schoolPortalApi';

export default function TeacherBehaviourPage() {
  const [form, setForm] = useState({
    studentUserId: '',
    category: 'POSITIVE',
    remark: '',
    points: 1,
    escalateToAdmin: false,
  });
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState('');

  const handleSave = async () => {
    if (!form.studentUserId || !form.remark) {
      setStatus('Student id and remark are required.');
      return;
    }
    setSaving(true);
    setStatus('');
    try {
      await teacherPortalApi.logBehaviourRemark(form);
      setForm({ studentUserId: '', category: 'POSITIVE', remark: '', points: 1, escalateToAdmin: false });
      setStatus('Behaviour remark recorded.');
    } catch (error: any) {
      setStatus(error?.message || 'Unable to save behaviour remark.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 pb-16">
      <PortalPageHeader
        eyebrow="Behaviour"
        title="Log behaviour remarks"
        description="Teacher behaviour tracking now has a dedicated action page with category, points, and escalation controls."
      />

      <PortalSection title="Behaviour entry" description="Use this page for positive, cautionary, or administrative behaviour notes.">
        <div className="grid gap-4 xl:grid-cols-2">
          <label className="grid gap-2">
            <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)', fontWeight: 700 }}>Student user id</span>
            <input className="input-field" value={form.studentUserId} onChange={(event) => setForm((current) => ({ ...current, studentUserId: event.target.value }))} />
          </label>
          <label className="grid gap-2">
            <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)', fontWeight: 700 }}>Category</span>
            <select className="input-field" value={form.category} onChange={(event) => setForm((current) => ({ ...current, category: event.target.value }))}>
              <option value="POSITIVE">Positive</option>
              <option value="CONCERN">Concern</option>
              <option value="DISCIPLINE">Discipline</option>
            </select>
          </label>
          <label className="grid gap-2">
            <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)', fontWeight: 700 }}>Points</span>
            <input className="input-field" type="number" value={form.points} onChange={(event) => setForm((current) => ({ ...current, points: Number(event.target.value) }))} />
          </label>
          <label className="grid gap-2 xl:col-span-2">
            <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)', fontWeight: 700 }}>Remark</span>
            <textarea className="input-field" rows={5} value={form.remark} onChange={(event) => setForm((current) => ({ ...current, remark: event.target.value }))} />
          </label>
          <label className="flex items-center gap-3" style={{ color: 'var(--text-dim)' }}>
            <input type="checkbox" checked={form.escalateToAdmin} onChange={(event) => setForm((current) => ({ ...current, escalateToAdmin: event.target.checked }))} />
            Escalate this note to admin
          </label>
          <div className="flex items-end">
            <Button onClick={handleSave} isLoading={saving}>
              <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Flag size={16} />
                Save remark
              </span>
            </Button>
          </div>
        </div>
        {status ? <div style={{ color: 'var(--text-dim)' }}>{status}</div> : null}
      </PortalSection>

      <PortalSection title="Escalation note" description="Administrative escalation is meant for cases that need wider intervention.">
        <div className="glass-panel" style={{ padding: 18, display: 'flex', alignItems: 'center', gap: 12, color: 'var(--text-dim)' }}>
          <ShieldAlert size={18} color="#ffb663" />
          Positive tags, negative tags, and escalated remarks can all be driven from this same entry workflow.
        </div>
      </PortalSection>
    </div>
  );
}
