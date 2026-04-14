import React, { useState } from 'react';
import { Calculator, FileDigit } from 'lucide-react';
import Button from '../../components/ui/Button';
import { PortalPageHeader, PortalSection } from '../../components/portal/PortalPagePrimitives';
import { teacherPortalApi } from '../../lib/schoolPortalApi';

export default function TeacherMarksPage() {
  const [form, setForm] = useState({
    examId: '',
    subjectId: '',
    marksJson: '[\n  {\n    "studentUserId": "",\n    "marksObtained": 0,\n    "remarks": ""\n  }\n]',
  });
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState('');

  const handleSubmit = async () => {
    try {
      const marks = JSON.parse(form.marksJson);
      if (!form.examId || !form.subjectId || !Array.isArray(marks)) {
        setStatus('Exam id, subject id, and a valid marks array are required.');
        return;
      }
      setSaving(true);
      setStatus('');
      await teacherPortalApi.enterMarks({
        examId: form.examId,
        subjectId: form.subjectId,
        marks,
      });
      setStatus('Marks submitted successfully.');
    } catch (error: any) {
      setStatus(error?.message || 'Marks JSON is invalid or submission failed.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 pb-16">
      <PortalPageHeader
        eyebrow="Exams & marks"
        title="Enter marks in bulk"
        description="This gives teachers a dedicated marks-entry page even before a richer editable table lands."
      />

      <PortalSection title="Bulk marks entry" description="Paste or edit a marks payload and submit it directly to the marks endpoint.">
        <div className="grid gap-4 xl:grid-cols-2">
          <label className="grid gap-2">
            <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)', fontWeight: 700 }}>Exam id</span>
            <input className="input-field" value={form.examId} onChange={(event) => setForm((current) => ({ ...current, examId: event.target.value }))} />
          </label>
          <label className="grid gap-2">
            <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)', fontWeight: 700 }}>Subject id</span>
            <input className="input-field" value={form.subjectId} onChange={(event) => setForm((current) => ({ ...current, subjectId: event.target.value }))} />
          </label>
          <label className="grid gap-2 xl:col-span-2">
            <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)', fontWeight: 700 }}>Marks payload JSON</span>
            <textarea className="input-field" rows={12} value={form.marksJson} onChange={(event) => setForm((current) => ({ ...current, marksJson: event.target.value }))} />
          </label>
          <div className="flex items-end">
            <Button onClick={handleSubmit} isLoading={saving}>
              <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Calculator size={16} />
                Submit marks
              </span>
            </Button>
          </div>
        </div>
        {status ? <div style={{ color: 'var(--text-dim)' }}>{status}</div> : null}
      </PortalSection>

      <PortalSection title="Next iteration" description="The next step here is replacing JSON entry with an editable marks table once the exam/class lookup endpoints are in place.">
        <div className="glass-panel" style={{ padding: 18, display: 'flex', alignItems: 'center', gap: 12, color: 'var(--text-dim)' }}>
          <FileDigit size={18} color="#22d3ee" />
          This page is wired to the real backend endpoint today, and ready for a richer teacher marks grid later.
        </div>
      </PortalSection>
    </div>
  );
}
