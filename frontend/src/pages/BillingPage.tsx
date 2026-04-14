import React, { useState, useEffect } from 'react';
import { PaymentGateway } from '../components/PaymentGateway';
import { useRealtime } from '../components/RealtimeHub';
import { CreditCard, ShieldCheck, Zap, Clock, ChevronRight, Sparkles, AlertCircle } from 'lucide-react';
import { request } from '../lib/api';

interface FeaturePrice {
  featureCode: string;
  featureName: string;
  monthlyPrice: number;
  description: string;
}

interface SubscriptionDetails {
  subscriptionId: string;
  tenantId: string;
  planId: string;
  planName: string;
  planCode: string;
  status: string;
  expiryDate?: string;
  startDate?: string;
  trialEndDate?: string;
  endDate?: string;
  activeFeatures: string[];
  monthlyBasePrice: number;
}

interface BillingPageProps {
  schoolSession: any;
  createSchoolOp: (path: string, body: any, onSuccess: () => Promise<void>, message: string) => Promise<void>;
}

export const BillingPage: React.FC<BillingPageProps> = ({ schoolSession, createSchoolOp }) => {
  const { messages } = useRealtime();
  const [subscription, setSubscription] = useState<SubscriptionDetails | null>(null);
  const [availablePlans, setAvailablePlans] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentConfig, setPaymentConfig] = useState({ planId: '', planName: '', amount: 0 });

  const fetchBillingData = async () => {
    try {
      const current = await request<any>('/subscriptions/current');
      const plansData = await request<any[]>('/subscriptions/plans');
      setAvailablePlans(plansData);

      const currentPlan = plansData.find((plan) => plan.planId === current.planId || plan.planCode === current.planCode);
      const monthlyBasePrice = Number(currentPlan?.monthlyPrice || 0);

      setSubscription({
        subscriptionId: current.subscriptionId,
        tenantId: current.tenantId,
        planId: current.planId,
        planName: current.planName || currentPlan?.planName || current.planCode,
        planCode: current.planCode,
        status: current.status,
        expiryDate: current.endDate || current.trialEndDate || null,
        startDate: current.startDate || null,
        trialEndDate: current.trialEndDate || null,
        endDate: current.endDate || null,
        activeFeatures: Array.isArray(current.featureCodes) ? current.featureCodes : [],
        monthlyBasePrice,
      });
    } catch (err) {
      console.error('Failed to fetch billing', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBillingData();
  }, [schoolSession.tenantId]);

  useEffect(() => {
    const lastMsg = messages[messages.length - 1];
    if (lastMsg?.topic?.includes('school/notifications') && lastMsg.payload.type === 'SUBSCRIPTION_UPDATED') {
      fetchBillingData();
    }
  }, [messages]);

  const handleRenew = () => {
    if (!subscription) return;
    setPaymentConfig({
      planId: subscription.planId,
      planName: subscription.planName,
      amount: subscription.monthlyBasePrice
    });
    setShowPaymentModal(true);
  };

  const handleUpgrade = (plan: any) => {
    setPaymentConfig({
      planId: plan.planId,
      planName: plan.planName,
      amount: plan.monthlyPrice
    });
    setShowPaymentModal(true);
  };

  const handlePaymentSuccess = async () => {
    setShowPaymentModal(false);
    await createSchoolOp(`/api/v1/subscriptions/update?tenantId=${schoolSession.tenantId}`, {
      planId: paymentConfig.planId
    }, async () => {
      await fetchBillingData();
    }, 'Subscription successfully synchronized with global ledger.');
  };

  if (loading) return (
    <div className="flex h-full items-center justify-center">
      <div className="animate-pulse flex flex-col items-center gap-4">
        <Zap className="text-cyan-400" size={48} />
        <p className="text-slate-500 font-mono text-xs uppercase tracking-widest">Hydrating Billing Node...</p>
      </div>
    </div>
  );

  const expiryRef = subscription?.expiryDate || subscription?.trialEndDate || subscription?.endDate;
  const isExpiringSoon = Boolean(expiryRef) && (new Date(expiryRef as string).getTime() - new Date().getTime() < 7 * 24 * 60 * 60 * 1000);
  const ledgerRows = subscription ? [
    { label: 'Subscription Started', date: subscription.startDate || 'N/A', amount: subscription.monthlyBasePrice, status: 'Confirmed' },
    { label: 'Current Plan Cycle', date: expiryRef || 'N/A', amount: subscription.monthlyBasePrice, status: subscription.status },
  ] : [];

  return (
    <div className="modular-page billing-workspace animate-in">
      <header className="page-header">
        <div className="header-content">
          <span className="eyebrow flex items-center gap-2"><CreditCard size={14} className="text-cyan-400" /> Capital Management</span>
          <h1>Institutional Billing</h1>
          <p>Seamlessly scale your academic infrastructure and manage feature protocols.</p>
        </div>
        <div className="header-actions">
           {isExpiringSoon && (
             <div className="alert-pill glass-card bg-amber-500/10 text-amber-500 border-amber-500/20 px-3 py-1 flex items-center gap-2 animate-bounce">
                <AlertCircle size={14} />
                <span className="text-[10px] font-bold uppercase">Renewal Required</span>
             </div>
           )}
           <button className="primary-button neon-button px-6" onClick={handleRenew}>
             Instant Renewal
           </button>
        </div>
      </header>

      <div className="dashboard-grid">
        <article className="dashboard-card status-card p-8 relative overflow-hidden group">
          <div className="absolute -right-4 -top-4 opacity-5 group-hover:opacity-10 transition-opacity">
            <ShieldCheck size={160} />
          </div>
          <span className="eyebrow flex items-center gap-2"><Sparkles size={14} className="text-cyan-400" /> Active Protocol</span>
          <h2 className="text-3xl font-bold mt-2">{subscription?.planName} <span className="text-slate-500 font-normal">Plan</span></h2>
          
          <div className="plan-stats-premium mt-8 grid grid-cols-2 gap-6">
            <div className="stat-node">
              <span className="text-[10px] uppercase text-slate-500 font-mono block mb-1">Node Status</span>
              <div className="flex items-center gap-2">
                <div className={`h-2 w-2 rounded-full ${subscription?.status === 'ACTIVE' ? 'bg-cyan-500 shadow-[0_0_8px_rgba(6,182,212,0.8)]' : 'bg-red-500'}`} />
                <span className="text-white font-bold">{subscription?.status}</span>
              </div>
            </div>
            <div className="stat-node">
              <span className="text-[10px] uppercase text-slate-500 font-mono block mb-1">Cycle Expiry</span>
              <span className="text-white font-bold flex items-center gap-2">
                <Clock size={14} className="text-slate-500" />
                    {expiryRef || 'N/A'}
              </span>
            </div>
          </div>

          <div className="mt-8 pt-8 border-t border-white/5">
            <div className="flex justify-between items-end">
              <div>
                <span className="text-[10px] uppercase text-slate-500 font-mono block mb-1">Monthly Uplink</span>
                <span className="text-2xl font-bold text-white">${subscription?.monthlyBasePrice.toFixed(2)}</span>
              </div>
              <button className="secondary-button compact flex items-center gap-2">
                View History <ChevronRight size={14} />
              </button>
            </div>
          </div>
          <div className="card-glimmer" />
        </article>

        <article className="dashboard-card wide-card p-8">
          <span className="eyebrow flex items-center gap-2"><Zap size={14} className="text-violet-400" /> Scalability Options</span>
          <h3>Available Tier Modifications</h3>
          <p className="text-slate-500 text-xs mt-1 mb-8">Elevate your institutional throughput by upgrading to a higher performance tier.</p>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {availablePlans.filter(p => p.planName !== subscription?.planName).map(plan => (
              <div key={plan.planCode} className="plan-tier-card glass-card p-5 border border-white/5 hover:border-cyan-500/30 transition-all flex flex-col">
                <div className="flex justify-between items-start mb-4">
                  <strong className="text-white tracking-tight">{plan.planName}</strong>
                  <span className="text-cyan-400 font-bold text-sm">${plan.monthlyPrice}</span>
                </div>
                <div className="flex-1">
                  <ul className="space-y-2 mb-6">
                    {(plan.featureCodes || []).map((f: string) => (
                      <li key={f} className="text-[10px] text-slate-400 flex items-center gap-2">
                        <div className="h-1 w-1 bg-cyan-500 rounded-full" /> {f}
                      </li>
                    ))}
                  </ul>
                </div>
                <button 
                  className="secondary-button w-full text-xs font-bold uppercase tracking-widest py-2"
                  onClick={() => handleUpgrade(plan)}
                >
                  Switch Node
                </button>
              </div>
            ))}
          </div>
        </article>

        <article className="dashboard-card p-6">
          <span className="eyebrow">Transaction Ledger</span>
          <h3>Historical Artifacts</h3>
          <div className="mt-6 space-y-4">
            {ledgerRows.map((row, index) => (
              <div key={index} className="invoice-row flex items-center justify-between p-3 glass-card bg-slate-800/20 border border-white/5 opacity-80 hover:opacity-100 transition-opacity">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded bg-slate-800"><CreditCard size={14} /></div>
                  <div>
                    <span className="text-[10px] text-white font-mono block">{row.label}</span>
                    <span className="text-[9px] text-slate-500">{row.date}</span>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-[10px] text-cyan-400 font-bold block">${row.amount.toFixed(2)}</span>
                  <span className="text-[8px] uppercase tracking-tighter text-slate-500">{row.status}</span>
                </div>
              </div>
            ))}
            {ledgerRows.length === 0 && (
              <div className="text-slate-500 text-xs">No subscription ledger entries available.</div>
            )}
          </div>
        </article>
      </div>

      {showPaymentModal && (
        <PaymentGateway 
          planName={paymentConfig.planName} 
          amount={paymentConfig.amount}
          onSuccess={handlePaymentSuccess}
          onCancel={() => setShowPaymentModal(false)}
        />
      )}
    </div>
  );
};

export default BillingPage;
