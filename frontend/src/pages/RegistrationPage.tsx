import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, ArrowRight, Building2, MapPin, CreditCard, CheckCircle2, Info, AlertCircle, Loader, Check, Sparkles, Zap, Shield, ImagePlus } from 'lucide-react';
import { toast } from 'sonner';
import { onboardingApi, type OnboardingRequest } from '../lib/api';
import { MotionBackdrop } from '../components/MotionBackdrop';
import { SchoolMark } from '../components/public/SchoolMark';

const BG = 'var(--public-page-bg)'; const BORDER = 'var(--public-border)'; const CYAN = '#22d3ee';
const TEXT = 'var(--public-text-main)'; const DIM = 'var(--public-text-muted)';

const defaultData: OnboardingRequest = { schoolName: '', schoolCode: '', boardAffiliation: 'CBSE', contactEmail: '', contactPhone: '', addressLine: '', city: '', state: '', country: 'India', postalCode: '', selectedPlanCode: 'BASIC' };

const Field = ({ label, children }: { label: string; children: React.ReactNode }) => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
    <label style={{ fontSize: '0.82rem', fontWeight: 700, color: DIM }}>{label}</label>
    {children}
  </div>
);

const inp = (extra?: React.CSSProperties): React.CSSProperties => ({
  width: '100%', boxSizing: 'border-box', padding: '11px 14px',
  background: 'rgba(255,255,255,0.04)', border: `1px solid ${BORDER}`,
  borderRadius: 12, color: TEXT, fontSize: '0.9rem', fontFamily: 'inherit', outline: 'none', ...extra,
});

const plans = [
  { id: 'FREE', label: 'Free', price: '₹0/mo', features: ['Up to 100 students', 'Basic attendance', 'Notice board'], color: '#64748b', glow: 'rgba(100,116,139,0.1)' },
  { id: 'BASIC', label: 'Basic', price: '₹999/mo', features: ['Up to 500 students', 'Full attendance + billing', 'AI Copilot (limited)'], color: CYAN, glow: 'rgba(6,182,212,0.12)', popular: true },
  { id: 'PREMIUM', label: 'Premium', price: '₹2,499/mo', features: ['Unlimited students', 'All modules + analytics', 'Full AI Copilot + MCP'], color: '#a78bfa', glow: 'rgba(139,92,246,0.12)' },
];

const STEPS = ['School Details', 'Location', 'Plan', 'Review', 'Done'];

