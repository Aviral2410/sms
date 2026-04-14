import React, { useEffect, useMemo, useState } from 'react';
import { ArrowRight, BadgeCheck, CheckCircle2, ShieldCheck, Sparkles, Zap } from 'lucide-react';
import { Link } from 'react-router-dom';
import { HoverTiltCard } from '../components/public/HoverTiltCard';
import { PublicPretextHeading } from '../components/public/PublicPretextHeading';
import { PublicSiteFrame } from '../components/public/PublicSiteFrame';
import { ScrollReveal } from '../components/public/ScrollReveal';
import { usePublicSiteContent } from '../hooks/usePublicSiteContent';
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

  const featureMatrix = useMemo(() => Array.from(new Set(plans.flatMap((plan) => plan.featureCodes || []))), [plans]);

  useEffect(() => {
    publicSiteApi.getPlans()
      .then((response) => {
        setPlans(response);
        setError(null);
      })
      .catch(() => setError('Pricing data is unavailable right now.'));
  }, []);

  return (
    <PublicSiteFrame content={content} activePath="/pricing" mode="ambient" density={1.12}>
      <section className="public-page-intro public-page-intro--wide">
        <PublicPretextHeading
          eyebrow="Pricing"
          pretext="Plans"
          title={content?.pricingHeadline || 'Commercial plans shaped around rollout depth and operational capacity.'}
          description={content?.pricingBody || 'Choose the pricing lane that matches launch speed, user volume, and how much institutional workflow you want connected from day one.'}
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
              {plans.map((plan, index) => (
                <ScrollReveal key={plan.planId} delay={index * 0.06}>
                  <HoverTiltCard className="public-site-plan-card public-site-plan-card--spotlit public-panel--strong" accentColor={accentForPlan(index)} as="article" maxTilt={12}>
                    <div className="public-site-plan-card__code">{plan.planCode}</div>
                    <h2>{plan.planName}</h2>
                    <div className="public-site-plan-card__price">{formatCurrency(Number(plan.monthlyPrice))}<span>/month</span></div>
                    <p>{plan.description}</p>
                    <div className="public-site-plan-card__metric">Student capacity: {plan.maxStudents.toLocaleString()}</div>
                    <ul>
                      {plan.featureCodes.map((feature) => (
                        <li key={feature}><BadgeCheck size={14} color={accentForPlan(index)} /> {humanizeFeature(feature)}</li>
                      ))}
                    </ul>
                    <Link to="/onboarding" className="public-primary-button">
                      Choose this plan
                      <ArrowRight size={16} />
                    </Link>
                  </HoverTiltCard>
                </ScrollReveal>
              ))}
            </div>
          </section>

          <section className="public-site-section">
            <div className="public-feature-lattice public-panel">
              <div className="public-feature-lattice__header">
                <div>
                  <div className="public-feature-lattice__eyebrow">Feature matrix</div>
                  <h3>What each subscription unlocks</h3>
                  <p>Every lane below comes directly from the subscription service, so commercial packaging and feature visibility stay aligned.</p>
                </div>
                <div className="public-feature-lattice__legend">
                  {plans.map((plan, index) => (
                    <div key={plan.planId} className="public-feature-lattice__legend-card" style={{ '--plan-accent': accentForPlan(index) } as React.CSSProperties}>
                      <span>{plan.planCode}</span>
                      <strong>{formatCurrency(Number(plan.monthlyPrice))}</strong>
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
                      {plans.map((plan, index) => {
                        const enabled = plan.featureCodes.includes(feature);
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
