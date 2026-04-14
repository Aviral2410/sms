import React from 'react';
import { KeyRound, Sparkles, UserPlus, Users } from 'lucide-react';

type Props = {
  teacherCount: number;
  recentHires: number;
  onboardingForm: {
    fullName: string;
    email: string;
    accessKey: string;
  };
  setForm: (form: any) => void;
  onSubmit: (e: React.FormEvent) => void;
};

export function TeacherSidebar({
  teacherCount,
  recentHires,
  onboardingForm,
  setForm,
  onSubmit,
}: Props) {
  const canSubmit = onboardingForm.fullName.trim().length > 0 && onboardingForm.email.trim().length > 0;

  return (
    <aside className="admin-management-sidebar">
      <div className="admin-management-card admin-management-panel">
        <div className="admin-management-panel-heading">
          <div>
            <div className="admin-management-panel-kicker">Faculty Snapshot</div>
            <h2>Capacity at a glance</h2>
          </div>
          <div className="admin-management-panel-icon">
            <Users size={18} />
          </div>
        </div>

        <div className="admin-management-mini-grid">
          <MetricCard label="Total Faculty" value={teacherCount} tone="blue" />
          <MetricCard label="New in 30 Days" value={recentHires} tone="violet" />
        </div>
      </div>

      <div className="admin-management-card admin-management-panel">
        <div className="admin-management-panel-heading">
          <div>
            <div className="admin-management-panel-kicker">Onboard Faculty</div>
            <h2>Add a teacher</h2>
            <p>Create an account and hand over a temporary access key in one step.</p>
          </div>
          <div className="admin-management-panel-icon">
            <UserPlus size={18} />
          </div>
        </div>

        <form onSubmit={onSubmit} className="admin-management-form">
          <InputGroup
            label="Full Name"
            value={onboardingForm.fullName}
            onChange={(value) => setForm({ ...onboardingForm, fullName: value })}
            placeholder="Aarav Mehta"
          />
          <InputGroup
            label="Email"
            type="email"
            value={onboardingForm.email}
            onChange={(value) => setForm({ ...onboardingForm, email: value })}
            placeholder="teacher@school.com"
          />
          <InputGroup
            label="Temporary Access Key"
            type="text"
            value={onboardingForm.accessKey}
            onChange={(value) => setForm({ ...onboardingForm, accessKey: value })}
            placeholder="Leave blank to auto-generate"
            icon={<KeyRound size={15} />}
          />

          <div className="admin-management-helper">
            <Sparkles size={14} />
            <span>If left empty, the system generates a secure access key automatically.</span>
          </div>

          <div className="admin-management-form-actions">
            <button type="submit" className="admin-management-primary w-full justify-center" disabled={!canSubmit}>
              <UserPlus size={15} />
              Add Teacher
            </button>
            <button
              type="button"
              className="admin-management-secondary w-full justify-center"
              onClick={() => setForm({ fullName: '', email: '', roleName: 'TEACHER', accessKey: '' })}
            >
              Reset Form
            </button>
          </div>
        </form>
      </div>
    </aside>
  );
}

function MetricCard({
  label,
  value,
  tone,
}: {
  label: string;
  value: string | number;
  tone: 'blue' | 'emerald' | 'amber' | 'violet';
}) {
  return (
    <div className={`admin-management-mini-stat tone-${tone}`}>
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function InputGroup({
  label,
  value,
  onChange,
  placeholder,
  type = 'text',
  icon,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  type?: string;
  icon?: React.ReactNode;
}) {
  return (
    <label className="admin-management-field">
      <span>{label}</span>
      <div className="admin-management-field-input">
        {icon ? <div className="admin-management-field-icon">{icon}</div> : null}
        <input
          type={type}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder={placeholder}
        />
      </div>
    </label>
  );
}
