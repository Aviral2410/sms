import React, { useState } from 'react';
import { Mail, Phone, Send, Sparkles, Users } from 'lucide-react';
import { HoverTiltCard } from '../components/public/HoverTiltCard';
import { PublicPretextHeading } from '../components/public/PublicPretextHeading';
import { PublicSiteFrame } from '../components/public/PublicSiteFrame';
import { PublicField } from '../components/public/PublicField';
import { usePublicSiteContent } from '../hooks/usePublicSiteContent';
import { publicSiteApi, type PublicInquiryRequest } from '../lib/publicSiteApi';

const emptyForm: PublicInquiryRequest = {
  fullName: '',
  email: '',
  organization: '',
  schoolName: '',
  phone: '',
  subject: '',
  message: '',
};

export default function ContactPage() {
  const { content } = usePublicSiteContent();
  const [form, setForm] = useState<PublicInquiryRequest>(emptyForm);
  const [status, setStatus] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const update = (key: keyof PublicInquiryRequest, value: string) => setForm((prev) => ({ ...prev, [key]: value }));

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setSubmitting(true);
    try {
      await publicSiteApi.submitContactRequest(form);
      setStatus('Your message has been received. We will follow up from the platform team.');
      setForm(emptyForm);
    } catch (error: any) {
      setStatus(error?.message || 'We could not submit your message right now.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <PublicSiteFrame content={content} activePath="/contact" mode="ambient" density={1.08}>
      <section className="public-page-intro">
        <PublicPretextHeading
          eyebrow="Contact Us"
          pretext="Connect"
          title={content?.contactHeadline || 'Talk to the team behind ElevateSmart.'}
          description={content?.contactBody || 'Use this route when you want a real conversation about rollout planning, partnerships, operational fit, or implementation timing.'}
        />
      </section>

      <section className="public-contact-grid">
        <HoverTiltCard className="public-panel public-contact-card public-contact-card--rich" accentColor="#22d3ee" as="article" maxTilt={12}>
          <div className="public-status-chip"><Sparkles size={14} /> Direct line to the platform team</div>
          <h3>Use this route for serious product conversations</h3>
          <div className="public-contact-card__line"><Mail size={18} /> Platform-led follow-up through the public inquiry workflow</div>
          <div className="public-contact-card__line"><Phone size={18} /> Share the best number and we can call back with rollout context</div>
          <div className="public-contact-card__line"><Users size={18} /> Best for demos, implementation planning, partnerships, and commercial discussions</div>
          <p className="public-muted">If you are evaluating rollout timing, tell us where the institution is today and we can respond with more context than a generic sales reply.</p>
        </HoverTiltCard>

        <HoverTiltCard className="public-panel--strong public-contact-form-card" accentColor="#ffb663" as="article" maxTilt={10}>
          <form className="public-contact-form" onSubmit={handleSubmit}>
            <div className="public-grid-2">
              <PublicField label="Full name" value={form.fullName} onChange={(e) => update('fullName', e.target.value)} placeholder="Asha Thomas" accent="#22d3ee" />
              <PublicField label="Email" value={form.email} onChange={(e) => update('email', e.target.value)} placeholder="asha@example.com" accent="#22d3ee" type="email" />
              <PublicField label="Organization" value={form.organization || ''} onChange={(e) => update('organization', e.target.value)} placeholder="North Ridge Academy" accent="#a78bfa" />
              <PublicField label="Phone" value={form.phone || ''} onChange={(e) => update('phone', e.target.value)} placeholder="+91 9876543210" accent="#a78bfa" />
            </div>
            <PublicField label="Subject" value={form.subject} onChange={(e) => update('subject', e.target.value)} placeholder="Need a walkthrough" accent="#ffb663" />
            <PublicField label="Message" multiline value={form.message} onChange={(e) => update('message', e.target.value)} placeholder="Tell us where you are in your evaluation or rollout journey." accent="#ffb663" rows={6} />
            {status ? <div className="public-site-empty public-contact-form__status">{status}</div> : null}
            <button type="submit" className="public-primary-button" disabled={submitting}>
              {submitting ? 'Sending...' : 'Send contact request'}
              <Send size={16} />
            </button>
          </form>
        </HoverTiltCard>
      </section>
    </PublicSiteFrame>
  );
}
