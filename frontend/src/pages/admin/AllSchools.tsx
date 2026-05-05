import React, { useEffect, useState } from 'react';
import { onboardingApi, OnboardingResponse, subscriptionApi, TenantSubscriptionResponse, SubscriptionPlanResponse } from '../../lib/api';
import { Building2, ShieldCheck, Mail, Calendar, Loader, Ban, RefreshCw, Zap, CheckCircle2, X, Search } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';

const DIM = '#8b95a2'; const BORDER = 'rgba(255,255,255,0.08)';

export default function AllSchools() {
  const [loading, setLoading] = useState(true);
  const [schools, setSchools] = useState<OnboardingResponse[]>([]);
  const [subscriptions, setSubscriptions] = useState<Record<string, TenantSubscriptionResponse>>({});
  const [plans, setPlans] = useState<SubscriptionPlanResponse[]>([]);
  const [hoverPlan, setHoverPlan] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  // Update Plan modal state
  const [updateModal, setUpdateModal] = useState<{ tenantId: string; schoolName: string; currentPlanId?: string } | null>(null);
  const [selectedPlan, setSelectedPlan] = useState('');
  const [updating, setUpdating] = useState(false);

  const fetchData = async (query?: string) => {
    setLoading(true);
    try {
      const [onboardings, subs, allPlans] = await Promise.all([
        onboardingApi.listAll(query),
        subscriptionApi.listAll(),
        subscriptionApi.listPlans()
      ]);
      const approved = onboardings.filter((d: OnboardingResponse) => d.status === 'APPROVED' && !!d.tenantId);
      setSchools(approved);
      setPlans(allPlans);
      const subMap: Record<string, TenantSubscriptionResponse> = {};
      subs.forEach((s: TenantSubscriptionResponse) => { subMap[s.tenantId] = s; });
      setSubscriptions(subMap);
    } catch (e) {
      toast.error('Failed to load schools and subscription data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchData(search);
    }, 400);
    return () => clearTimeout(timer);
  }, [search]);

  const handleRevoke = async (tenantId?: string | null) => {
    if (!tenantId) {
      toast.error('Missing tenant id for this school.');
      return;
    }
    if (!confirm('REVOKE this school\'s subscription? Access will be removed immediately.')) return;
    try {
      await subscriptionApi.updateStatus(tenantId, 'REVOKED');
      toast.success('Subscription revoked.');
      await fetchData(search);
    } catch {
      toast.error('Failed to revoke subscription.');
    }
  };

  const handleOpenUpdate = (s: OnboardingResponse, sub?: TenantSubscriptionResponse) => {
    if (!s.tenantId) {
      toast.error('Cannot update plan: missing tenant id.');
      return;
    }
    const tenantId = s.tenantId;
    const fallbackPlanId = plans.find((plan) => plan.planCode === s.selectedPlanCode)?.planId;
    setSelectedPlan(sub?.planId || fallbackPlanId || '');
    setUpdateModal({ tenantId, schoolName: s.schoolName, currentPlanId: sub?.planId || fallbackPlanId });
  };

  const handleUpdatePlan = async () => {
    if (!updateModal || !selectedPlan) return;
    setUpdating(true);
    try {
      await subscriptionApi.updatePlan(updateModal.tenantId, selectedPlan);
      setUpdateModal(null);
      toast.success('Subscription plan updated.');
      await fetchData(search);
    } catch {
      toast.error('Failed to update plan.');
    } finally {
      setUpdating(false);
    }
  };

  const statusColor = (status?: string) => ({
    ACTIVE: '#34d399',
    TRIAL: '#6366f1',
    PENDING_PAYMENT: '#fb7185',
    REVOKED: '#f87171',
    CANCELLED: '#94a3b8',
    EXPIRED: '#fbbf24'
  }[status || ''] || DIM);

  const GRID_STYLE = {
    display: 'grid',
    gridTemplateColumns: '1.2fr 1fr 0.6fr 0.6fr 0.6fr 0.8fr',
    gap: '16px',
    alignItems: 'center',
    padding: '16px 24px'
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
        <div>
          <h1 style={{ fontSize: '2.5rem', fontWeight: 900, color: '#fff', margin: '0 0 6px', letterSpacing: '-0.04em' }}>All Schools</h1>
          <p style={{ color: DIM, margin: 0, fontSize: '0.9rem' }}>Manage active tenants and subscription plans</p>
        </div>
        {/* Stats */}
        <div style={{ display: 'flex', gap: 16 }}>
          {[
            { label: 'Total', value: schools.length, color: '#22d3ee' },
            { label: 'Active', value: Object.values(subscriptions).filter(s => s.status === 'ACTIVE').length, color: '#34d399' },
            { label: 'Trial', value: Object.values(subscriptions).filter(s => s.status === 'TRIAL').length, color: '#6366f1' },
          ].map(st => (
            <div key={st.label} style={{ textAlign: 'center', padding: '12px 20px', borderRadius: 16, background: `${st.color}08`, border: `1px solid ${st.color}20` }}>
              <div style={{ fontSize: '1.5rem', fontWeight: 900, color: '#fff' }}>{st.value}</div>
              <div style={{ fontSize: '0.7rem', fontWeight: 700, color: st.color, textTransform: 'uppercase' }}>{st.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Search */}
      <div style={{ position: 'relative' }}>
        <Search size={16} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: '#475569' }} />
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by school name or code..."
          style={{ width: '100%', boxSizing: 'border-box', padding: '12px 14px 12px 42px', borderRadius: 14, background: 'rgba(255,255,255,0.03)', border: `1px solid ${BORDER}`, color: '#fff', fontSize: '0.88rem', outline: 'none', fontFamily: 'inherit' }} />
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {/* Header */}
        <div style={{ ...GRID_STYLE, paddingBottom: 8, color: DIM, fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.1em', fontWeight: 800 }}>
           <div>School & Code</div>
           <div>Admin Contact</div>
           <div>Plan</div>
           <div>Account Status</div>
           <div>Subscription Status</div>
           <div style={{ textAlign: 'right' }}>Actions</div>
        </div>

        {loading ? (
          <div style={{ padding: 80, textAlign: 'center', color: DIM }}><Loader size={32} style={{ animation: 'spin 1s linear infinite' }} /></div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {schools.map(s => {
              const sub = s.tenantId ? subscriptions[s.tenantId] : undefined;
              const selectedPlanCode = s.selectedPlanCode || 'BASIC';
              const plan = plans.find(p => p.planId === sub?.planId || p.planCode === selectedPlanCode);
              const displayPlanName = sub?.planName || selectedPlanCode;
              const features = plan?.features ? plan.features.split(',') : [];
              const sc = statusColor(sub?.status);
              return (
                <motion.div key={s.onboardingId} whileHover={{ scale: 1.002, x: 4 }}
                  style={{ ...GRID_STYLE, background: 'rgba(255,255,255,0.02)', borderRadius: 20, border: `1px solid ${BORDER}`, transition: 'all 0.2s' }}>
                  
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{ width: 40, height: 40, borderRadius: 12, background: 'rgba(34,211,238,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid rgba(34,211,238,0.2)' }}>
                      <Building2 size={18} color="#22d3ee" />
                    </div>
                    <div className="min-w-0">
                      <div style={{ fontWeight: 800, fontSize: '0.9rem', color: '#fff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{s.schoolName}</div>
                      <div style={{ fontSize: '0.7rem', color: '#ffb663', fontWeight: 700, marginTop: 2 }}>{s.schoolCode}</div>
                    </div>
                  </div>

                  <div style={{ color: DIM, min-w: 0 }}>
                    <div style={{ fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: 6, color: '#e2e8f0' }}><Mail size={13} />{s.adminEmail}</div>
                    <div style={{ fontSize: '0.7rem', opacity: 0.6, marginTop: 3, display: 'flex', alignItems: 'center', gap: 6 }}><Calendar size={11} />Joined {new Date(s.createdAt).toLocaleDateString()}</div>
                  </div>

                  <div style={{ position: 'relative' }}>
                    <div onMouseEnter={() => setHoverPlan(s.onboardingId)} onMouseLeave={() => setHoverPlan(null)}
                      style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '5px 12px', borderRadius: 10, background: 'rgba(99,102,241,0.08)', color: '#a5b4fc', fontSize: '0.78rem', fontWeight: 800, border: '1px solid rgba(99,102,241,0.2)', cursor: 'help' }}>
                      <Zap size={12} fill="#a5b4fc" />{displayPlanName}
                      {hoverPlan === s.onboardingId && plan && (
                        <div style={{ position: 'absolute', top: '100%', left: 0, zIndex: 100, width: 220, padding: 16, background: '#0a0f18', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 16, boxShadow: '0 20px 40px rgba(0,0,0,0.5)', marginTop: 8 }}>
                          <div style={{ fontWeight: 800, fontSize: '0.7rem', color: DIM, textTransform: 'uppercase', marginBottom: 10 }}>Plan Features</div>
                          {features.slice(0, 5).map(f => <div key={f} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.75rem', color: '#fff', marginBottom: 6 }}><CheckCircle2 size={11} color="#34d399" />{f.trim()}</div>)}
                          <div style={{ marginTop: 10, paddingTop: 10, borderTop: '1px solid rgba(255,255,255,0.05)', fontSize: '0.72rem', color: DIM }}>Max Students: <strong style={{ color: '#fff' }}>{plan.maxStudents}</strong></div>
                        </div>
                      )}
                    </div>
                  </div>

                  <div>
                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '4px 10px', borderRadius: 20, background: 'rgba(52,211,153,0.08)', color: '#34d399', fontSize: '0.7rem', fontWeight: 800, border: '1px solid rgba(52,211,153,0.2)' }}>
                       <ShieldCheck size={11} />
                       ACTIVATED
                    </div>
                  </div>

                  <div>
                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '4px 10px', borderRadius: 20, background: `${sc}08`, color: sc, fontSize: '0.7rem', fontWeight: 800, border: `1px solid ${sc}20` }}>
                      <div style={{ width: 5, height: 5, borderRadius: '50%', background: sc, boxShadow: `0 0 6px ${sc}` }} />
                      {sub?.status || 'ACTIVE'}
                    </div>
                  </div>

                  <div style={{ textAlign: 'right' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 6 }}>
                      <motion.button whileHover={{ scale: 1.05 }} onClick={() => handleOpenUpdate(s, sub)}
                        style={{ p: '6px 12px', borderRadius: 10, background: 'rgba(255,255,255,0.03)', border: `1px solid ${BORDER}`, color: '#fff', fontSize: '0.75rem', fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: 4 }}>
                        <RefreshCw size={12} /> Plan
                      </motion.button>
                      <motion.button whileHover={{ scale: 1.05 }} onClick={() => handleRevoke(s.tenantId)}
                        style={{ p: '6px 12px', borderRadius: 10, background: 'rgba(248,113,113,0.05)', border: '1px solid rgba(248,113,113,0.15)', color: '#f87171', fontSize: '0.75rem', fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>
                        <Ban size={12} />
                      </motion.button>
                    </div>
                  </div>
                </motion.div>
              );
            })}
            {schools.length === 0 && (
              <div style={{ padding: 60, textAlign: 'center', color: DIM, display: 'flex', flexDirection: 'column', gap: 12, alignItems: 'center' }}>
                <ShieldCheck size={40} opacity={0.2} />
                <div>{search ? 'No schools match your search.' : 'No approved schools found.'}</div>
              </div>
            )}
          </div>
        )}
      </div>
      </div>


      {/* Update Plan Modal */}
      <AnimatePresence>
        {updateModal && (
          <div style={{ position: 'fixed', inset: 0, zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(12px)' }}>
            <motion.div initial={{ opacity: 0, scale: 0.9, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9, y: 20 }}
              style={{ width: '100%', maxWidth: 480, background: '#0f1419', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 28, padding: 36 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
                <div>
                  <h2 style={{ color: '#fff', fontSize: '1.3rem', fontWeight: 900, margin: 0 }}>Update Subscription Plan</h2>
                  <p style={{ color: DIM, fontSize: '0.82rem', margin: '4px 0 0' }}>{updateModal.schoolName}</p>
                </div>
                <button onClick={() => setUpdateModal(null)} style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer' }}><X size={20} /></button>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 24 }}>
                {plans.length > 0 ? plans.map(p => (
                  <div key={p.planId} onClick={() => setSelectedPlan(p.planId)}
                    style={{ padding: '16px 20px', borderRadius: 16, border: `1px solid ${selectedPlan === p.planId ? 'rgba(99,102,241,0.5)' : 'rgba(255,255,255,0.07)'}`, background: selectedPlan === p.planId ? 'rgba(99,102,241,0.1)' : 'rgba(255,255,255,0.02)', cursor: 'pointer', transition: 'all 0.2s' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <div style={{ fontWeight: 800, color: '#fff', fontSize: '0.95rem' }}>{p.planName}</div>
                        <div style={{ fontSize: '0.75rem', color: DIM, marginTop: 3 }}>{(p.featureCodes || p.features?.split(',') || []).slice(0, 2).join(' • ')}</div>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontWeight: 900, color: selectedPlan === p.planId ? '#a5b4fc' : '#fff', fontSize: '1.1rem' }}>${p.monthlyPrice || '—'}<span style={{ fontSize: '0.7rem', fontWeight: 600, color: DIM }}>/mo</span></div>
                        <div style={{ fontSize: '0.7rem', color: DIM }}>Max {p.maxStudents} students</div>
                      </div>
                    </div>
                  </div>
                )) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {['FREE', 'BASIC', 'PREMIUM'].map(name => (
                      <div key={name} onClick={() => setSelectedPlan(name)}
                        style={{ padding: '14px 18px', borderRadius: 14, border: `1px solid ${selectedPlan === name ? 'rgba(99,102,241,0.5)' : 'rgba(255,255,255,0.07)'}`, background: selectedPlan === name ? 'rgba(99,102,241,0.1)' : 'rgba(255,255,255,0.02)', cursor: 'pointer' }}>
                        <div style={{ fontWeight: 700, color: '#fff' }}>{name}</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div style={{ display: 'flex', gap: 12 }}>
                <button onClick={() => setUpdateModal(null)} style={{ flex: 1, padding: '13px', borderRadius: 14, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', color: '#94a3b8', fontWeight: 700, fontSize: '0.9rem', cursor: 'pointer', fontFamily: 'inherit' }}>
                  Cancel
                </button>
                <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }} onClick={handleUpdatePlan} disabled={!selectedPlan || updating}
                  style={{ flex: 2, padding: '13px', borderRadius: 14, background: selectedPlan ? 'linear-gradient(135deg, #6366f1, #4f46e5)' : 'rgba(255,255,255,0.05)', border: 'none', color: selectedPlan ? '#fff' : '#475569', fontWeight: 800, fontSize: '0.9rem', cursor: selectedPlan ? 'pointer' : 'not-allowed', fontFamily: 'inherit', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                  {updating ? <Loader size={16} style={{ animation: 'spin 1s linear infinite' }} /> : <RefreshCw size={16} />}
                  {updating ? 'Updating...' : 'Apply Plan'}
                </motion.button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
