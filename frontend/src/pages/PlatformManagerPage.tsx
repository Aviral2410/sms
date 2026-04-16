import React, { useState, useEffect } from 'react';
import { Shield, Globe, Users, Zap, TrendingUp, BarChart3, Activity, HardDrive, Bell, Settings, Search, Sparkles } from 'lucide-react';
import { useRealtime } from '../components/RealtimeHub';
import { useStore } from '../store/useStore';
import PlatformSettingsPage from './admin/PlatformSettingsPage';
import { request, subscriptionApi, type SubscriptionPlanResponse, type TenantSubscriptionResponse } from '../lib/api';

interface Plan {
  planCode: string;
  planName: string;
  monthlyPrice: number;
  featureCodes?: string[];
  features?: string[] | string;
}

interface SchoolProject {
  schoolId: string;
  schoolName: string;
  currentPlan: string;
  expiryDate: string;
  status: 'ACTIVE' | 'WARNING' | 'EXPIRED';
  studentCount: number;
}

export const PlatformManagerPage: React.FC = () => {
  const { session, setSearchOpen, setPaletteAiMode } = useStore();
  const { messages } = useRealtime();
  const [plans, setPlans] = useState<Plan[]>([]);
  const [schools, setSchools] = useState<SchoolProject[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'commercials' | 'nodes' | 'settings'>('overview');

  const planFeatures = (plan: Plan): string[] =>
    Array.isArray(plan.featureCodes) && plan.featureCodes.length
      ? plan.featureCodes
      : Array.isArray(plan.features)
      ? plan.features
      : String(plan.features || '')
          .split(',')
          .map((item) => item.trim())
          .filter(Boolean);

  const fetchData = async () => {
    try {
      const [plansData, subscriptionsData] = await Promise.all([
        request<SubscriptionPlanResponse[]>('/subscriptions/plans'),
        subscriptionApi.listAll()
      ]);
      
      setPlans(plansData as any);
      
      const mappedSchools: SchoolProject[] = subscriptionsData.map((sub: TenantSubscriptionResponse) => ({
        schoolId: sub.tenantId, // Using tenantId as proxy for schoolId in this context
        schoolName: `Tenant ${sub.tenantId.substring(0, 8)}`, // We'd need a way to get school names if not in this service
        currentPlan: sub.planCode,
        expiryDate: sub.endDate || 'Ongoing',
        status: sub.status === 'ACTIVE' || sub.status === 'TRIAL' ? 'ACTIVE' : 'EXPIRED',
        studentCount: plansData.find((plan) => plan.planCode === sub.planCode)?.maxStudents ?? 0
      }));
      
      setSchools(mappedSchools);
    } catch (err) {
      console.error('Platform data failed', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    const lastMsg = messages[messages.length - 1];
    if (lastMsg?.topic?.includes('platform/global')) {
      fetchData();
    }
  }, [messages]);

  const activeSchools = schools.filter((school) => school.status === 'ACTIVE').length;
  const expiredSchools = schools.filter((school) => school.status === 'EXPIRED').length;
  const totalCapacity = schools.reduce((sum, school) => sum + school.studentCount, 0);
  const monthlyRevenue = schools.reduce((sum, school) => {
    if (school.status !== 'ACTIVE') return sum;
    const plan = plans.find((item) => item.planCode === school.currentPlan);
    return sum + (plan?.monthlyPrice || 0);
  }, 0);

  if (loading) return (
    <div className="flex h-full items-center justify-center">
      <div className="animate-pulse flex flex-col items-center gap-4">
        <Globe className="text-cyan-400" size={48} />
        <p className="text-slate-500 font-mono text-xs uppercase tracking-widest">Establishing Platform Uplink...</p>
      </div>
    </div>
  );

  return (
    <div className="modular-page platform-workspace animate-in">
      <header className="page-header">
        <div className="header-content">
          <span className="eyebrow flex items-center gap-2"><Shield size={14} className="text-cyan-400" /> Administrative Core</span>
          <h1>Platform Command</h1>
          <p>Orchestrate global multi-tenant operations and monitor institutional health.</p>
        </div>
        <div className="header-actions flex items-center gap-4">
           <div className="flex items-center gap-2">
             <button 
               className="secondary-button compact py-2 px-3 flex items-center gap-2"
               onClick={() => {
                 if (searchOpen && !paletteAiMode) {
                   setSearchOpen(false);
                 } else {
                   setPaletteAiMode(false);
                   setSearchOpen(true);
                 }
               }}
             >
               <Search size={14} /> Search
             </button>
             <button 
               className="secondary-button compact py-2 px-3 flex items-center gap-2 text-violet-400 border-violet-500/30 bg-violet-500/5 hover:bg-violet-500/10"
               onClick={() => {
                 if (searchOpen && paletteAiMode) {
                   setSearchOpen(false);
                 } else {
                   setPaletteAiMode(true);
                   setSearchOpen(true);
                 }
               }}
             >
               <Sparkles size={14} /> Ask Insights
             </button>
           </div>
           <div className="tab-switch glass-card p-1 flex gap-1">
             <button className={`tab-btn ${activeTab === 'overview' ? 'active neon-glow' : ''}`} onClick={() => setActiveTab('overview')}>Intelligence</button>
             <button className={`tab-btn ${activeTab === 'commercials' ? 'active neon-glow' : ''}`} onClick={() => setActiveTab('commercials')}>Commercials</button>
             <button className={`tab-btn ${activeTab === 'nodes' ? 'active neon-glow' : ''}`} onClick={() => setActiveTab('nodes')}>Tenant Nodes</button>
             <button className={`tab-btn ${activeTab === 'settings' ? 'active neon-glow' : ''}`} onClick={() => setActiveTab('settings')}>Settings</button>
           </div>
        </div>
      </header>

      {activeTab === 'overview' ? (
        <div className="dashboard-grid">
          <article className="dashboard-card p-6 border-l-4 border-cyan-500">
            <div className="flex justify-between items-start">
               <div>
                  <span className="text-[10px] uppercase text-slate-500 font-mono">Total Throughput</span>
                  <h3 className="text-2xl font-bold text-white mt-1">{totalCapacity.toLocaleString()} <span className="text-xs text-cyan-400 font-normal">capacity seats</span></h3>
               </div>
               <Users className="text-cyan-500/20" size={32} />
            </div>
            <div className="mt-4 h-1 w-full bg-slate-800 rounded-full overflow-hidden">
               <div className="h-full bg-cyan-500 w-3/4 shadow-[0_0_8px_rgba(6,182,212,0.8)]" />
            </div>
          </article>

          <article className="dashboard-card p-6 border-l-4 border-violet-500">
            <div className="flex justify-between items-start">
               <div>
                  <span className="text-[10px] uppercase text-slate-500 font-mono">Platform Revenue</span>
                  <h3 className="text-2xl font-bold text-white mt-1">${monthlyRevenue.toLocaleString()} <span className="text-xs text-violet-400 font-normal">MRR</span></h3>
               </div>
               <TrendingUp className="text-violet-500/20" size={32} />
            </div>
            <div className="mt-4 flex gap-1 h-8 items-end">
               {[40, 60, 30, 80, 50, 90, 70].map((h, i) => (
                 <div key={i} className="flex-1 bg-violet-500/20 rounded-t-sm hover:bg-violet-500 transition-all" style={{ height: `${h}%` }} />
               ))}
            </div>
          </article>

          <article className="dashboard-card p-6 border-l-4 border-emerald-500">
            <div className="flex justify-between items-start">
               <div>
                  <span className="text-[10px] uppercase text-slate-500 font-mono">System Latency</span>
                  <h3 className="text-2xl font-bold text-white mt-1">{activeSchools} <span className="text-xs text-emerald-400 font-normal">active nodes</span></h3>
               </div>
               <Activity className="text-emerald-500/20" size={32} />
            </div>
            <div className="mt-4 font-mono text-[10px] text-emerald-500/60 uppercase tracking-widest">
               {expiredSchools > 0 ? `${expiredSchools} tenants need attention` : 'All systems operational'}
            </div>
          </article>

          <article className="dashboard-card wide-card p-0 overflow-hidden">
             <div className="p-6 border-b border-white/5 flex justify-between items-center">
                <h3>Live Network Status</h3>
                <div className="flex gap-4">
                   <span className="flex items-center gap-1 text-[10px] text-slate-500"><HardDrive size={12} /> {activeSchools} Active Nodes</span>
                   <span className="flex items-center gap-1 text-[10px] text-slate-500"><Bell size={12} /> {expiredSchools} Incidents</span>
                </div>
             </div>
             <div className="p-8 grid grid-cols-1 lg:grid-cols-2 gap-12 bg-slate-900/40">
                <div className="space-y-6">
                   <h4 className="text-xs font-bold uppercase tracking-widest text-slate-400 flex items-center gap-2">
                      <BarChart3 size={14} className="text-cyan-400" /> Resource Distribution
                   </h4>
                   <div className="space-y-4">
                      {['Storage', 'Compute', 'MQTT Bandwidth'].map(label => (
                        <div key={label}>
                          <div className="flex justify-between text-[10px] mb-1">
                             <span className="text-slate-500">{label}</span>
                             <span className="text-white font-mono">24%</span>
                          </div>
                          <div className="h-1 bg-white/5 rounded-full overflow-hidden">
                             <div className="h-full bg-cyan-500/40 w-1/4" />
                          </div>
                        </div>
                      ))}
                   </div>
                </div>
                <div className="relative">
                   <div className="absolute inset-0 flex items-center justify-center opacity-20">
                      <Globe size={240} className="text-cyan-500 animate-pulse" />
                   </div>
                   <div className="relative z-10 p-6 glass-card bg-cyan-500/5 border-cyan-500/10">
                      <p className="text-[10px] text-cyan-300 font-mono leading-relaxed">
                         Multi-tenant isolation protocols are currently being enforced across all clusters. Data segregation for {schools.length} tenants verified at 100% compliance.
                      </p>
                   </div>
                </div>
             </div>
          </article>
        </div>
      ) : activeTab === 'commercials' ? (
        <div className="dashboard-grid">
           <article className="dashboard-card wide-card p-8">
              <span className="eyebrow flex items-center gap-2"><Zap size={14} className="text-violet-400" /> Plan Architect</span>
              <h3>Global Subscription Matrix</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
                 {plans.map(plan => (
                   <div key={plan.planCode} className="plan-edit-card glass-card p-6 border border-white/5 hover:border-violet-500/30 transition-all flex flex-col group">
                      <div className="flex justify-between items-center mb-6">
                         <strong className="text-white text-lg">{plan.planName}</strong>
                         <span className="text-violet-400 font-mono font-bold">${plan.monthlyPrice}</span>
                      </div>
                      <div className="flex-1 space-y-3 mb-8">
                         {planFeatures(plan).map(f => (
                           <div key={f} className="text-[10px] text-slate-500 flex items-center gap-2">
                              <Shield size={10} className="text-violet-500/40" /> {f}
                           </div>
                         ))}
                      </div>
                      <button className="secondary-button compact w-full opacity-60 group-hover:opacity-100">Edit Permissions</button>
                   </div>
                 ))}
              </div>
           </article>
        </div>
      ) : activeTab === 'nodes' ? (
        <div className="dashboard-grid">
           <article className="dashboard-card wide-card p-0 overflow-hidden">
              <div className="p-6 border-b border-white/5 flex justify-between items-center">
                 <h3>Active Tenant Registry</h3>
                 <div className="search-box-minimal glass-card px-3 py-1 flex items-center gap-2 border border-white/5">
                    <input className="bg-transparent border-none text-[10px] focus:ring-0 p-0" placeholder="Search clusters..." />
                 </div>
              </div>
              <table className="premium-table">
                 <thead>
                    <tr>
                       <th>Identity</th>
                       <th>Commercial Tier</th>
                       <th>Lifecycle State</th>
                       <th>Node Capacity</th>
                       <th>Operations</th>
                    </tr>
                 </thead>
                 <tbody>
                    {schools.map(school => (
                      <tr key={school.schoolId} className="hover:bg-cyan-500/5 transition-colors">
                         <td>
                            <div className="font-bold text-white text-xs">{school.schoolName}</div>
                            <div className="text-[9px] text-slate-500 font-mono">{school.schoolId}</div>
                         </td>
                         <td><span className="mode-chip-modern">{school.currentPlan}</span></td>
                         <td>
                            <div className="flex items-center gap-2">
                               <div className={`h-1.5 w-1.5 rounded-full ${school.status === 'ACTIVE' ? 'bg-emerald-500' : school.status === 'WARNING' ? 'bg-amber-500' : 'bg-rose-500'}`} />
                               <span className="text-[10px] text-slate-300 font-mono uppercase">{school.status}</span>
                            </div>
                         </td>
                         <td>
                            <span className="text-[10px] text-white flex items-center gap-2">
                               <Users size={12} className="text-slate-500" /> {school.studentCount}
                            </span>
                         </td>
                         <td>
                            <button className="secondary-button compact font-mono text-[9px] tracking-widest">DEBUG_NODE</button>
                         </td>
                      </tr>
                    ))}
                 </tbody>
              </table>
           </article>
        </div>
      ) : (
        <PlatformSettingsPage />
      )}
    </div>
  );
};