export default function RegistrationPage() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [data, setData] = useState<OnboardingRequest>(defaultData);
  const [selectedPlan, setSelectedPlan] = useState('BASIC');
  const [loading, setLoading] = useState(false);
  const [logoUploading, setLogoUploading] = useState(false);
  const [error, setError] = useState('');
  const [submitted, setSubmitted] = useState<{ schoolName: string; contactEmail: string } | null>(null);

  const up = (key: keyof OnboardingRequest, val: string) => setData(d => ({ ...d, [key]: val }));

  const validate = () => {
    if (step === 1 && (!data.schoolName.trim() || !data.schoolCode.trim() || !data.contactEmail.trim() || !data.contactPhone.trim())) {
      return 'Please fill in School Name, School Code, Admin Email, and Contact Phone.';
    }
    if (step === 2 && (!data.addressLine.trim() || !data.city.trim() || !data.state.trim() || !data.country.trim() || !data.postalCode.trim())) {
      return 'Please complete the full address, including postal code.';
    }
    return '';
  };

  const handleNext = async () => {
    const err = validate();
    if (err) { toast.error(err); setError(err); return; }
    setError('');
    if (step < 4) { setStep(s => s + 1); return; }
    // Step 4 → Submit
    setLoading(true);
    try {
      await onboardingApi.create({
        ...data,
        schoolName: data.schoolName.trim(),
        schoolCode: data.schoolCode.trim().toUpperCase(),
        boardAffiliation: data.boardAffiliation.trim(),
        contactEmail: data.contactEmail.trim(),
        contactPhone: data.contactPhone.trim(),
        addressLine: data.addressLine.trim(),
        city: data.city.trim(),
        state: data.state.trim(),
        country: data.country.trim(),
        postalCode: data.postalCode.trim(),
        selectedPlanCode: selectedPlan as 'FREE' | 'BASIC' | 'PREMIUM',
      });
      setSubmitted({ schoolName: data.schoolName, contactEmail: data.contactEmail });
      toast.success('Onboarding request submitted successfully.');
      setStep(5);
    } catch (e: any) {
      const msg = e.message || 'Submission failed. Please try again.';
      toast.error(msg); setError(msg);
    } finally { setLoading(false); }
  };

  const handleLogoUpload = async (file: File) => {
    setLogoUploading(true);
    try {
      const response = await onboardingApi.uploadPublicSchoolLogo(file, data.schoolCode);
      setData((current) => ({ ...current, logoUrl: response.publicUrl }));
      toast.success('School logo uploaded. You can still replace it later from the school admin profile.');
    } catch (uploadError: any) {
      toast.error(uploadError?.message || 'Could not upload the school logo.');
    } finally {
      setLogoUploading(false);
    }
  };

  const sectionStyle: React.CSSProperties = {
    background: 'linear-gradient(180deg, rgba(8,51,68,0.6), rgba(2,6,23,0.95))',
    border: `1px solid ${BORDER}`, borderRadius: 24, padding: 36,
    backdropFilter: 'blur(20px)', width: '100%', maxWidth: 760,
  };

  return (
    <div style={{ minHeight: '100vh', background: BG, display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '32px 24px', fontFamily: "'Manrope','Inter',system-ui,sans-serif", color: TEXT, position: 'relative', overflow: 'hidden' }}>
      <MotionBackdrop mode="ambient" density={1.04} baseColor={CYAN} />

      {/* Back button */}
      <div style={{ width: '100%', maxWidth: 760, marginBottom: 32 }}>
        <button onClick={() => step > 1 && step < 5 ? setStep(s => s - 1) : navigate('/signup')} style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'none', border: 'none', color: DIM, cursor: 'pointer', fontFamily: 'inherit', fontSize: '0.85rem' }}>
          <ArrowLeft size={16} /> {step > 1 && step < 5 ? 'Back' : 'Back to signup'}
        </button>
      </div>

      {/* Stepper */}
      {step < 5 && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 40, width: '100%', maxWidth: 760 }}>
          {STEPS.slice(0, 4).map((label, i) => {
            const s = i + 1;
            const done = step > s; const active = step === s;
            return (
              <React.Fragment key={s}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{ width: 32, height: 32, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.8rem', fontWeight: 800, background: done ? CYAN : active ? `${CYAN}20` : 'rgba(255,255,255,0.06)', color: done ? '#0b0f14' : active ? CYAN : '#4b5563', border: active ? `1px solid ${CYAN}` : 'none', flexShrink: 0 }}>
                    {done ? <Check size={14} /> : s}
                  </div>
                  <span style={{ fontSize: '0.75rem', fontWeight: 700, color: active ? CYAN : done ? '#94a3b8' : '#4b5563', whiteSpace: 'nowrap' as const }}>{label}</span>
                </div>
                {s < 4 && <div style={{ flex: 1, height: 2, background: done ? CYAN : 'rgba(255,255,255,0.08)', borderRadius: 99 }} />}
              </React.Fragment>
            );
          })}
        </div>
      )}

      <AnimatePresence mode="wait">
        {step === 1 && (
          <motion.div key="s1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} style={sectionStyle}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
              <Building2 size={22} color={CYAN} />
              <h2 style={{ fontSize: '1.4rem', fontWeight: 800 }}>Institutional Details</h2>
            </div>
            <p style={{ color: DIM, marginBottom: 28, fontSize: '0.88rem' }}>Enter the core details of your educational institution.</p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 20 }}>
              <div style={{ gridColumn: '1 / -1', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 18, padding: 18, borderRadius: 20, border: `1px solid ${BORDER}`, background: 'rgba(255,255,255,0.02)' }}>
                <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 150, padding: 12, borderRadius: 18, border: `1px solid ${CYAN}22`, background: 'radial-gradient(circle at top, rgba(34,211,238,0.12), rgba(255,255,255,0.02) 55%)' }}>
                  <SchoolMark
                    school={{
                      schoolName: data.schoolName || 'Your school identity',
                      schoolCode: data.schoolCode || 'NEW',
                      logoUrl: data.logoUrl || null,
                    }}
                    size="lg"
                  />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10, justifyContent: 'center' }}>
                  <div style={{ fontSize: '0.78rem', letterSpacing: '0.14em', textTransform: 'uppercase', fontWeight: 800, color: CYAN }}>School identity</div>
                  <div style={{ fontSize: '1.05rem', fontWeight: 800, color: TEXT }}>Upload your crest or logo now</div>
                  <p style={{ margin: 0, color: DIM, fontSize: '0.84rem', lineHeight: 1.6 }}>
                    If you do not have branding ready yet, we will generate a dynamic mark from the school name and code.
                    You can replace it later from the school admin profile without reopening onboarding.
                  </p>
                  <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, width: '100%', maxWidth: 520, padding: '16px 18px', borderRadius: 18, border: `1px dashed ${CYAN}66`, background: 'linear-gradient(135deg, rgba(34,211,238,0.12), rgba(255,255,255,0.03))', cursor: logoUploading ? 'not-allowed' : 'pointer', color: '#b6f5ff', fontWeight: 700, marginBottom: 0, boxSizing: 'border-box' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 0 }}>
                      <div style={{ width: 40, height: 40, borderRadius: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(34,211,238,0.14)', border: `1px solid ${CYAN}33`, flexShrink: 0 }}>
                        {logoUploading ? <Loader size={18} style={{ animation: 'spin 1s linear infinite' }} /> : <ImagePlus size={18} />}
                      </div>
                      <div style={{ minWidth: 0, display: 'flex', flexDirection: 'column', gap: 3 }}>
                        <span>{logoUploading ? 'Uploading logo...' : data.logoUrl ? 'Replace uploaded logo' : 'Upload school logo'}</span>
                        <span style={{ fontSize: '0.76rem', fontWeight: 600, color: DIM, lineHeight: 1.5 }}>
                          PNG, JPG, or WEBP works best. Recommended square artwork for cleaner marks.
                        </span>
                      </div>
                    </div>
                    <div style={{ padding: '8px 12px', borderRadius: 999, border: `1px solid ${CYAN}33`, background: 'rgba(2,6,23,0.34)', fontSize: '0.74rem', letterSpacing: '0.08em', textTransform: 'uppercase', flexShrink: 0 }}>
                      {data.logoUrl ? 'Change' : 'Browse'}
                    </div>
                    <input
                      type="file"
                      accept="image/*"
                      style={{ display: 'none' }}
                      disabled={logoUploading}
                      onChange={(event) => {
                        const file = event.target.files?.[0];
                        if (!file) return;
                        handleLogoUpload(file);
                        event.currentTarget.value = '';
                      }}
                    />
                  </label>
                  {data.logoUrl ? (
                    <div style={{ fontSize: '0.76rem', color: '#9dd9e5', lineHeight: 1.5 }}>
                      Logo uploaded successfully. You can keep this version or replace it before submission.
                    </div>
                  ) : null}
                </div>
              </div>
              <Field label="Institution Name *">
                <input value={data.schoolName} onChange={e => up('schoolName', e.target.value)} placeholder="e.g. Global Tech Academy" style={inp()} onFocus={e => (e.target.style.borderColor = CYAN)} onBlur={e => (e.target.style.borderColor = BORDER)} />
              </Field>
              <Field label="Desired School Code *">
                <input value={data.schoolCode} onChange={e => up('schoolCode', e.target.value.toUpperCase())} placeholder="e.g. GTA01" style={inp()} onFocus={e => (e.target.style.borderColor = CYAN)} onBlur={e => (e.target.style.borderColor = BORDER)} />
              </Field>
              <Field label="Primary Admin Email *">
                <input type="email" value={data.contactEmail} onChange={e => up('contactEmail', e.target.value)} placeholder="admin@academy.edu" style={inp()} onFocus={e => (e.target.style.borderColor = CYAN)} onBlur={e => (e.target.style.borderColor = BORDER)} />
              </Field>
              <Field label="Contact Phone *">
                <input value={data.contactPhone} onChange={e => up('contactPhone', e.target.value)} placeholder="+91 9876543210" style={inp()} onFocus={e => (e.target.style.borderColor = CYAN)} onBlur={e => (e.target.style.borderColor = BORDER)} />
              </Field>
              <Field label="Board Affiliation">
                <select value={data.boardAffiliation} onChange={e => up('boardAffiliation', e.target.value)} style={inp({ appearance: 'none' as any })}>
                  {['CBSE', 'ICSE', 'State Board', 'IB', 'Cambridge'].map(b => <option key={b} value={b}>{b}</option>)}
                </select>
              </Field>
            </div>
            {error && <div style={{ marginTop: 16, display: 'flex', gap: 8, color: '#fb7185', fontSize: '0.82rem', alignItems: 'center' }}><AlertCircle size={14} />{error}</div>}
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 28 }}>
              <button onClick={handleNext} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '12px 28px', borderRadius: 14, background: CYAN, border: 'none', color: '#0b0f14', fontWeight: 800, cursor: 'pointer', fontFamily: 'inherit' }}>
                Continue <ArrowRight size={18} />
              </button>
            </div>
          </motion.div>
        )}

        {step === 2 && (
          <motion.div key="s2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} style={sectionStyle}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
              <MapPin size={22} color="#a78bfa" />
              <h2 style={{ fontSize: '1.4rem', fontWeight: 800 }}>Location Details</h2>
            </div>
            <p style={{ color: DIM, marginBottom: 28, fontSize: '0.88rem' }}>Where is your primary campus located?</p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 20 }}>
              <div style={{ gridColumn: '1/-1' }}>
                <Field label="Address Line *">
                  <input value={data.addressLine} onChange={e => up('addressLine', e.target.value)} placeholder="123 Innovation Drive" style={inp()} onFocus={e => (e.target.style.borderColor = '#a78bfa')} onBlur={e => (e.target.style.borderColor = BORDER)} />
                </Field>
              </div>
              <Field label="City *">
                <input value={data.city} onChange={e => up('city', e.target.value)} placeholder="Mumbai" style={inp()} onFocus={e => (e.target.style.borderColor = '#a78bfa')} onBlur={e => (e.target.style.borderColor = BORDER)} />
              </Field>
              <Field label="State *">
                <input value={data.state} onChange={e => up('state', e.target.value)} placeholder="Maharashtra" style={inp()} onFocus={e => (e.target.style.borderColor = '#a78bfa')} onBlur={e => (e.target.style.borderColor = BORDER)} />
              </Field>
              <Field label="Postal Code *">
                <input value={data.postalCode} onChange={e => up('postalCode', e.target.value)} placeholder="400001" style={inp()} onFocus={e => (e.target.style.borderColor = '#a78bfa')} onBlur={e => (e.target.style.borderColor = BORDER)} />
              </Field>
              <Field label="Country *">
                <input value={data.country} onChange={e => up('country', e.target.value)} placeholder="India" style={inp()} onFocus={e => (e.target.style.borderColor = '#a78bfa')} onBlur={e => (e.target.style.borderColor = BORDER)} />
              </Field>
            </div>
            {error && <div style={{ marginTop: 16, display: 'flex', gap: 8, color: '#fb7185', fontSize: '0.82rem', alignItems: 'center' }}><AlertCircle size={14} />{error}</div>}
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 28 }}>
              <button onClick={handleNext} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '12px 28px', borderRadius: 14, background: '#7c3aed', border: 'none', color: '#fff', fontWeight: 800, cursor: 'pointer', fontFamily: 'inherit' }}>
                Continue <ArrowRight size={18} />
              </button>
            </div>
          </motion.div>
        )}

        {step === 3 && (
          <motion.div key="s3" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} style={{ ...sectionStyle, maxWidth: 860 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
              <CreditCard size={22} color="#ffb663" />
              <h2 style={{ fontSize: '1.4rem', fontWeight: 800 }}>Select a Plan</h2>
            </div>
            <p style={{ color: DIM, marginBottom: 28, fontSize: '0.88rem' }}>Choose the plan that fits your institution. You can upgrade anytime.</p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16, marginBottom: 28 }}>
              {plans.map(p => (
                <div key={p.id} onClick={() => setSelectedPlan(p.id)} style={{ padding: '24px 20px', borderRadius: 20, border: `1px solid ${selectedPlan === p.id ? p.color + '60' : BORDER}`, background: selectedPlan === p.id ? p.glow : 'rgba(255,255,255,0.02)', cursor: 'pointer', transition: 'all 0.2s', position: 'relative', display: 'flex', flexDirection: 'column', gap: 16 }}>
                  {(p as any).popular && <div style={{ position: 'absolute', top: -12, left: '50%', transform: 'translateX(-50%)', padding: '3px 14px', borderRadius: 99, background: CYAN, color: '#0b0f14', fontSize: '0.68rem', fontWeight: 800, whiteSpace: 'nowrap' }}>MOST POPULAR</div>}
                  <div>
                    <div style={{ fontWeight: 800, fontSize: '1.1rem', color: p.color, marginBottom: 4 }}>{p.label}</div>
                    <div style={{ fontSize: '1.3rem', fontWeight: 900, color: TEXT }}>{p.price}</div>
                  </div>
                  <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {p.features.map(f => (
                      <li key={f} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.8rem', color: '#94a3b8' }}>
                        <Check size={13} color={p.color} /> {f}
                      </li>
                    ))}
                  </ul>
                  {selectedPlan === p.id && <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: p.color, fontSize: '0.78rem', fontWeight: 800 }}><CheckCircle2 size={14} /> Selected</div>}
                </div>
              ))}
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <button onClick={handleNext} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '12px 28px', borderRadius: 14, background: '#d97706', border: 'none', color: '#0b0f14', fontWeight: 800, cursor: 'pointer', fontFamily: 'inherit' }}>
                Continue <ArrowRight size={18} />
              </button>
            </div>
          </motion.div>
        )}

        {step === 4 && (
          <motion.div key="s4" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} style={sectionStyle}>
            <h2 style={{ fontSize: '1.4rem', fontWeight: 800, marginBottom: 6 }}>Review & Submit</h2>
            <p style={{ color: DIM, marginBottom: 24, fontSize: '0.88rem' }}>Please confirm your details before submitting.</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 24 }}>
              {[
                ['Institution', data.schoolName],
                ['School Code', data.schoolCode],
                ['Admin Email', data.contactEmail],
                ['Board', data.boardAffiliation],
                ['Location', [data.city, data.state, data.country].filter(Boolean).join(', ')],
                ['Plan', selectedPlan],
              ].map(([k, v]) => (
                <div key={k} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: `1px solid ${BORDER}` }}>
                  <span style={{ color: DIM, fontSize: '0.85rem' }}>{k}</span>
                  <span style={{ fontWeight: 700, fontSize: '0.85rem', color: TEXT }}>{v}</span>
                </div>
              ))}
            </div>
            {error && <div style={{ marginBottom: 16, display: 'flex', gap: 8, color: '#fb7185', fontSize: '0.82rem', padding: '10px 14px', borderRadius: 10, background: 'rgba(244,63,94,0.1)', border: '1px solid rgba(244,63,94,0.25)', alignItems: 'center' }}><AlertCircle size={14} />{error}</div>}
            <button onClick={handleNext} disabled={loading} style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, padding: '14px', borderRadius: 14, background: loading ? '#374151' : `linear-gradient(135deg, #0e7490, ${CYAN})`, border: 'none', color: loading ? '#9ca3af' : '#0b0f14', fontWeight: 800, cursor: loading ? 'not-allowed' : 'pointer', fontFamily: 'inherit' }}>
              {loading ? <><Loader size={18} style={{ animation: 'spin 1s linear infinite' }} /> Submitting...</> : <><Sparkles size={18} /> Submit Registration</>}
            </button>
          </motion.div>
        )}

        {step === 5 && submitted && (
          <motion.div key="s5" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} style={{ ...sectionStyle, textAlign: 'center', padding: '56px 36px' }}>
            <div style={{ width: 80, height: 80, borderRadius: '50%', background: 'linear-gradient(135deg, #059669, #34d399)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 28px', boxShadow: '0 0 48px rgba(52,211,153,0.4)' }}>
              <CheckCircle2 size={40} color="#fff" />
            </div>
            <h2 style={{ fontSize: '1.8rem', fontWeight: 900, marginBottom: 12 }}>Application Submitted!</h2>
            <p style={{ color: DIM, fontSize: '0.92rem', lineHeight: 1.7, maxWidth: 480, margin: '0 auto 24px' }}>
              Your registration for <strong style={{ color: TEXT }}>{submitted.schoolName}</strong> has been sent to the platform review queue.
            </p>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 10, padding: '14px 20px', borderRadius: 14, background: 'rgba(6,182,212,0.08)', border: '1px solid rgba(6,182,212,0.2)', color: '#67e8f9', fontSize: '0.85rem', marginBottom: 28, textAlign: 'left' }}>
              <Info size={18} style={{ flexShrink: 0 }} />
              Watch <strong>{submitted.contactEmail}</strong> for your Tenant ID and Activation Code.
            </div>
            <button onClick={() => navigate('/login')} style={{ padding: '12px 28px', borderRadius: 14, background: 'rgba(255,255,255,0.08)', border: `1px solid ${BORDER}`, color: TEXT, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>
              Return to Login
            </button>
          </motion.div>
        )}
      </AnimatePresence>
      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
