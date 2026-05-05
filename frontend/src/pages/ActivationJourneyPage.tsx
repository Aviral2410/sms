import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  AlertCircle,
  ArrowRight,
  CheckCircle2,
  Globe2,
  Hash,
  Key,
  Loader,
  Lock,
  Mail,
  ShieldCheck,
} from 'lucide-react';
import { authApi } from '../lib/api';
import { MotionBackdrop } from '../components/MotionBackdrop';

const BG = 'var(--public-page-bg)';
const BORDER = 'var(--public-border)';
const CYAN = '#22d3ee';
const TEXT = 'var(--public-text-main)';
const DIM = 'var(--public-text-muted)';

function Field({
  label,
  icon: Icon,
  ...props
}: {
  label: string;
  icon: React.ElementType;
} & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <label style={{ fontSize: '0.82rem', fontWeight: 700, color: DIM }}>{label}</label>
      <div style={{ position: 'relative' }}>
        <div style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: DIM, pointerEvents: 'none', display: 'flex' }}>
          <Icon size={16} />
        </div>
        <input
          {...props}
          style={{ width: '100%', boxSizing: 'border-box', padding: '12px 14px 12px 42px', background: 'rgba(255,255,255,0.04)', border: `1px solid ${BORDER}`, borderRadius: 12, color: TEXT, fontSize: '0.9rem', fontFamily: 'inherit', outline: 'none' }}
        />
      </div>
    </div>
  );
}

function inferSubdomainHost(realmName: string, hostname: string, port: string) {
  const slug = realmName.trim().toLowerCase();
  if (!slug) return '';
  if (hostname === 'localhost' || hostname.endsWith('.localhost')) return `http://${slug}.localhost${port || ':30080'}`;
  return `${window.location.protocol}//${slug}.${hostname}${port}`;
}

