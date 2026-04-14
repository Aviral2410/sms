import React, { useEffect, useState } from 'react';
import { Loader, Lock, MapPin, Phone, ShieldCheck, User } from 'lucide-react';
import Button from '../../components/ui/Button';
import { PortalPageHeader, PortalSection, PortalStatePanel, PortalStatCard } from '../../components/portal/PortalPagePrimitives';
import { studentPortalApi, type StudentProfileResponse } from '../../lib/schoolPortalApi';

export default function StudentProfilePortalPage() {
  const [profile, setProfile] = useState<StudentProfileResponse | null>(null);
  const [draft, setDraft] = useState({ address: '', guardianName: '', guardianPhone: '' });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    let active = true;
    studentPortalApi.getProfile()
      .then((response) => {
        if (!active) return;
        setProfile(response);
        setDraft({
          address: response.address || '',
          guardianName: response.guardianName || '',
          guardianPhone: response.guardianPhone || '',
        });
      })
      .catch((error: any) => {
        if (!active) return;
        setMessage(error?.message || 'Unable to load student profile.');
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  const handleSave = async () => {
    setSaving(true);
    setMessage('');
    try {
      const response = await studentPortalApi.updateProfile(draft);
      setProfile(response);
      setDraft({
        address: response.address || '',
        guardianName: response.guardianName || '',
        guardianPhone: response.guardianPhone || '',
      });
      setMessage('Student profile details updated.');
    } catch (error: any) {
      setMessage(error?.message || 'Unable to update profile.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <PortalStatePanel icon={Loader} title="Loading profile" description="Fetching student profile and guardian details." accent="#22d3ee" />;
  }

  if (!profile) {
    return <PortalStatePanel title="Profile unavailable" description={message || 'The student profile could not be resolved for this account.'} />;
  }

  return (
    <div className="space-y-6 pb-16">
      <PortalPageHeader
        eyebrow="Student profile"
        title={profile.fullName}
        description="Editable fields remain clearly separated from school-controlled records like admission number, class assignment, and roll number."
        actions={<Button onClick={handleSave} isLoading={saving}>Save changes</Button>}
      />

      <div className="grid gap-4 md:grid-cols-4">
        <PortalStatCard label="Admission No." value={profile.admissionNo} icon={ShieldCheck} accent="#22d3ee" />
        <PortalStatCard label="Class" value={profile.className || 'Pending'} icon={User} accent="#ffb663" />
        <PortalStatCard label="Section" value={profile.sectionName || 'Pending'} icon={User} accent="#a78bfa" />
        <PortalStatCard label="Status" value={profile.status || 'Active'} icon={Lock} accent="#34d399" />
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <PortalSection title="Locked academic identity" description="These fields are controlled by the school and remain visible but not editable.">
          <div className="grid gap-4 md:grid-cols-2">
            {[
              ['Full name', profile.fullName],
              ['Email', profile.email],
              ['Admission number', profile.admissionNo],
              ['Roll number', profile.rollNo || 'Not assigned'],
              ['Admitted on', profile.admittedOn || 'Pending'],
              ['Classroom', [profile.className, profile.sectionName].filter(Boolean).join(' - ') || 'Pending assignment'],
            ].map(([label, value]) => (
              <div key={label} className="glass-panel" style={{ padding: 18, display: 'grid', gap: 8 }}>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.12em', fontWeight: 800 }}>{label}</div>
                <div style={{ color: 'var(--text-strong)', fontWeight: 700 }}>{value}</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#94a3b8', fontSize: '0.82rem' }}>
                  <Lock size={14} />
                  School managed
                </div>
              </div>
            ))}
          </div>
        </PortalSection>

        <PortalSection title="Editable guardian details" description="Students can update contact-facing fields without altering academic identity.">
          <div className="grid gap-4">
            <label className="grid gap-2">
              <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)', fontWeight: 700 }}>Guardian name</span>
              <input className="input-field" value={draft.guardianName} onChange={(event) => setDraft((current) => ({ ...current, guardianName: event.target.value }))} />
            </label>
            <label className="grid gap-2">
              <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)', fontWeight: 700 }}>Guardian phone</span>
              <input className="input-field" value={draft.guardianPhone} onChange={(event) => setDraft((current) => ({ ...current, guardianPhone: event.target.value }))} />
            </label>
            <label className="grid gap-2">
              <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)', fontWeight: 700 }}>Address</span>
              <textarea className="input-field" rows={5} value={draft.address} onChange={(event) => setDraft((current) => ({ ...current, address: event.target.value }))} />
            </label>
            {message ? <div style={{ color: 'var(--text-dim)' }}>{message}</div> : null}
          </div>
        </PortalSection>
      </div>

      <PortalSection title="Family snapshot" description="A compact view for quick verification in mobile and desktop layouts.">
        <div className="grid gap-4 md:grid-cols-3">
          <div className="glass-panel" style={{ padding: 18, display: 'flex', alignItems: 'center', gap: 12 }}>
            <User size={18} color="#22d3ee" />
            <div>
              <div style={{ color: 'var(--text-dim)', fontSize: '0.75rem' }}>Guardian</div>
              <div style={{ color: 'var(--text-strong)', fontWeight: 700 }}>{profile.guardianName || 'Not added yet'}</div>
            </div>
          </div>
          <div className="glass-panel" style={{ padding: 18, display: 'flex', alignItems: 'center', gap: 12 }}>
            <Phone size={18} color="#ffb663" />
            <div>
              <div style={{ color: 'var(--text-dim)', fontSize: '0.75rem' }}>Phone</div>
              <div style={{ color: 'var(--text-strong)', fontWeight: 700 }}>{profile.guardianPhone || 'Not added yet'}</div>
            </div>
          </div>
          <div className="glass-panel" style={{ padding: 18, display: 'flex', alignItems: 'center', gap: 12 }}>
            <MapPin size={18} color="#a78bfa" />
            <div>
              <div style={{ color: 'var(--text-dim)', fontSize: '0.75rem' }}>Address</div>
              <div style={{ color: 'var(--text-strong)', fontWeight: 700 }}>{profile.address || 'Not added yet'}</div>
            </div>
          </div>
        </div>
      </PortalSection>
    </div>
  );
}
