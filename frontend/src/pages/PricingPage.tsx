import React, { useEffect, useMemo, useState } from 'react';
import { ArrowRight, BadgeCheck, CheckCircle2, ShieldCheck, Sparkles, Zap } from 'lucide-react';
import { Link } from 'react-router-dom';
import { HoverTiltCard } from '../components/public/HoverTiltCard';
import { PublicPretextHeading } from '../components/public/PublicPretextHeading';
import { PublicSiteFrame } from '../components/public/PublicSiteFrame';
import { ScrollReveal } from '../components/public/ScrollReveal';
import { usePublicSiteContent } from '../hooks/usePublicSiteContent';
import { platformSettingsApi, type PublicPlatformSettingsResponse } from '../lib/api';
import { filterVisibleFeatures, hiddenFeatures } from '../lib/features';
import { publicSiteApi } from '../lib/publicSiteApi';
import type { SubscriptionPlanResponse } from '../lib/api';

function formatCurrency(value: number) {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(value);
}

function humanizeFeature(feature: string) {
  return feature
    .split('_')
    .map((part) => part.charAt(0) + part.slice(1).toLowerCase())
    .join(' ');
}

function accentForPlan(index: number) {
  if (index === 1) return '#22d3ee';
  if (index === 2) return '#a78bfa';
  return '#ffb663';
}

