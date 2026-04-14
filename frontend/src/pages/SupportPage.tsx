import React, { useState } from 'react';
import { AlertTriangle, LifeBuoy, Send, ShieldCheck, TimerReset } from 'lucide-react';
import { HoverTiltCard } from '../components/public/HoverTiltCard';
import { PublicPretextHeading } from '../components/public/PublicPretextHeading';
import { PublicSiteFrame } from '../components/public/PublicSiteFrame';
import { PublicField } from '../components/public/PublicField';
import { usePublicSiteContent } from '../hooks/usePublicSiteContent';
import { publicSiteApi, type PublicInquiryRequest } from '../lib/publicSiteApi';

const initialState: PublicInquiryRequest = {
  fullName: '',
  email: '',
  organization: '',
  schoolName: '',
  phone: '',
  subject: '',
  message: '',
};

export default function SupportPage() {
  const { content } = usePublicSiteContent();
  const [form, setForm] = useState<PublicInquiryRequest>(initialState);
  const [status, setStatus] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const update = (key: keyof PublicInquiryRequest, value: string) => setForm((prev) => ({ ...prev, [key]: value }));

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setSubmitting(true);
    try {
      await publicSiteApi.submitSupportRequest(form);
      setStatus('Your support request has been captured. We will review it with the platform context you shared.');
      setForm(initialState);
    } catch (error: any) {
      setStatus(error?.message || 'We could not submit your support request.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <PublicSiteFrame content={content} activePath="/support" mode="ambient" density={1.08}>
      <section className="public-page-intro">
        <PublicPretextHeading
          eyebrow="Raise Support"
          pretext="Support"
          title={content?.supportHeadline || 'Support with real institutional context.'}
          description={content?.supportBody || 'Bring rollout blockers, production issues, access failures, or operational questions here so the platform team can triage with full context.'}
        />
      </section>

      <section className="public-contact-grid">
        <HoverTiltCard className="public-panel public-contact-card public-contact-card--rich" accentColor="#ffb663" as="article" maxTilt={12}>
          <div className="public-status-chip"><AlertTriangle size={14} /> Support intake with context</div>
          <h3>Designed for real blockers, not vague tickets</h3>
          <div className="public-contact-card__line"><LifeBuoy size={18} /> Best for production blockers, rollout questions, and access issues</div>
          <div className="public-contact-card__line"><ShieldCheck size={18} /> Include school, environment, and symptoms so triage starts with context</div>
          <div className="public-contact-card__line"><TimerReset size={18} /> The more precise the context, the faster the first useful response</div>
          <p className="public-muted">This support intake is stored in our backend so the request stays part of the platform record instead of disappearing into side-channel chat.</p>
        </HoverTiltCard>

        <HoverTiltCard className="public-panel--strong public-contact-form-card" accentColor="#22d3ee" as="article" maxTilt={10}>
          <form className="public-contact-form" onSubmit={handleSubmit}>
            <div className="public-grid-2">
              <PublicField label="Full name" value={form.fullName} onChange={(e) => update('fullName', e.target.value)} placeholder="Asha Thomas" accent="#22d3ee" />
              <PublicField label="Email" value={form.email} onChange={(e) => update('email', e.target.value)} placeholder="asha@example.com" accent="#22d3ee" type="email" />
              <PublicField label="Organization" value={form.organization || ''} onChange={(e) => update('organization', e.target.value)} placeholder="North Ridge Academy" accent="#a78bfa" />
              <PublicField label="School name" value={form.schoolName || ''} onChange={(e) => update('schoolName', e.target.value)} placeholder="North Ridge Academy" accent="#a78bfa" />
            </div>
            <PublicField label="Subject" value={form.subject} onChange={(e) => update('subject', e.target.value)} placeholder="Admin login blocked after rollout" accent="#ffb663" />
            <PublicField label="Message" multiline value={form.message} onChange={(e) => update('message', e.target.value)} placeholder="Describe the issue, timeline, environment, and any steps already taken." accent="#ffb663" rows={6} />
            {status ? <div className="public-site-empty public-contact-form__status">{status}</div> : null}
            <button type="submit" className="public-primary-button" disabled={submitting}>
              {submitting ? 'Sending...' : 'Submit support request'}
              <Send size={16} />
            </button>
          </form>
        </HoverTiltCard>
      </section>
    </PublicSiteFrame>
  );
}
