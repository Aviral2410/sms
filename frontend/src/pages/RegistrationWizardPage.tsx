import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  Building2,
  Check,
  CheckCircle2,
  CreditCard,
  Globe2,
  ImagePlus,
  Info,
  Loader,
  MapPin,
  ShieldCheck,
  Sparkles,
} from 'lucide-react';
import { toast } from 'sonner';
import { onboardingApi, type OnboardingRequest } from '../lib/api';
import { MotionBackdrop } from '../components/MotionBackdrop';
import { SchoolMark } from '../components/public/SchoolMark';

const BG = 'var(--public-page-bg)';
const BORDER = 'var(--public-border)';
const CYAN = '#22d3ee';
const VIOLET = '#a78bfa';
const AMBER = '#ffb663';
const TEXT = 'var(--public-text-main)';
const DIM = 'var(--public-text-muted)';

const defaultData: OnboardingRequest = {
  schoolName: '',
  schoolCode: '',
  realmName: '',
  boardAffiliation: 'CBSE',
  contactEmail: '',
  contactPhone: '',
  addressLine: '',
  city: '',
  state: '',
  country: 'India',
  postalCode: '',
  selectedPlanCode: 'BASIC',
  logoUrl: null,
  usePlatformSubdomain: true,
  customDomain: '',
  tagline: '',
  latitude: null,
  longitude: null,
  hasBranches: false,
};

const STEPS = ['School details', 'Campus', 'Routing', 'Plan', 'Review'];

const plans = [
  { id: 'FREE', label: 'Free', price: 'Rs 0/mo', features: ['Up to 100 students', 'Basic attendance', 'Notice board'], color: '#64748b', glow: 'rgba(100,116,139,0.1)' },
  { id: 'BASIC', label: 'Basic', price: 'Rs 999/mo', features: ['Up to 500 students', 'Full attendance + billing', 'Landing page + CMS'], color: CYAN, glow: 'rgba(6,182,212,0.12)', popular: true },
  { id: 'PREMIUM', label: 'Premium', price: 'Rs 2,499/mo', features: ['Unlimited students', 'Routing + analytics', 'AI + advanced modules'], color: VIOLET, glow: 'rgba(139,92,246,0.12)' },
];

function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <label style={{ fontSize: '0.82rem', fontWeight: 700, color: DIM }}>{label}</label>
      {children}
      {hint ? <div style={{ fontSize: '0.78rem', color: '#8ba1b3', lineHeight: 1.5 }}>{hint}</div> : null}
    </div>
  );
}

const inp = (extra?: React.CSSProperties): React.CSSProperties => ({
  width: '100%',
  boxSizing: 'border-box',
  padding: '11px 14px',
  background: 'rgba(255,255,255,0.04)',
  border: `1px solid ${BORDER}`,
  borderRadius: 12,
  color: TEXT,
  fontSize: '0.9rem',
  fontFamily: 'inherit',
  outline: 'none',
  ...extra,
});

function inferRealm(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 40);
}

