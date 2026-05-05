import React, { useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  BadgeDollarSign, RefreshCw, Save, Sparkles, Zap, 
  ShieldCheck, ArrowRight, BadgeCheck, Eye, Edit3, 
  ChevronRight, Info, Layers
} from 'lucide-react';
import { platformSettingsApi, subscriptionApi, type SubscriptionPlanResponse } from '../../lib/api';
import { hiddenFeatures } from '../../lib/features';

type DraftMap = Record<string, SubscriptionPlanResponse & { featureText: string }>;

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
  const colors = ['#ffb663', '#22d3ee', '#a78bfa', '#f472b6', '#34d399'];
  return colors[index % colors.length];
}

export default function PricingControlPage() {
  const [drafts, setDrafts] = useState<DraftMap>({});
  const [releasedFeatureCodes, setReleasedFeatureCodes] = useState<string[]>(['*']);
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [activePlanId, setActivePlanId] = useState<string | null>(null);

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
      if (plans.length > 0) setActivePlanId(plans[0].planId);
      setReleasedFeatureCodes(settings?.releasedFeatureCodes || ['*']);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const plans = useMemo(() => Object.values(drafts), [drafts]);
  const activePlan = useMemo(() => activePlanId ? drafts[activePlanId] : null, [activePlanId, drafts]);

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
    <div className="modular-page animate-in" style={{ display: 'flex', flexDirection: 'column', gap: 32, minHeight: '100vh', paddingBottom: 60 }}>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', gap: 24 }}>
        <div style={{ flex: 1 }}>
          <motion.div 
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            style={{ display: 'inline-flex', gap: 8, alignItems: 'center', padding: '6px 14px', borderRadius: 99, background: 'rgba(251,191,36,0.1)', border: '1px solid rgba(251,191,36,0.2)', color: '#fbbf24', fontSize: '0.7rem', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: 16 }}
          >
            <BadgeDollarSign size={14} /> Commercial Controls
          </motion.div>
          <h1 style={{ fontSize: '2.8rem', fontWeight: 900, color: 'var(--text-strong)', margin: '0 0 12px', letterSpacing: '-0.04em' }}>
            Pricing <span style={{ color: '#fbbf24' }}>Architecture</span>
          </h1>
          <p style={{ color: 'var(--text-dim)', margin: 0, maxWidth: 640, lineHeight: 1.6, fontSize: '1rem' }}>
            Define institutional launch postures by adjusting prices, student capacity, and feature entitlements. 
            Changes are reflected in real-time across the public site.
          </p>
        </div>
        <div style={{ display: 'flex', gap: 12 }}>
          <motion.button 
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="secondary-button" 
            onClick={load}
            style={{ padding: '12px 20px', borderRadius: 14, background: 'var(--surface-elevated)', border: '1px solid var(--glass-border)', color: 'var(--text-strong)', fontSize: '0.85rem', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 10 }}
          >
            <RefreshCw size={16} /> Sync Plans
          </motion.button>
        </div>
      </header>

      {loading ? (
        <div style={{ height: 400, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', fontSize: '0.9rem', gap: 12 }}>
          <RefreshCw size={20} className="animate-spin" /> Retrieving commercial definitions...
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', gap: 40, alignItems: 'start' }}>
          
          {/* Left Column: Editor */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
            <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 12, borderBottom: '1px solid var(--glass-border)' }}>
              {plans.map((p, idx) => (
                <button
                  key={p.planId}
                  onClick={() => setActivePlanId(p.planId)}
                  style={{
                    padding: '10px 18px',
                    borderRadius: 12,
                    background: activePlanId === p.planId ? 'rgba(251,191,36,0.15)' : 'transparent',
                    border: '1px solid',
                    borderColor: activePlanId === p.planId ? '#fbbf24' : 'transparent',
                    color: activePlanId === p.planId ? '#fbbf24' : 'var(--text-dim)',
                    fontSize: '0.82rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                    whiteSpace: 'nowrap',
                    transition: 'all 0.2s'
                  }}
                >
                  {p.planName}
                </button>
              ))}
            </div>

            <AnimatePresence mode="wait">
              {activePlan && (
                <motion.div
                  key={activePlan.planId}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.3 }}
                  style={{ display: 'flex', flexDirection: 'column', gap: 24 }}
                >
                  <div style={{ padding: 32, borderRadius: 28, background: 'rgba(15,23,42,0.4)', border: '1px solid var(--glass-border)', display: 'grid', gap: 24 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                        <div style={{ width: 48, height: 48, borderRadius: 14, background: 'rgba(251,191,36,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fbbf24' }}>
                          <Edit3 size={20} />
                        </div>
                        <div>
                          <div style={{ fontSize: '0.68rem', fontWeight: 900, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.12em' }}>Configuration</div>
                          <h2 style={{ margin: 0, fontSize: '1.4rem', fontWeight: 900, color: '#fff' }}>{activePlan.planName}</h2>
                        </div>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 12px', borderRadius: 10, background: 'rgba(52,211,153,0.1)', border: '1px solid rgba(52,211,153,0.2)', color: '#34d399', fontSize: '0.72rem', fontWeight: 700 }}>
                        <Sparkles size={12} /> Live Strategy
                      </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                        <label style={{ fontSize: '0.7rem', fontWeight: 900, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Plan Name</label>
                        <input
                          type="text"
                          value={activePlan.planName}
                          onChange={(e) => updateDraft(activePlan.planId, { planName: e.target.value })}
                          style={{ width: '100%', borderRadius: 14, padding: '14px 18px', background: 'rgba(255,255,255,0.03)', border: '1px solid var(--glass-border)', color: '#fff', fontSize: '0.95rem' }}
                        />
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                        <label style={{ fontSize: '0.7rem', fontWeight: 900, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Internal Code</label>
                        <input
                          type="text"
                          value={activePlan.planCode}
                          onChange={(e) => updateDraft(activePlan.planId, { planCode: e.target.value })}
                          style={{ width: '100%', borderRadius: 14, padding: '14px 18px', background: 'rgba(255,255,255,0.03)', border: '1px solid var(--glass-border)', color: '#fff', fontSize: '0.95rem' }}
                        />
                      </div>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                      <label style={{ fontSize: '0.7rem', fontWeight: 900, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Public Description</label>
                      <textarea
                        value={activePlan.description}
                        onChange={(e) => updateDraft(activePlan.planId, { description: e.target.value })}
                        style={{ width: '100%', minHeight: 80, borderRadius: 14, padding: '14px 18px', background: 'rgba(255,255,255,0.03)', border: '1px solid var(--glass-border)', color: '#fff', fontSize: '0.95rem', lineHeight: 1.6, resize: 'vertical' }}
                        placeholder="Explain the value proposition of this plan..."
                      />
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                        <label style={{ fontSize: '0.7rem', fontWeight: 900, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Monthly Fee (INR)</label>
                        <div style={{ position: 'relative' }}>
                          <span style={{ position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', fontWeight: 700 }}>₹</span>
                          <input
                            type="number"
                            value={activePlan.monthlyPrice}
                            onChange={(e) => updateDraft(activePlan.planId, { monthlyPrice: Number(e.target.value) as any })}
                            style={{ width: '100%', borderRadius: 14, padding: '14px 18px 14px 32px', background: 'rgba(255,255,255,0.03)', border: '1px solid var(--glass-border)', color: '#fff', fontSize: '1.1rem', fontWeight: 800 }}
                          />
                        </div>
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                        <label style={{ fontSize: '0.7rem', fontWeight: 900, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Student Cap</label>
                        <div style={{ position: 'relative' }}>
                          <Users size={16} style={{ position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                          <input
                            type="number"
                            value={activePlan.maxStudents}
                            onChange={(e) => updateDraft(activePlan.planId, { maxStudents: Number(e.target.value) as any })}
                            style={{ width: '100%', borderRadius: 14, padding: '14px 18px 14px 44px', background: 'rgba(255,255,255,0.03)', border: '1px solid var(--glass-border)', color: '#fff', fontSize: '1.1rem', fontWeight: 800 }}
                          />
                        </div>
                      </div>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <label style={{ fontSize: '0.7rem', fontWeight: 900, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Feature Entitlements</label>
                        <span style={{ fontSize: '0.65rem', color: '#fbbf24', fontWeight: 700 }}>One technical code per line</span>
                      </div>
                      <textarea
                        value={activePlan.featureText}
                        onChange={(e) => updateDraft(activePlan.planId, { featureText: e.target.value })}
                        style={{ 
                          width: '100%', 
                          minHeight: 200, 
                          borderRadius: 18, 
                          padding: '16px 20px', 
                          background: 'rgba(0,0,0,0.2)', 
                          border: '1px solid var(--glass-border)', 
                          color: '#fbbf24', 
                          fontFamily: "'JetBrains Mono', monospace", 
                          fontSize: '0.85rem', 
                          lineHeight: 1.7,
                          letterSpacing: '0.02em'
                        }}
                        placeholder="ACADEMICS_BASE\nFINANCE_CORE\n..."
                      />
                    </div>

                    <motion.button 
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => savePlan(activePlan.planId)} 
                      disabled={savingId === activePlan.planId}
                      style={{ 
                        marginTop: 12, 
                        padding: '18px', 
                        borderRadius: 18, 
                        background: '#fbbf24', 
                        border: 'none', 
                        color: '#020617', 
                        fontWeight: 900, 
                        fontSize: '1rem', 
                        cursor: 'pointer', 
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'center', 
                        gap: 12,
                        boxShadow: '0 10px 30px rgba(251,191,36,0.2)'
                      }}
                    >
                      {savingId === activePlan.planId ? (
                        <>
                          <RefreshCw size={18} className="animate-spin" /> Synchronizing...
                        </>
                      ) : (
                        <>
                          <Save size={18} /> Deploy Changes to Public
                        </>
                      )}
                    </motion.button>
                  </div>

                  <div style={{ padding: '24px', borderRadius: 24, background: 'rgba(251,191,36,0.05)', border: '1px solid rgba(251,191,36,0.1)', display: 'flex', gap: 16, alignItems: 'center' }}>
                    <div style={{ width: 40, height: 40, borderRadius: 12, background: 'rgba(251,191,36,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fbbf24', flexShrink: 0 }}>
                      <Info size={18} />
                    </div>
                    <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-soft)', lineHeight: 1.5 }}>
                      Feature codes are validated against the <strong>Platform Engine</strong> registry. 
                      Ensure codes match technical release definitions to prevent UI mismatch.
                    </p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Right Column: Sticky Preview */}
          <div style={{ position: 'sticky', top: 32, display: 'flex', flexDirection: 'column', gap: 24 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, color: 'var(--text-muted)', fontSize: '0.7rem', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.12em', paddingLeft: 10 }}>
              <Eye size={14} /> Live Public Preview
            </div>

            <AnimatePresence mode="wait">
              {activePlan && (
                <motion.div
                  key={`preview-${activePlan.planId}`}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  style={{
                    padding: '40px 32px',
                    borderRadius: 32,
                    background: 'rgba(15,23,42,0.6)',
                    border: '1px solid rgba(255,255,255,0.06)',
                    backdropFilter: 'blur(40px)',
                    boxShadow: '0 40px 100px rgba(0,0,0,0.4)',
                    position: 'relative',
                    overflow: 'hidden'
                  }}
                >
                  {/* Decorative Glow */}
                  <div style={{ position: 'absolute', top: -100, right: -100, width: 250, height: 250, borderRadius: '50%', background: `radial-gradient(circle, ${accentForPlan(plans.indexOf(activePlan))}22 0%, transparent 70%)`, filter: 'blur(40px)' }} />

                  <div style={{ position: 'relative' }}>
                    <div style={{ fontSize: '0.65rem', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.24em', color: accentForPlan(plans.indexOf(activePlan)), marginBottom: 12 }}>
                      {activePlan.planCode}
                    </div>
                    <h2 style={{ fontSize: '2.2rem', fontWeight: 900, color: '#fff', margin: '0 0 8px', letterSpacing: '-0.02em' }}>
                      {activePlan.planName}
                    </h2>
                    <div style={{ fontSize: '1.8rem', fontWeight: 900, color: '#fff', marginBottom: 24, display: 'flex', alignItems: 'baseline', gap: 4 }}>
                      {formatCurrency(Number(activePlan.monthlyPrice))}
                      <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)', fontWeight: 600 }}>/month</span>
                    </div>

                    <p style={{ color: 'var(--text-soft)', fontSize: '0.95rem', lineHeight: 1.6, marginBottom: 28, minHeight: 60 }}>
                      {activePlan.description}
                    </p>

                    <div style={{ padding: '14px 18px', borderRadius: 16, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', marginBottom: 28 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.85rem', fontWeight: 700, color: '#fff' }}>
                        <Users size={16} color={accentForPlan(plans.indexOf(activePlan))} />
                        Student capacity: {Number(activePlan.maxStudents).toLocaleString()}
                      </div>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 36 }}>
                      {activePlan.featureText.split('\n').filter(Boolean).slice(0, 8).map((f, i) => (
                        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: '0.88rem', color: '#fff', fontWeight: 500 }}>
                          <BadgeCheck size={16} color={accentForPlan(plans.indexOf(activePlan))} />
                          {humanizeFeature(f)}
                        </div>
                      ))}
                      {activePlan.featureText.split('\n').filter(Boolean).length > 8 && (
                        <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600, paddingLeft: 26 }}>
                          + {activePlan.featureText.split('\n').filter(Boolean).length - 8} more operational modules
                        </div>
                      )}
                    </div>

                    <div style={{ 
                      padding: '16px', 
                      borderRadius: 18, 
                      background: accentForPlan(plans.indexOf(activePlan)), 
                      color: '#020617', 
                      fontWeight: 900, 
                      textAlign: 'center', 
                      fontSize: '0.95rem', 
                      display: 'flex', 
                      alignItems: 'center', 
                      justifyContent: 'center', 
                      gap: 8,
                      opacity: 0.9
                    }}>
                      Choose this plan
                      <ArrowRight size={16} />
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <div style={{ padding: 32, borderRadius: 28, background: 'linear-gradient(135deg, rgba(34,211,238,0.1), rgba(129,140,248,0.05))', border: '1px solid rgba(34,211,238,0.2)', display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div style={{ width: 40, height: 40, borderRadius: 12, background: 'rgba(34,211,238,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#22d3ee' }}>
                <Layers size={18} />
              </div>
              <div>
                <h4 style={{ margin: '0 0 6px', fontSize: '1rem', fontWeight: 900, color: '#fff' }}>Post-Launch Control</h4>
                <p style={{ margin: 0, fontSize: '0.82rem', color: '#67e8f9', lineHeight: 1.6 }}>
                  Commercial changes take effect immediately for new registrations. 
                  Existing tenants are protected by their original subscription terms until renewal.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
