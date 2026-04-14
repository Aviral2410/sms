import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  Award,
  BookOpen,
  Building2,
  CalendarDays,
  CheckCircle2,
  ChevronRight,
  Compass,
  GraduationCap,
  Image as ImageIcon,
  Loader,
  Mail,
  MapPin,
  Menu,
  Phone,
  Quote,
  ShieldCheck,
  Sparkles,
  Star,
  Trophy,
  X,
} from 'lucide-react';
import { FallbackImage } from '../components/ui/FallbackImage';
import { HoverTiltCard } from '../components/public/HoverTiltCard';
import { PublicPageShell } from '../components/public/PublicPageShell';
import { PublicPretextFlowText } from '../components/public/PublicPretextFlowText';
import { PublicPretextHeading } from '../components/public/PublicPretextHeading';
import { ScrollReveal } from '../components/public/ScrollReveal';
import { SchoolMark } from '../components/public/SchoolMark';
import { schoolOpsApi, type PublicSchoolProfileResponse } from '../lib/api';
import {
  publicSchoolCmsApi,
  type NewsletterSubscribeRequest,
  type SchoolAchievement,
  type SchoolEvent,
  type SchoolFeeStructure,
  type SchoolGalleryMedia,
  type SchoolLandingPagePayload,
  type SchoolSectionConfig,
  type SchoolSocialLink,
} from '../lib/schoolPortalApi';
import { getSchoolContext } from '../lib/subdomain';
import { useStore } from '../store/useStore';

const AMBER = '#ffb663';
const CYAN = '#22d3ee';
const VIOLET = '#a78bfa';
const ROSE = '#fb7185';

type SchoolPortalLandingPageProps = {
  initialSection?: string;
};

type NavLink = {
  id: string;
  label: string;
};

function assetUrl(mediaId?: string | null) {
  return mediaId ? `/api/v1/public/media/${encodeURIComponent(mediaId)}` : '';
}

function stripHtml(value?: string | null) {
  if (!value) return '';
  return value.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
}

function visibleSection(configs: SchoolSectionConfig[], sectionKey: string) {
  const config = configs.find((item) => item.sectionKey === sectionKey);
  return config?.isEnabled ?? true;
}

