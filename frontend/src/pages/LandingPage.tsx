import React, { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import {
  ArrowRight,
  BadgeCheck,
  Building2,
  Cpu,
  GraduationCap,
  Quote,
  Route,
  ShieldCheck,
  Sparkles,
  UserCog,
  Users,
  Wallet,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { HoverTiltCard } from '../components/public/HoverTiltCard';
import { PublicPretextFlowText } from '../components/public/PublicPretextFlowText';
import { PublicPretextHeading } from '../components/public/PublicPretextHeading';
import { PublicSiteFrame } from '../components/public/PublicSiteFrame';
import { SchoolShowcase } from '../components/public/SchoolShowcase';
import { ScrollReveal } from '../components/public/ScrollReveal';
import { WebGLHero } from '../components/public/WebGLHero';
import { PublicField } from '../components/public/PublicField';
import { FallbackImage } from '../components/ui/FallbackImage';
import { usePublicSiteContent } from '../hooks/usePublicSiteContent';
import { publicSiteApi, type PublicRoleBenefit, type PublicSubscriptionOverviewResponse, type PublicSiteFeatureCard } from '../lib/publicSiteApi';
import { startPublicGuidedTour } from '../components/public/PublicGuidedTour';

const ROLE_ICONS: Record<string, React.ElementType> = {
  SCHOOL_ADMIN: Building2,
  TEACHER: Cpu,
  STUDENT: GraduationCap,
  PARENT: Users,
  STAFF: UserCog,
  TRANSPORT: Route,
};

function findMedia(content: ReturnType<typeof usePublicSiteContent>['content'], key: string) {
  return content?.mediaGallery.find((item) => item.sectionKey === key) ?? null;
}

function resolveVisionPath(url?: string) {
  if (!url || url === '/founders-message') {
    return '/vision';
  }
  return url;
}

function buildOverviewCards(overview: PublicSubscriptionOverviewResponse | null) {
  if (!overview) return [];
  return [
    { label: 'Active institutions', value: overview.activeInstitutions.toLocaleString(), icon: Building2, accent: '#ffb663' },
    { label: 'Schools attached', value: overview.connectedSchools.toLocaleString(), icon: ShieldCheck, accent: '#22d3ee' },
    { label: 'Platform users', value: overview.totalUsers.toLocaleString(), icon: Users, accent: '#a78bfa' },
    { label: 'Learner capacity', value: overview.totalLearnerCapacity.toLocaleString(), icon: GraduationCap, accent: '#a78bfa' },
    { label: 'Available plans', value: overview.availablePlans.toLocaleString(), icon: Wallet, accent: '#34d399' },
  ];
}

function resolveFeatureImage(feature: PublicSiteFeatureCard) {
  const title = `${feature.title} ${feature.category}`.toLowerCase();
  const current = feature.imageUrl || '';
  const genericImage = !current || current === '/hero.png' || current === '/school_facade.png' || current === '/classroom.png';

  if (title.includes('admission') || title.includes('onboarding') || title.includes('growth')) {
    return genericImage || current === '/school_facade.png' ? '/admissions-story.svg' : current;
  }

  if (title.includes('academic') || title.includes('class') || title.includes('attendance') || title.includes('exam')) {
    return genericImage || current === '/classroom.png' ? '/academics-story.svg' : current;
  }

  if (title.includes('finance') || title.includes('billing') || title.includes('subscription') || title.includes('commercial')) {
    return genericImage || current === '/operational-viewpoint.svg' ? '/finance-story.svg' : current;
  }

  if (title.includes('communication') || title.includes('announcement')) {
    return genericImage || current === '/admissions-story.svg' ? '/communication-network.svg' : current;
  }

  if (title.includes('transport')) {
    return genericImage || current === '/operational-viewpoint.svg' ? '/transport-network.svg' : current;
  }

  if (title.includes('ai') || title.includes('intelligence') || title.includes('copilot')) {
    return genericImage || current === '/academics-story.svg' ? '/ai-story.svg' : current;
  }

  return current || '/institution-flow.svg';
}

function resolveSectionMedia(sectionKey: string, current?: string | null, fallback?: string | null) {
  const candidate = current || fallback || '';
  const genericImage = !candidate || candidate === '/hero.png' || candidate === '/school_facade.png' || candidate === '/classroom.png';

  if (sectionKey === 'hero') {
    return genericImage ? '/operational-viewpoint.svg' : candidate;
  }

  if (sectionKey === 'story') {
    return genericImage ? '/institution-flow.svg' : candidate;
  }

  return candidate || '/institution-flow.svg';
}

function buildStoryRotationImages(primary?: string | null) {
  const candidates = [
    primary,
    '/classroom.png',
    '/school_facade.png',
    '/communication-story.svg',
    '/transport-story.svg',
  ].filter((value): value is string => Boolean(value && value.trim()));

  return [...new Set(candidates.filter((value) => value !== '/hero.png'))];
}

export default function LandingPage() {
  const { content, loading, error } = usePublicSiteContent();
  const [overview, setOverview] = useState<PublicSubscriptionOverviewResponse | null>(null);
  const [dataError, setDataError] = useState<string | null>(null);
  const [storyImageIndex, setStoryImageIndex] = useState(0);
  const [demoOpen, setDemoOpen] = useState(false);
  const [demoStatus, setDemoStatus] = useState<string | null>(null);
  const [demoSubmitting, setDemoSubmitting] = useState(false);
  const [demoForm, setDemoForm] = useState({
    fullName: '',
    email: '',
    organization: '',
    phone: '',
    preferredSlot: '',
    notes: '',
  });

  useEffect(() => {
    let active = true;

    publicSiteApi.getOverview()
      .then((response) => {
        if (!active) return;
        setOverview(response);
        setDataError(null);
      })
      .catch(() => {
        if (!active) return;
        setDataError('Public overview data is currently unavailable.');
      });

    return () => {
      active = false;
    };
  }, []);

  const heroMedia = findMedia(content, 'hero');
  const storyMedia = findMedia(content, 'story');
  const rotatingStoryImages = useMemo(
    () => buildStoryRotationImages(resolveSectionMedia('story', storyMedia?.imageUrl, storyMedia?.fallbackImageUrl)),
    [storyMedia],
  );
  const overviewCards = useMemo(() => buildOverviewCards(overview), [overview]);
  const visibleRoleBenefits = (content?.roleBenefits || []).filter((item) => item.roleKey !== 'PLATFORM_ADMIN');
  const testimonialThread = [...(content?.testimonials || [])]
    .sort((left, right) => (left.sortOrder || Number.MAX_SAFE_INTEGER) - (right.sortOrder || Number.MAX_SAFE_INTEGER));
  const visionUrl = resolveVisionPath(content?.secondaryCtaUrl);
  const attachedSchools = useMemo(() => {
    if (!overview?.attachedSchools?.length) {
      return (overview?.attachedSchoolNames || []).map((schoolName, index) => ({
        schoolName,
        schoolCode: `SCH-${index + 1}`,
        logoUrl: null,
      }));
    }

    return overview.attachedSchools.map((school) => ({
      schoolName: school.schoolName,
      schoolCode: school.schoolCode,
      logoUrl: school.logoUrl || null,
    }));
  }, [overview]);

  useEffect(() => {
    setStoryImageIndex(0);
  }, [rotatingStoryImages]);

  useEffect(() => {
    if (rotatingStoryImages.length <= 1) {
      return;
    }

    const intervalId = window.setInterval(() => {
      setStoryImageIndex((current) => (current + 1) % rotatingStoryImages.length);
    }, 5200);

    return () => window.clearInterval(intervalId);
  }, [rotatingStoryImages]);

  const submitDemoRequest = async (event: React.FormEvent) => {
    event.preventDefault();
    setDemoSubmitting(true);
    setDemoStatus(null);
    try {
      await publicSiteApi.submitContactRequest({
        fullName: demoForm.fullName,
        email: demoForm.email,
        organization: demoForm.organization,
        schoolName: '',
        phone: demoForm.phone,
        subject: 'Schedule a demo',
        message: `Preferred slot: ${demoForm.preferredSlot || 'Not specified'}\n\n${demoForm.notes || ''}`.trim(),
      });
      setDemoStatus('Demo request received. The platform team will follow up to confirm the slot.');
      setDemoForm({ fullName: '', email: '', organization: '', phone: '', preferredSlot: '', notes: '' });
    } catch (error: any) {
      setDemoStatus(error?.message || 'We could not submit your demo request right now.');
    } finally {
      setDemoSubmitting(false);
    }
  };

  return (
    <PublicSiteFrame content={content} activePath="/" mode="hero" density={1.26} contentWidth={1460}>
      <section className="public-site-hero">
        <ScrollReveal y={20} duration={0.82}>
          <div className="public-site-hero__copy">
            <PublicPretextHeading
              eyebrow={content?.heroEyebrow || 'Loading platform story...'}
              pretext="Campus OS"
              title={content?.heroHeadline || 'Preparing the public experience...'}
              description={content?.heroSubheadline || 'The platform story is loading.'}
              className="public-site-hero__pretext"
              effect="flow"
              accentColor="#8ee7ff"
            />
            <div className="public-site-hero__actions">
              <Link to={content?.primaryCtaUrl || '/onboarding'} className="public-primary-button public-primary-button--hero">
                {content?.primaryCtaLabel || 'Start school onboarding'}
                <ArrowRight size={16} />
              </Link>
              <Link to={visionUrl} className="public-secondary-button public-secondary-button--hero">
                {content?.secondaryCtaLabel || 'See the vision'}
              </Link>
            </div>
            <div className="public-site-hero__signal-row">
              <span><ShieldCheck size={14} /> Multi-service institutional platform</span>
              <span><Sparkles size={14} /> AI-assisted workflows</span>
              <span><Building2 size={14} /> Operations, academics, finance, and support</span>
            </div>
          </div>
        </ScrollReveal>

        <ScrollReveal delay={0.08} y={18} duration={0.9}>
          <div className="public-site-hero__visual-stack">
            <WebGLHero />
            <motion.div
              className="public-site-hero__visual-card public-panel"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.6 }}
            >
              <FallbackImage
                src={resolveSectionMedia('hero', heroMedia?.imageUrl, heroMedia?.fallbackImageUrl)}
                fallbackSrc="/operational-viewpoint.svg"
                alt={heroMedia?.altText || 'Platform operational illustration'}
                className="public-site-hero__image"
              />
              <div>
                <div className="public-site-hero__visual-label">Operational viewpoint</div>
                <PublicPretextFlowText
                  as="p"
                  text={heroMedia?.caption || 'A text-free platform illustration that mirrors the same connected operating model described beside it.'}
                  variant="body"
                  className="public-site-hero__visual-copy"
                  accentColor="#b9f4ff"
                  delayStep={0.05}
                  layoutKey="hero-visual-copy"
                />
              </div>
            </motion.div>
          </div>
        </ScrollReveal>
      </section>

      <section className="public-site-section">
        <div className="public-site-section__heading">
          <PublicPretextHeading
            eyebrow="Growth Signals"
            pretext="Growth"
            title="Evidence of institutional momentum"
            description="Live aggregate numbers only. If public data is unavailable, we leave this section honest instead of inventing traction."
            compact
            effect="flow"
            accentColor="#9eeeff"
          />
        </div>
        {overviewCards.length ? (
          <>
            <div className="public-grid-4">
              {overviewCards.map((card, index) => {
                const Icon = card.icon;
                return (
                  <ScrollReveal key={card.label} delay={index * 0.06}>
                    <HoverTiltCard className="public-site-stat-card public-panel public-site-stat-card--deep" accentColor={card.accent} as="article" maxTilt={12}>
                      <div className="public-site-stat-card__icon" style={{ color: card.accent }}>
                        <Icon size={24} />
                      </div>
                      <PublicPretextFlowText
                        as="div"
                        text={card.value}
                        variant="stat"
                        className="public-site-stat-card__value"
                        accentColor={card.accent}
                        delayStep={0.04}
                        layoutKey={`stat-${card.label}`}
                      />
                      <PublicPretextFlowText
                        as="div"
                        text={card.label}
                        variant="label"
                        className="public-site-stat-card__label"
                        accentColor={card.accent}
                        delayStep={0.04}
                        layoutKey={`stat-label-${card.label}`}
                      />
                    </HoverTiltCard>
                  </ScrollReveal>
                );
              })}
            </div>
            <div className="public-overview-meta">
              <SchoolShowcase schools={attachedSchools} payingInstitutions={overview?.payingInstitutions || 0} />
            </div>
          </>
        ) : (
          <div className="public-site-empty public-panel">
            {dataError || 'Public overview data is currently unavailable.'}
          </div>
        )}
      </section>

      <section className="public-site-section public-site-story-grid">
        <div>
          <PublicPretextHeading
            eyebrow={content?.visionTitle || 'Why we built this'}
            pretext="Purpose"
            title={content?.whyTitle || 'Built for real operational depth'}
            description={content?.visionBody || error || 'Public site content is unavailable right now.'}
            compact
            effect="flow"
            accentColor="#ffca87"
          />
          <div className="public-site-story-copy public-panel">
            <PublicPretextFlowText
              as="h3"
              text={content?.whyTitle || 'Built for institutional momentum'}
              variant="immersive"
              className="public-site-story-copy__title"
              accentColor="#ffbf6b"
              layoutKey="story-title"
            />
            <PublicPretextFlowText
              as="p"
              text={content?.whyBody || 'We are loading the long-form platform story.'}
              variant="body"
              accentColor="#ffd8a8"
              delayStep={0.05}
              layoutKey="story-body"
            />
          </div>
        </div>
        <HoverTiltCard className="public-site-story-media public-panel--strong" accentColor="#ffb663" as="article" maxTilt={12}>
          <FallbackImage
            src={rotatingStoryImages[storyImageIndex] || '/classroom.png'}
            fallbackSrc="/institution-flow.svg"
            alt={storyMedia?.altText || 'Institutional workflow illustration'}
            className="public-site-story-media__image"
          />
          <PublicPretextFlowText
            as="div"
            text={storyMedia?.caption || 'A modular SVG scene showing the same connected system across onboarding, academics, transport, communication, and finance.'}
            variant="body"
            className="public-site-story-media__caption"
            accentColor="#ffd39b"
            delayStep={0.05}
            layoutKey="story-media-caption"
          />
        </HoverTiltCard>
      </section>

      <section className="public-site-section">
        <div className="public-site-section__heading">
          <PublicPretextHeading
            eyebrow="Capabilities"
            pretext="Modules"
            title="A connected operating surface, not disconnected admin tools"
            description="Each capability below moves one part of the institution forward without breaking context for the rest of the campus."
            compact
            effect="flow"
            accentColor="#9cecff"
          />
        </div>
        <div className="public-grid-3 public-site-feature-grid">
          {(content?.featureCards || []).map((feature, index) => (
            <ScrollReveal key={feature.title} delay={index * 0.05}>
              <HoverTiltCard className="public-site-feature-card public-panel--strong" accentColor={feature.accentColor} as="article" maxTilt={12}>
                <FallbackImage src={resolveFeatureImage(feature)} fallbackSrc="/institution-flow.svg" alt={feature.title} className="public-site-feature-card__image" />
                <div className="public-status-chip" style={{ borderColor: `${feature.accentColor}55`, color: feature.accentColor }}>{feature.category}</div>
                <PublicPretextFlowText
                  as="h3"
                  text={feature.title}
                  variant="heading"
                  accentColor={feature.accentColor}
                  layoutKey={`feature-title-${index}`}
                />
                <PublicPretextFlowText
                  as="p"
                  text={feature.description}
                  variant="body"
                  accentColor={feature.accentColor}
                  delayStep={0.05}
                  layoutKey={`feature-description-${index}`}
                />
                <ul>
                  {feature.bullets.map((bullet) => (
                    <li key={bullet}><BadgeCheck size={14} color={feature.accentColor} /> {bullet}</li>
                  ))}
                </ul>
              </HoverTiltCard>
            </ScrollReveal>
          ))}
        </div>
      </section>

      {testimonialThread.length ? (
        <section className="public-site-section">
          <div className="public-site-section__heading">
            <PublicPretextHeading
              eyebrow="Testimonials"
              pretext="Proof"
              title="What institutions say after rollout momentum begins"
              description="This thread is managed from the platform admin surface, so the public story can keep reflecting real voices instead of frozen launch copy."
              compact
              effect="flow"
              accentColor="#f2d4ff"
            />
          </div>
          <div className="public-testimonial-thread">
            {testimonialThread.map((testimonial, index) => (
              <ScrollReveal key={`${testimonial.authorName}-${testimonial.sortOrder || index}`} delay={index * 0.06}>
                <HoverTiltCard className="public-testimonial-card public-panel" accentColor={testimonial.accentColor} as="article" maxTilt={10}>
                  <div className="public-testimonial-card__quote-mark" style={{ color: testimonial.accentColor }}>
                    <Quote size={20} />
                  </div>
                  <PublicPretextFlowText
                    as="p"
                    text={testimonial.quote}
                    variant="quote"
                    className="public-testimonial-card__quote"
                    accentColor={testimonial.accentColor}
                    delayStep={0.05}
                    layoutKey={`testimonial-quote-${index}`}
                  />
                  <div className="public-testimonial-card__author">
                    <FallbackImage
                      src={testimonial.avatarUrl || '/hero.png'}
                      fallbackSrc="/hero.png"
                      alt={testimonial.authorName}
                      className="public-testimonial-card__avatar"
                    />
                    <div>
                      <PublicPretextFlowText
                        as="strong"
                        text={testimonial.authorName}
                        variant="label"
                        className="public-testimonial-card__author-name"
                        accentColor={testimonial.accentColor}
                        delayStep={0.04}
                        layoutKey={`testimonial-author-${index}`}
                      />
                      <PublicPretextFlowText
                        as="span"
                        text={`${testimonial.authorRole} - ${testimonial.organization}`}
                        variant="body"
                        className="public-testimonial-card__author-meta"
                        accentColor={testimonial.accentColor}
                        delayStep={0.04}
                        layoutKey={`testimonial-role-${index}`}
                      />
                    </div>
                  </div>
                </HoverTiltCard>
              </ScrollReveal>
            ))}
          </div>
        </section>
      ) : null}

      <section className="public-site-section">
        <div className="public-site-section__heading">
          <PublicPretextHeading
            eyebrow="Role Clarity"
            pretext="Users"
            title="What each user gets from the platform"
            description="Value has to be obvious to the people doing the real work, not just the people configuring the system."
            compact
            effect="flow"
            accentColor="#ffcb8f"
          />
        </div>
        <div className="public-grid-3">
          {visibleRoleBenefits.map((benefit: PublicRoleBenefit, index) => {
            const Icon = ROLE_ICONS[benefit.roleKey] || Sparkles;
            return (
              <ScrollReveal key={benefit.roleKey} delay={index * 0.04}>
                <HoverTiltCard className="public-site-role-card public-panel public-site-role-card--deep" accentColor={benefit.accentColor} as="article" maxTilt={14}>
                  <div className="public-site-role-card__top">
                    <div className="public-site-role-card__icon" style={{ color: benefit.accentColor }}>
                      <Icon size={22} />
                    </div>
                    <div className="public-site-role-card__text">
                      <div className="public-site-role-card__label">{benefit.roleLabel}</div>
                      <PublicPretextFlowText
                        as="h3"
                        text={benefit.headline}
                        variant="heading"
                        className="public-site-role-card__title"
                        accentColor={benefit.accentColor}
                        layoutKey={`role-headline-${index}`}
                      />
                    </div>
                  </div>
                  <PublicPretextFlowText
                    as="p"
                    text={benefit.description}
                    variant="body"
                    className="public-site-role-card__description"
                    accentColor={benefit.accentColor}
                    delayStep={0.05}
                    layoutKey={`role-description-${index}`}
                  />
                  <ul>
                    {benefit.outcomes.map((outcome) => (
                      <li key={outcome}>{outcome}</li>
                    ))}
                  </ul>
                </HoverTiltCard>
              </ScrollReveal>
            );
          })}
        </div>
      </section>

      <section className="public-site-section">
        <div className="public-site-section__heading">
          <PublicPretextHeading
            eyebrow="Get Started"
            pretext="Launch"
            title="Choose the entry point that fits how you are arriving"
            description="Whether you are evaluating the platform, joining an existing school, or signing in to manage rollout, the entry path should feel obvious."
            compact
            effect="flow"
            accentColor="#97ecff"
          />
        </div>
        <div className="public-launch-grid">
          <HoverTiltCard className="public-launch-card public-panel--strong" accentColor="#ffb663" as="article" maxTilt={12}>
            <div className="public-status-chip">Institution Setup</div>
            <PublicPretextFlowText
              as="h3"
              text="Start school onboarding"
              variant="heading"
              accentColor="#ffb663"
              layoutKey="launch-onboarding-title"
            />
            <PublicPretextFlowText
              as="p"
              text="Register a new institution, choose a plan, and move into provisioning without switching products."
              variant="body"
              accentColor="#ffb663"
              delayStep={0.05}
              layoutKey="launch-onboarding-body"
            />
            <Link to="/onboarding" className="public-primary-button public-launch-card__button">
              Start onboarding
              <ArrowRight size={16} />
            </Link>
          </HoverTiltCard>

          <HoverTiltCard className="public-launch-card public-panel" accentColor="#22d3ee" as="article" maxTilt={12}>
            <div className="public-status-chip">Returning User</div>
            <PublicPretextFlowText
              as="h3"
              text="Join with school code"
              variant="heading"
              accentColor="#22d3ee"
              layoutKey="launch-join-title"
            />
            <PublicPretextFlowText
              as="p"
              text="Students, parents, staff, and teachers can enter through a clean route designed for activation and first access."
              variant="body"
              accentColor="#22d3ee"
              delayStep={0.05}
              layoutKey="launch-join-body"
            />
            <Link to="/join" className="public-secondary-button public-launch-card__button">Join with code</Link>
          </HoverTiltCard>

          <HoverTiltCard className="public-launch-card public-panel" accentColor="#a78bfa" as="article" maxTilt={12}>
            <div className="public-status-chip">Admin Access</div>
            <PublicPretextFlowText
              as="h3"
              text="Platform admin login"
              variant="heading"
              accentColor="#a78bfa"
              layoutKey="launch-admin-title"
            />
            <PublicPretextFlowText
              as="p"
              text="Use the admin surface to manage schools, public content, settings, runtime configuration, and rollout posture."
              variant="body"
              accentColor="#a78bfa"
              delayStep={0.05}
              layoutKey="launch-admin-body"
            />
            <Link to="/login/admin" className="public-secondary-button public-launch-card__button">Open admin login</Link>
          </HoverTiltCard>
        </div>
      </section>

      <section className="public-site-section" id="demo-section">
        <div className="public-demo-grid">
          <HoverTiltCard className="public-demo-card public-panel--strong" accentColor="#22d3ee" as="article" maxTilt={12}>
            <div className="public-status-chip">Interactive demo</div>
            <h3>Start a guided tour of the system</h3>
            <p className="public-muted">Click once and we will walk you through navigation, pricing, onboarding, and where support lives.</p>
            <button type="button" className="public-primary-button public-demo-card__button" onClick={() => startPublicGuidedTour()}>
              Start guided tour
              <ArrowRight size={16} />
            </button>
          </HoverTiltCard>

          <HoverTiltCard className="public-demo-card public-panel" accentColor="#a78bfa" as="article" maxTilt={12}>
            <div className="public-status-chip">Live walkthrough</div>
            <h3>Schedule a detailed demo</h3>
            <p className="public-muted">Tell us the institution context and we will schedule a slot with a platform specialist.</p>
            <button type="button" className="public-secondary-button public-demo-card__button" onClick={() => setDemoOpen(true)}>
              Request a demo slot
            </button>
          </HoverTiltCard>
        </div>
      </section>

      {loading && (
        <section className="public-site-section">
          <div className="public-site-empty public-panel">Loading public site content...</div>
        </section>
      )}

      {demoOpen && (
        <div className="public-modal" role="dialog" aria-label="Schedule a demo">
          <div className="public-modal__backdrop" onClick={() => setDemoOpen(false)} />
          <div className="public-modal__panel public-panel--strong">
            <header className="public-modal__header">
              <div>
                <div className="public-modal__eyebrow">Detailed demo</div>
                <h3 className="public-modal__title">Schedule a walkthrough</h3>
              </div>
              <button type="button" className="public-modal__close" onClick={() => setDemoOpen(false)} aria-label="Close demo request">×</button>
            </header>
            <form className="public-contact-form" onSubmit={submitDemoRequest}>
              <div className="public-grid-2">
                <PublicField label="Full name" value={demoForm.fullName} onChange={(e) => setDemoForm((p) => ({ ...p, fullName: e.target.value }))} placeholder="Asha Thomas" accent="#22d3ee" required />
                <PublicField label="Email" value={demoForm.email} onChange={(e) => setDemoForm((p) => ({ ...p, email: e.target.value }))} placeholder="asha@example.com" accent="#22d3ee" type="email" required />
                <PublicField label="Organization" value={demoForm.organization} onChange={(e) => setDemoForm((p) => ({ ...p, organization: e.target.value }))} placeholder="North Ridge Academy" accent="#a78bfa" />
                <PublicField label="Phone" value={demoForm.phone} onChange={(e) => setDemoForm((p) => ({ ...p, phone: e.target.value }))} placeholder="+91 9876543210" accent="#a78bfa" />
              </div>
              <PublicField label="Preferred slot" value={demoForm.preferredSlot} onChange={(e) => setDemoForm((p) => ({ ...p, preferredSlot: e.target.value }))} placeholder="e.g. Tue 11:00 AM IST" accent="#ffb663" />
              <PublicField label="Notes" multiline value={demoForm.notes} onChange={(e) => setDemoForm((p) => ({ ...p, notes: e.target.value }))} placeholder="What do you want to see? Modules, roles, integrations, rollout timeline..." accent="#ffb663" rows={5} />
              {demoStatus ? <div className="public-site-empty public-contact-form__status">{demoStatus}</div> : null}
              <button type="submit" className="public-primary-button" disabled={demoSubmitting}>
                {demoSubmitting ? 'Sending...' : 'Request demo'}
                <ArrowRight size={16} />
              </button>
            </form>
          </div>
        </div>
      )}
    </PublicSiteFrame>
  );
}
