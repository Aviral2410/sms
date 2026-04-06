import React, { useState, useEffect, useRef } from 'react';
import { useStore } from '../store/useStore';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Hash, Mail, Lock, ArrowRight, AlertCircle, Loader, Building2, Users, ShieldCheck, Sparkles } from 'lucide-react';
import { authApi } from '../lib/api';
import { AntigravityBackground } from '../components/AntigravityBackground';

const BG = '#040b14'; const BORDER = 'rgba(255,255,255,0.08)';
const AMBER = '#ffb663'; const CYAN = '#22d3ee'; const VIOLET = '#a78bfa';
const TEXT = '#f5efdf'; const DIM = '#8b95a2';

const Field = ({ label, icon: Icon, ...props }: { label: string; icon: React.ElementType } & React.InputHTMLAttributes<HTMLInputElement>) => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
    <label style={{ fontSize: '0.8rem', fontWeight: 700, color: DIM }}>{label}</label>
    <div style={{ position: 'relative' }}>
      <div style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: DIM, display: 'flex', pointerEvents: 'none' }}><Icon size={16} /></div>
      <input {...props} style={{ width: '100%', boxSizing: 'border-box', padding: '12px 14px 12px 42px', background: 'rgba(255,255,255,0.03)', border: `1px solid ${BORDER}`, borderRadius: 12, color: TEXT, fontSize: '0.9rem', fontFamily: 'inherit', outline: 'none', transition: 'border-color 0.2s, box-shadow 0.2s' }}
        onFocus={e => { e.target.style.borderColor = AMBER; e.target.style.boxShadow = '0 0 0 3px rgba(255,182,99,0.12)'; }} onBlur={e => { e.target.style.borderColor = BORDER; e.target.style.boxShadow = 'none'; }} />
    </div>
  </div>
);

