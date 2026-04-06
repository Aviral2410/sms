import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Key, Hash, Mail, Lock, ArrowRight, AlertCircle, Loader, CheckCircle2 } from 'lucide-react';
import { authApi } from '../lib/api';
import { AntigravityBackground } from '../components/AntigravityBackground';

const BG = '#0b0f14'; const BORDER = 'rgba(255,255,255,0.08)'; const CYAN = '#22d3ee';
const TEXT = '#f1f5f9'; const DIM = '#8b95a2';

const Field = ({ label, icon: Icon, ...props }: { label: string; icon: React.ElementType } & React.InputHTMLAttributes<HTMLInputElement>) => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
    <label style={{ fontSize: '0.82rem', fontWeight: 700, color: DIM }}>{label}</label>
    <div style={{ position: 'relative' }}>
      <div style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: DIM, pointerEvents: 'none', display: 'flex' }}><Icon size={16} /></div>
      <input {...props} style={{ width: '100%', boxSizing: 'border-box', padding: '12px 14px 12px 42px', background: 'rgba(255,255,255,0.04)', border: `1px solid ${BORDER}`, borderRadius: 12, color: TEXT, fontSize: '0.9rem', fontFamily: 'inherit', outline: 'none' }}
        onFocus={e => (e.target.style.borderColor = CYAN)} onBlur={e => (e.target.style.borderColor = BORDER)} />
    </div>
  </div>
);

export default function ActivationPage() {
  const [form, setForm] = useState({ schoolCode: '', email: '', activationCode: '', newPassword: '' });
  const [error, setError] = useState(''); const [loading, setLoading] = useState(false); const [done, setDone] = useState(false);
  const navigate = useNavigate();

  const up = (k: keyof typeof form, v: string) => setForm(f => ({ ...f, [k]: v }));

  const handleActivate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.schoolCode || !form.email || !form.activationCode || !form.newPassword) { setError('All fields are required.'); return; }
    setLoading(true); setError('');
    try {
      await authApi.activateAccount({
        schoolCode: form.schoolCode.toUpperCase().trim(),
        email: form.email.trim(),
        activationCode: form.activationCode.trim(),
        newPassword: form.newPassword,
      });
      setDone(true);
      setTimeout(() => navigate('/login'), 1800);
    } catch (err: any) { setError(err.message || 'Activation failed. Check your details.'); }
    finally { setLoading(false); }
  };

  return (
    <div style={{ minHeight: '100vh', background: BG, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 24, fontFamily: "'Manrope','Inter',system-ui,sans-serif", color: TEXT, position: 'relative', overflow: 'hidden' }}>
      <AntigravityBackground />
      
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} style={{ width: '100%', maxWidth: 440, position: 'relative', zIndex: 1 }}>
        {done ? (
          <div style={{ textAlign: 'center', padding: '48px 0' }}>
            <div style={{ width: 72, height: 72, borderRadius: '50%', background: 'linear-gradient(135deg, #0e7490, #22d3ee)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px', boxShadow: '0 0 40px rgba(6,182,212,0.35)' }}>
              <CheckCircle2 size={36} color="#fff" />
            </div>
            <h2 style={{ fontSize: '1.6rem', fontWeight: 800, marginBottom: 8 }}>Account Activated!</h2>
            <p style={{ color: DIM }}>Redirecting to sign in...</p>
          </div>
        ) : (
          <>
            <div style={{ textAlign: 'center', marginBottom: 32 }}>
              <div style={{ width: 60, height: 60, borderRadius: 18, background: 'linear-gradient(135deg, #0e7490, #22d3ee)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px', boxShadow: '0 0 32px rgba(6,182,212,0.25)' }}>
                <Key size={26} color="#0b0f14" />
              </div>
              <h1 style={{ fontSize: '1.8rem', fontWeight: 800, letterSpacing: '-0.02em', marginBottom: 8 }}>Activate Account</h1>
              <p style={{ color: DIM, fontSize: '0.88rem' }}>Use the activation code sent to your email</p>
            </div>

            <form onSubmit={handleActivate} style={{ background: 'linear-gradient(180deg, rgba(8,51,68,0.95), rgba(2,6,23,0.9))', border: `1px solid rgba(6,182,212,0.15)`, borderRadius: 24, padding: 32, backdropFilter: 'blur(20px)', display: 'flex', flexDirection: 'column', gap: 20 }}>
              <Field label="School Code" icon={Hash} type="text" placeholder="e.g. GTA01" value={form.schoolCode} onChange={e => up('schoolCode', e.target.value)} />
              <Field label="Admin Email" icon={Mail} type="email" placeholder="admin@school.edu" value={form.email} onChange={e => up('email', e.target.value)} />
              <Field label="Activation Code" icon={Key} type="text" placeholder="Code from your email" value={form.activationCode} onChange={e => up('activationCode', e.target.value)} />
              <Field label="New Password" icon={Lock} type="password" placeholder="Choose a secure password" value={form.newPassword} onChange={e => up('newPassword', e.target.value)} />
              {error && <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 14px', borderRadius: 10, background: 'rgba(244,63,94,0.1)', border: '1px solid rgba(244,63,94,0.25)', color: '#fb7185', fontSize: '0.82rem' }}><AlertCircle size={14} />{error}</div>}
              <button type="submit" disabled={loading} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, padding: '14px', borderRadius: 14, background: loading ? '#374151' : `linear-gradient(135deg, #0e7490, ${CYAN})`, border: 'none', color: '#0b0f14', fontWeight: 800, fontSize: '0.95rem', cursor: loading ? 'not-allowed' : 'pointer', fontFamily: 'inherit' }}>
                {loading ? <Loader size={18} style={{ animation: 'spin 1s linear infinite' }} /> : <><span>Activate & Enter</span><ArrowRight size={18} /></>}
              </button>
            </form>

            <p style={{ textAlign: 'center', marginTop: 20, fontSize: '0.82rem', color: DIM }}>
              Back to <span style={{ color: CYAN, fontWeight: 700, cursor: 'pointer' }} onClick={() => navigate('/login')}>Sign in</span>
            </p>
          </>
        )}
      </motion.div>
      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
