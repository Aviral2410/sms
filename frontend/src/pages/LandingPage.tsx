import React, { useEffect, useMemo, useState } from 'react';
import {
  ArrowRight,
  BadgeCheck,
  Bot,
  Building2,
  CalendarDays,
  CheckCircle2,
  ChevronRight,
  GraduationCap,
  LifeBuoy,
  Mail,
  MessageSquareMore,
  ShieldCheck,
  Sparkles,
  Users,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { FallbackImage } from '../components/ui/FallbackImage';
import { PublicSiteFrame } from '../components/public/PublicSiteFrame';
import { usePublicSiteContent } from '../hooks/usePublicSiteContent';
import { publicSiteApi, type PublicRoleBenefit, type PublicSiteFeatureCard, type PublicSubscriptionOverviewResponse, type PublicTestimonial } from '../lib/publicSiteApi';

function findMedia(content: ReturnType<typeof usePublicSiteContent>['content'], key: string) {
  return content?.mediaGallery.find((item) => item.sectionKey === key) ?? null;
}

function resolveImage(candidate?: string | null, fallback = '/institution-flow.svg') {
  if (!candidate || candidate === '/hero.png' || candidate === '/school_facade.png' || candidate === '/classroom.png') {
    return fallback;
  }
  return candidate;
}

function initials(name: string) {
  const value = name.trim().split(/\s+/).slice(0, 2).map((part) => part[0]?.toUpperCase() || '').join('');
  return value || 'ES';
}

function buildTrustMetrics(
  overview: PublicSubscriptionOverviewResponse | null,
  featureCards: PublicSiteFeatureCard[],
  roleBenefits: PublicRoleBenefit[],
  testimonials: PublicTestimonial[],
) {
  const liveInstitutionMetric = overview?.activeInstitutions && overview.activeInstitutions > 0
    ? `${overview.activeInstitutions.toLocaleString()} live`
    : `${Math.max(featureCards.length, 8)} modules`;

  const connectedUsersMetric = overview?.totalUsers && overview.totalUsers > 0
    ? overview.totalUsers.toLocaleString()
    : 'Streaming';

  return [
    {
      label: 'Operational coverage',
      value: liveInstitutionMetric,
      detail: 'Admissions, academics, finance, transport, communication, and AI in one system.',
    },
    {
      label: 'Role-aware experiences',
      value: `${Math.max(roleBenefits.length, 6)}`,
      detail: 'Purpose-built surfaces for leadership, teachers, parents, students, and staff.',
    },
    {
      label: 'Assistant output modes',
      value: connectedUsersMetric,
      detail: 'Markdown answers plus charts, cards, and tables for real school workflows.',
    },
    {
      label: 'Reference stories',
      value: `${Math.max(testimonials.length, 3)}`,
      detail: 'Proof points designed to build confidence before demo, onboarding, and rollout.',
    },
  ];
}

const ROLE_ICON_MAP: Record<string, React.ElementType> = {
  SCHOOL_ADMIN: Building2,
  TEACHER: GraduationCap,
  PARENT: Users,
  STUDENT: Sparkles,
  STAFF: ShieldCheck,
  TRANSPORT: CalendarDays,
};

const PLATFORM_BADGES = [
  'Unified school ERP',
  'AI-native workflows',
  'Role-based access',
  'Public + tenant journeys',
];

export default function LandingPage() {
  const { content, loading, error } = usePublicSiteContent();
  const [overview, setOverview] = useState<PublicSubscriptionOverviewResponse | null>(null);
  const [demoSubmitting, setDemoSubmitting] = useState(false);
  const [demoStatus, setDemoStatus] = useState<string | null>(null);
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
        if (active) {
          setOverview(response);
        }
      })
      .catch(() => {
        if (active) {
          setOverview(null);
        }
      });

    return () => {
      active = false;
    };
  }, []);

  const heroMedia = findMedia(content, 'hero');
  const storyMedia = findMedia(content, 'story');
  const featureCards = (content?.featureCards || []).slice(0, 6);
  const roleBenefits = (content?.roleBenefits || []).filter((item) => item.roleKey !== 'PLATFORM_ADMIN').slice(0, 4);
  const testimonials = [...(content?.testimonials || [])]
    .sort((left, right) => (left.sortOrder || Number.MAX_SAFE_INTEGER) - (right.sortOrder || Number.MAX_SAFE_INTEGER))
    .slice(0, 3);

  const trustMetrics = useMemo(
    () => buildTrustMetrics(overview, featureCards, roleBenefits, testimonials),
    [featureCards, overview, roleBenefits, testimonials],
  );

  const submitDemoRequest = async (event: React.FormEvent) => {
    event.preventDefault();
    setDemoSubmitting(true);
    setDemoStatus(null);

    try {
      await publicSiteApi.submitContactRequest({
        fullName: demoForm.fullName,
        email: demoForm.email,
        organization: demoForm.organization,
        schoolName: demoForm.organization,
        phone: demoForm.phone,
        subject: 'Schedule a demo',
        message: `Preferred slot: ${demoForm.preferredSlot || 'Not specified'}\n\n${demoForm.notes || ''}`.trim(),
      });

      setDemoStatus('Demo request received. Our team will confirm the best slot shortly.');
      setDemoForm({
        fullName: '',
        email: '',
        organization: '',
        phone: '',
        preferredSlot: '',
        notes: '',
      });
    } catch (requestError: any) {
      setDemoStatus(requestError?.message || 'We could not submit the request right now.');
    } finally {
      setDemoSubmitting(false);
    }
  };

  return (
    <PublicSiteFrame
      content={content}
      activePath="/"
      mode="minimal"
      density={0.42}
      showOrbs={false}
      textStream={false}
      flareTrail={false}
      contentWidth={1320}
    >
      <div className="space-y-24 pb-24 pt-10 md:space-y-32 md:pb-32 md:pt-14">
        <section id="product" className="relative overflow-hidden rounded-[2rem] border border-white/10 bg-slate-950/70 px-6 py-10 shadow-[0_32px_120px_rgba(2,6,23,0.45)] backdrop-blur-xl md:px-10 md:py-14">
          <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-emerald-300/35 to-transparent" />
          <div className="pointer-events-none absolute -right-24 top-0 h-72 w-72 rounded-full bg-emerald-400/12 blur-3xl" />
          <div className="pointer-events-none absolute bottom-0 left-0 h-64 w-64 rounded-full bg-cyan-400/10 blur-3xl" />

          <div className="grid gap-10 lg:grid-cols-[minmax(0,1.05fr)_minmax(420px,0.95fr)] lg:items-center">
            <div className="max-w-2xl">
              <div className="inline-flex items-center gap-2 rounded-full border border-emerald-400/20 bg-emerald-500/8 px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.28em] text-emerald-200/80">
                <Sparkles size={14} />
                {content?.brandLabel || 'ElevateSmart'} for modern schools
              </div>

              <h1 className="mt-6 max-w-3xl text-4xl font-black tracking-[-0.04em] text-white sm:text-5xl lg:text-6xl">
                Run your entire school on one intelligent system.
              </h1>

              <p className="mt-5 max-w-2xl text-base leading-8 text-slate-300 md:text-lg">
                Admissions, academics, finance, transport, communication, and AI guidance in a single enterprise-ready operating layer built for schools that want clarity, speed, and control.
              </p>

              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <a
                  href="#demo"
                  className="inline-flex items-center justify-center gap-2 rounded-2xl bg-emerald-400 px-6 py-3.5 text-sm font-bold text-slate-950 shadow-[0_18px_45px_rgba(52,211,153,0.28)] transition hover:bg-emerald-300"
                >
                  Book a Live Demo
                  <ArrowRight size={16} />
                </a>
                <Link
                  to="/pricing"
                  className="inline-flex items-center justify-center gap-2 rounded-2xl border border-white/12 bg-white/[0.03] px-6 py-3.5 text-sm font-semibold text-white transition hover:border-emerald-300/35 hover:bg-white/[0.06]"
                >
                  Explore Pricing
                  <ChevronRight size={16} />
                </Link>
              </div>

              <div className="mt-8 flex flex-wrap gap-2">
                {PLATFORM_BADGES.map((badge) => (
                  <span
                    key={badge}
                    className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5 text-xs font-medium text-slate-300"
                  >
                    {badge}
                  </span>
                ))}
              </div>

              {(loading || error) ? (
                <div className="mt-8 rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm text-slate-300">
                  {loading ? 'Loading platform content...' : error}
                </div>
              ) : null}
            </div>

            <div className="relative">
              <div className="rounded-[2rem] border border-white/10 bg-[linear-gradient(180deg,rgba(15,23,42,0.92),rgba(2,6,23,0.98))] p-4 shadow-[0_30px_80px_rgba(2,6,23,0.45)]">
                <div className="rounded-[1.5rem] border border-white/10 bg-slate-900/70 p-4">
                  <div className="flex items-center justify-between border-b border-white/10 pb-4">
                    <div>
                      <div className="text-[11px] font-semibold uppercase tracking-[0.26em] text-emerald-200/65">Executive Overview</div>
                      <div className="mt-2 text-lg font-semibold text-white">Operational command center</div>
                    </div>
                    <div className="rounded-full border border-emerald-300/20 bg-emerald-400/10 px-3 py-1 text-xs font-semibold text-emerald-200">
                      Ask Aura ready
                    </div>
                  </div>

                  <div className="mt-4 overflow-hidden rounded-[1.4rem] border border-white/10 bg-slate-950/60">
                    <FallbackImage
                      src={resolveImage(heroMedia?.imageUrl || storyMedia?.imageUrl, '/operational-viewpoint.svg')}
                      fallbackSrc="/operational-viewpoint.svg"
                      alt={heroMedia?.altText || 'School operations dashboard'}
                      className="h-[280px] w-full object-cover"
                    />
                  </div>

                  <div className="mt-4 grid gap-3 sm:grid-cols-2">
                    {trustMetrics.map((metric) => (
                      <div key={metric.label} className="rounded-[1.25rem] border border-white/10 bg-white/[0.03] p-4">
                        <div className="text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-400">{metric.label}</div>
                        <div className="mt-2 text-2xl font-black tracking-tight text-white">{metric.value}</div>
                        <p className="mt-2 text-sm leading-6 text-slate-400">{metric.detail}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="grid gap-4 md:grid-cols-4">
          {trustMetrics.map((metric) => (
            <article key={metric.label} className="rounded-[1.75rem] border border-white/10 bg-white/[0.035] p-6 backdrop-blur-sm">
              <div className="text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-400">{metric.label}</div>
              <div className="mt-3 text-3xl font-black tracking-tight text-white">{metric.value}</div>
              <p className="mt-3 text-sm leading-6 text-slate-400">{metric.detail}</p>
            </article>
          ))}
        </section>

        <section id="solutions" className="grid gap-6 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)]">
          <div className="rounded-[2rem] border border-white/10 bg-white/[0.03] p-8">
            <div className="text-[11px] font-semibold uppercase tracking-[0.28em] text-emerald-200/75">Product</div>
            <h2 className="mt-4 text-3xl font-black tracking-tight text-white sm:text-4xl">
              A single data spine for every operational team.
            </h2>
            <p className="mt-4 max-w-2xl text-base leading-8 text-slate-300">
              Replace disconnected admin tools with one consistent enterprise experience, from public enquiry capture to day-to-day execution inside the school ERP.
            </p>

            <div className="mt-8 grid gap-4 md:grid-cols-2">
              {featureCards.map((feature) => (
                <article key={feature.title} className="rounded-[1.5rem] border border-white/10 bg-slate-950/55 p-5">
                  <div className="flex items-center justify-between gap-3">
                    <h3 className="text-lg font-semibold text-white">{feature.title}</h3>
                    <span className="rounded-full border border-emerald-300/18 bg-emerald-500/8 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-emerald-200/75">
                      {feature.category}
                    </span>
                  </div>
                  <p className="mt-3 text-sm leading-7 text-slate-400">{feature.description}</p>
                  <div className="mt-4 space-y-2">
                    {feature.bullets.slice(0, 3).map((bullet) => (
                      <div key={bullet} className="flex items-start gap-2 text-sm leading-6 text-slate-300">
                        <BadgeCheck size={16} className="mt-1 shrink-0 text-emerald-300" />
                        <span>{bullet}</span>
                      </div>
                    ))}
                  </div>
                </article>
              ))}
            </div>
          </div>

          <div className="space-y-4">
            {roleBenefits.map((benefit) => {
              const Icon = ROLE_ICON_MAP[benefit.roleKey] || ShieldCheck;
              return (
                <article key={benefit.roleKey} className="rounded-[1.75rem] border border-white/10 bg-white/[0.035] p-6">
                  <div className="flex items-start gap-4">
                    <div className="rounded-2xl border border-emerald-300/16 bg-emerald-500/8 p-3 text-emerald-200">
                      <Icon size={20} />
                    </div>
                    <div className="min-w-0">
                      <div className="text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-400">{benefit.roleLabel}</div>
                      <h3 className="mt-2 text-xl font-semibold text-white">{benefit.headline}</h3>
                      <p className="mt-3 text-sm leading-7 text-slate-400">{benefit.description}</p>
                      <div className="mt-4 flex flex-wrap gap-2">
                        {benefit.outcomes.slice(0, 3).map((outcome) => (
                          <span key={outcome} className="rounded-full border border-white/10 bg-slate-900/80 px-3 py-1.5 text-xs font-medium text-slate-300">
                            {outcome}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        </section>

        <section id="pricing" className="rounded-[2rem] border border-white/10 bg-[linear-gradient(135deg,rgba(15,23,42,0.75),rgba(2,6,23,0.95))] p-8 md:p-10">
          <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(360px,0.8fr)] lg:items-center">
            <div>
              <div className="text-[11px] font-semibold uppercase tracking-[0.28em] text-emerald-200/75">Pricing</div>
              <h2 className="mt-4 text-3xl font-black tracking-tight text-white sm:text-4xl">
                Pricing built for school leadership teams that need a rollout plan, not just a quote.
              </h2>
              <p className="mt-4 max-w-2xl text-base leading-8 text-slate-300">
                Compare plans, understand rollout support, and move from evaluation to implementation without piecing together separate products.
              </p>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Link to="/pricing" className="inline-flex items-center justify-center gap-2 rounded-2xl bg-white px-6 py-3.5 text-sm font-bold text-slate-950 transition hover:bg-slate-100">
                  View Plans
                  <ArrowRight size={16} />
                </Link>
                <a href="#demo" className="inline-flex items-center justify-center gap-2 rounded-2xl border border-white/12 px-6 py-3.5 text-sm font-semibold text-white transition hover:border-emerald-300/35 hover:bg-white/[0.05]">
                  Talk Through Rollout
                </a>
              </div>
            </div>

            <div className="rounded-[1.75rem] border border-white/10 bg-white/[0.04] p-6">
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <CheckCircle2 size={18} className="mt-1 shrink-0 text-emerald-300" />
                  <div>
                    <div className="font-semibold text-white">Clear deployment path</div>
                    <div className="mt-1 text-sm leading-6 text-slate-400">Pricing, onboarding, and the assistant experience all point to the same rollout motion.</div>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle2 size={18} className="mt-1 shrink-0 text-emerald-300" />
                  <div>
                    <div className="font-semibold text-white">Enterprise-ready visibility</div>
                    <div className="mt-1 text-sm leading-6 text-slate-400">Decision-makers see operational fit before procurement, implementation, and training begin.</div>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle2 size={18} className="mt-1 shrink-0 text-emerald-300" />
                  <div>
                    <div className="font-semibold text-white">AI included in the experience</div>
                    <div className="mt-1 text-sm leading-6 text-slate-400">Aura is available to explain modules, workflows, and school ERP use cases before the first meeting.</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {testimonials.length ? (
          <section className="space-y-6">
            <div className="max-w-2xl">
              <div className="text-[11px] font-semibold uppercase tracking-[0.28em] text-emerald-200/75">Customer proof</div>
              <h2 className="mt-4 text-3xl font-black tracking-tight text-white sm:text-4xl">
                Leaders want software they can trust on day one.
              </h2>
              <p className="mt-4 text-base leading-8 text-slate-300">
                Real faces, real roles, and institutional context make the buying experience feel credible before the first live walkthrough.
              </p>
            </div>

            <div className="grid gap-5 lg:grid-cols-3">
              {testimonials.map((testimonial, index) => (
                <article key={`${testimonial.authorName}-${index}`} className="rounded-[1.85rem] border border-white/10 bg-white/[0.04] p-6">
                  <div className="flex items-center gap-4">
                    {testimonial.avatarUrl ? (
                      <FallbackImage
                        src={testimonial.avatarUrl}
                        fallbackSrc="/hero.png"
                        alt={testimonial.authorName}
                        className="h-14 w-14 rounded-2xl object-cover"
                      />
                    ) : (
                      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-300 to-cyan-400 text-sm font-black text-slate-950">
                        {initials(testimonial.authorName)}
                      </div>
                    )}
                    <div className="min-w-0">
                      <div className="font-semibold text-white">{testimonial.authorName}</div>
                      <div className="mt-1 text-sm text-slate-400">{testimonial.authorRole}</div>
                      <div className="mt-1 text-xs uppercase tracking-[0.22em] text-emerald-200/70">{testimonial.organization}</div>
                    </div>
                  </div>
                  <p className="mt-5 text-sm leading-7 text-slate-300">“{testimonial.quote}”</p>
                </article>
              ))}
            </div>
          </section>
        ) : null}

        <section className="rounded-[2rem] border border-white/10 bg-white/[0.04] p-8 md:p-10">
          <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(320px,0.7fr)] lg:items-center">
            <div>
              <div className="text-[11px] font-semibold uppercase tracking-[0.28em] text-emerald-200/75">Ask Aura</div>
              <h2 className="mt-4 text-3xl font-black tracking-tight text-white sm:text-4xl">
                Let the AI assistant handle first questions before your team gets on a call.
              </h2>
              <p className="mt-4 max-w-2xl text-base leading-8 text-slate-300">
                Aura explains modules, compares workflows, and returns structured answers with markdown, charts, tables, and school ERP context.
              </p>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Link to="/assistant" className="inline-flex items-center justify-center gap-2 rounded-2xl bg-emerald-400 px-6 py-3.5 text-sm font-bold text-slate-950 transition hover:bg-emerald-300">
                  Open Aura Workspace
                  <Bot size={16} />
                </Link>
                <a href="#demo" className="inline-flex items-center justify-center gap-2 rounded-2xl border border-white/12 px-6 py-3.5 text-sm font-semibold text-white transition hover:border-emerald-300/35 hover:bg-white/[0.05]">
                  Turn questions into a demo
                </a>
              </div>
            </div>

            <div className="rounded-[1.75rem] border border-white/10 bg-slate-950/70 p-6">
              <div className="space-y-3">
                {[
                  'How does Aura connect admissions, attendance, fees, and parent communication?',
                  'Show me how the AI assistant presents school ERP data in charts and tables.',
                  'What does rollout look like for a growing school group?',
                ].map((prompt) => (
                  <div key={prompt} className="rounded-[1.25rem] border border-white/10 bg-white/[0.03] px-4 py-3 text-sm leading-6 text-slate-300">
                    {prompt}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section id="demo" className="grid gap-6 lg:grid-cols-[minmax(0,0.95fr)_minmax(420px,1.05fr)]">
          <div className="rounded-[2rem] border border-white/10 bg-white/[0.03] p-8">
            <div className="text-[11px] font-semibold uppercase tracking-[0.28em] text-emerald-200/75">Demo</div>
            <h2 className="mt-4 text-3xl font-black tracking-tight text-white sm:text-4xl">
              Book a walkthrough built around your school’s workflow.
            </h2>
            <p className="mt-4 text-base leading-8 text-slate-300">
              Share your context and we will tailor the session around admissions, academics, finance, transport, communication, or AI adoption.
            </p>

            <div className="mt-8 space-y-4">
              <div className="flex items-start gap-3 rounded-[1.25rem] border border-white/10 bg-slate-950/55 p-4">
                <CalendarDays size={18} className="mt-1 shrink-0 text-emerald-300" />
                <div>
                  <div className="font-semibold text-white">Focused agenda</div>
                  <div className="mt-1 text-sm leading-6 text-slate-400">We shape the flow around the modules and roles that matter to your institution.</div>
                </div>
              </div>
              <div className="flex items-start gap-3 rounded-[1.25rem] border border-white/10 bg-slate-950/55 p-4">
                <MessageSquareMore size={18} className="mt-1 shrink-0 text-emerald-300" />
                <div>
                  <div className="font-semibold text-white">AI + ERP story together</div>
                  <div className="mt-1 text-sm leading-6 text-slate-400">Aura and the operational platform are demonstrated as one connected experience.</div>
                </div>
              </div>
            </div>
          </div>

          <form onSubmit={submitDemoRequest} className="rounded-[2rem] border border-white/10 bg-slate-950/72 p-8">
            <div className="grid gap-4 md:grid-cols-2">
              <label className="space-y-2">
                <span className="text-sm font-medium text-slate-200">Full name</span>
                <input
                  value={demoForm.fullName}
                  onChange={(event) => setDemoForm((current) => ({ ...current, fullName: event.target.value }))}
                  className="w-full rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-white outline-none placeholder:text-slate-500 focus:border-emerald-300/30"
                  placeholder="Principal or operations lead"
                  required
                />
              </label>
              <label className="space-y-2">
                <span className="text-sm font-medium text-slate-200">Work email</span>
                <input
                  type="email"
                  value={demoForm.email}
                  onChange={(event) => setDemoForm((current) => ({ ...current, email: event.target.value }))}
                  className="w-full rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-white outline-none placeholder:text-slate-500 focus:border-emerald-300/30"
                  placeholder="name@school.org"
                  required
                />
              </label>
              <label className="space-y-2">
                <span className="text-sm font-medium text-slate-200">School or group</span>
                <input
                  value={demoForm.organization}
                  onChange={(event) => setDemoForm((current) => ({ ...current, organization: event.target.value }))}
                  className="w-full rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-white outline-none placeholder:text-slate-500 focus:border-emerald-300/30"
                  placeholder="Institution name"
                  required
                />
              </label>
              <label className="space-y-2">
                <span className="text-sm font-medium text-slate-200">Phone</span>
                <input
                  value={demoForm.phone}
                  onChange={(event) => setDemoForm((current) => ({ ...current, phone: event.target.value }))}
                  className="w-full rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-white outline-none placeholder:text-slate-500 focus:border-emerald-300/30"
                  placeholder="Optional"
                />
              </label>
            </div>

            <label className="mt-4 block space-y-2">
              <span className="text-sm font-medium text-slate-200">Preferred time</span>
              <input
                value={demoForm.preferredSlot}
                onChange={(event) => setDemoForm((current) => ({ ...current, preferredSlot: event.target.value }))}
                className="w-full rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-white outline-none placeholder:text-slate-500 focus:border-emerald-300/30"
                placeholder="Next week, mornings IST"
              />
            </label>

            <label className="mt-4 block space-y-2">
              <span className="text-sm font-medium text-slate-200">What should we focus on?</span>
              <textarea
                value={demoForm.notes}
                onChange={(event) => setDemoForm((current) => ({ ...current, notes: event.target.value }))}
                rows={5}
                className="w-full rounded-[1.5rem] border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-white outline-none placeholder:text-slate-500 focus:border-emerald-300/30"
                placeholder="Admissions, fee collection, teacher operations, parent communication, analytics, AI..."
              />
            </label>

            {demoStatus ? (
              <div className="mt-4 rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-slate-300">
                {demoStatus}
              </div>
            ) : null}

            <button
              type="submit"
              disabled={demoSubmitting}
              className="mt-6 inline-flex items-center justify-center gap-2 rounded-2xl bg-emerald-400 px-6 py-3.5 text-sm font-bold text-slate-950 transition hover:bg-emerald-300 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {demoSubmitting ? 'Submitting...' : 'Request My Demo'}
              <ArrowRight size={16} />
            </button>
          </form>
        </section>

        <section id="contact" className="rounded-[2rem] border border-white/10 bg-white/[0.03] p-8 md:p-10">
          <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(320px,0.85fr)] lg:items-center">
            <div>
              <div className="text-[11px] font-semibold uppercase tracking-[0.28em] text-emerald-200/75">Contact</div>
              <h2 className="mt-4 text-3xl font-black tracking-tight text-white sm:text-4xl">
                Ready to plan rollout, pricing, or product fit?
              </h2>
              <p className="mt-4 max-w-2xl text-base leading-8 text-slate-300">
                Start with a demo, continue the conversation in Aura, or go straight to the contact team if you already know what you need.
              </p>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Link to="/contact" className="inline-flex items-center justify-center gap-2 rounded-2xl bg-white px-6 py-3.5 text-sm font-bold text-slate-950 transition hover:bg-slate-100">
                  Contact Sales
                  <Mail size={16} />
                </Link>
                <Link to="/assistant" className="inline-flex items-center justify-center gap-2 rounded-2xl border border-white/12 px-6 py-3.5 text-sm font-semibold text-white transition hover:border-emerald-300/35 hover:bg-white/[0.05]">
                  Ask Aura First
                  <Bot size={16} />
                </Link>
              </div>
            </div>

            <div className="grid gap-4">
              <div className="rounded-[1.5rem] border border-white/10 bg-slate-950/60 p-5">
                <div className="flex items-center gap-3 text-white">
                  <LifeBuoy size={18} className="text-emerald-300" />
                  <div className="font-semibold">Sales and implementation</div>
                </div>
                <p className="mt-3 text-sm leading-7 text-slate-400">Use the pricing, demo, and contact flows together for a much stronger enterprise buying experience.</p>
              </div>
              <div className="rounded-[1.5rem] border border-white/10 bg-slate-950/60 p-5">
                <div className="flex items-center gap-3 text-white">
                  <Bot size={18} className="text-emerald-300" />
                  <div className="font-semibold">Aura product guidance</div>
                </div>
                <p className="mt-3 text-sm leading-7 text-slate-400">The assistant supports platform exploration with streaming answers, markdown, and structured school ERP outputs.</p>
              </div>
            </div>
          </div>
        </section>
      </div>
    </PublicSiteFrame>
  );
}