export default function AuthPortal() {
  const [schoolCode, setSchoolCode] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { setSession, accentColor } = useStore();
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!schoolCode.trim() || !email.trim() || !password) { setError('All fields required.'); return; }
    setLoading(true); setError('');
    try {
      const res = await authApi.schoolLogin({ schoolCode: schoolCode.toUpperCase().trim(), email: email.trim(), password });
      setSession({ userId: res.userId, role: res.role, email: res.email, fullName: res.fullName, schoolId: res.schoolId, tenantId: res.tenantId, token: res.token });
      navigate('/dashboard');
    } catch (err: any) { setError(err.message || 'Invalid credentials.'); }
    finally { setLoading(false); }
  };

  return (
    <div style={{ minHeight: '100vh', background: BG, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '40px 24px', fontFamily: "'Manrope','Inter',system-ui,sans-serif", color: TEXT, position: 'relative', overflow: 'hidden' }}>
      <AntigravityBackground particleCount={120} />


      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} style={{ width: '100%', maxWidth: 1000, display: 'grid', gridTemplateColumns: 'minmax(400px, 1.2fr) 1fr', gap: 40, alignItems: 'center', zIndex: 1 }}>
        
        {/* Left: Login Form */}
        <div style={{ background: 'linear-gradient(180deg, rgba(16,22,30,0.95), rgba(10,14,19,0.9))', border: `1px solid ${BORDER}`, borderRadius: 28, padding: 40, backdropFilter: 'blur(20px)', boxShadow: '0 24px 48px rgba(0,0,0,0.4)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 32 }}>
            <div style={{ width: 44, height: 44, background: `linear-gradient(135deg, #d97706, ${AMBER})`, borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 0 20px rgba(255,182,99,0.3)' }}><Sparkles size={20} color="#040b14" /></div>
            <div>
              <h1 style={{ fontSize: '1.4rem', fontWeight: 800, margin: 0, letterSpacing: '-0.02em' }}>ElevateSmart</h1>
              <p style={{ color: DIM, margin: 0, fontSize: '0.82rem' }}>Welcome back to your workspace</p>
            </div>
          </div>

          <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
            <Field label="School Code" icon={Hash} type="text" placeholder="e.g. GTA01" autoCapitalize="characters" value={schoolCode} onChange={e => setSchoolCode(e.target.value)} />
            <Field label="Email Address" icon={Mail} type="email" placeholder="you@school.edu" value={email} onChange={e => setEmail(e.target.value)} />
            <Field label="Password" icon={Lock} type="password" placeholder="••••••••" value={password} onChange={e => setPassword(e.target.value)} />
            
            {error && <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 14px', borderRadius: 10, background: 'rgba(244,63,94,0.1)', border: '1px solid rgba(244,63,94,0.25)', color: '#fb7185', fontSize: '0.82rem' }}><AlertCircle size={14} />{error}</div>}
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 4 }}>
              <span style={{ fontSize: '0.78rem', color: DIM, cursor: 'pointer' }} onClick={() => navigate('/activate')}>Activate account</span>
              <span style={{ fontSize: '0.78rem', color: AMBER, cursor: 'pointer', fontWeight: 700 }} onClick={() => navigate('/forgot-password')}>Forgot password?</span>
            </div>

            <button type="submit" disabled={loading} style={{ marginTop: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, padding: '14px', borderRadius: 14, background: loading ? '#374151' : `linear-gradient(135deg, ${AMBER}, #d97706)`, border: 'none', color: '#040b14', fontWeight: 800, fontSize: '0.95rem', cursor: loading ? 'not-allowed' : 'pointer', fontFamily: 'inherit' }}>
              {loading ? <Loader size={18} style={{ animation: 'spin 1s linear infinite' }} /> : <><span>Sign In</span><ArrowRight size={18} /></>}
            </button>
          </form>
        </div>

        {/* Right: Onboarding / Other roles */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24, padding: '20px 0' }}>
          <div>
            <h2 style={{ fontSize: '2rem', fontWeight: 900, letterSpacing: '-0.03em', marginBottom: 12, lineHeight: 1.1 }}>New to <span style={{ color: CYAN }}>ElevateSmart?</span></h2>
            <p style={{ color: DIM, fontSize: '0.95rem', lineHeight: 1.6, maxWidth: 400 }}>Experience true unified operational intelligence. Launch your institution's digital campus today.</p>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginTop: 12 }}>
            <div onClick={() => navigate('/onboarding')} style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '20px', borderRadius: 20, background: 'rgba(34,211,238,0.06)', border: '1px solid rgba(34,211,238,0.2)', cursor: 'pointer', transition: 'all 0.2s', position: 'relative', overflow: 'hidden' }} onMouseEnter={e => (e.currentTarget.style.borderColor = 'rgba(34,211,238,0.4)')} onMouseLeave={e => (e.currentTarget.style.borderColor = 'rgba(34,211,238,0.2)')}>
              <div style={{ width: 44, height: 44, borderRadius: 12, background: 'rgba(34,211,238,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Building2 size={22} color={CYAN} /></div>
              <div>
                <div style={{ fontWeight: 800, fontSize: '1rem', color: '#fff', marginBottom: 2 }}>Register your School</div>
                <div style={{ fontSize: '0.8rem', color: '#94a3b8' }}>Create a new tenant workspace</div>
              </div>
              <ArrowRight size={18} color={CYAN} style={{ marginLeft: 'auto' }} />
            </div>

            <div onClick={() => navigate('/join')} style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '20px', borderRadius: 20, background: 'rgba(167,139,250,0.06)', border: '1px solid rgba(167,139,250,0.2)', cursor: 'pointer', transition: 'all 0.2s' }} onMouseEnter={e => (e.currentTarget.style.borderColor = 'rgba(167,139,250,0.4)')} onMouseLeave={e => (e.currentTarget.style.borderColor = 'rgba(167,139,250,0.2)')}>
              <div style={{ width: 44, height: 44, borderRadius: 12, background: 'rgba(167,139,250,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Users size={22} color={VIOLET} /></div>
              <div>
                <div style={{ fontWeight: 800, fontSize: '1rem', color: '#fff', marginBottom: 2 }}>Join with Code</div>
                <div style={{ fontSize: '0.8rem', color: '#94a3b8' }}>For students and educators</div>
              </div>
              <ArrowRight size={18} color={VIOLET} style={{ marginLeft: 'auto' }} />
            </div>

            <div onClick={() => navigate('/login/admin')} style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '16px 20px', borderRadius: 18, background: 'transparent', border: `1px solid ${BORDER}`, cursor: 'pointer', transition: 'all 0.2s' }} onMouseEnter={e => (e.currentTarget.style.borderColor = 'rgba(255,255,255,0.2)')} onMouseLeave={e => (e.currentTarget.style.borderColor = BORDER)}>
              <div style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><ShieldCheck size={18} color={DIM} /></div>
              <div style={{ fontWeight: 700, fontSize: '0.9rem', color: DIM }}>Platform Admin Sign In</div>
            </div>
          </div>
        </div>
      </motion.div>
      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