export default function PricingPage() {
  const { content } = usePublicSiteContent();
  const [plans, setPlans] = useState<SubscriptionPlanResponse[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [platformSettings, setPlatformSettings] = useState<PublicPlatformSettingsResponse | null>(null);

  const orderedPlans = useMemo(() => {
    const safe = [...plans];
    const isCommercial = (plan: SubscriptionPlanResponse) => {
      const code = (plan.planCode || '').toUpperCase();
      const name = (plan.planName || '').toUpperCase();
      return code.includes('COMMERCIAL') || name.includes('COMMERCIAL');
    };

    safe.sort((a, b) => {
      const aCommercial = isCommercial(a);
      const bCommercial = isCommercial(b);
      if (aCommercial === bCommercial) return 0;
      return aCommercial ? -1 : 1;
    });

    const commercialIndex = safe.findIndex(isCommercial);
    if (commercialIndex > 0 && safe.length >= 3) {
      const [commercial] = safe.splice(commercialIndex, 1);
      safe.splice(1, 0, commercial);
    }

    return safe;
  }, [plans]);

  const visiblePlans = useMemo(() => (
    orderedPlans.map((plan) => ({
      ...plan,
      visibleFeatureCodes: filterVisibleFeatures(plan.featureCodes, platformSettings?.releasedFeatureCodes),
      unreleasedFeatureCodes: hiddenFeatures(plan.featureCodes, platformSettings?.releasedFeatureCodes),
    }))
  ), [orderedPlans, platformSettings?.releasedFeatureCodes]);

  const featureMatrix = useMemo(
    () => Array.from(new Set(visiblePlans.flatMap((plan) => plan.visibleFeatureCodes || []))),
    [visiblePlans],
  );

  useEffect(() => {
    Promise.all([
      publicSiteApi.getPlans(),
      platformSettingsApi.getPublicSettings().catch(() => null),
    ])
      .then(([response, settings]) => {
        setPlans(response);
        setPlatformSettings(settings);
        setError(null);
      })
      .catch(() => setError('Pricing data is unavailable right now.'));
  }, []);

  return (
    <PublicSiteFrame content={content} activePath="/pricing" mode="ambient" density={1.12}>
      <section className="public-page-intro public-page-intro--focus">
        <PublicPretextHeading
          eyebrow="Pricing"
          pretext="Plans"
          title={content?.pricingHeadline || 'Commercial plans shaped around rollout depth and operational capacity.'}
          description={content?.pricingBody || 'Choose the pricing lane that matches launch speed, user volume, and how much institutional workflow you want connected from day one.'}
          align="center"
        />
      </section>

      {error ? (
        <section className="public-site-section">
          <div className="public-site-empty public-panel">{error}</div>
        </section>
      ) : (
        <>
          <section className="public-site-section">
            <div className="public-grid-3">
              {visiblePlans.map((plan, index) => {
                const featured = (plan.planCode || '').toUpperCase().includes('COMMERCIAL') || (plan.planName || '').toUpperCase().includes('COMMERCIAL') || index === 1;
                return (
                <ScrollReveal key={plan.planId} delay={index * 0.06}>
                  <HoverTiltCard
                    className={`public-site-plan-card public-site-plan-card--spotlit public-panel--strong${featured ? ' public-site-plan-card--featured' : ''}`}
                    accentColor={accentForPlan(index)}
                    as="article"
                    maxTilt={12}
                  >
                    <div className="public-site-plan-card__code">{plan.planCode}</div>
                    <h2>{plan.planName}</h2>
                    <div className="public-site-plan-card__price">{formatCurrency(Number(plan.monthlyPrice))}<span>/month</span></div>
                    <p>{plan.description}</p>
                    <div className="public-site-plan-card__metric">Student capacity: {plan.maxStudents.toLocaleString()}</div>
                    <ul>
                      {plan.visibleFeatureCodes.map((feature) => (
                        <li key={feature}><BadgeCheck size={14} color={accentForPlan(index)} /> {humanizeFeature(feature)}</li>
                      ))}
                    </ul>
                    {plan.unreleasedFeatureCodes.length > 0 ? (
                      <div className="public-site-empty public-panel" style={{ padding: '12px 14px', fontSize: '0.82rem', gap: 8 }}>
                        <ShieldCheck size={16} />
                        Some features in this plan are not yet enabled for release. Contact your admin for rollout timing.
                      </div>
                    ) : null}
                    <Link to="/onboarding" className="public-primary-button public-site-plan-card__cta">
                      Choose this plan
                      <ArrowRight size={16} />
                    </Link>
                  </HoverTiltCard>
                </ScrollReveal>
                );
              })}
            </div>
          </section>

          <section className="public-site-section">
            <div className="public-feature-lattice public-panel" style={{ ['--plan-count' as any]: orderedPlans.length } as React.CSSProperties}>
              <div className="public-feature-lattice__header" style={{ padding: '24px 32px' }}>
                <div>
                  <div className="public-feature-lattice__eyebrow" style={{ color: '#10b981' }}>Feature matrix</div>
                  <h3 style={{ fontSize: '1.8rem', marginBottom: 8 }}>What each subscription unlocks</h3>
                  <p className="public-muted" style={{ maxWidth: 500 }}>Every lane below comes directly from the subscription service and platform release settings, so unreleased capabilities stay hidden until rollout.</p>
                </div>
                <div className="public-feature-lattice__legend">
                  {visiblePlans.map((plan, index) => (
                    <div key={plan.planId} className="public-feature-lattice__legend-card" style={{ '--plan-accent': accentForPlan(index), minWidth: 120 } as React.CSSProperties}>
                      <span style={{ fontSize: 10 }}>{plan.planCode}</span>
                      <strong style={{ fontSize: 16 }}>{formatCurrency(Number(plan.monthlyPrice))}</strong>
                    </div>
                  ))}
                </div>
              </div>

              <div className="public-feature-lattice__rows">
                {featureMatrix.map((feature) => (
                  <div key={feature} className="public-feature-lattice__row">
                    <div className="public-feature-lattice__feature">
                      <strong>{humanizeFeature(feature)}</strong>
                      <span>Included where this operational capability is part of the package.</span>
                    </div>
                    <div className="public-feature-lattice__plan-strip">
                      {visiblePlans.map((plan, index) => {
                        const enabled = plan.visibleFeatureCodes.includes(feature);
                        return (
                          <div
                            key={`${plan.planId}-${feature}`}
                            className={`public-feature-lattice__plan-cell${enabled ? ' is-active' : ''}`}
                            style={{ '--plan-accent': accentForPlan(index) } as React.CSSProperties}
                          >
                            {enabled ? (
                              <>
                                <CheckCircle2 size={18} />
                                <span>Included</span>
                              </>
                            ) : (
                              <span className="public-feature-lattice__inactive">Not in plan</span>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {visiblePlans.some((plan) => plan.unreleasedFeatureCodes.length > 0) ? (
            <section className="public-site-section">
              <div className="public-site-empty public-panel">
                <ShieldCheck size={18} />
                Some capabilities exist in commercial plans but are not yet enabled on the live UI. Contact your platform admin for rollout status.
              </div>
            </section>
          ) : null}
        </>
      )}

      <section className="public-site-section">
        <div className="public-launch-grid">
          <HoverTiltCard className="public-launch-card public-panel" accentColor="#22d3ee" as="article" maxTilt={12}>
            <div className="public-status-chip"><ShieldCheck size={14} /> Rollout fit</div>
            <h3>Need help choosing the right path?</h3>
            <p>We can help map student capacity, launch expectations, and the operational depth your institution actually needs.</p>
            <Link to="/contact" className="public-secondary-button public-launch-card__button">Talk to the team</Link>
          </HoverTiltCard>
          <HoverTiltCard className="public-launch-card public-panel--strong" accentColor="#ffb663" as="article" maxTilt={12}>
            <div className="public-status-chip"><Zap size={14} /> Fast launch</div>
            <h3>Ready to move?</h3>
            <p>Start onboarding directly and let the platform team work with you from registration through activation.</p>
            <Link to="/onboarding" className="public-primary-button public-launch-card__button">
              Start onboarding
              <ArrowRight size={16} />
            </Link>
          </HoverTiltCard>
        </div>
      </section>

      <section className="public-site-section">
        <div className="public-site-empty public-panel">
          <Sparkles size={18} />
          Each plan is meant to feel like a launch posture, not a random pricing tier.
        </div>
      </section>
    </PublicSiteFrame>
  );
}
