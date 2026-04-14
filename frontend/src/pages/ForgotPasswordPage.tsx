import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Mail, ArrowLeft, ArrowRight, Lock, Check, Loader, Sparkles, ShieldCheck, Hash, AlertCircle } from 'lucide-react';
import { MotionBackdrop } from '../components/MotionBackdrop';
import { authPublicApi } from '../lib/api';

const BG = 'var(--public-page-bg)'; const BORDER = 'var(--public-border)';
const AMBER = '#ffb663'; const TEXT = 'var(--public-text-main)'; const DIM = 'var(--public-text-muted)';

export default function ForgotPasswordPage() {
  const navigate = useNavigate();
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [schoolCode, setSchoolCode] = useState('');
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [resetToken, setResetToken] = useState('');
  const [newPass, setNewPass] = useState('');
  const [confirmPass, setConfirmPass] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleStep1 = async () => {
    if (!schoolCode.trim() || !email.trim()) return;
    setLoading(true);
    setError('');
    try {
      await authPublicApi.forgotPassword({ schoolCode: schoolCode.trim().toUpperCase(), email: email.trim() });
      setStep(2);
    } catch (err: any) {
      setError(err?.message || 'Failed to send reset code.');
    } finally {
      setLoading(false);
    }
  };

  const handleStep2 = async () => {
    if (!code) return;
    setLoading(true);
    setError('');
    try {
      const res = await authPublicApi.verifyResetCode({
        schoolCode: schoolCode.trim().toUpperCase(),
        email: email.trim(),
        code: code.trim(),
      });
      setResetToken(res.resetToken);
      setStep(3);
    } catch (err: any) {
      setError(err?.message || 'Invalid or expired reset code.');
    } finally {
      setLoading(false);
    }
  };

  const handleStep3 = async () => {
    if (!newPass || newPass !== confirmPass) return;
    if (!resetToken) return;
    setLoading(true);
    setError('');
    try {
      await authPublicApi.resetPassword({ resetToken, newPassword: newPass });
      navigate('/login');
    } catch (err: any) {
      setError(err?.message || 'Failed to update password.');
    } finally {
      setLoading(false);
    }
  };

  const steps = [
    { n: 1, label: 'Account' },
    { n: 2, label: 'Verify Code' },
    { n: 3, label: 'New Password' },
  ];

  return (
    <div style={{ minHeight: '100vh', background: BG, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '40px 24px', fontFamily: "'Manrope','Inter',system-ui,sans-serif", color: TEXT, position: 'relative', overflow: 'hidden' }}>
      <MotionBackdrop mode="ambient" density={1.04} baseColor={AMBER} />

      <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} style={{ width: '100%', maxWidth: 440, zIndex: 1 }}>
        {/* Brand */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 40, justifyContent: 'center' }}>
          <div style={{ width: 44, height: 44, background: `linear-gradient(135deg, #d97706, ${AMBER})`, borderRadius: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 0 30px rgba(255,182,99,0.3)' }}>
            <Sparkles size={20} color="#040b14" />
          </div>
          <div>
            <div style={{ fontWeight: 800, fontSize: '1.2rem', color: TEXT }}>ElevateSmart</div>
            <div style={{ fontSize: '0.72rem', color: DIM }}>Password Recovery</div>
          </div>
        </div>

        {/* Progress Steps */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 36, alignItems: 'center', justifyContent: 'center' }}>
          {steps.map((s, i) => (
            <React.Fragment key={s.n}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{ width: 32, height: 32, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: step >= s.n ? AMBER : 'rgba(255,255,255,0.05)', border: `1px solid ${step >= s.n ? AMBER : BORDER}`, color: step >= s.n ? '#040b14' : DIM, fontSize: '0.8rem', fontWeight: 900, transition: 'all 0.3s' }}>
                  {step > s.n ? <Check size={14} /> : s.n}
                </div>
                <span style={{ fontSize: '0.72rem', fontWeight: 700, color: step === s.n ? TEXT : DIM, display: step === 1 && s.n !== 1 ? 'none' : 'block' }}>{s.label}</span>
              </div>
              {i < steps.length - 1 && <div style={{ flex: 1, height: 1, background: step > s.n ? AMBER : BORDER, transition: 'background 0.3s', maxWidth: 48 }} />}
            </React.Fragment>
          ))}
        </div>

        {/* Card */}
        <div style={{ background: 'linear-gradient(180deg, rgba(16,22,30,0.95), rgba(10,14,19,0.9))', border: `1px solid ${BORDER}`, borderRadius: 28, padding: 40, backdropFilter: 'blur(20px)', boxShadow: '0 24px 48px rgba(0,0,0,0.4)' }}>
          <AnimatePresence mode="wait">
            {step === 1 && (
              <motion.div key="s1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                <h2 style={{ fontWeight: 900, fontSize: '1.6rem', margin: '0 0 8px', letterSpacing: '-0.02em' }}>Forgot Password?</h2>
                <p style={{ color: DIM, fontSize: '0.88rem', margin: '0 0 28px', lineHeight: 1.6 }}>Enter your school code and registered email address and we'll send you a reset code.</p>
                <div style={{ position: 'relative', marginBottom: 12 }}>
                  <Hash size={16} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: DIM }} />
                  <input placeholder="School Code (e.g. BMPS)" value={schoolCode} onChange={e => setSchoolCode(e.target.value)}
                    style={{ width: '100%', boxSizing: 'border-box', padding: '13px 14px 13px 42px', background: 'rgba(255,255,255,0.03)', border: `1px solid ${BORDER}`, borderRadius: 14, color: TEXT, fontSize: '0.9rem', outline: 'none', fontFamily: 'inherit', textTransform: 'uppercase' }}
                    onFocus={e => e.target.style.borderColor = AMBER} onBlur={e => e.target.style.borderColor = BORDER} />
                </div>
                <div style={{ position: 'relative', marginBottom: 16 }}>
                  <Mail size={16} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: DIM }} />
                  <input type="email" placeholder="you@school.edu" value={email} onChange={e => setEmail(e.target.value)}
                    style={{ width: '100%', boxSizing: 'border-box', padding: '13px 14px 13px 42px', background: 'rgba(255,255,255,0.03)', border: `1px solid ${BORDER}`, borderRadius: 14, color: TEXT, fontSize: '0.9rem', outline: 'none', fontFamily: 'inherit' }}
                    onFocus={e => e.target.style.borderColor = AMBER} onBlur={e => e.target.style.borderColor = BORDER} />
                </div>
                {error && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 14px', borderRadius: 12, background: 'rgba(244,63,94,0.1)', border: '1px solid rgba(244,63,94,0.25)', color: '#fb7185', fontSize: '0.82rem', marginBottom: 12 }}>
                    <AlertCircle size={14} /> {error}
                  </div>
                )}
                <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }} onClick={handleStep1} disabled={loading || !schoolCode.trim() || !email.trim()}
                  style={{ width: '100%', padding: '14px', borderRadius: 14, background: `linear-gradient(135deg, ${AMBER}, #d97706)`, border: 'none', color: '#040b14', fontWeight: 800, fontSize: '0.95rem', cursor: 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                  {loading ? <Loader size={18} style={{ animation: 'spin 1s linear infinite' }} /> : <><span>Send Reset Code</span><ArrowRight size={18} /></>}
                </motion.button>
              </motion.div>
            )}

            {step === 2 && (
              <motion.div key="s2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                <div style={{ width: 60, height: 60, borderRadius: 18, background: 'rgba(52,211,153,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 20 }}>
                  <ShieldCheck size={28} color="#34d399" />
                </div>
                <h2 style={{ fontWeight: 900, fontSize: '1.6rem', margin: '0 0 8px', letterSpacing: '-0.02em' }}>Check Your Email</h2>
                <p style={{ color: DIM, fontSize: '0.88rem', margin: '0 0 28px', lineHeight: 1.6 }}>We sent a 6-digit code to <span style={{ color: TEXT, fontWeight: 700 }}>{email}</span>. Enter it below.</p>
                <input placeholder="000000" value={code} onChange={e => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))} maxLength={6}
                  style={{ width: '100%', boxSizing: 'border-box', padding: '16px', textAlign: 'center', letterSpacing: '0.4em', fontSize: '1.5rem', fontWeight: 900, background: 'rgba(255,255,255,0.03)', border: `1px solid ${BORDER}`, borderRadius: 14, color: TEXT, outline: 'none', fontFamily: 'monospace', marginBottom: 24 }} />
                {error && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 14px', borderRadius: 12, background: 'rgba(244,63,94,0.1)', border: '1px solid rgba(244,63,94,0.25)', color: '#fb7185', fontSize: '0.82rem', marginBottom: 12 }}>
                    <AlertCircle size={14} /> {error}
                  </div>
                )}
                <motion.button whileHover={{ scale: 1.02 }} onClick={handleStep2} disabled={loading || code.length < 6}
                  style={{ width: '100%', padding: '14px', borderRadius: 14, background: `linear-gradient(135deg, ${AMBER}, #d97706)`, border: 'none', color: '#040b14', fontWeight: 800, fontSize: '0.95rem', cursor: 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                  {loading ? <Loader size={18} style={{ animation: 'spin 1s linear infinite' }} /> : <><span>Verify Code</span><ArrowRight size={18} /></>}
                </motion.button>
              </motion.div>
            )}

            {step === 3 && (
              <motion.div key="s3" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                <h2 style={{ fontWeight: 900, fontSize: '1.6rem', margin: '0 0 8px', letterSpacing: '-0.02em' }}>New Password</h2>
                <p style={{ color: DIM, fontSize: '0.88rem', margin: '0 0 28px', lineHeight: 1.6 }}>Choose a strong new password for your account.</p>
                {['New Password', 'Confirm Password'].map((l, i) => (
                  <div key={l} style={{ position: 'relative', marginBottom: 16 }}>
                    <Lock size={16} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: DIM }} />
                    <input type="password" placeholder="••••••••" value={i === 0 ? newPass : confirmPass} onChange={e => i === 0 ? setNewPass(e.target.value) : setConfirmPass(e.target.value)}
                      style={{ width: '100%', boxSizing: 'border-box', padding: '13px 14px 13px 42px', background: 'rgba(255,255,255,0.03)', border: `1px solid ${BORDER}`, borderRadius: 14, color: TEXT, fontSize: '0.9rem', outline: 'none', fontFamily: 'inherit' }}
                      onFocus={e => e.target.style.borderColor = AMBER} onBlur={e => e.target.style.borderColor = BORDER} />
                  </div>
                ))}
                {confirmPass && newPass !== confirmPass && <div style={{ color: '#fb7185', fontSize: '0.8rem', marginBottom: 12 }}>Passwords do not match</div>}
                {error && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 14px', borderRadius: 12, background: 'rgba(244,63,94,0.1)', border: '1px solid rgba(244,63,94,0.25)', color: '#fb7185', fontSize: '0.82rem', marginBottom: 12 }}>
                    <AlertCircle size={14} /> {error}
                  </div>
                )}
                <motion.button whileHover={{ scale: 1.02 }} onClick={handleStep3} disabled={loading || !resetToken || !newPass || newPass !== confirmPass}
                  style={{ width: '100%', marginTop: 8, padding: '14px', borderRadius: 14, background: `linear-gradient(135deg, ${AMBER}, #d97706)`, border: 'none', color: '#040b14', fontWeight: 800, fontSize: '0.95rem', cursor: 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                  {loading ? <Loader size={18} style={{ animation: 'spin 1s linear infinite' }} /> : <><span>Update Password</span><Check size={18} /></>}
                </motion.button>
              </motion.div>
            )}
          </AnimatePresence>

          <button onClick={() => navigate('/login')} style={{ marginTop: 20, width: '100%', background: 'none', border: 'none', color: DIM, fontSize: '0.85rem', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, fontFamily: 'inherit' }}>
            <ArrowLeft size={14} /> Back to Sign In
          </button>
        </div>
      </motion.div>
      <style>{`@keyframes spin{from{transform:rotate(0)}to{transform:rotate(360deg)}}`}</style>
    </div>
  );
}