export default function ActivationJourneyPage() {
  const [form, setForm] = useState({ realmName: '', email: '', activationCode: '', newPassword: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const navigate = useNavigate();

  const tenantUrl = useMemo(() => {
    if (typeof window === 'undefined') return '';
    return inferSubdomainHost(form.realmName, window.location.hostname, window.location.port ? `:${window.location.port}` : '');
  }, [form.realmName]);

  const up = (key: keyof typeof form, value: string) => setForm((current) => ({ ...current, [key]: value }));

  const handleActivate = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!form.realmName || !form.email || !form.activationCode || !form.newPassword) {
      setError('All fields are required.');
      return;
    }

    setLoading(true);
    setError('');
    try {
      await authApi.activateAccount({
        schoolCode: form.realmName.toLowerCase().trim(),
        email: form.email.trim(),
        activationCode: form.activationCode.trim(),
        newPassword: form.newPassword,
      });
      setDone(true);
      setTimeout(() => {
        if (tenantUrl) {
          window.location.assign(`${tenantUrl}/login`);
          return;
        }
        navigate('/login');
      }, 1600);
    } catch (activationError: any) {
      setError(activationError?.message || 'Activation failed. Check your details and try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: BG, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '20px 16px 32px', fontFamily: "'Manrope','Inter',system-ui,sans-serif", color: TEXT, position: 'relative', overflow: 'hidden' }}>
      <MotionBackdrop mode="ambient" density={1.02} baseColor={CYAN} />

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} style={{ width: '100%', maxWidth: 960, position: 'relative', zIndex: 1 }}>
        {done ? (
          <div style={{ display: 'grid', gap: 24, textAlign: 'center', padding: '48px 0' }}>
            <div style={{ width: 72, height: 72, borderRadius: '50%', background: 'linear-gradient(135deg, #0e7490, #22d3ee)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto', boxShadow: '0 0 40px rgba(6,182,212,0.35)' }}>
              <CheckCircle2 size={36} color="#fff" />
            </div>
            <div>
              <h2 style={{ fontSize: '1.8rem', fontWeight: 900, marginBottom: 8 }}>Account activated</h2>
              <p style={{ color: DIM, margin: 0 }}>Redirecting you into the school-specific sign-in flow.</p>
            </div>
            {tenantUrl ? (
              <div style={{ maxWidth: 520, margin: '0 auto', padding: 18, borderRadius: 18, background: 'rgba(6,182,212,0.08)', border: '1px solid rgba(6,182,212,0.18)', color: '#b6f5ff', wordBreak: 'break-word' }}>
                {tenantUrl}/login
              </div>
            ) : null}
          </div>
        ) : (
          <div style={{ display: 'grid', gap: 24, gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', alignItems: 'start' }}>
            <div style={{ background: 'linear-gradient(180deg, rgba(8,51,68,0.95), rgba(2,6,23,0.92))', border: '1px solid rgba(6,182,212,0.15)', borderRadius: 28, padding: 'clamp(20px, 5vw, 32px)', backdropFilter: 'blur(20px)', display: 'grid', gap: 20 }}>
              <div style={{ width: 60, height: 60, borderRadius: 18, background: 'linear-gradient(135deg, #0e7490, #22d3ee)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 0 32px rgba(6,182,212,0.25)' }}>
                <Key size={26} color="#0b0f14" />
              </div>
              <div>
                <h1 style={{ fontSize: '1.9rem', fontWeight: 900, letterSpacing: '-0.03em', margin: 0 }}>Activate school admin access</h1>
                <p style={{ color: DIM, fontSize: '0.9rem', marginTop: 10, lineHeight: 1.7 }}>
                  Finish activation, then continue directly to the school-specific sign-in page so tenant branding, routing, and auth context stay aligned.
                </p>
              </div>
              <div style={{ display: 'grid', gap: 14 }}>
                <div style={{ padding: 16, borderRadius: 18, background: 'rgba(255,255,255,0.04)', border: `1px solid ${BORDER}` }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#b6f5ff', fontWeight: 800 }}>
                    <ShieldCheck size={16} /> Activation checklist
                  </div>
                  <div style={{ marginTop: 10, color: DIM, fontSize: '0.84rem', lineHeight: 1.7 }}>
                    1. Confirm the <strong>realm name</strong> from the onboarding email.
                    <br />
                    2. Set the password for the admin account.
                    <br />
                    3. Continue to the school portal login page on the tenant subdomain.
                  </div>
                </div>
                <div style={{ padding: 16, borderRadius: 18, background: 'rgba(255,182,99,0.08)', border: '1px solid rgba(255,182,99,0.18)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#ffd8b1', fontWeight: 800 }}>
                    <Globe2 size={16} /> Tenant preview
                  </div>
                  <div style={{ marginTop: 10, color: TEXT, fontWeight: 800, wordBreak: 'break-word' }}>
                    {tenantUrl ? `${tenantUrl}/login` : 'Enter a realm name to preview the tenant URL'}
                  </div>
                </div>
              </div>
            </div>

            <form onSubmit={handleActivate} style={{ background: 'linear-gradient(180deg, rgba(8,51,68,0.95), rgba(2,6,23,0.9))', border: '1px solid rgba(6,182,212,0.15)', borderRadius: 28, padding: 'clamp(20px, 5vw, 32px)', backdropFilter: 'blur(20px)', display: 'grid', gap: 20 }}>
              <Field label="Realm name" icon={Globe2} type="text" placeholder="my-school-portal" value={form.realmName} onChange={(event) => up('realmName', event.target.value.toLowerCase())} />
              <Field label="Admin email" icon={Mail} type="email" placeholder="admin@school.edu" value={form.email} onChange={(event) => up('email', event.target.value)} />
              <Field label="Activation code" icon={Key} type="text" placeholder="Code from your email" value={form.activationCode} onChange={(event) => up('activationCode', event.target.value)} />
              <Field label="New password" icon={Lock} type="password" placeholder="Choose a secure password" value={form.newPassword} onChange={(event) => up('newPassword', event.target.value)} />

              {error ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 14px', borderRadius: 10, background: 'rgba(244,63,94,0.1)', border: '1px solid rgba(244,63,94,0.25)', color: '#fb7185', fontSize: '0.82rem' }}>
                  <AlertCircle size={14} />{error}
                </div>
              ) : null}

              <button type="submit" disabled={loading} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, padding: '14px', borderRadius: 14, background: loading ? '#374151' : `linear-gradient(135deg, #0e7490, ${CYAN})`, border: 'none', color: '#0b0f14', fontWeight: 800, fontSize: '0.95rem', cursor: loading ? 'not-allowed' : 'pointer', fontFamily: 'inherit' }}>
                {loading ? <><Loader size={18} style={{ animation: 'spin 1s linear infinite' }} /> Activating...</> : <><span>Activate and continue</span><ArrowRight size={18} /></>}
              </button>

              <button type="button" onClick={() => navigate('/login')} style={{ padding: '12px 18px', borderRadius: 14, background: 'rgba(255,255,255,0.05)', border: `1px solid ${BORDER}`, color: TEXT, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>
                Back to sign in
              </button>
            </form>
          </div>
        )}
      </motion.div>
      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
