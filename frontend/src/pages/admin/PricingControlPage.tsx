import React, { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { BadgeDollarSign, RefreshCw, Save, Sparkles } from 'lucide-react';
import { platformSettingsApi, subscriptionApi, type SubscriptionPlanResponse } from '../../lib/api';
import { hiddenFeatures } from '../../lib/features';

type DraftMap = Record<string, SubscriptionPlanResponse & { featureText: string }>;

export default function PricingControlPage() {
  const [drafts, setDrafts] = useState<DraftMap>({});
  const [releasedFeatureCodes, setReleasedFeatureCodes] = useState<string[]>(['*']);
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    try {
      const [plans, settings] = await Promise.all([
        subscriptionApi.listPlans(),
        platformSettingsApi.getSettings().catch(() => null),
      ]);
      const next: DraftMap = {};
      plans.forEach((plan) => {
        next[plan.planId] = {
          ...plan,
          featureText: (plan.featureCodes || []).join('\n'),
        };
      });
      setDrafts(next);
      setReleasedFeatureCodes(settings?.releasedFeatureCodes || ['*']);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const plans = useMemo(() => Object.values(drafts), [drafts]);

  const updateDraft = (planId: string, patch: Partial<SubscriptionPlanResponse & { featureText: string }>) => {
    setDrafts((current) => ({
      ...current,
      [planId]: {
        ...current[planId],
        ...patch,
      },
    }));
  };

  const savePlan = async (planId: string) => {
    const draft = drafts[planId];
    if (!draft) return;
    setSavingId(planId);
    try {
      const updated = await subscriptionApi.updatePlanDefinition(planId, {
        planName: draft.planName,
        planCode: draft.planCode,
        description: draft.description,
        monthlyPrice: Number(draft.monthlyPrice),
        maxStudents: Number(draft.maxStudents),
        maxParentsPerStudent: Number(draft.maxParentsPerStudent),
        featureCodes: draft.featureText
          .split('\n')
          .map((item) => item.trim())
          .filter(Boolean),
      });

      updateDraft(planId, {
        ...updated,
        featureText: (updated.featureCodes || []).join('\n'),
      });
    } finally {
      setSavingId(null);
    }
  };

  return (
    <div className="modular-page animate-in" style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <header className="page-header">
        <div className="header-content">
          <span className="eyebrow" style={{ display: 'inline-flex', gap: 8, alignItems: 'center' }}>
            <BadgeDollarSign size={14} className="text-amber-400" /> Commercial Controls
          </span>
          <h1>Plan pricing and feature controls</h1>
          <p>Change plan prices, capacity, and plan entitlements here. UI visibility for unreleased features is controlled separately from Platform Engine.</p>
        </div>
        <div className="header-actions">
          <button className="secondary-button compact" onClick={load}>
            <RefreshCw size={14} /> Refresh
          </button>
        </div>
      </header>

      {loading ? (
        <div className="dashboard-card" style={{ padding: 28, textAlign: 'center', color: 'var(--text-muted)' }}>Loading plans...</div>
      ) : (
        <section className="dashboard-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))' }}>
          {plans.map((plan) => (
            (() => {
              const unreleased = hiddenFeatures(plan.featureCodes || [], releasedFeatureCodes);
              return (
            <motion.article
              key={plan.planId}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="dashboard-card"
              style={{ padding: 24, display: 'grid', gap: 14, border: '1px solid rgba(251,191,36,0.16)', background: 'linear-gradient(160deg, rgba(251,191,36,0.08), rgba(15,23,42,0.9))' }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'center' }}>
                <div>
                  <div style={{ fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.18em', color: '#fbbf24', fontWeight: 800 }}>{plan.planCode}</div>
                  <h3 style={{ margin: '6px 0 0', color: '#fff' }}>{plan.planName}</h3>
                </div>
                <div className="public-status-chip"><Sparkles size={14} /> Live public plan</div>
              </div>

              <label>
                <span className="text-xs uppercase font-black text-slate-500 tracking-widest mb-2 block">Description</span>
                <textarea
                  value={plan.description}
                  onChange={(e) => updateDraft(plan.planId, { description: e.target.value })}
                  style={{ width: '100%', minHeight: 92, borderRadius: 14, padding: 12, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', color: '#fff', fontFamily: 'inherit' }}
                />
              </label>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <label>
                  <span className="text-xs uppercase font-black text-slate-500 tracking-widest mb-2 block">Monthly price</span>
                  <input
                    type="number"
                    value={plan.monthlyPrice}
                    onChange={(e) => updateDraft(plan.planId, { monthlyPrice: Number(e.target.value) as any })}
                    style={{ width: '100%', borderRadius: 12, padding: 12, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', color: '#fff' }}
                  />
                </label>
                <label>
                  <span className="text-xs uppercase font-black text-slate-500 tracking-widest mb-2 block">Student capacity</span>
                  <input
                    type="number"
                    value={plan.maxStudents}
                    onChange={(e) => updateDraft(plan.planId, { maxStudents: Number(e.target.value) as any })}
                    style={{ width: '100%', borderRadius: 12, padding: 12, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', color: '#fff' }}
                  />
                </label>
              </div>

              <label>
                <span className="text-xs uppercase font-black text-slate-500 tracking-widest mb-2 block">Features, one per line</span>
                <textarea
                  value={plan.featureText}
                  onChange={(e) => updateDraft(plan.planId, { featureText: e.target.value })}
                  style={{ width: '100%', minHeight: 160, borderRadius: 14, padding: 12, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', color: '#fff', fontFamily: 'inherit' }}
                />
              </label>

              {unreleased.length > 0 ? (
                <div className="public-site-empty public-panel" style={{ padding: '12px 14px', fontSize: '0.82rem' }}>
                  {unreleased.length} feature{unreleased.length > 1 ? 's are' : ' is'} included in this plan but hidden on the live UI until released from Platform Engine.
                </div>
              ) : null}

              <button className="primary-button compact" onClick={() => savePlan(plan.planId)} disabled={savingId === plan.planId}>
                <Save size={14} /> {savingId === plan.planId ? 'Saving...' : 'Save plan changes'}
              </button>
            </motion.article>
              );
            })()
          ))}
        </section>
      )}
    </div>
  );
}
