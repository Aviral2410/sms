import React, { useEffect, useMemo, useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { AlertCircle, ArrowRight, Building2, Loader, Lock, Mail, MapPin, ShieldCheck, Sparkles } from 'lucide-react';
import { PublicPageShell } from '../components/public/PublicPageShell';
import { PublicField } from '../components/public/PublicField';
import { PublicPretextHeading } from '../components/public/PublicPretextHeading';
import { SchoolMark } from '../components/public/SchoolMark';
import { getSchoolContext } from '../lib/subdomain';
import { authApi, schoolOpsApi, type PublicSchoolProfileResponse } from '../lib/api';
import { publicSchoolCmsApi, type SchoolLandingPagePayload } from '../lib/schoolPortalApi';
import { useStore } from '../store/useStore';

const AMBER = '#ffb663';
const CYAN = '#22d3ee';

export default function SchoolPortalLoginPage() {
  const navigate = useNavigate();
  const { session, setSession } = useStore();
  const { schoolCode } = getSchoolContext();
  const [landing, setLanding] = useState<SchoolLandingPagePayload | null>(null);
  const [branding, setBranding] = useState<PublicSchoolProfileResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [pageError, setPageError] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [authError, setAuthError] = useState('');
  const [authLoading, setAuthLoading] = useState(false);

  useEffect(() => {
    let active = true;

    if (!schoolCode) {
      setPageError('This school portal does not have a valid school code.');
      setLoading(false);
      return;
    }

    Promise.allSettled([
      publicSchoolCmsApi.getLandingPage(schoolCode),
      schoolOpsApi.getPublicProfile(schoolCode),
    ])
      .then((results) => {
        if (!active) return;

        const [landingResult, brandingResult] = results;

        if (landingResult.status === 'fulfilled') {
          setLanding(landingResult.value);
        }

        if (brandingResult.status === 'fulfilled') {
          setBranding(brandingResult.value);
        }

        if (landingResult.status === 'rejected' && brandingResult.status === 'rejected') {
          setPageError('This school portal is unavailable or has not been activated yet.');
        } else {
          setPageError('');
        }
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [schoolCode]);

  const schoolName = useMemo(
    () => landing?.profile?.schoolName || branding?.schoolName || schoolCode || 'School portal',
    [branding?.schoolName, landing?.profile?.schoolName, schoolCode],
  );
  const heroCopy = landing?.profile?.shortDescription || landing?.profile?.tagline || branding?.vision || 'Continue into your school workspace with the right tenant context already resolved.';
  const locationText = [landing?.profile?.city || branding?.city, landing?.profile?.state || branding?.state].filter(Boolean).join(', ');

  const handleLogin = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!schoolCode || !email.trim() || !password) {
      setAuthError('Enter your school email and password to continue.');
      return;
    }

    setAuthLoading(true);
    setAuthError('');
    try {
      const result = await authApi.schoolLogin({
        schoolCode: schoolCode.toUpperCase(),
        email: email.trim(),
        password,
      });
      setSession({
        userId: result.userId,
        role: result.role,
        email: result.email,
        fullName: result.fullName,
        schoolId: result.schoolId,
        schoolCode: result.schoolCode,
        schoolName: result.schoolName,
        tenantId: result.tenantId,
        token: result.token,
      });
      navigate('/dashboard');
    } catch (error: any) {
      setAuthError(error?.message || 'Sign-in failed for this school portal.');
    } finally {
      setAuthLoading(false);
    }
  };

  if (session.email) {
    return <Navigate to="/dashboard" replace />;
  }

  if (loading) {
    return (
      <PublicPageShell mode="hero" density={1.12} centered contentWidth={980}>
        <div className="public-panel--strong" style={{ minWidth: 320, padding: 28, display: 'flex', alignItems: 'center', gap: 12 }}>
          <Loader size={18} className="animate-spin" />
          Loading school portal...
        </div>
      </PublicPageShell>
    );
  }

  if (pageError) {
    return (
      <PublicPageShell mode="hero" density={1.1} centered contentWidth={900}>
        <div className="public-panel--strong" style={{ maxWidth: 760, padding: 32, display: 'grid', gap: 18, textAlign: 'center' }}>
          <div className="public-status-chip" style={{ justifySelf: 'center', color: '#fda4af', borderColor: 'rgba(244,63,94,0.25)' }}>
            <AlertCircle size={16} />
            Tenant unavailable
          </div>
          <h1 className="public-title" style={{ fontSize: 'clamp(2rem, 4vw, 3rem)' }}>School portal not available</h1>
          <p className="public-muted" style={{ margin: 0 }}>{pageError}</p>
          <div style={{ display: 'flex', justifyContent: 'center', gap: 12, flexWrap: 'wrap' }}>
            <Link to="/" className="public-secondary-button">Return to platform</Link>
            <Link to="/join" className="public-primary-button">
              Join with school code
              <ArrowRight size={16} />
            </Link>
          </div>
        </div>
      </PublicPageShell>
    );
  }

  return (
    <PublicPageShell mode="hero" density={1.16} contentWidth={1260}>
      <div className="public-site-section" style={{ minHeight: '100vh', display: 'grid', alignItems: 'center' }}>
        <div className="public-site-hero" style={{ alignItems: 'stretch' }}>
          <section className="public-panel--strong" style={{ padding: 'clamp(28px, 4vw, 42px)', display: 'grid', gap: 24 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
              <SchoolMark school={{ schoolName, schoolCode: schoolCode?.toUpperCase() || undefined, logoUrl: branding?.logoUrl || undefined }} size="lg" />
              <div>
                <div className="public-status-chip" style={{ color: CYAN, borderColor: 'rgba(34,211,238,0.28)', marginBottom: 12 }}>
                  <ShieldCheck size={14} />
                  Tenant-aware sign-in
                </div>
                <div className="public-title" style={{ fontSize: '1.3rem', fontWeight: 900 }}>{schoolName}</div>
                <div className="public-muted" style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 6 }}>
                  <Building2 size={15} />
                  {schoolCode?.toUpperCase()}
                  {locationText ? (
                    <>
                      <span style={{ opacity: 0.4 }}>•</span>
                      <MapPin size={15} />
                      {locationText}
                    </>
                  ) : null}
                </div>
              </div>
            </div>

            <PublicPretextHeading
              eyebrow={landing?.profile?.tagline || 'School Portal'}
              pretext="Access"
              title={`Sign in to ${schoolName}`}
              description={heroCopy}
              effect="flow"
              accentColor={AMBER}
            />

            <div className="public-grid-3">
              <div className="public-soft-card" style={{ padding: 18 }}>
                <div className="public-site-hero__visual-label">School context</div>
                <p className="public-muted" style={{ margin: '8px 0 0' }}>
                  Your domain already resolves to this institution, so users do not need to re-enter a school code.
                </p>
              </div>
              <div className="public-soft-card" style={{ padding: 18 }}>
                <div className="public-site-hero__visual-label">Branded experience</div>
                <p className="public-muted" style={{ margin: '8px 0 0' }}>
                  Public content, admissions, events, and dashboard access stay anchored to the same school identity.
                </p>
              </div>
              <div className="public-soft-card" style={{ padding: 18 }}>
                <div className="public-site-hero__visual-label">Quick paths</div>
                <p className="public-muted" style={{ margin: '8px 0 0' }}>
                  Need activation or first-time access? Start from the same tenant-aware flow without leaving this portal.
                </p>
              </div>
            </div>

            <div className="public-site-hero__actions">
              <Link to="/" className="public-secondary-button public-secondary-button--hero">View school site</Link>
              <Link to="/activate" className="public-primary-button public-primary-button--hero">
                Activate account
                <ArrowRight size={16} />
              </Link>
            </div>
          </section>

          <section className="public-panel" style={{ padding: 'clamp(24px, 4vw, 36px)', display: 'grid', gap: 20 }}>
            <div>
              <div className="public-status-chip" style={{ color: AMBER, borderColor: 'rgba(255,182,99,0.25)', marginBottom: 12 }}>
                <Sparkles size={14} />
                Secure entry
              </div>
              <h2 className="public-title" style={{ fontSize: 'clamp(1.8rem, 3vw, 2.4rem)', marginBottom: 8 }}>School workspace sign-in</h2>
              <p className="public-muted" style={{ margin: 0 }}>
                Continue with your school email. This sign-in is scoped to <strong style={{ color: 'var(--public-text-main)' }}>{schoolCode?.toUpperCase()}</strong>.
              </p>
            </div>

            <form onSubmit={handleLogin} style={{ display: 'grid', gap: 16 }}>
              <PublicField label="School Code" icon={Building2} accent={AMBER} readOnly value={schoolCode?.toUpperCase() || ''} />
              <PublicField
                label="Email"
                icon={Mail}
                accent={CYAN}
                type="email"
                placeholder="name@school.edu"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
              />
              <PublicField
                label="Password"
                icon={Lock}
                accent={AMBER}
                type="password"
                placeholder="Enter your password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
              />

              {authError ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '12px 14px', borderRadius: 16, background: 'rgba(244,63,94,0.1)', border: '1px solid rgba(244,63,94,0.18)', color: '#fda4af' }}>
                  <AlertCircle size={16} />
                  {authError}
                </div>
              ) : null}

              <button type="submit" className="public-primary-button" disabled={authLoading}>
                {authLoading ? (
                  <>
                    <Loader size={16} className="animate-spin" />
                    Signing in...
                  </>
                ) : (
                  <>
                    Access dashboard
                    <ArrowRight size={16} />
                  </>
                )}
              </button>
            </form>

            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
              <Link to="/forgot-password" className="public-ghost-button">Forgot password?</Link>
              <Link to="/join" className="public-ghost-button">Join with school code</Link>
            </div>
          </section>
        </div>
      </div>
    </PublicPageShell>
  );
}