function formatDateLabel(value?: string | null) {
  if (!value) return 'Date to be announced';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString('en-IN', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

function parseFeeRows(item: SchoolFeeStructure) {
  if (!item.structuredDataJson) return [];
  try {
    const parsed = JSON.parse(item.structuredDataJson);
    if (Array.isArray(parsed)) return parsed.filter(Boolean);
    if (Array.isArray(parsed?.rows)) return parsed.rows.filter(Boolean);
  } catch {
    return [];
  }
  return [];
}

function socialLabel(link: SchoolSocialLink) {
  return link.platform.replace(/[_-]/g, ' ');
}

function scrollToSection(sectionId: string) {
  document.getElementById(sectionId)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function featureCopy(landing: SchoolLandingPagePayload | null) {
  return [
    {
      label: 'Academic excellence',
      value: landing?.academicContent?.curriculum ? 'Curriculum-led pathways' : 'Structured academic pathways',
      accent: CYAN,
    },
    {
      label: 'Admissions',
      value: landing?.admissionInfo?.overview ? 'Application guidance is live' : 'Admission assistance ready',
      accent: AMBER,
    },
    {
      label: 'Campus experience',
      value: landing?.infrastructure?.length ? `${landing.infrastructure.length} curated campus highlights` : 'Campus showcase coming soon',
      accent: VIOLET,
    },
  ];
}

export default function SchoolPortalLandingPage({ initialSection }: SchoolPortalLandingPageProps) {
  const { schoolCode } = getSchoolContext();
  const { session } = useStore();
  const [landing, setLanding] = useState<SchoolLandingPagePayload | null>(null);
  const [branding, setBranding] = useState<PublicSchoolProfileResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [pageError, setPageError] = useState('');
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [newsletterEmail, setNewsletterEmail] = useState('');
  const [newsletterLoading, setNewsletterLoading] = useState(false);
  const [newsletterMessage, setNewsletterMessage] = useState('');
  const [enquiry, setEnquiry] = useState({
    studentName: '',
    parentName: '',
    phone: '',
    email: '',
    classInterested: '',
    message: '',
  });
  const [enquiryLoading, setEnquiryLoading] = useState(false);
  const [enquiryMessage, setEnquiryMessage] = useState('');

  useEffect(() => {
    let active = true;

    if (!schoolCode) {
      setPageError('This school portal does not have a valid tenant context.');
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
        if (landingResult.status === 'fulfilled') setLanding(landingResult.value);
        if (brandingResult.status === 'fulfilled') setBranding(brandingResult.value);
        if (landingResult.status === 'rejected' && brandingResult.status === 'rejected') {
          setPageError('This school code is inactive, unpublished, or unavailable.');
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

  useEffect(() => {
    if (!landing || !initialSection) return;
    const timer = window.setTimeout(() => scrollToSection(initialSection), 180);
    return () => window.clearTimeout(timer);
  }, [initialSection, landing]);

  const profile = landing?.profile;
  const schoolName = profile?.schoolName || branding?.schoolName || schoolCode || 'School portal';
  const coverImage =
    assetUrl(landing?.albums?.[0]?.coverMediaId) ||
    assetUrl(landing?.albums?.[0]?.mediaItems?.[0]?.mediaId) ||
    '/hero.png';

  const galleryMedia = useMemo(
    () => (landing?.albums || []).flatMap((album) => album.mediaItems || []).slice(0, 8),
    [landing?.albums],
  );

  const events = useMemo(
    () => [...(landing?.upcomingEvents || [])].sort((a, b) => new Date(a.startAt || 0).getTime() - new Date(b.startAt || 0).getTime()),
    [landing?.upcomingEvents],
  );
  const featuredEvent = events[0];
  const supportingEvents = events.slice(1, 4);

  const navLinks: NavLink[] = useMemo(
    () => [
      { id: 'home', label: 'Home' },
      { id: 'about', label: 'About' },
      { id: 'academics', label: 'Academics' },
      { id: 'admissions', label: 'Admissions' },
      { id: 'campus', label: 'Campus Life' },
      { id: 'events', label: 'Events' },
      { id: 'contact', label: 'Contact' },
    ],
    [],
  );

  const handlePortalLogin = () => {
    window.location.href = '/login';
  };

  const handleQuickAdminSignIn = async () => {
    if (session.email) return;
    handlePortalLogin();
  };

  const handleNewsletterSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!schoolCode || !newsletterEmail.trim()) {
      setNewsletterMessage('Enter an email address to subscribe.');
      return;
    }
    setNewsletterLoading(true);
    setNewsletterMessage('');
    try {
      const payload: NewsletterSubscribeRequest = { email: newsletterEmail.trim() };
      const response = await publicSchoolCmsApi.subscribeNewsletter(schoolCode, payload);
      setNewsletterEmail('');
      setNewsletterMessage(`Subscribed ${response.email} for school updates.`);
    } catch (error: any) {
      setNewsletterMessage(error?.message || 'Newsletter subscription failed.');
    } finally {
      setNewsletterLoading(false);
    }
  };

  const handleEnquirySubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!schoolCode || !enquiry.parentName.trim() || !enquiry.phone.trim()) {
      setEnquiryMessage('Parent name and phone are required.');
      return;
    }
    setEnquiryLoading(true);
    setEnquiryMessage('');
    try {
      await publicSchoolCmsApi.submitEnquiry(schoolCode, {
        type: 'ADMISSION',
        source: 'PUBLIC_SITE',
        ...enquiry,
      });
      setEnquiry({
        studentName: '',
        parentName: '',
        phone: '',
        email: '',
        classInterested: '',
        message: '',
      });
      setEnquiryMessage('Enquiry submitted successfully. The admissions team will reach out soon.');
    } catch (error: any) {
      setEnquiryMessage(error?.message || 'Unable to submit your enquiry right now.');
    } finally {
      setEnquiryLoading(false);
    }
  };

  if (loading) {
    return (
      <PublicPageShell mode="hero" density={1.14} centered contentWidth={980}>
        <div className="public-panel--strong" style={{ padding: 28, display: 'flex', alignItems: 'center', gap: 12 }}>
          <Loader size={18} className="animate-spin" />
          Loading school experience...
        </div>
      </PublicPageShell>
    );
  }

  if (pageError || !schoolCode) {
    return (
      <PublicPageShell mode="hero" density={1.1} centered contentWidth={900}>
        <div className="public-panel--strong" style={{ maxWidth: 760, padding: 32, display: 'grid', gap: 18, textAlign: 'center' }}>
          <div className="public-status-chip" style={{ justifySelf: 'center', color: '#fda4af', borderColor: 'rgba(244,63,94,0.25)' }}>
            <ShieldCheck size={16} />
            Invalid school portal
          </div>
          <h1 className="public-title" style={{ fontSize: 'clamp(2rem, 4vw, 3rem)' }}>School site not available</h1>
          <p className="public-muted" style={{ margin: 0 }}>{pageError || 'No tenant context was detected for this school portal.'}</p>
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
    <PublicPageShell mode="hero" density={1.18} showOrbs textStream flareTrail contentWidth={1440}>
      <div className="public-site-frame">
        <nav className={`public-site-nav${mobileNavOpen ? ' is-open' : ''}`}>
          <button type="button" className="public-site-nav__brand" onClick={() => scrollToSection('home')} style={{ background: 'none', border: 'none', padding: 0 }}>
            <SchoolMark school={{ schoolName, schoolCode: schoolCode.toUpperCase(), logoUrl: branding?.logoUrl || undefined }} />
            <span>{schoolName}</span>
          </button>

          <div className="public-site-nav__links">
            {navLinks.map((item) => (
              <button key={item.id} type="button" className="public-site-nav__link" onClick={() => scrollToSection(item.id)} style={{ background: 'none', border: 'none' }}>
                {item.label}
              </button>
            ))}
          </div>

          <div className="public-site-nav__actions">
            <Link to="/login" className="public-ghost-button public-site-nav__ghost">Sign In</Link>
            <button type="button" className="public-primary-button public-site-nav__cta" onClick={() => scrollToSection('admissions')}>
              Admission Enquiry
              <ArrowRight size={16} />
            </button>
            <button
              type="button"
              className="public-site-nav__menu"
              aria-label={mobileNavOpen ? 'Close navigation menu' : 'Open navigation menu'}
              onClick={() => setMobileNavOpen((current) => !current)}
            >
              {mobileNavOpen ? <X size={18} /> : <Menu size={18} />}
            </button>
          </div>

          <div className={`public-site-nav__mobile${mobileNavOpen ? ' is-open' : ''}`}>
            {navLinks.map((item) => (
              <button
                key={item.id}
                type="button"
                className="public-site-nav__mobile-link"
                style={{ border: 'none' }}
                onClick={() => {
                  setMobileNavOpen(false);
                  scrollToSection(item.id);
                }}
              >
                {item.label}
              </button>
            ))}
            <div className="public-site-nav__mobile-actions">
              <Link to="/login" className="public-secondary-button" onClick={() => setMobileNavOpen(false)}>Sign In</Link>
              <button
                type="button"
                className="public-primary-button"
                onClick={() => {
                  setMobileNavOpen(false);
                  scrollToSection('admissions');
                }}
              >
                Admission Enquiry
                <ArrowRight size={16} />
              </button>
            </div>
          </div>
        </nav>

        <main className="public-site-frame__body">
          <section id="home" className="public-site-section" style={{ paddingTop: 132 }}>
            <div className="public-site-hero">
              <div className="public-site-hero__content">
                <ScrollReveal>
                  <div className="public-status-chip" style={{ color: CYAN, borderColor: 'rgba(34,211,238,0.25)' }}>
                    <Sparkles size={14} />
                    {profile?.tagline || 'A modern school experience'}
                  </div>
                </ScrollReveal>

                <ScrollReveal delay={0.06}>
                  <PublicPretextHeading
                    eyebrow={schoolCode.toUpperCase()}
                    pretext="School Site"
                    title={profile?.shortName ? `${profile.shortName} School Portal` : schoolName}
                    description={profile?.shortDescription || branding?.vision || 'Admissions, campus life, academic excellence, and parent-ready communication all live inside one consistent school experience.'}
                    effect="flow"
                    accentColor={AMBER}
                  />
                </ScrollReveal>

                <ScrollReveal delay={0.1}>
                  <div className="public-site-hero__actions">
                    <button type="button" className="public-primary-button public-primary-button--hero" onClick={() => scrollToSection('admissions')}>
                      Apply for admission
                      <ArrowRight size={16} />
                    </button>
                    <button type="button" className="public-secondary-button public-secondary-button--hero" onClick={() => scrollToSection('contact')}>
                      Visit campus
                    </button>
                  </div>
                </ScrollReveal>

                <div className="public-grid-3">
                  {featureCopy(landing).map((item) => (
                    <div key={item.label} className="public-soft-card" style={{ padding: 18 }}>
                      <div className="public-site-hero__visual-label" style={{ color: item.accent }}>{item.label}</div>
                      <p className="public-muted" style={{ margin: '10px 0 0' }}>{item.value}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="public-site-hero__visual">
                <div className="public-site-hero__visual-card">
                  <div className="public-site-hero__visual-media">
                    <FallbackImage
                      src={coverImage}
                      fallbackSrc="/school_facade.png"
                      alt={`${schoolName} campus`}
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                  </div>
                  <div className="public-site-hero__visual-stack">
                    <div className="public-soft-card public-site-stat-card--deep" style={{ padding: 18 }}>
                      <div className="public-site-hero__visual-label">School code</div>
                      <div className="public-title" style={{ fontSize: '1.5rem', marginTop: 8 }}>{schoolCode.toUpperCase()}</div>
                      <p className="public-muted" style={{ margin: '8px 0 0' }}>
                        Tenant-aware access, branded identity, and local routing all stay scoped to this school.
                      </p>
                    </div>
                    <div className="public-soft-card public-site-stat-card--deep" style={{ padding: 18 }}>
                      <div className="public-site-hero__visual-label">Location</div>
                      <div className="public-title" style={{ fontSize: '1.2rem', marginTop: 8 }}>
                        {[profile?.city || branding?.city, profile?.state || branding?.state].filter(Boolean).join(', ') || 'Campus location'}
                      </div>
                      <p className="public-muted" style={{ margin: '8px 0 0' }}>
                        {profile?.addressLine1 || profile?.addressLine2 || 'Address and branch information are managed from the school CMS.'}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {visibleSection(landing?.sectionConfigs || [], 'about') && (
            <section id="about" className="public-site-section">
              <ScrollReveal>
                <PublicPretextHeading
                  eyebrow="About the school"
                  pretext="Foundation"
                  title={profile?.tagline || `A student-first identity for ${schoolName}`}
                  description={profile?.objective || stripHtml(profile?.aboutHtml) || 'Every section below is rendered from tenant-specific CMS content while keeping the same platform landing-page motion and spacing language.'}
                  effect="flow"
                  accentColor={CYAN}
                />
              </ScrollReveal>

              <div className="public-grid-2" style={{ marginTop: 28 }}>
                <div className="public-panel--strong" style={{ padding: 28, display: 'grid', gap: 18 }}>
                  <div className="public-status-chip" style={{ color: AMBER, borderColor: 'rgba(255,182,99,0.24)' }}>
                    <Building2 size={14} />
                    School story
                  </div>
                  {profile?.aboutHtml ? (
                    <div
                      className="public-muted"
                      style={{ lineHeight: 1.8 }}
                      dangerouslySetInnerHTML={{ __html: profile.aboutHtml }}
                    />
                  ) : (
                    <p className="public-muted" style={{ margin: 0, lineHeight: 1.8 }}>
                      {profile?.shortDescription || 'School story content will appear here once the CMS profile is completed.'}
                    </p>
                  )}
                </div>

                <div className="public-grid-2" style={{ alignSelf: 'stretch' }}>
                  {[
                    { title: 'Mission', body: profile?.mission || branding?.mission || 'Mission statement pending publication.', icon: GraduationCap, accent: CYAN },
                    { title: 'Vision', body: profile?.vision || branding?.vision || 'Vision statement pending publication.', icon: Sparkles, accent: VIOLET },
                    { title: 'Objective', body: profile?.objective || 'School objective will appear here.', icon: Compass, accent: AMBER },
                    { title: 'History & Legacy', body: profile?.history || 'History and legacy details can be published from the school CMS.', icon: Award, accent: ROSE },
                  ].map((item) => (
                    <div key={item.title} className="public-soft-card" style={{ padding: 22 }}>
                      <div style={{ width: 42, height: 42, borderRadius: 14, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', background: `${item.accent}18`, color: item.accent, marginBottom: 14 }}>
                        <item.icon size={18} />
                      </div>
                      <h3 className="public-title" style={{ fontSize: '1.1rem', marginBottom: 10 }}>{item.title}</h3>
                      <p className="public-muted" style={{ margin: 0 }}>{item.body}</p>
                    </div>
                  ))}
                </div>
              </div>

              {(landing?.leaders || []).length > 0 ? (
                <div className="public-grid-3" style={{ marginTop: 24 }}>
                  {landing?.leaders.slice(0, 6).map((leader) => (
                    <HoverTiltCard key={leader.id}>
                      <div className="public-soft-card" style={{ padding: 22, height: '100%' }}>
                        <div style={{ display: 'flex', gap: 16, alignItems: 'center', marginBottom: 16 }}>
                          <div style={{ width: 64, height: 64, borderRadius: 22, overflow: 'hidden', background: 'rgba(255,255,255,0.05)' }}>
                            <FallbackImage src={assetUrl(leader.imageMediaId)} fallbackSrc="/founder.png" alt={leader.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                          </div>
                          <div>
                            <div className="public-site-hero__visual-label">{leader.type.replace(/_/g, ' ')}</div>
                            <h3 className="public-title" style={{ fontSize: '1.05rem', marginTop: 6 }}>{leader.name}</h3>
                            <p className="public-muted" style={{ margin: '6px 0 0' }}>{leader.title || 'School leadership'}</p>
                          </div>
                        </div>
                        <p className="public-muted" style={{ margin: 0 }}>{stripHtml(leader.message || leader.bio) || 'Leadership note will appear here.'}</p>
                      </div>
                    </HoverTiltCard>
                  ))}
                </div>
              ) : null}
            </section>
          )}

          <section id="academics" className="public-site-section">
            <ScrollReveal>
              <PublicPretextHeading
                eyebrow="Academics"
                pretext="Growth"
                title="Curriculum, co-curriculars, and performance highlights"
                description={landing?.academicContent?.curriculum || 'Academic content, co-curricular activities, results, and scholarship notes are published from the school admin CMS.'}
                effect="flow"
                accentColor={VIOLET}
              />
            </ScrollReveal>

            <div className="public-grid-2" style={{ marginTop: 28 }}>
              {[
                { title: 'Curriculum overview', body: landing?.academicContent?.curriculum || 'Curriculum overview pending.', icon: BookOpen, accent: CYAN },
                { title: 'Co-curricular activities', body: landing?.academicContent?.coCurricular || 'Co-curricular showcase pending.', icon: Star, accent: AMBER },
                { title: 'Scholarships & awards', body: landing?.academicContent?.scholarshipInfo || 'Scholarship and awards details pending.', icon: Trophy, accent: ROSE },
                { title: 'Results & notices', body: [landing?.academicContent?.resultHighlights, landing?.academicContent?.notices].filter(Boolean).join(' ') || 'Result highlights and notices will appear here.', icon: CheckCircle2, accent: VIOLET },
              ].map((item) => (
                <div key={item.title} className="public-panel" style={{ padding: 24 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
                    <div style={{ width: 42, height: 42, borderRadius: 14, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', background: `${item.accent}18`, color: item.accent }}>
                      <item.icon size={18} />
                    </div>
                    <h3 className="public-title" style={{ fontSize: '1.1rem' }}>{item.title}</h3>
                  </div>
                  <p className="public-muted" style={{ margin: 0 }}>{item.body}</p>
                </div>
              ))}
            </div>

            {(landing?.achievements || []).length > 0 ? (
              <div className="public-grid-3" style={{ marginTop: 24 }}>
                {landing?.achievements.slice(0, 6).map((achievement: SchoolAchievement) => (
                  <div key={achievement.id} className="public-soft-card" style={{ padding: 22 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, marginBottom: 14 }}>
                      <div className="public-site-hero__visual-label" style={{ color: achievement.isFeatured ? AMBER : CYAN }}>
                        {achievement.category || 'Achievement'}
                      </div>
                      {achievement.achievementYear ? <span className="public-muted">{achievement.achievementYear}</span> : null}
                    </div>
                    <h3 className="public-title" style={{ fontSize: '1.05rem', marginBottom: 8 }}>{achievement.title}</h3>
                    <p className="public-muted" style={{ margin: 0 }}>{achievement.description || 'School achievement details pending.'}</p>
                  </div>
                ))}
              </div>
            ) : null}
          </section>

          <section id="campus" className="public-site-section">
            <ScrollReveal>
              <PublicPretextHeading
                eyebrow="Campus life"
                pretext="Environment"
                title="Infrastructure, branches, gallery, and facilities"
                description="The campus layer keeps the same premium public-site rhythm as the platform landing page while surfacing school-specific media, branch details, and facility highlights."
                effect="flow"
                accentColor={AMBER}
              />
            </ScrollReveal>

            {(landing?.infrastructure || []).length > 0 ? (
              <div className="public-grid-4" style={{ marginTop: 28 }}>
                {landing?.infrastructure.slice(0, 8).map((item) => (
                  <div key={item.id} className="public-soft-card" style={{ padding: 20 }}>
                    <div className="public-site-hero__visual-label" style={{ marginBottom: 10 }}>{item.type || 'Facility'}</div>
                    <h3 className="public-title" style={{ fontSize: '1rem', marginBottom: 8 }}>{item.title}</h3>
                    <p className="public-muted" style={{ margin: 0 }}>{item.description || 'Infrastructure details pending.'}</p>
                  </div>
                ))}
              </div>
            ) : null}

            {galleryMedia.length > 0 ? (
              <div className="public-grid-4" style={{ marginTop: 24 }}>
                {galleryMedia.map((item: SchoolGalleryMedia, index: number) => (
                  <div key={`${item.id}-${index}`} className="public-soft-card" style={{ padding: 10, overflow: 'hidden' }}>
                    <FallbackImage
                      src={assetUrl(item.mediaId)}
                      fallbackSrc="/institution-flow.svg"
                      alt={item.altText || item.caption || 'School gallery'}
                      style={{ width: '100%', aspectRatio: '1 / 1', objectFit: 'cover', borderRadius: 18 }}
                    />
                    <div style={{ padding: 12 }}>
                      <div className="public-site-hero__visual-label">{item.mediaType}</div>
                      <p className="public-muted" style={{ margin: '8px 0 0' }}>{item.caption || 'School moment'}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="public-panel" style={{ marginTop: 24, padding: 24, display: 'flex', alignItems: 'center', gap: 12 }}>
                <ImageIcon size={18} color={CYAN} />
                <span className="public-muted">Gallery media will appear here once albums are published from the CMS.</span>
              </div>
            )}

            {(landing?.branches || []).length > 0 ? (
              <div className="public-grid-3" style={{ marginTop: 24 }}>
                {landing?.branches.map((branch) => (
                  <div key={branch.id} className="public-panel--strong" style={{ padding: 22 }}>
                    <div className="public-status-chip" style={{ color: branch.isPrimary ? AMBER : CYAN, borderColor: branch.isPrimary ? 'rgba(255,182,99,0.24)' : 'rgba(34,211,238,0.24)' }}>
                      <MapPin size={14} />
                      {branch.isPrimary ? 'Primary branch' : 'Branch campus'}
                    </div>
                    <h3 className="public-title" style={{ fontSize: '1.08rem', marginTop: 14 }}>{branch.branchName}</h3>
                    <p className="public-muted" style={{ margin: '8px 0 12px' }}>
                      {[branch.address, branch.city, branch.state, branch.pincode].filter(Boolean).join(', ') || 'Branch address pending.'}
                    </p>
                    <div style={{ display: 'grid', gap: 8 }}>
                      {branch.phone ? <span className="public-muted" style={{ display: 'flex', alignItems: 'center', gap: 8 }}><Phone size={14} /> {branch.phone}</span> : null}
                      {branch.email ? <span className="public-muted" style={{ display: 'flex', alignItems: 'center', gap: 8 }}><Mail size={14} /> {branch.email}</span> : null}
                    </div>
                  </div>
                ))}
              </div>
            ) : null}
          </section>

          <section id="events" className="public-site-section">
            <ScrollReveal>
              <PublicPretextHeading
                eyebrow="Events"
                pretext="Momentum"
                title="Upcoming events, celebrations, and community moments"
                description="Nearest upcoming events appear first, with the lead event elevated and the remaining schedule kept easy to scan."
                effect="flow"
                accentColor={ROSE}
              />
            </ScrollReveal>

            {featuredEvent ? (
              <div className="public-grid-2" style={{ marginTop: 28 }}>
                <div className="public-panel--strong" style={{ padding: 24, display: 'grid', gap: 16 }}>
                  <div className="public-status-chip" style={{ color: AMBER, borderColor: 'rgba(255,182,99,0.24)' }}>
                    <CalendarDays size={14} />
                    Featured upcoming event
                  </div>
                  <h3 className="public-title" style={{ fontSize: '1.5rem' }}>{featuredEvent.title}</h3>
                  <p className="public-muted" style={{ margin: 0 }}>{featuredEvent.description || 'Event details will be updated soon.'}</p>
                  <div className="public-grid-2">
                    <div className="public-soft-card" style={{ padding: 18 }}>
                      <div className="public-site-hero__visual-label">Date & time</div>
                      <p className="public-muted" style={{ margin: '10px 0 0' }}>{formatDateLabel(featuredEvent.startAt)}</p>
                    </div>
                    <div className="public-soft-card" style={{ padding: 18 }}>
                      <div className="public-site-hero__visual-label">Location</div>
                      <p className="public-muted" style={{ margin: '10px 0 0' }}>{featuredEvent.location || 'Campus venue to be confirmed'}</p>
                    </div>
                  </div>
                  {featuredEvent.registrationUrl ? (
                    <a className="public-primary-button" href={featuredEvent.registrationUrl} target="_blank" rel="noreferrer">
                      Register interest
                      <ArrowRight size={16} />
                    </a>
                  ) : null}
                </div>

                <div className="public-grid-1" style={{ display: 'grid', gap: 16 }}>
                  {supportingEvents.map((event: SchoolEvent) => (
                    <div key={event.id} className="public-soft-card" style={{ padding: 20 }}>
                      <div className="public-site-hero__visual-label">{formatDateLabel(event.startAt)}</div>
                      <h3 className="public-title" style={{ fontSize: '1.05rem', margin: '10px 0 8px' }}>{event.title}</h3>
                      <p className="public-muted" style={{ margin: 0 }}>{event.description || 'Event details pending.'}</p>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="public-panel" style={{ marginTop: 24, padding: 24 }}>
                <p className="public-muted" style={{ margin: 0 }}>Upcoming events will appear here once they are published from the school admin CMS.</p>
              </div>
            )}

            {(landing?.testimonials || []).length > 0 ? (
              <div className="public-grid-3" style={{ marginTop: 24 }}>
                {landing?.testimonials.slice(0, 6).map((testimonial) => (
                  <div key={testimonial.id} className="public-panel" style={{ padding: 22 }}>
                    <Quote size={18} color={AMBER} />
                    <p className="public-muted" style={{ margin: '14px 0 18px', lineHeight: 1.75 }}>{testimonial.content}</p>
                    <div className="public-title" style={{ fontSize: '1rem' }}>{testimonial.authorName}</div>
                    <div className="public-muted">{[testimonial.designation, testimonial.relationshipType].filter(Boolean).join(' - ')}</div>
                  </div>
                ))}
              </div>
            ) : null}
          </section>

          <section id="admissions" className="public-site-section">
            <div className="public-grid-2">
              <div className="public-panel--strong" style={{ padding: 28, display: 'grid', gap: 18 }}>
                <PublicPretextFlowText text="Admissions" as="div" variant="label" accentColor={AMBER} />
                <h2 className="public-title" style={{ fontSize: 'clamp(2rem, 4vw, 2.7rem)' }}>Ready to start the admission journey?</h2>
                <p className="public-muted" style={{ margin: 0, lineHeight: 1.7 }}>
                  {landing?.admissionInfo?.overview || 'Admission overview, eligibility, and process details are managed from the school CMS and surfaced here automatically.'}
                </p>
                <div className="public-grid-2">
                  <div className="public-soft-card" style={{ padding: 18 }}>
                    <div className="public-site-hero__visual-label">Eligibility</div>
                    <p className="public-muted" style={{ margin: '10px 0 0' }}>{landing?.admissionInfo?.eligibility || 'Eligibility rules coming soon.'}</p>
                  </div>
                  <div className="public-soft-card" style={{ padding: 18 }}>
                    <div className="public-site-hero__visual-label">Process</div>
                    <p className="public-muted" style={{ margin: '10px 0 0' }}>{landing?.admissionInfo?.process || 'Process checklist coming soon.'}</p>
                  </div>
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12 }}>
                  <button type="button" className="public-primary-button" onClick={() => scrollToSection('fees')}>
                    View fee structure
                    <ChevronRight size={16} />
                  </button>
                  <button type="button" className="public-secondary-button" onClick={handleQuickAdminSignIn}>
                    School admin sign-in
                  </button>
                </div>
              </div>

              <form className="public-panel" style={{ padding: 28, display: 'grid', gap: 14 }} onSubmit={handleEnquirySubmit}>
                <div>
                  <h3 className="public-title" style={{ fontSize: '1.3rem', marginBottom: 8 }}>Admission enquiry</h3>
                  <p className="public-muted" style={{ margin: 0 }}>Capture parent interest directly into the school CMS enquiry inbox.</p>
                </div>

                {[
                  { key: 'studentName', label: 'Student name', type: 'text' },
                  { key: 'parentName', label: 'Parent name', type: 'text' },
                  { key: 'phone', label: 'Phone number', type: 'tel' },
                  { key: 'email', label: 'Email', type: 'email' },
                  { key: 'classInterested', label: 'Class interested in', type: 'text' },
                ].map((field) => (
                  <label key={field.key} style={{ display: 'grid', gap: 8 }}>
                    <span className="public-site-hero__visual-label">{field.label}</span>
                    <input
                      type={field.type}
                      value={(enquiry as Record<string, string>)[field.key]}
                      onChange={(event) => setEnquiry((current) => ({ ...current, [field.key]: event.target.value }))}
                      style={{
                        width: '100%',
                        borderRadius: 16,
                        border: '1px solid var(--public-border)',
                        background: 'var(--public-panel-soft)',
                        color: 'var(--public-text-main)',
                        padding: '12px 14px',
                        fontFamily: 'inherit',
                      }}
                    />
                  </label>
                ))}

                <label style={{ display: 'grid', gap: 8 }}>
                  <span className="public-site-hero__visual-label">Message</span>
                  <textarea
                    rows={4}
                    value={enquiry.message}
                    onChange={(event) => setEnquiry((current) => ({ ...current, message: event.target.value }))}
                    style={{
                      width: '100%',
                      borderRadius: 16,
                      border: '1px solid var(--public-border)',
                      background: 'var(--public-panel-soft)',
                      color: 'var(--public-text-main)',
                      padding: '12px 14px',
                      fontFamily: 'inherit',
                      resize: 'vertical',
                    }}
                  />
                </label>

                {enquiryMessage ? <div className="public-muted">{enquiryMessage}</div> : null}

                <button type="submit" className="public-primary-button" disabled={enquiryLoading}>
                  {enquiryLoading ? <><Loader size={16} className="animate-spin" /> Sending...</> : <><ArrowRight size={16} /> Submit enquiry</>}
                </button>
              </form>
            </div>
          </section>

          <section id="fees" className="public-site-section">
            <ScrollReveal>
              <PublicPretextHeading
                eyebrow="Fee structure"
                pretext="Clarity"
                title="Transparent fee information and downloadable references"
                description="Fee structures render as responsive cards and can also expose uploaded brochure or fee documents."
                effect="flow"
                accentColor={CYAN}
              />
            </ScrollReveal>

            {(landing?.feeStructures || []).length > 0 ? (
              <div className="public-grid-2" style={{ marginTop: 24 }}>
                {landing?.feeStructures.map((item) => {
                  const rows = parseFeeRows(item);
                  return (
                    <div key={item.id} className="public-panel--strong" style={{ padding: 24 }}>
                      <div className="public-site-hero__visual-label">{item.academicYear}</div>
                      <h3 className="public-title" style={{ fontSize: '1.15rem', margin: '10px 0 8px' }}>{item.title}</h3>
                      <p className="public-muted" style={{ margin: 0 }}>{item.description || 'Fee schedule available on request.'}</p>
                      {rows.length > 0 ? (
                        <div style={{ display: 'grid', gap: 10, marginTop: 18 }}>
                          {rows.slice(0, 6).map((row, index) => (
                            <div key={`${item.id}-${index}`} className="public-soft-card" style={{ padding: 16, display: 'flex', justifyContent: 'space-between', gap: 12 }}>
                              <span className="public-muted">{row.label || row.name || `Fee item ${index + 1}`}</span>
                              <strong style={{ color: 'var(--public-text-main)' }}>{row.value || row.amount || row.fee || 'TBA'}</strong>
                            </div>
                          ))}
                        </div>
                      ) : null}
                      {item.attachmentMediaId ? (
                        <a className="public-secondary-button" href={assetUrl(item.attachmentMediaId)} target="_blank" rel="noreferrer" style={{ marginTop: 18 }}>
                          Download fee sheet
                        </a>
                      ) : null}
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="public-panel" style={{ marginTop: 24, padding: 24 }}>
                <p className="public-muted" style={{ margin: 0 }}>Fee structures will appear here after the school publishes them from the CMS.</p>
              </div>
            )}
          </section>

          <section id="contact" className="public-site-section">
            <div className="public-grid-2">
              <div className="public-panel--strong" style={{ padding: 28, display: 'grid', gap: 18 }}>
                <PublicPretextHeading
                  eyebrow="Contact"
                  pretext="Reach Us"
                  title="Visit, call, or write to the school"
                  description="Contact information, branch context, and directions all stay tenant-specific and editable by the school admin."
                  effect="flow"
                  accentColor={AMBER}
                />
                <div className="public-grid-2">
                  <div className="public-soft-card" style={{ padding: 18 }}>
                    <div className="public-site-hero__visual-label">Address</div>
                    <p className="public-muted" style={{ margin: '10px 0 0' }}>
                      {[profile?.addressLine1, profile?.addressLine2, profile?.city, profile?.state, profile?.pincode].filter(Boolean).join(', ') || 'School address pending.'}
                    </p>
                  </div>
                  <div className="public-soft-card" style={{ padding: 18 }}>
                    <div className="public-site-hero__visual-label">Contact</div>
                    <div style={{ display: 'grid', gap: 10, marginTop: 10 }}>
                      <span className="public-muted" style={{ display: 'flex', alignItems: 'center', gap: 8 }}><Phone size={14} /> {profile?.phone || landing?.admissionInfo?.contactPhone || 'Contact number pending'}</span>
                      <span className="public-muted" style={{ display: 'flex', alignItems: 'center', gap: 8 }}><Mail size={14} /> {profile?.email || landing?.admissionInfo?.contactEmail || 'Contact email pending'}</span>
                      <span className="public-muted" style={{ display: 'flex', alignItems: 'center', gap: 8 }}><CalendarDays size={14} /> {profile?.officeHours || 'Office hours available on enquiry'}</span>
                    </div>
                  </div>
                </div>

                {(profile?.latitude && profile?.longitude) ? (
                  <a
                    className="public-primary-button"
                    href={`https://www.google.com/maps/search/?api=1&query=${profile.latitude},${profile.longitude}`}
                    target="_blank"
                    rel="noreferrer"
                  >
                    Get directions
                    <ArrowRight size={16} />
                  </a>
                ) : null}
              </div>

              <div className="public-panel" style={{ padding: 28, display: 'grid', gap: 18 }}>
                <div>
                  <h3 className="public-title" style={{ fontSize: '1.3rem', marginBottom: 8 }}>Newsletter and compliance</h3>
                  <p className="public-muted" style={{ margin: 0 }}>Collect newsletter opt-ins and surface affiliation or board details on the same page.</p>
                </div>

                <form onSubmit={handleNewsletterSubmit} style={{ display: 'grid', gap: 12 }}>
                  <label style={{ display: 'grid', gap: 8 }}>
                    <span className="public-site-hero__visual-label">Newsletter email</span>
                    <input
                      type="email"
                      value={newsletterEmail}
                      onChange={(event) => setNewsletterEmail(event.target.value)}
                      placeholder="name@example.com"
                      style={{
                        width: '100%',
                        borderRadius: 16,
                        border: '1px solid var(--public-border)',
                        background: 'var(--public-panel-soft)',
                        color: 'var(--public-text-main)',
                        padding: '12px 14px',
                        fontFamily: 'inherit',
                      }}
                    />
                  </label>
                  {newsletterMessage ? <div className="public-muted">{newsletterMessage}</div> : null}
                  <button type="submit" className="public-primary-button" disabled={newsletterLoading}>
                    {newsletterLoading ? <><Loader size={16} className="animate-spin" /> Subscribing...</> : <><Mail size={16} /> Subscribe</>}
                  </button>
                </form>

                <div className="public-soft-card" style={{ padding: 20 }}>
                  <div className="public-site-hero__visual-label">Affiliation & recognition</div>
                  <p className="public-muted" style={{ margin: '10px 0 0' }}>
                    {landing?.affiliation?.boardName || 'Board / affiliation details pending.'}
                    {landing?.affiliation?.affiliationNumber ? ` - ${landing.affiliation.affiliationNumber}` : ''}
                  </p>
                  {landing?.affiliation?.complianceText ? (
                    <p className="public-muted" style={{ margin: '10px 0 0' }}>{landing.affiliation.complianceText}</p>
                  ) : null}
                </div>

                {(landing?.socialLinks || []).length > 0 ? (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
                    {landing?.socialLinks.map((link) => (
                      <a key={link.id} className="public-secondary-button" href={link.url} target="_blank" rel="noreferrer">
                        {socialLabel(link)}
                      </a>
                    ))}
                  </div>
                ) : null}
              </div>
            </div>
          </section>
        </main>

        <footer className="public-site-footer">
          <div className="public-soft-card" style={{ padding: 24 }}>
            <div className="public-title" style={{ fontSize: '1.05rem' }}>{schoolName}</div>
            <p className="public-muted" style={{ margin: '8px 0 0' }}>
              School landing page, admissions, and sign-in all share the same tenant context on <strong style={{ color: 'var(--public-text-main)' }}>{schoolCode.toUpperCase()}</strong>.
            </p>
          </div>
          <div className="public-soft-card" style={{ padding: 24 }}>
            <div className="public-site-hero__visual-label">Quick links</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, marginTop: 10 }}>
              {navLinks.map((item) => (
                <button key={item.id} type="button" className="public-ghost-button" onClick={() => scrollToSection(item.id)}>
                  {item.label}
                </button>
              ))}
              <Link to="/login" className="public-primary-button">
                Portal login
                <ArrowRight size={16} />
              </Link>
            </div>
          </div>
        </footer>
      </div>
    </PublicPageShell>
  );
}
