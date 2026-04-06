import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, ArrowRight, Users, GraduationCap, Briefcase, Hash, Mail, Lock, User, CheckCircle2, AlertCircle, Loader } from 'lucide-react';
import { useStore } from '../store/useStore';
import { onboardingStatusApi, schoolOpsApi } from '../lib/api';
import { AntigravityBackground } from '../components/AntigravityBackground';

const BG = '#020617'; const BORDER = 'rgba(255,255,255,0.08)';
const TEXT = '#f1f5f9'; const DIM = '#64748b';

type Role = 'STUDENT' | 'TEACHER' | 'STAFF';
interface JoinState { schoolCode: string; role: Role | ''; fullName: string; email: string; password: string; }



const roles: { id: Role; label: string; desc: string; icon: React.ElementType; color: string }[] = [
  { id: 'STUDENT', label: 'Student', desc: 'Access classes, homework & results', icon: GraduationCap, color: '#22d3ee' },
  { id: 'TEACHER', label: 'Teacher', desc: 'Manage classes, attendance & grades', icon: Users, color: '#a78bfa' },
  { id: 'STAFF', label: 'Staff', desc: 'Administrative & support role', icon: Briefcase, color: '#34d399' },
];

export default function JoinSchoolPage() {
  const { accentColor: VIOLET } = useStore();

  const Field = ({ label, icon: Icon, accent = VIOLET, ...props }: { label: string; icon: React.ElementType; accent?: string } & React.InputHTMLAttributes<HTMLInputElement>) => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <label style={{ fontSize: '0.82rem', fontWeight: 700, color: DIM }}>{label}</label>
      <div style={{ position: 'relative' }}>
        <div style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: DIM, display: 'flex', pointerEvents: 'none' }}><Icon size={16} /></div>
        <input {...props} style={{ width: '100%', boxSizing: 'border-box', padding: '12px 14px 12px 42px', background: 'rgba(255,255,255,0.04)', border: `1px solid ${BORDER}`, borderRadius: 12, color: TEXT, fontSize: '0.9rem', fontFamily: 'inherit', outline: 'none' }}
          onFocus={e => (e.target.style.borderColor = accent)} onBlur={e => (e.target.style.borderColor = BORDER)} />
      </div>
    </div>
  );
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [data, setData] = useState<JoinState>({ schoolCode: '', role: '', fullName: '', email: '', password: '' });
  const [adminEmail, setAdminEmail] = useState('');
  const [schoolContext, setSchoolContext] = useState<{ schoolName: string; schoolId: string; tenantId: string } | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [lookupLoading, setLookupLoading] = useState(false);

  const up = (key: keyof JoinState, val: string) => setData(d => ({ ...d, [key]: val }));

  const handleSubmit = async () => {
    if (!data.fullName || !data.email || !data.password) { setError('All fields are required.'); return; }
    if (!schoolContext) { setError('Verify school code before continuing.'); return; }
    setLoading(true); setError('');
    try {
      await schoolOpsApi.createUser({
        schoolId: schoolContext.schoolId,
        tenantId: schoolContext.tenantId,
        schoolCode: data.schoolCode.toUpperCase().trim(),
        schoolName: schoolContext.schoolName,
        fullName: data.fullName.trim(),
        email: data.email.trim(),
        roleName: data.role,
        accessKey: data.password,
      });
      setStep(4); // success
    } catch (err: any) {
      setError(err.message || 'Failed to register. Please check your school code.');
    } finally { setLoading(false); }
  };

  const verifySchoolCode = async () => {
    if (!data.schoolCode.trim() || !adminEmail.trim()) {
      setError('Enter school code and school admin email.');
      return;
    }
    setLookupLoading(true);
    setError('');
    try {
      const status = await onboardingStatusApi.lookup(
        data.schoolCode.toUpperCase().trim(),
        adminEmail.trim()
      );

      if (!status.schoolId || !status.tenantId) {
        throw new Error('School is not activated yet. Ask admin to complete onboarding first.');
      }

      setSchoolContext({
        schoolName: status.schoolName,
        schoolId: status.schoolId,
        tenantId: status.tenantId,
      });
      setStep(2);
    } catch (err: any) {
      setSchoolContext(null);
      setError(err?.message || 'Could not verify school code.');
    } finally {
      setLookupLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: BG, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 24, fontFamily: "'Manrope','Inter',system-ui,sans-serif", color: TEXT, position: 'relative', overflow: 'hidden' }}>
      <AntigravityBackground />

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} style={{ width: '100%', maxWidth: 520, position: 'relative', zIndex: 1 }}>
        <button onClick={() => step > 1 ? setStep(s => s - 1) : navigate('/signup')} style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'none', border: 'none', color: DIM, cursor: 'pointer', marginBottom: 32, fontFamily: 'inherit' }}>
          <ArrowLeft size={16} /> {step > 1 ? 'Back' : 'Back to signup'}
        </button>

        {/* Progress dots */}
        {step < 4 && (
          <div style={{ display: 'flex', gap: 8, marginBottom: 32 }}>
            {[1, 2, 3].map(s => (
              <div key={s} style={{ height: 4, flex: 1, borderRadius: 99, background: step >= s ? VIOLET : 'rgba(255,255,255,0.1)', transition: 'background 0.3s' }} />
            ))}
          </div>
        )}

        <div style={{ background: 'linear-gradient(180deg, rgba(16,14,40,0.97), rgba(2,6,23,0.95))', border: `1px solid ${BORDER}`, borderRadius: 24, padding: 36, backdropFilter: 'blur(20px)' }}>
          <AnimatePresence mode="wait">
            {step === 1 && (
              <motion.div key="s1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
                <div>
                  <h2 style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: 6 }}>Enter School Code</h2>
                  <p style={{ color: DIM, fontSize: '0.88rem' }}>Get this from your school admin or invitation</p>
                </div>
                <Field label="School Code" icon={Hash} type="text" placeholder="e.g. GTA01" value={data.schoolCode} onChange={e => { up('schoolCode', e.target.value); setSchoolContext(null); }} />
                <Field label="School Admin Email" icon={Mail} type="email" placeholder="admin@school.edu" value={adminEmail} onChange={e => setAdminEmail(e.target.value)} />
                <button onClick={verifySchoolCode} disabled={lookupLoading} style={{ padding: '13px', borderRadius: 14, background: VIOLET, border: 'none', color: '#fff', fontWeight: 800, cursor: lookupLoading ? 'not-allowed' : 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                  {lookupLoading ? <Loader size={18} style={{ animation: 'spin 1s linear infinite' }} /> : <>Verify & Continue <ArrowRight size={18} /></>}
                </button>
                {error && <div style={{ color: '#fb7185', fontSize: '0.82rem', display: 'flex', gap: 6, alignItems: 'center' }}><AlertCircle size={14} />{error}</div>}
              </motion.div>
            )}

            {step === 2 && (
              <motion.div key="s2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
                <div>
                  <h2 style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: 6 }}>Select Your Role</h2>
                  <p style={{ color: DIM, fontSize: '0.88rem' }}>
                    Joining <strong style={{ color: VIOLET }}>{schoolContext?.schoolName || data.schoolCode.toUpperCase()}</strong>
                  </p>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {roles.map(r => (
                    <div key={r.id} onClick={() => up('role', r.id)} style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '16px 20px', borderRadius: 16, border: `1px solid ${data.role === r.id ? r.color + '55' : BORDER}`, background: data.role === r.id ? `${r.color}10` : 'rgba(255,255,255,0.02)', cursor: 'pointer', transition: 'all 0.2s' }}>
                      <div style={{ width: 40, height: 40, borderRadius: 12, background: `${r.color}18`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}><r.icon size={20} color={r.color} /></div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 700, fontSize: '0.95rem', color: TEXT }}>{r.label}</div>
                        <div style={{ fontSize: '0.78rem', color: DIM }}>{r.desc}</div>
                      </div>
                      {data.role === r.id && <CheckCircle2 size={18} color={r.color} />}
                    </div>
                  ))}
                </div>
                <button onClick={() => { if (!data.role) { setError('Select a role.'); return; } setError(''); setStep(3); }} style={{ padding: '13px', borderRadius: 14, background: data.role ? VIOLET : '#374151', border: 'none', color: '#fff', fontWeight: 800, cursor: data.role ? 'pointer' : 'not-allowed', fontFamily: 'inherit', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                  Continue <ArrowRight size={18} />
                </button>
                {error && <div style={{ color: '#fb7185', fontSize: '0.82rem', display: 'flex', gap: 6, alignItems: 'center' }}><AlertCircle size={14} />{error}</div>}
              </motion.div>
            )}

            {step === 3 && (
              <motion.div key="s3" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                <div>
                  <h2 style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: 6 }}>Create Your Account</h2>
                  <p style={{ color: DIM, fontSize: '0.88rem' }}>Joining as <strong style={{ color: VIOLET }}>{data.role}</strong></p>
                </div>
                <Field label="Full Name" icon={User} placeholder="Your full name" value={data.fullName} onChange={e => up('fullName', e.target.value)} />
                <Field label="Email" icon={Mail} type="email" placeholder="you@email.com" value={data.email} onChange={e => up('email', e.target.value)} />
                <Field label="Password" icon={Lock} type="password" placeholder="Choose a password" value={data.password} onChange={e => up('password', e.target.value)} />
                {error && <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 14px', borderRadius: 10, background: 'rgba(244,63,94,0.1)', border: '1px solid rgba(244,63,94,0.25)', color: '#fb7185', fontSize: '0.82rem' }}><AlertCircle size={14} />{error}</div>}
                <button onClick={handleSubmit} disabled={loading} style={{ padding: '13px', borderRadius: 14, background: loading ? '#374151' : VIOLET, border: 'none', color: '#fff', fontWeight: 800, cursor: loading ? 'not-allowed' : 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                  {loading ? <Loader size={18} style={{ animation: 'spin 1s linear infinite' }} /> : <><span>Join School</span><ArrowRight size={18} /></>}
                </button>
              </motion.div>
            )}

            {step === 4 && (
              <motion.div key="s4" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} style={{ textAlign: 'center', padding: '20px 0' }}>
                <div style={{ width: 72, height: 72, borderRadius: '50%', background: 'linear-gradient(135deg, #059669, #34d399)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px', boxShadow: '0 0 40px rgba(52,211,153,0.3)' }}>
                  <CheckCircle2 size={36} color="#fff" />
                </div>
                <h2 style={{ fontSize: '1.6rem', fontWeight: 800, marginBottom: 12 }}>Account Created</h2>
                <p style={{ color: DIM, fontSize: '0.9rem', lineHeight: 1.6, marginBottom: 28 }}>Your account has been created for <strong style={{ color: TEXT }}>{data.schoolCode.toUpperCase()}</strong> as <strong style={{ color: VIOLET }}>{data.role}</strong>. You can now log in.</p>
                <button onClick={() => navigate('/login')} style={{ padding: '12px 28px', borderRadius: 14, background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)', color: TEXT, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>
                  Go to Login
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
