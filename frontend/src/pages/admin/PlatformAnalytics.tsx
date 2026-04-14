import React, { useEffect, useState } from 'react';
import { onboardingApi, OnboardingResponse, subscriptionApi, PlatformStatsResponse } from '../../lib/api';
import { mcpApi } from '../../lib/mcp';
import { Building2, Users, DollarSign, Activity, Loader, TrendingUp, ShieldCheck } from 'lucide-react';
import { useRealtime } from '../../components/RealtimeHub';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell, AreaChart, Area } from 'recharts';

const DIM = '#8b95a2'; const BORDER = 'rgba(255,255,255,0.08)';

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: '#0f1824', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12, padding: '10px 14px', fontSize: '0.8rem', color: '#fff' }}>
      <div style={{ fontWeight: 700, marginBottom: 4 }}>{label}</div>
      {payload.map((p: any) => (
        <div key={p.name} style={{ color: p.stroke || p.fill, fontSize: '0.78rem' }}>{p.name}: <strong>{p.value}</strong></div>
      ))}
    </div>
  );
};

// Revenue trend will now be fetched dynamically

export default function PlatformAnalytics() {
  const { lastMessage } = useRealtime();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ total: 0, pending: 0, rejected: 0 });
  const [subscriptionStats, setSubscriptionStats] = useState<PlatformStatsResponse | null>(null);
  const [growthTrend, setGrowthTrend] = useState<{ month: string; schools: number }[]>([]);
  const [revenueTrend, setRevenueTrend] = useState<{ month: string; mrr: number }[]>([]);

  const fetchStats = async () => {
    try {
      const [onboardingData, subStats] = await Promise.all([
        onboardingApi.listAll(),
        subscriptionApi.getStats()
      ]);

      const approved = onboardingData.filter((d: OnboardingResponse) => d.status === 'APPROVED').length;
      // FIX: was 'PENDING' — correct statuses are SUBMITTED and UNDER_REVIEW
      const pending = onboardingData.filter((d: OnboardingResponse) =>
        d.status === 'SUBMITTED' || d.status === 'UNDER_REVIEW'
      ).length;
      const rejected = onboardingData.filter((d: OnboardingResponse) => d.status === 'REJECTED').length;

      setStats({ total: approved, pending, rejected });
      setSubscriptionStats(subStats);

      // Fetch dynamic trends from MCP
      try {
        const trendRes = await mcpApi.callTool('platform_growth_trend');
        const trendData = JSON.parse(trendRes.content[0].text);
        setGrowthTrend(trendData.map((d: any) => ({ month: d.month, schools: d.schools })));
        setRevenueTrend(trendData.map((d: any) => ({ month: d.month, mrr: d.mrr })));
      } catch (err) {
        console.error('Failed to fetch growth trend:', err);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchStats(); }, []);

  useEffect(() => {
    if (lastMessage?.topic?.startsWith('platform/onboarding/') || lastMessage?.topic?.startsWith('platform/subscriptions/')) {
      fetchStats();
    }
  }, [lastMessage]);

  const statusPieData = [
    { name: 'Approved', value: stats.total, fill: '#34d399' },
    { name: 'Pending', value: stats.pending, fill: '#fbbf24' },
    { name: 'Rejected', value: stats.rejected, fill: '#f87171' },
  ].filter(d => d.value > 0);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 28, paddingBottom: 48 }}>
      <div>
        <h1 style={{ fontSize: '2.5rem', fontWeight: 900, color: '#fff', margin: '0 0 6px', letterSpacing: '-0.04em' }}>Platform Analytics</h1>
        <p style={{ color: DIM, margin: 0, fontSize: '0.95rem' }}>High-level SaaS business metrics with real-time monitoring</p>
      </div>

      {loading ? (
        <div style={{ padding: 80, textAlign: 'center', color: DIM }}><Loader size={32} style={{ animation: 'spin 1s linear infinite' }} /></div>
      ) : (
        <>
          {/* KPI Cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 20 }}>
            {[
              { label: 'Active Schools', value: stats.total, icon: Building2, color: '#22d3ee', trend: 'Approved tenants' },
              { label: 'Platform Capacity', value: `${(subscriptionStats?.totalCapacityStudents ?? 0).toLocaleString()}`, icon: Users, color: '#a78bfa', trend: `${subscriptionStats?.totalActiveSubscriptions ?? 0} active subs` },
              { label: 'Monthly Revenue', value: `$${(subscriptionStats?.monthlyRecurringRevenue ?? 0).toLocaleString()}`, icon: DollarSign, color: '#34d399', trend: 'Real-time billing' },
              { label: 'Pending Reviews', value: stats.pending, icon: Activity, color: '#fbbf24', trend: 'Action required' },
            ].map(m => (
              <div key={m.label} style={{ padding: '28px', borderRadius: 24, background: `${m.color}06`, border: `1px solid ${m.color}18`, position: 'relative', overflow: 'hidden' }}>
                <div style={{ position: 'absolute', top: -10, right: -10, opacity: 0.08 }}><m.icon size={80} color={m.color} /></div>
                <m.icon size={24} color={m.color} style={{ marginBottom: 16 }} />
                <div style={{ fontSize: '2.5rem', fontWeight: 900, color: '#fff', lineHeight: 1, letterSpacing: '-0.02em' }}>{m.value}</div>
                <div style={{ fontSize: '0.85rem', color: DIM, marginTop: 8, fontWeight: 600 }}>{m.label}</div>
                <div style={{ marginTop: 12, display: 'flex', alignItems: 'center', gap: 6, color: m.color, fontSize: '0.75rem', fontWeight: 700 }}>
                  <TrendingUp size={14} /> {m.trend}
                </div>
              </div>
            ))}
          </div>

          {/* Charts Row 1 */}
          <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: 20 }}>
            {/* School Growth Line Chart */}
            <div style={{ padding: '28px', borderRadius: 24, background: 'rgba(255,255,255,0.02)', border: `1px solid ${BORDER}` }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 24 }}>
                <Building2 size={18} color="#22d3ee" />
               <h3 style={{ color: '#fff', fontWeight: 800, fontSize: '1rem', margin: 0 }}>School Growth (6 Months)</h3>
              </div>
              <ResponsiveContainer width="100%" height={220}>
                <AreaChart data={growthTrend}>
                  <defs>
                    <linearGradient id="schoolGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#22d3ee" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#22d3ee" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="month" tick={{ fill: '#8b95a2', fontSize: 12 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: '#8b95a2', fontSize: 11 }} axisLine={false} tickLine={false} />
                  <Tooltip content={<CustomTooltip />} />
                  <Area type="monotone" dataKey="schools" name="Schools" stroke="#22d3ee" strokeWidth={2.5} fill="url(#schoolGrad)" dot={{ fill: '#22d3ee', r: 4, strokeWidth: 0 }} />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            {/* Onboarding Status Pie */}
            <div style={{ padding: '28px', borderRadius: 24, background: 'rgba(255,255,255,0.02)', border: `1px solid ${BORDER}` }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 24 }}>
                <ShieldCheck size={18} color="#a78bfa" />
                <h3 style={{ color: '#fff', fontWeight: 800, fontSize: '1rem', margin: 0 }}>Onboarding Status</h3>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
                <ResponsiveContainer width={160} height={160}>
                  <PieChart>
                    <Pie data={statusPieData.length > 0 ? statusPieData : [{ name: 'None', value: 1, fill: '#334155' }]} cx={75} cy={75} innerRadius={45} outerRadius={68} dataKey="value" stroke="none">
                      {statusPieData.map((entry, i) => <Cell key={i} fill={entry.fill} opacity={0.85} />)}
                    </Pie>
                    <Tooltip content={<CustomTooltip />} />
                  </PieChart>
                </ResponsiveContainer>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {statusPieData.map(d => (
                    <div key={d.name} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div style={{ width: 10, height: 10, borderRadius: 3, background: d.fill }} />
                      <div>
                        <div style={{ fontSize: '0.72rem', color: '#8b95a2', fontWeight: 600 }}>{d.name}</div>
                        <div style={{ fontSize: '1.1rem', fontWeight: 900, color: '#fff' }}>{d.value}</div>
                      </div>
                    </div>
                  ))}
                  {statusPieData.length === 0 && <div style={{ color: DIM, fontSize: '0.85rem' }}>No data yet</div>}
                </div>
              </div>
            </div>
          </div>

          {/* Revenue Trend */}
          <div style={{ padding: '28px', borderRadius: 24, background: 'rgba(255,255,255,0.02)', border: `1px solid ${BORDER}` }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 24 }}>
              <DollarSign size={18} color="#34d399" />
              <h3 style={{ color: '#fff', fontWeight: 800, fontSize: '1rem', margin: 0 }}>Monthly Recurring Revenue (MRR)</h3>
            </div>
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={revenueTrend}>
                <defs>
                  <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#34d399" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#34d399" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="month" tick={{ fill: '#8b95a2', fontSize: 12 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: '#8b95a2', fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={v => `$${v}`} />
                <Tooltip content={<CustomTooltip />} />
                <Area type="monotone" dataKey="mrr" name="MRR ($)" stroke="#34d399" strokeWidth={2.5} fill="url(#revGrad)" dot={{ fill: '#34d399', r: 4, strokeWidth: 0 }} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </>
      )}
      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
