import React, { useState, useEffect, useRef } from 'react';
import { useStore } from '../store/useStore';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ShieldCheck, Mail, Lock, ArrowRight, AlertCircle, Loader, ArrowLeft } from 'lucide-react';
import { authApi } from '../lib/api';
import { AntigravityBackground } from '../components/AntigravityBackground';

const BG = '#020617'; const BORDER = 'rgba(255,255,255,0.08)'; const GREEN = '#34d399'; const DIM = '#8b95a2'; const TEXT = '#f1f5f9';

const Field = ({ label, icon: Icon, ...props }: { label: string; icon: React.ElementType } & React.InputHTMLAttributes<HTMLInputElement>) => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
    <label style={{ fontSize: '0.82rem', fontWeight: 700, color: DIM }}>{label}</label>
    <div style={{ position: 'relative' }}>
      <div style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: DIM, display: 'flex', pointerEvents: 'none' }}><Icon size={16} /></div>
      <input {...props} style={{ width: '100%', boxSizing: 'border-box', padding: '12px 14px 12px 42px', background: 'rgba(255,255,255,0.04)', border: `1px solid ${BORDER}`, borderRadius: 12, color: TEXT, fontSize: '0.9rem', fontFamily: 'inherit', outline: 'none', transition: 'border-color 0.2s, box-shadow 0.2s' }}
        onFocus={e => { e.target.style.borderColor = GREEN; e.target.style.boxShadow = '0 0 0 3px rgba(52,211,153,0.12)'; }} onBlur={e => { e.target.style.borderColor = BORDER; e.target.style.boxShadow = 'none'; }} />
    </div>
  </div>
);

export default function AdminLoginPage() {
  const [email, setEmail] = useState(''); const [password, setPassword] = useState('');
  const [error, setError] = useState(''); const [loading, setLoading] = useState(false);
  const { setSession } = useStore(); const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true); setError('');
    try {
      const res = await authApi.adminLogin({ email: email.trim(), password });
      // Normalize backend role names to frontend canonical roles
      const normalizedRole = res.role === 'SUPER_ADMIN' || res.role === 'ADMIN' ? 'PLATFORM_ADMIN' : res.role;
      setSession({ userId: res.userId, role: normalizedRole, email: res.email, fullName: res.fullName, schoolId: null, tenantId: null, token: res.token });
      navigate('/dashboard');
    } catch (err: any) { setError(err.message || 'Invalid credentials.'); }
    finally { setLoading(false); }
  };

  return (
    <div style={{ minHeight: '100vh', background: BG, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 24, fontFamily: "'Manrope','Inter',system-ui,sans-serif", color: TEXT, position: 'relative', overflow: 'hidden' }}>
      {/* Antigravity background */}
      <AntigravityBackground baseColor="#34d399" />

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} style={{ width: '100%', maxWidth: 420, position: 'relative', zIndex: 1 }}>
        <button onClick={() => navigate('/')} style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'none', border: 'none', color: DIM, cursor: 'pointer', marginBottom: 32, fontFamily: 'inherit', fontSize: '0.85rem' }}>
          <ArrowLeft size={16} /> Back to home
        </button>
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{ width: 60, height: 60, borderRadius: 18, background: 'linear-gradient(135deg, #065f46, #34d399)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px', boxShadow: '0 0 32px rgba(52,211,153,0.3)' }}>
            <ShieldCheck size={28} color="#fff" />
          </div>
          <h1 style={{ fontSize: '1.8rem', fontWeight: 800, letterSpacing: '-0.02em', marginBottom: 8 }}>Platform Admin</h1>
          <p style={{ color: DIM, fontSize: '0.88rem' }}>Super admin access to the entire platform</p>
        </div>

        <form onSubmit={handleLogin} style={{ background: 'linear-gradient(180deg, rgba(6,20,14,0.97), rgba(2,6,23,0.95))', border: '1px solid rgba(52,211,153,0.15)', borderRadius: 24, padding: 32, backdropFilter: 'blur(20px)', display: 'flex', flexDirection: 'column', gap: 20 }}>
          <Field label="Admin Email" icon={Mail} type="email" placeholder="admin@platform.io" value={email} onChange={e => setEmail(e.target.value)} />
          <Field label="Password" icon={Lock} type="password" placeholder="••••••••" value={password} onChange={e => setPassword(e.target.value)} />
          {error && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 16px', borderRadius: 12, background: 'rgba(244,63,94,0.1)', border: '1px solid rgba(244,63,94,0.25)', color: '#fb7185', fontSize: '0.83rem' }}>
              <AlertCircle size={15} style={{ flexShrink: 0 }} />{error}
            </div>
          )}
          <button type="submit" disabled={loading} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, padding: '14px', borderRadius: 14, background: loading ? '#374151' : 'linear-gradient(135deg, #059669, #34d399)', border: 'none', color: '#fff', fontWeight: 800, fontSize: '0.95rem', cursor: loading ? 'not-allowed' : 'pointer', fontFamily: 'inherit' }}>
            {loading ? <Loader size={18} style={{ animation: 'spin 1s linear infinite' }} /> : <><span>Enter Platform</span><ArrowRight size={18} /></>}
          </button>
        </form>
      </motion.div>
      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