export default function RegistrationWizardPage() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [data, setData] = useState<OnboardingRequest>(defaultData);
  const [selectedPlan, setSelectedPlan] = useState<'FREE' | 'BASIC' | 'PREMIUM'>('BASIC');
  const [loading, setLoading] = useState(false);
  const [logoUploading, setLogoUploading] = useState(false);
  const [error, setError] = useState('');
  const [submitted, setSubmitted] = useState<{ schoolName: string; contactEmail: string; schoolCode: string; realmName: string } | null>(null);

  const hostname = typeof window !== 'undefined' ? window.location.hostname : 'localhost';
  const port = typeof window !== 'undefined' && window.location.port ? `:${window.location.port}` : '';
  const baseHost = useMemo(() => {
    if (hostname === 'localhost' || hostname.endsWith('.localhost')) return `localhost${port || ':30080'}`;
    return `${hostname}${port}`;
  }, [hostname, port]);
  const tenantPreview = `${(data.realmName || data.schoolCode || 'demo-school').toLowerCase()}.${baseHost}`;

  const up = <K extends keyof OnboardingRequest>(key: K, value: OnboardingRequest[K]) => {
    setData((current) => {
      const next = { ...current, [key]: value };
      if ((key === 'schoolCode' || key === 'schoolName') && !current.realmName?.trim()) {
        next.realmName = inferRealm(String(value));
      }
      return next;
    });
  };

  const validate = () => {
    if (step === 1 && (!data.schoolName?.trim() || !data.schoolCode?.trim() || !data.contactEmail?.trim() || !data.contactPhone?.trim())) {
      return 'Please fill in school name, school code, admin email, and contact phone.';
    }
    if (step === 2 && (!data.addressLine?.trim() || !data.city?.trim() || !data.state?.trim() || !data.country?.trim() || !data.postalCode?.trim())) {
      return 'Please complete the primary campus address before continuing.';
    }
    if (step === 3) {
      if (!data.realmName?.trim()) {
        return 'A realm name is required so the tenant can resolve correctly.';
      }
      if (data.usePlatformSubdomain === false && !data.customDomain?.trim()) {
        return 'Add a custom domain or enable the platform subdomain option.';
      }
    }
    return '';
  };

  const handleNext = async () => {
    const validationMessage = validate();
    if (validationMessage) {
      setError(validationMessage);
      toast.error(validationMessage);
      return;
    }

    setError('');
    if (step < 5) {
      setStep((current) => current + 1);
      return;
    }

    setLoading(true);
    try {
      await onboardingApi.create({
        ...data,
        schoolName: data.schoolName.trim(),
        schoolCode: data.schoolCode.trim().toUpperCase(),
        realmName: inferRealm(data.realmName || data.schoolCode),
        boardAffiliation: data.boardAffiliation.trim(),
        contactEmail: data.contactEmail.trim(),
        contactPhone: data.contactPhone.trim(),
        addressLine: data.addressLine.trim(),
        city: data.city.trim(),
        state: data.state.trim(),
        country: data.country.trim(),
        postalCode: data.postalCode.trim(),
        selectedPlanCode: selectedPlan,
        customDomain: data.customDomain?.trim() || null,
        tagline: data.tagline?.trim() || null,
        latitude: data.latitude ?? null,
        longitude: data.longitude ?? null,
        hasBranches: Boolean(data.hasBranches),
      });
      setSubmitted({
        schoolName: data.schoolName.trim(),
        contactEmail: data.contactEmail.trim(),
        schoolCode: data.schoolCode.trim().toUpperCase(),
        realmName: inferRealm(data.realmName || data.schoolCode),
      });
      setStep(6);
      toast.success('Onboarding request submitted successfully.');
    } catch (submitError: any) {
      const message = submitError?.message || 'Submission failed. Please try again.';
      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  const handleLogoUpload = async (file: File) => {
    if (!data.schoolCode?.trim()) {
      toast.error('Enter a school code before uploading the logo so the asset can be attached correctly.');
      return;
    }
    setLogoUploading(true);
    try {
      const response = await onboardingApi.uploadPublicSchoolLogo(file, data.schoolCode.trim().toUpperCase());
      setData((current) => ({ ...current, logoUrl: response.publicUrl }));
      toast.success('School logo uploaded. You can replace it later inside the school CMS.');
    } catch (uploadError: any) {
      toast.error(uploadError?.message || 'Could not upload the school logo.');
    } finally {
      setLogoUploading(false);
    }
  };

  const sectionStyle: React.CSSProperties = {
    background: 'linear-gradient(180deg, rgba(8,51,68,0.68), rgba(2,6,23,0.96))',
    border: `1px solid ${BORDER}`,
    borderRadius: 24,
    padding: 'clamp(20px, 4vw, 36px)',
    backdropFilter: 'blur(20px)',
    width: '100%',
    maxWidth: 940,
  };

  const reviewRows = [
    ['School', data.schoolName],
    ['School code', data.schoolCode?.toUpperCase()],
    ['Realm', inferRealm(data.realmName || data.schoolCode)],
    ['Routing', data.usePlatformSubdomain ? (data.customDomain?.trim() ? 'Platform subdomain + custom domain' : 'Platform subdomain') : 'Custom domain only'],
    ['Custom domain', data.customDomain || 'Not provided'],
    ['Admin email', data.contactEmail],
    ['Plan', selectedPlan],
    ['Campus', [data.city, data.state, data.country].filter(Boolean).join(', ')],
    ['Branches', data.hasBranches ? 'Multi-branch' : 'Single campus'],
  ];

  return (
    <div style={{ minHeight: '100vh', background: BG, display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '24px 16px 40px', fontFamily: "'Manrope','Inter',system-ui,sans-serif", color: TEXT, position: 'relative', overflow: 'hidden' }}>
      <MotionBackdrop mode="ambient" density={1.04} baseColor={CYAN} />

      <div style={{ width: '100%', maxWidth: 940, marginBottom: 32 }}>
        <button
          onClick={() => (step > 1 && step < 6 ? setStep((current) => current - 1) : navigate('/signup'))}
          style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'none', border: 'none', color: DIM, cursor: 'pointer', fontFamily: 'inherit', fontSize: '0.85rem' }}
        >
          <ArrowLeft size={16} /> {step > 1 && step < 6 ? 'Back' : 'Back to signup'}
        </button>
      </div>

      {step < 6 ? (
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 32, width: '100%', maxWidth: 940, flexWrap: 'wrap' }}>
          {STEPS.map((label, index) => {
            const s = index + 1;
            const done = step > s;
            const active = step === s;
            return (
              <React.Fragment key={s}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{ width: 32, height: 32, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.8rem', fontWeight: 800, background: done ? CYAN : active ? `${CYAN}20` : 'rgba(255,255,255,0.06)', color: done ? '#0b0f14' : active ? CYAN : '#4b5563', border: active ? `1px solid ${CYAN}` : 'none', flexShrink: 0 }}>
                    {done ? <Check size={14} /> : s}
                  </div>
                  <span style={{ fontSize: '0.75rem', fontWeight: 700, color: active ? CYAN : done ? '#94a3b8' : '#4b5563', whiteSpace: 'nowrap' }}>{label}</span>
                </div>
                {s < STEPS.length ? <div style={{ flex: 1, height: 2, background: done ? CYAN : 'rgba(255,255,255,0.08)', borderRadius: 99 }} /> : null}
              </React.Fragment>
            );
          })}
        </div>
      ) : null}

      <AnimatePresence mode="wait">
        {step === 1 ? (
          <motion.div key="s1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} style={sectionStyle}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 24 }}>
              <div style={{ display: 'grid', gap: 18, padding: 20, borderRadius: 22, border: `1px solid ${BORDER}`, background: 'rgba(255,255,255,0.02)' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
                  <div>
                    <div style={{ fontSize: '0.78rem', letterSpacing: '0.14em', textTransform: 'uppercase', fontWeight: 800, color: CYAN }}>School identity</div>
                    <div style={{ fontSize: '1.15rem', fontWeight: 800, color: TEXT, marginTop: 8 }}>Brand, profile, and admin owner</div>
                  </div>
                  <Building2 size={22} color={CYAN} />
                </div>
                <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 160, padding: 12, borderRadius: 18, border: `1px solid ${CYAN}22`, background: 'radial-gradient(circle at top, rgba(34,211,238,0.12), rgba(255,255,255,0.02) 55%)' }}>
                  <SchoolMark school={{ schoolName: data.schoolName || 'Your school identity', schoolCode: data.schoolCode || 'NEW', logoUrl: data.logoUrl || null }} size="lg" />
                </div>
                <p style={{ margin: 0, color: DIM, fontSize: '0.84rem', lineHeight: 1.6 }}>
                  The onboarding flow now captures the same brand and routing metadata the school landing page and sign-in portal will use later.
                </p>
                <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, width: '100%', padding: '16px 18px', borderRadius: 18, border: `1px dashed ${CYAN}66`, background: 'linear-gradient(135deg, rgba(34,211,238,0.12), rgba(255,255,255,0.03))', cursor: logoUploading ? 'not-allowed' : 'pointer', color: '#b6f5ff', fontWeight: 700, boxSizing: 'border-box' }}>
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

              <div style={{ display: 'grid', gap: 18 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <Building2 size={22} color={CYAN} />
                  <h2 style={{ fontSize: '1.4rem', fontWeight: 800, margin: 0 }}>School details</h2>
                </div>
                <p style={{ color: DIM, margin: 0, fontSize: '0.88rem' }}>Capture the core identity that the admin CMS, tenant routing, and public landing page will share.</p>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 18 }}>
                  <Field label="School name *">
                    <input value={data.schoolName} onChange={(event) => up('schoolName', event.target.value)} placeholder="Global Tech Academy" style={inp()} />
                  </Field>
                  <Field label="School code *" hint="Used for activation and initial tenant creation.">
                    <input value={data.schoolCode} onChange={(event) => up('schoolCode', event.target.value.toUpperCase())} placeholder="GTA01" style={inp()} />
                  </Field>
                  <Field label="Realm name *" hint="This becomes the default school subdomain slug.">
                    <input value={data.realmName || ''} onChange={(event) => up('realmName', inferRealm(event.target.value))} placeholder="global-tech-academy" style={inp()} />
                  </Field>
                  <Field label="Board affiliation">
                    <select value={data.boardAffiliation} onChange={(event) => up('boardAffiliation', event.target.value)} style={inp({ appearance: 'none' })}>
                      {['CBSE', 'ICSE', 'State Board', 'IB', 'Cambridge'].map((board) => <option key={board} value={board}>{board}</option>)}
                    </select>
                  </Field>
                  <Field label="Primary admin email *">
                    <input type="email" value={data.contactEmail} onChange={(event) => up('contactEmail', event.target.value)} placeholder="admin@academy.edu" style={inp()} />
                  </Field>
                  <Field label="Contact phone *">
                    <input value={data.contactPhone} onChange={(event) => up('contactPhone', event.target.value)} placeholder="+91 9876543210" style={inp()} />
                  </Field>
                  <Field label="Hero tagline" hint="Shown across the branded sign-in and public landing experience.">
                    <input value={data.tagline || ''} onChange={(event) => up('tagline', event.target.value)} placeholder="Future-ready learning with strong values" style={inp()} />
                  </Field>
                  <Field label="Branch model">
                    <select value={data.hasBranches ? 'yes' : 'no'} onChange={(event) => up('hasBranches', event.target.value === 'yes')} style={inp({ appearance: 'none' })}>
                      <option value="no">Single campus</option>
                      <option value="yes">Multiple branches</option>
                    </select>
                  </Field>
                </div>
              </div>
            </div>
          </motion.div>
        ) : null}

        {step === 2 ? (
          <motion.div key="s2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} style={sectionStyle}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
              <MapPin size={22} color={VIOLET} />
              <h2 style={{ fontSize: '1.4rem', fontWeight: 800, margin: 0 }}>Campus and contact details</h2>
            </div>
            <p style={{ color: DIM, marginBottom: 28, fontSize: '0.88rem' }}>These details feed the public map block, contact page, and branch routing cards later.</p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 20 }}>
              <div style={{ gridColumn: '1 / -1' }}>
                <Field label="Address line *">
                  <input value={data.addressLine} onChange={(event) => up('addressLine', event.target.value)} placeholder="123 Innovation Drive" style={inp()} />
                </Field>
              </div>
              <Field label="City *">
                <input value={data.city} onChange={(event) => up('city', event.target.value)} placeholder="Mumbai" style={inp()} />
              </Field>
              <Field label="State *">
                <input value={data.state} onChange={(event) => up('state', event.target.value)} placeholder="Maharashtra" style={inp()} />
              </Field>
              <Field label="Postal code *">
                <input value={data.postalCode} onChange={(event) => up('postalCode', event.target.value)} placeholder="400001" style={inp()} />
              </Field>
              <Field label="Country *">
                <input value={data.country} onChange={(event) => up('country', event.target.value)} placeholder="India" style={inp()} />
              </Field>
              <Field label="Latitude" hint="Optional, but useful for the map embed and branch marker defaults.">
                <input value={data.latitude ?? ''} onChange={(event) => up('latitude', event.target.value ? Number(event.target.value) : null)} placeholder="19.0760" style={inp()} />
              </Field>
              <Field label="Longitude">
                <input value={data.longitude ?? ''} onChange={(event) => up('longitude', event.target.value ? Number(event.target.value) : null)} placeholder="72.8777" style={inp()} />
              </Field>
            </div>
          </motion.div>
        ) : null}

        {step === 3 ? (
          <motion.div key="s3" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} style={sectionStyle}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
              <Globe2 size={22} color={CYAN} />
              <h2 style={{ fontSize: '1.4rem', fontWeight: 800, margin: 0 }}>Routing and public access</h2>
            </div>
            <p style={{ color: DIM, marginBottom: 28, fontSize: '0.88rem' }}>Set the initial subdomain strategy now so activation, sign-in, and public landing pages remain consistent.</p>
            <div style={{ display: 'grid', gap: 18, gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))' }}>
              <div style={{ padding: 20, borderRadius: 20, border: `1px solid ${CYAN}44`, background: 'rgba(34,211,238,0.08)', display: 'grid', gap: 12 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ color: TEXT, fontWeight: 800 }}>Platform subdomain</div>
                  <ShieldCheck size={18} color={CYAN} />
                </div>
                <div style={{ color: '#b6f5ff', fontWeight: 800 }}>{tenantPreview}</div>
                <div style={{ color: DIM, lineHeight: 1.6, fontSize: '0.84rem' }}>Recommended for launch. This works immediately on localhost and maps directly to the school-specific sign-in and landing page module.</div>
                <label style={{ display: 'inline-flex', alignItems: 'center', gap: 10, color: TEXT, fontWeight: 700 }}>
                  <input type="checkbox" checked={Boolean(data.usePlatformSubdomain)} onChange={(event) => up('usePlatformSubdomain', event.target.checked)} />
                  Enable platform subdomain
                </label>
              </div>
              <div style={{ padding: 20, borderRadius: 20, border: `1px solid ${BORDER}`, background: 'rgba(255,255,255,0.03)', display: 'grid', gap: 12 }}>
                <div style={{ color: TEXT, fontWeight: 800 }}>Custom domain</div>
                <Field label="Primary custom domain" hint="Optional during onboarding. DNS and SSL can be finalized later from the routing dashboard.">
                  <input value={data.customDomain || ''} onChange={(event) => up('customDomain', event.target.value)} placeholder="school.example.edu" style={inp()} />
                </Field>
                <div style={{ padding: 14, borderRadius: 16, background: 'rgba(255,182,99,0.08)', border: '1px solid rgba(255,182,99,0.18)', color: '#ffd8b1', fontSize: '0.82rem', lineHeight: 1.6 }}>
                  DNS instructions, verification token, and canonical domain switching are available after provisioning inside the dedicated routing admin page.
                </div>
              </div>
            </div>
          </motion.div>
        ) : null}

        {step === 4 ? (
          <motion.div key="s4" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} style={sectionStyle}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
              <CreditCard size={22} color={AMBER} />
              <h2 style={{ fontSize: '1.4rem', fontWeight: 800, margin: 0 }}>Select a plan</h2>
            </div>
            <p style={{ color: DIM, marginBottom: 28, fontSize: '0.88rem' }}>Choose the operational tier that unlocks the modules you need at launch.</p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16 }}>
              {plans.map((plan) => (
                <div key={plan.id} onClick={() => setSelectedPlan(plan.id as 'FREE' | 'BASIC' | 'PREMIUM')} style={{ padding: '24px 20px', borderRadius: 20, border: `1px solid ${selectedPlan === plan.id ? `${plan.color}60` : BORDER}`, background: selectedPlan === plan.id ? plan.glow : 'rgba(255,255,255,0.02)', cursor: 'pointer', transition: 'all 0.2s', position: 'relative', display: 'flex', flexDirection: 'column', gap: 16 }}>
                  {plan.popular ? <div style={{ position: 'absolute', top: -12, left: '50%', transform: 'translateX(-50%)', padding: '3px 14px', borderRadius: 99, background: CYAN, color: '#0b0f14', fontSize: '0.68rem', fontWeight: 800, whiteSpace: 'nowrap' }}>MOST POPULAR</div> : null}
                  <div>
                    <div style={{ fontWeight: 800, fontSize: '1.1rem', color: plan.color, marginBottom: 4 }}>{plan.label}</div>
                    <div style={{ fontSize: '1.3rem', fontWeight: 900, color: TEXT }}>{plan.price}</div>
                  </div>
                  <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'grid', gap: 8 }}>
                    {plan.features.map((feature) => (
                      <li key={feature} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.8rem', color: '#94a3b8' }}>
                        <Check size={13} color={plan.color} /> {feature}
                      </li>
                    ))}
                  </ul>
                  {selectedPlan === plan.id ? <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: plan.color, fontSize: '0.78rem', fontWeight: 800 }}><CheckCircle2 size={14} /> Selected</div> : null}
                </div>
              ))}
            </div>
          </motion.div>
        ) : null}

        {step === 5 ? (
          <motion.div key="s5" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} style={sectionStyle}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
              <Sparkles size={22} color={CYAN} />
              <h2 style={{ fontSize: '1.4rem', fontWeight: 800, margin: 0 }}>Review and submit</h2>
            </div>
            <p style={{ color: DIM, marginBottom: 24, fontSize: '0.88rem' }}>Confirm the launch configuration before we create the onboarding record and tenant activation path.</p>
            <div style={{ display: 'grid', gap: 10, marginBottom: 24 }}>
              {reviewRows.map(([label, value]) => (
                <div key={label} style={{ display: 'flex', justifyContent: 'space-between', gap: 20, padding: '10px 0', borderBottom: `1px solid ${BORDER}` }}>
                  <span style={{ color: DIM, fontSize: '0.85rem' }}>{label}</span>
                  <span style={{ fontWeight: 700, fontSize: '0.85rem', color: TEXT, textAlign: 'right' }}>{value || '-'}</span>
                </div>
              ))}
            </div>
            <div style={{ display: 'grid', gap: 14, gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', marginBottom: 20 }}>
              <div style={{ padding: 16, borderRadius: 18, background: 'rgba(34,211,238,0.08)', border: '1px solid rgba(34,211,238,0.2)' }}>
                <div style={{ color: CYAN, fontSize: '0.74rem', textTransform: 'uppercase', letterSpacing: '0.12em', fontWeight: 800 }}>Tenant preview</div>
                <div style={{ marginTop: 8, color: TEXT, fontWeight: 800 }}>{tenantPreview}</div>
              </div>
              <div style={{ padding: 16, borderRadius: 18, background: 'rgba(255,182,99,0.08)', border: '1px solid rgba(255,182,99,0.18)' }}>
                <div style={{ color: AMBER, fontSize: '0.74rem', textTransform: 'uppercase', letterSpacing: '0.12em', fontWeight: 800 }}>Activation readiness</div>
                <div style={{ marginTop: 8, color: TEXT, fontWeight: 800 }}>Admin activation email + branded sign-in</div>
              </div>
            </div>
            {error ? <div style={{ marginBottom: 16, display: 'flex', gap: 8, color: '#fb7185', fontSize: '0.82rem', padding: '10px 14px', borderRadius: 10, background: 'rgba(244,63,94,0.1)', border: '1px solid rgba(244,63,94,0.25)', alignItems: 'center' }}><AlertCircle size={14} />{error}</div> : null}
            <button onClick={handleNext} disabled={loading} style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, padding: '14px', borderRadius: 14, background: loading ? '#374151' : `linear-gradient(135deg, #0e7490, ${CYAN})`, border: 'none', color: loading ? '#9ca3af' : '#0b0f14', fontWeight: 800, cursor: loading ? 'not-allowed' : 'pointer', fontFamily: 'inherit' }}>
              {loading ? <><Loader size={18} style={{ animation: 'spin 1s linear infinite' }} /> Submitting...</> : <><Sparkles size={18} /> Submit registration</>}
            </button>
          </motion.div>
        ) : null}

        {step === 6 && submitted ? (
          <motion.div key="s6" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} style={{ ...sectionStyle, textAlign: 'center', padding: '56px 36px' }}>
            <div style={{ width: 80, height: 80, borderRadius: '50%', background: 'linear-gradient(135deg, #059669, #34d399)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 28px', boxShadow: '0 0 48px rgba(52,211,153,0.4)' }}>
              <CheckCircle2 size={40} color="#fff" />
            </div>
            <h2 style={{ fontSize: '1.8rem', fontWeight: 900, marginBottom: 12 }}>Application submitted</h2>
            <p style={{ color: DIM, fontSize: '0.92rem', lineHeight: 1.7, maxWidth: 560, margin: '0 auto 24px' }}>
              Your registration for <strong style={{ color: TEXT }}>{submitted.schoolName}</strong> is now in the platform review queue with a tenant-ready routing configuration.
            </p>
            <div style={{ display: 'grid', gap: 14, margin: '0 auto 28px', maxWidth: 640, textAlign: 'left' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '14px 18px', borderRadius: 16, background: 'rgba(6,182,212,0.08)', border: '1px solid rgba(6,182,212,0.18)', color: '#67e8f9', fontSize: '0.85rem' }}>
                <Info size={18} style={{ flexShrink: 0 }} />
                Watch <strong>{submitted.contactEmail}</strong> for your activation code and provisioning status.
              </div>
              <div style={{ display: 'grid', gap: 12, gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))' }}>
                <div style={{ padding: 16, borderRadius: 18, background: 'rgba(255,255,255,0.04)', border: `1px solid ${BORDER}` }}>
                  <div style={{ color: '#8ba1b3', fontSize: '0.74rem', textTransform: 'uppercase', letterSpacing: '0.12em', fontWeight: 800 }}>School code</div>
                  <div style={{ color: TEXT, fontWeight: 900, marginTop: 8 }}>{submitted.schoolCode}</div>
                </div>
                <div style={{ padding: 16, borderRadius: 18, background: 'rgba(255,255,255,0.04)', border: `1px solid ${BORDER}` }}>
                  <div style={{ color: '#8ba1b3', fontSize: '0.74rem', textTransform: 'uppercase', letterSpacing: '0.12em', fontWeight: 800 }}>Realm</div>
                  <div style={{ color: TEXT, fontWeight: 900, marginTop: 8 }}>{submitted.realmName}</div>
                </div>
                <div style={{ padding: 16, borderRadius: 18, background: 'rgba(255,255,255,0.04)', border: `1px solid ${BORDER}` }}>
                  <div style={{ color: '#8ba1b3', fontSize: '0.74rem', textTransform: 'uppercase', letterSpacing: '0.12em', fontWeight: 800 }}>Preview host</div>
                  <div style={{ color: TEXT, fontWeight: 900, marginTop: 8, wordBreak: 'break-word' }}>{submitted.realmName}.{baseHost}</div>
                </div>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
              <button onClick={() => navigate('/activate')} style={{ padding: '12px 24px', borderRadius: 14, background: `linear-gradient(135deg, #0e7490, ${CYAN})`, border: 'none', color: '#0b0f14', fontWeight: 800, cursor: 'pointer', fontFamily: 'inherit' }}>
                Continue to activation
              </button>
              <button onClick={() => navigate('/login')} style={{ padding: '12px 24px', borderRadius: 14, background: 'rgba(255,255,255,0.08)', border: `1px solid ${BORDER}`, color: TEXT, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>
                Back to sign in
              </button>
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>

      {step < 5 ? (
        <div style={{ display: 'flex', justifyContent: 'flex-end', width: '100%', maxWidth: 940, marginTop: 24 }}>
          <button onClick={handleNext} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, padding: '12px 28px', borderRadius: 14, background: step === 2 ? VIOLET : step === 4 ? '#d97706' : CYAN, border: 'none', color: step === 2 ? '#fff' : '#0b0f14', fontWeight: 800, cursor: 'pointer', fontFamily: 'inherit', width: 'min(100%, 260px)' }}>
            {step === 5 ? 'Submit registration' : 'Continue'} <ArrowRight size={18} />
          </button>
        </div>
      ) : null}

      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
