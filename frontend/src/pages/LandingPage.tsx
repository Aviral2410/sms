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
  Plus,
  Send
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
              eyebrow={content?.heroEyebrow || 'Future-Ready Education OS'}
              pretext="Campus"
              title={content?.heroHeadline || 'Institutional Intelligence for the Next Generation'}
              description={content?.heroSubheadline || 'A connected, AI-native operating surface that unifies academics, operations, and finance.'}
              className="public-site-hero__pretext"
              effect="flow"
              accentColor="#10b981"
            />
            <div className="public-site-hero__actions">
              <Link to={content?.primaryCtaUrl || '/onboarding'} className="public-primary-button public-primary-button--hero" style={{ background: 'linear-gradient(135deg, #059669, #10b981)', boxShadow: '0 4px 20px rgba(16,185,129,0.3)' }}>
                {content?.primaryCtaLabel || 'Start Onboarding'}
                <ArrowRight size={16} />
              </Link>
              <Link to={visionUrl} className="public-secondary-button public-secondary-button--hero" style={{ borderColor: 'rgba(16,185,129,0.4)', color: '#6ee7b7' }}>
                {content?.secondaryCtaLabel || 'See the Vision'}
              </Link>
            </div>
            <div className="public-site-hero__signal-row">
              <span style={{ color: '#6ee7b7' }}><ShieldCheck size={14} /> Unified Modular Architecture</span>
              <span style={{ color: '#10b981' }}><Sparkles size={14} /> Integrated Ollama Intelligence</span>
              <span style={{ color: '#34d399' }}><Building2 size={14} /> Full Campus Lifecycle</span>
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
              style={{ background: 'rgba(2, 44, 34, 0.4)', border: '1px solid rgba(16, 185, 129, 0.2)' }}
            >
              <FallbackImage
                src={resolveSectionMedia('hero', heroMedia?.imageUrl, heroMedia?.fallbackImageUrl)}
                fallbackSrc="/operational-viewpoint.svg"
                alt={heroMedia?.altText || 'System overview'}
                className="public-site-hero__image"
              />
              <div>
                <div className="public-site-hero__visual-label" style={{ color: '#10b981' }}>Core Intelligence</div>
                <PublicPretextFlowText
                  as="p"
                  text={heroMedia?.caption || 'The platform mirrors a connected operating model where data flows seamlessly between all campus services.'}
                  variant="body"
                  className="public-site-hero__visual-copy"
                  accentColor="#6ee7b7"
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
            eyebrow="System Signals"
            pretext="Velocity"
            title="Real-time Platform Momentum"
            description="Live institutional metrics. The numbers below reflect our current network of active schools and learners."
            compact
            effect="flow"
            accentColor="#34d399"
          />
        </div>
        {overviewCards.length ? (
          <>
            <div className="public-grid-4">
              {overviewCards.map((card, index) => {
                const Icon = card.icon;
                return (
                  <ScrollReveal key={card.label} delay={index * 0.06}>
                    <HoverTiltCard className="public-site-stat-card public-panel public-site-stat-card--deep" accentColor="#10b981" as="article" maxTilt={12} style={{ background: 'rgba(6, 78, 59, 0.1)' }}>
                      <div className="public-site-stat-card__icon" style={{ color: '#10b981' }}>
                        <Icon size={24} />
                      </div>
                      <PublicPretextFlowText
                        as="div"
                        text={card.value}
                        variant="stat"
                        className="public-site-stat-card__value"
                        accentColor="#ecfdf5"
                        delayStep={0.04}
                        layoutKey={`stat-${card.label}`}
                      />
                      <PublicPretextFlowText
                        as="div"
                        text={card.label}
                        variant="label"
                        className="public-site-stat-card__label"
                        accentColor="#6ee7b7"
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
            {dataError || 'Fetching institutional metrics...'}
          </div>
        )}
      </section>

      <section className="public-site-section public-site-story-grid">
        <div>
          <PublicPretextHeading
            eyebrow={content?.visionTitle || 'Primary Vision'}
            pretext="Future"
            title={content?.whyTitle || 'Beyond Admin Tools'}
            description={content?.visionBody || 'Developing a system that learns and evolves with your institution.'}
            compact
            effect="flow"
            accentColor="#84cc16"
          />
          <div className="public-site-story-copy public-panel" style={{ borderLeft: '4px solid #84cc16' }}>
            <PublicPretextFlowText
              as="h3"
              text={content?.whyTitle || 'Operational Depth'}
              variant="heading"
              className="public-site-story-copy__title"
              accentColor="#bef264"
              layoutKey="story-title"
            />
            <PublicPretextFlowText
              as="p"
              text={content?.whyBody || 'Our modular design ensures that academics, finance, and transport are always in sync.'}
              variant="body"
              accentColor="#ecfdf5"
              delayStep={0.05}
              layoutKey="story-body"
            />
          </div>
        </div>
        <HoverTiltCard className="public-site-story-media public-panel--strong" accentColor="#84cc16" as="article" maxTilt={12} style={{ background: 'rgba(57, 88, 7, 0.1)' }}>
          <FallbackImage
            src={rotatingStoryImages[storyImageIndex] || '/classroom.png'}
            fallbackSrc="/institution-flow.svg"
            alt="Campus lifecycle"
            className="public-site-story-media__image"
          />
          <PublicPretextFlowText
            as="div"
            text={storyMedia?.caption || 'A modular view of the campus OS lifecycle.'}
            variant="body"
            className="public-site-story-media__caption"
            accentColor="#d9f99d"
            delayStep={0.05}
            layoutKey="story-media-caption"
          />
        </HoverTiltCard>
      </section>

      <section className="public-site-section">
        <div className="public-site-section__heading">
          <PublicPretextHeading
            eyebrow="Core Engines"
            pretext="Modules"
            title="Integrated Operational Domains"
            description="Unified services for every aspect of the modern institution."
            compact
            effect="flow"
            accentColor="#10b981"
          />
        </div>
        <div className="public-grid-3 public-site-feature-grid">
          {(content?.featureCards || []).map((feature, index) => (
            <ScrollReveal key={feature.title} delay={index * 0.05}>
              <HoverTiltCard className="public-site-feature-card public-panel--strong" accentColor="#10b981" as="article" maxTilt={12} style={{ background: 'rgba(2, 44, 34, 0.3)', borderColor: 'rgba(16, 185, 129, 0.2)' }}>
                <FallbackImage src={resolveFeatureImage(feature)} fallbackSrc="/institution-flow.svg" alt={feature.title} className="public-site-feature-card__image" />
                <div className="public-status-chip" style={{ borderColor: '#10b98155', color: '#10b981', background: 'rgba(16, 185, 129, 0.05)' }}>{feature.category}</div>
                <PublicPretextFlowText
                  as="h3"
                  text={feature.title}
                  variant="heading"
                  accentColor="#ecfdf5"
                  layoutKey={`feature-title-${index}`}
                />
                <PublicPretextFlowText
                  as="p"
                  text={feature.description}
                  variant="body"
                  accentColor="#6ee7b7"
                  delayStep={0.05}
                  layoutKey={`feature-description-${index}`}
                />
                <ul style={{ color: '#d1fae5' }}>
                  {feature.bullets.map((bullet) => (
                    <li key={bullet}><BadgeCheck size={14} color="#10b981" /> {bullet}</li>
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
              eyebrow="Global Validation"
              pretext="Proof"
              title="Voices from the Network"
              description="Trusted by institutional leaders worldwide."
              compact
              effect="flow"
              accentColor="#34d399"
            />
          </div>
          <div className="public-testimonial-thread">
            {testimonialThread.map((testimonial, index) => (
              <ScrollReveal key={`${testimonial.authorName}-${testimonial.sortOrder || index}`} delay={index * 0.06}>
                <HoverTiltCard className="public-testimonial-card public-panel" accentColor="#10b981" as="article" maxTilt={10} style={{ background: 'rgba(2, 44, 34, 0.3)' }}>
                  <div className="public-testimonial-card__quote-mark" style={{ color: '#10b981' }}>
                    <Quote size={20} />
                  </div>
                  <PublicPretextFlowText
                    as="p"
                    text={testimonial.quote}
                    variant="quote"
                    className="public-testimonial-card__quote"
                    accentColor="#ecfdf5"
                    delayStep={0.05}
                    layoutKey={`testimonial-quote-${index}`}
                  />
                  <div className="public-testimonial-card__author">
                    <FallbackImage
                      src={testimonial.avatarUrl || '/hero.png'}
                      fallbackSrc="/hero.png"
                      alt={testimonial.authorName}
                      className="public-testimonial-card__avatar"
                      style={{ border: '2px solid #10b981' }}
                    />
                    <div>
                      <PublicPretextFlowText
                        as="strong"
                        text={testimonial.authorName}
                        variant="label"
                        className="public-testimonial-card__author-name"
                        accentColor="#10b981"
                        delayStep={0.04}
                        layoutKey={`testimonial-author-${index}`}
                      />
                      <PublicPretextFlowText
                        as="span"
                        text={`${testimonial.authorRole} - ${testimonial.organization}`}
                        variant="body"
                        className="public-testimonial-card__author-meta"
                        accentColor="#6ee7b7"
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

      <div style={{ marginTop: 120, borderTop: '1px solid rgba(16, 185, 129, 0.1)', paddingTop: 120 }}>
        <section className="public-site-section">
          <div className="public-site-section__heading">
            <PublicPretextHeading
              eyebrow="Onboarding Flow"
              pretext="Entry"
              title="Next Steps for your Institution"
              description="Join the connected campus ecosystem."
              compact
              effect="flow"
              accentColor="#84cc16"
            />
          </div>
          <div className="public-launch-grid">
            <HoverTiltCard className="public-launch-card public-panel--strong" accentColor="#10b981" as="article" maxTilt={12} style={{ background: 'linear-gradient(135deg, rgba(6, 95, 70, 0.2), rgba(2, 44, 34, 0.4))' }}>
              <div className="public-status-chip" style={{ color: '#10b981', borderColor: '#10b981' }}>New School</div>
              <PublicPretextFlowText
                as="h3"
                text="Start Onboarding"
                variant="heading"
                accentColor="#ecfdf5"
                layoutKey="launch-onboarding-title"
              />
              <PublicPretextFlowText
                as="p"
                text="Register your institution and begin the modular provisioning process today."
                variant="body"
                accentColor="#6ee7b7"
                delayStep={0.05}
                layoutKey="launch-onboarding-body"
              />
              <Link to="/onboarding" className="public-primary-button public-launch-card__button" style={{ background: '#10b981' }}>
                Start Now
                <ArrowRight size={16} />
              </Link>
            </HoverTiltCard>

            <HoverTiltCard className="public-launch-card public-panel" accentColor="#34d399" as="article" maxTilt={12}>
              <div className="public-status-chip">Member Portal</div>
              <PublicPretextFlowText
                as="h3"
                text="Join with Code"
                variant="heading"
                accentColor="#34d399"
                layoutKey="launch-join-title"
              />
              <PublicPretextFlowText
                as="p"
                text="Students and staff can access their school directly using their unique institution code."
                variant="body"
                accentColor="#6ee7b7"
                delayStep={0.05}
                layoutKey="launch-join-body"
              />
              <Link to="/join" className="public-secondary-button public-launch-card__button" style={{ color: '#34d399', borderColor: '#34d399' }}>Join Campus</Link>
            </HoverTiltCard>

            <HoverTiltCard className="public-launch-card public-panel" accentColor="#10b981" as="article" maxTilt={12}>
              <div className="public-status-chip">Operations</div>
              <PublicPretextFlowText
                as="h3"
                text="Admin Console"
                variant="heading"
                accentColor="#10b981"
                layoutKey="launch-admin-title"
              />
              <PublicPretextFlowText
                as="p"
                text="Institutional administrators can manage settings, users, and deployments."
                variant="body"
                accentColor="#6ee7b7"
                delayStep={0.05}
                layoutKey="launch-admin-body"
              />
              <Link to="/login/admin" className="public-secondary-button public-launch-card__button" style={{ color: '#10b981', borderColor: '#10b981' }}>Operator Login</Link>
            </HoverTiltCard>
          </div>
        </section>
      </div>

      <section className="public-site-section">
        <div className="public-panel--strong overflow-hidden relative" style={{ background: 'linear-gradient(135deg, rgba(6, 78, 59, 0.4), rgba(2, 44, 34, 0.6))', border: '1px solid rgba(16, 185, 129, 0.3)', borderRadius: 32 }}>
          <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-500/10 blur-[100px] -mr-48 -mt-48" />
          <div className="p-12 relative z-10 grid md:grid-cols-2 gap-12 items-center">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-[10px] font-black uppercase tracking-widest text-emerald-400 mb-6 font-mono">
                <Sparkles size={12} /> Intelligent Assistance
              </div>
              <h2 className="text-4xl font-black tracking-tighter text-white mb-6 leading-tight">
                Guided Institutional Intelligence
              </h2>
              <p className="text-emerald-50/60 text-lg font-medium leading-relaxed mb-8">
                Experience a stateful, AI-driven support and onboarding layer. 
                Our assistant remembers your context, helps with missing fields, 
                and provides intelligent answers to your platform queries.
              </p>
              <div className="flex flex-wrap gap-4">
                <Link to="/ai-assistant" className="public-primary-button" style={{ background: '#10b981', boxShadow: '0 10px 30px rgba(16, 185, 129, 0.2)' }}>
                  Launch AI Assistant
                  <Cpu size={18} />
                </Link>
                <div className="flex items-center gap-6 mt-4 md:mt-0 px-4">
                  <div className="flex flex-col">
                    <span className="text-white font-bold text-sm">Guest Support</span>
                    <span className="text-emerald-500/50 text-[10px] uppercase font-black tracking-widest">No Login Required</span>
                  </div>
                  <div className="h-8 w-px bg-white/10" />
                  <div className="flex flex-col">
                    <span className="text-white font-bold text-sm">Stateful Hub</span>
                    <span className="text-emerald-500/50 text-[10px] uppercase font-black tracking-widest">Always Persistent</span>
                  </div>
                </div>
              </div>
            </div>
            <div className="relative group">
              <div className="absolute -inset-4 bg-emerald-500/20 blur-3xl opacity-20 group-hover:opacity-40 transition duration-1000" />
              <div className="relative aspect-square md:aspect-video rounded-2xl border border-white/10 bg-black/40 backdrop-blur-3xl p-6 shadow-2xl overflow-hidden flex flex-col">
                 <div className="flex items-center justify-between mb-8">
                    <div className="flex gap-1.5">
                      <div className="w-2.5 h-2.5 rounded-full bg-red-500/40" />
                      <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/40" />
                      <div className="w-2.5 h-2.5 rounded-full bg-emerald-500/40" />
                    </div>
                    <div className="text-[10px] font-black uppercase tracking-widest opacity-30 text-emerald-100">AI Terminal v2.0</div>
                 </div>
                 <div className="flex-1 space-y-4">
                    <div className="flex gap-3">
                      <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center flex-shrink-0">
                        <Cpu size={14} className="text-emerald-400" />
                      </div>
                      <div className="bg-emerald-500/5 border border-emerald-500/10 rounded-xl p-3 text-xs text-emerald-50/70 max-w-[80%]">
                        How can I assist you with your school onboarding today? I've noticed you still need to provide the contact details.
                      </div>
                    </div>
                    <div className="flex gap-3 justify-end">
                      <div className="bg-white/5 border border-white/10 rounded-xl p-3 text-xs text-white max-w-[80%]">
                        Help me fill the contact phone and email for my institution.
                      </div>
                      <div className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center flex-shrink-0">
                        <Users size={14} className="text-white/40" />
                      </div>
                    </div>
                 </div>
                 <div className="mt-8 pt-4 border-t border-white/5 flex items-center gap-4">
                    <div className="flex-1 h-10 bg-white/5 rounded-full border border-white/10 px-4 flex items-center gap-2">
                       <Plus size={14} className="opacity-30" />
                       <div className="text-[10px] opacity-20 font-medium">Type your query...</div>
                    </div>
                    <div className="w-10 h-10 bg-emerald-500 rounded-full flex items-center justify-center shadow-lg shadow-emerald-500/20">
                       <Send size={14} className="text-black" />
                    </div>
                 </div>
              </div>
            </div>
          </div>
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
