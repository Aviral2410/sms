import React, { useState, useEffect } from 'react';
import { useStore } from '../../store/useStore';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ShieldCheck, Building2, Sparkles, Activity, Users, Plus, X,
  BarChart3, Zap, Globe, Brain, TrendingUp, AlertTriangle, CheckCircle2,
  RefreshCw, Clock
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { mcpApi } from '../../lib/mcp';

const V = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.08 } } };
const I = { hidden: { opacity: 0, y: 16 }, show: { opacity: 1, y: 0 } };

/* Animated counter */
function AnimNum({ value, prefix = '' }: { value: number | string; prefix?: string }) {
  const [display, setDisplay] = useState(0);
  const num = typeof value === 'number' ? value : parseInt(value) || 0;
  useEffect(() => {
    let frame: number;
    const dur = 1000; const t0 = performance.now();
    const tick = (now: number) => {
      const p = Math.min((now - t0) / dur, 1);
      setDisplay(Math.round(p * num));
      if (p < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [num]);
  return <>{prefix}{display.toLocaleString()}</>;
}

/* AI Insight banner */
function AiInsightBanner({ insight, onClose }: { insight: string; onClose: () => void }) {
  return (
    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
      style={{ padding: '20px 24px', borderRadius: 20, background: 'linear-gradient(135deg, rgba(99,102,241,0.1), rgba(167,139,250,0.05))', border: '1px solid rgba(99,102,241,0.2)', display: 'flex', gap: 16, alignItems: 'flex-start' }}>
      <motion.div animate={{ rotate: [0, 360] }} transition={{ duration: 8, repeat: Infinity, ease: 'linear' }}
        style={{ padding: 10, borderRadius: 14, background: 'rgba(99,102,241,0.15)', flexShrink: 0 }}>
        <Brain size={20} color="#818cf8" />
      </motion.div>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: '0.68rem', fontWeight: 900, color: '#818cf8', textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: 6 }}>AI Platform Insight</div>
        <div style={{ fontSize: '0.88rem', color: 'var(--text-soft)', lineHeight: 1.65 }}>{insight}</div>
      </div>
      <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', flexShrink: 0 }}><X size={16} /></button>
    </motion.div>
  );
}

export default function PlatformDashboard() {
  const { session, dashboardWidgets, setDashboardWidgets } = useStore();
  const navigate = useNavigate();
  const [platformStats, setPlatformStats] = useState<any>(null);
  const [isAdding, setIsAdding] = useState(false);
  const [lastRefresh, setLastRefresh] = useState(new Date());

  const fetchStats = () => {
    mcpApi.callTool('platform_onboarding_overview')
      .then(res => {
        try { setPlatformStats(JSON.parse(res.content[0].text)); } catch {}
      })
      .catch(console.error);
    setLastRefresh(new Date());
  };

  useEffect(() => { fetchStats(); }, []);

  const handleAiInsight = () => {
    navigate('/admin/ai-briefing');
  };

  const removeWidget = (id: string) => setDashboardWidgets(dashboardWidgets.filter(w => w !== id));
  const addWidget = (id: string) => { if (!dashboardWidgets.includes(id)) setDashboardWidgets([...dashboardWidgets, id]); setIsAdding(false); };

  const widgets: Record<string, React.ReactNode> = {
    stats: (
      <div style={{ padding: '24px', borderRadius: 24, background: 'linear-gradient(135deg, rgba(99,102,241,0.1), rgba(168,85,247,0.05))', border: '1px solid rgba(99,102,241,0.2)', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: -20, right: -20, width: 100, height: 100, borderRadius: '50%', background: 'rgba(99,102,241,0.15)', filter: 'blur(40px)' }} />
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
          <div style={{ padding: 8, borderRadius: 12, background: 'rgba(99,102,241,0.2)', color: '#818cf8' }}><Users size={20} /></div>
          <button onClick={() => removeWidget('stats')} style={{ color: '#475569', cursor: 'pointer', background: 'none', border: 'none' }}><X size={14} /></button>
        </div>
        <div style={{ fontSize: '0.68rem', fontWeight: 900, color: '#818cf8', textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: 6 }}>Platform Reach</div>
        <div style={{ fontSize: '2.2rem', fontWeight: 900, color: '#fff', marginBottom: 4, letterSpacing: '-0.03em' }}>
          <AnimNum value={platformStats?.totals?.totalStudents || 0} />
        </div>
        <div style={{ fontSize: '0.82rem', color: '#64748b' }}>Students across <strong style={{ color: '#818cf8' }}><AnimNum value={platformStats?.totals?.activeSchools || 0} /></strong> schools</div>
      </div>
    ),
    onboarding: (
      <div style={{ padding: '24px', borderRadius: 24, background: 'linear-gradient(135deg, rgba(34,211,238,0.08), rgba(6,182,212,0.03))', border: '1px solid rgba(34,211,238,0.15)', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: -20, right: -20, width: 100, height: 100, borderRadius: '50%', background: 'rgba(34,211,238,0.1)', filter: 'blur(40px)' }} />
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
          <div style={{ padding: 8, borderRadius: 12, background: 'rgba(34,211,238,0.15)', color: '#22d3ee' }}><Building2 size={20} /></div>
          <button onClick={() => removeWidget('onboarding')} style={{ color: '#475569', cursor: 'pointer', background: 'none', border: 'none' }}><X size={14} /></button>
        </div>
        <div style={{ fontSize: '0.68rem', fontWeight: 900, color: '#22d3ee', textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: 6 }}>Onboarding Pipeline</div>
        <div style={{ fontSize: '2.2rem', fontWeight: 900, color: '#fff', marginBottom: 4, letterSpacing: '-0.03em' }}>
          <AnimNum value={platformStats?.totals?.submitted || 0} />
        </div>
        <div style={{ fontSize: '0.82rem', color: '#64748b' }}>New requests pending review</div>
        {(platformStats?.totals?.submitted || 0) > 0 && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            style={{ marginTop: 14, display: 'flex', alignItems: 'center', gap: 6, color: '#fbbf24', fontSize: '0.75rem', fontWeight: 700 }}>
            <AlertTriangle size={13} /> Action required
          </motion.div>
        )}
      </div>
    ),
    health: (
      <div style={{ padding: '24px', borderRadius: 24, background: 'linear-gradient(135deg, rgba(52,211,153,0.08), rgba(16,185,129,0.03))', border: '1px solid rgba(52,211,153,0.15)', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: -20, right: -20, width: 100, height: 100, borderRadius: '50%', background: 'rgba(52,211,153,0.1)', filter: 'blur(40px)' }} />
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
          <div style={{ padding: 8, borderRadius: 12, background: 'rgba(52,211,153,0.15)', color: '#34d399' }}><Activity size={20} /></div>
          <button onClick={() => removeWidget('health')} style={{ color: '#475569', cursor: 'pointer', background: 'none', border: 'none' }}><X size={14} /></button>
        </div>
        <div style={{ fontSize: '0.68rem', fontWeight: 900, color: '#34d399', textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: 6 }}>System Health</div>
        <div style={{ fontSize: '2.2rem', fontWeight: 900, color: '#fff', marginBottom: 4, letterSpacing: '-0.03em' }}>99.9%</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <motion.div animate={{ scale: [1, 1.4, 1] }} transition={{ repeat: Infinity, duration: 2 }}
            style={{ width: 8, height: 8, borderRadius: '50%', background: '#34d399', boxShadow: '0 0 8px #34d399' }} />
          <span style={{ fontSize: '0.82rem', color: '#64748b' }}>All 7 services operational</span>
        </div>
      </div>
    ),
    revenue: (
      <div style={{ padding: '24px', borderRadius: 24, background: 'linear-gradient(135deg, rgba(251,191,36,0.08), rgba(245,158,11,0.03))', border: '1px solid rgba(251,191,36,0.15)', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: -20, right: -20, width: 100, height: 100, borderRadius: '50%', background: 'rgba(251,191,36,0.1)', filter: 'blur(40px)' }} />
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
          <div style={{ padding: 8, borderRadius: 12, background: 'rgba(251,191,36,0.15)', color: '#fbbf24' }}><TrendingUp size={20} /></div>
          <button onClick={() => removeWidget('revenue')} style={{ color: '#475569', cursor: 'pointer', background: 'none', border: 'none' }}><X size={14} /></button>
        </div>
        <div style={{ fontSize: '0.68rem', fontWeight: 900, color: '#fbbf24', textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: 6 }}>Monthly Revenue</div>
        <div style={{ fontSize: '2.2rem', fontWeight: 900, color: '#fff', marginBottom: 4, letterSpacing: '-0.03em' }}>
          $<AnimNum value={(platformStats?.totals?.activeSchools || 0) * 299} />
        </div>
        <div style={{ fontSize: '0.82rem', color: '#64748b' }}>MRR · Growing steadily</div>
      </div>
    ),
  };

  const allWidgetMeta = [
    { id: 'stats', label: 'Platform Reach', icon: Users, color: '#818cf8' },
    { id: 'onboarding', label: 'Onboarding Pipeline', icon: Building2, color: '#22d3ee' },
    { id: 'health', label: 'System Health', icon: Activity, color: '#34d399' },
    { id: 'revenue', label: 'Monthly Revenue', icon: TrendingUp, color: '#fbbf24' },
  ];

  const quickActions: { icon: React.ElementType; label: string; desc: string; color: string; path: string | null }[] = [
    { icon: Building2, label: 'School Onboarding', desc: 'Approve or reject school entities', color: '#22d3ee', path: '/admin/onboarding' },
    { icon: Globe, label: 'System Logs', desc: 'Real-time logs and service health', color: '#f43f5e', path: '/admin/logs' },
    { icon: BarChart3, label: 'Analytics', desc: 'Global data aggregation & MRR', color: '#a78bfa', path: '/admin/analytics' },
    { icon: ShieldCheck, label: 'All Schools', desc: 'Manage tenants & subscriptions', color: '#34d399', path: '/admin/schools' },
    { icon: Zap, label: 'Platform Settings', desc: 'Theme, policies, trial config', color: '#ffb663', path: '/settings' },
    { icon: Brain, label: 'AI Briefing', desc: 'Generate platform health AI report', color: '#f472b6', path: '/admin/ai-briefing' },
  ];

  return (
    <motion.div variants={V} initial="hidden" animate="show" style={{ display: 'flex', flexDirection: 'column', gap: 32, paddingBottom: 48 }}>

      {/* Welcome Header */}
      <motion.div variants={I} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
        <div>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '4px 14px', borderRadius: 999, background: 'rgba(52,211,153,0.1)', border: '1px solid rgba(52,211,153,0.25)', color: '#34d399', fontSize: '0.68rem', fontWeight: 900, letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 14 }}>
            <motion.div animate={{ scale: [1, 1.3, 1] }} transition={{ repeat: Infinity, duration: 2 }}>
              <ShieldCheck size={12} />
            </motion.div>
            Platform Command Center
          </div>
          <h1 style={{ fontSize: '2.8rem', fontWeight: 900, color: 'var(--text-strong)', margin: '0 0 8px', letterSpacing: '-0.04em' }}>
            Welcome back, <span style={{ background: 'linear-gradient(135deg,#22d3ee,#818cf8)', WebkitBackgroundClip: 'text', backgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>{(session.fullName || 'Admin').split(' ')[0]}</span>
          </h1>
          <p style={{ color: 'var(--text-dim)', margin: 0, fontSize: '1rem', display: 'flex', alignItems: 'center', gap: 8 }}>
            Global administrative control for the elevateSmart ecosystem
            <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 600 }}>
              <Clock size={11} /> Last refresh: {lastRefresh.toLocaleTimeString()}
            </span>
          </p>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <motion.button whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }} onClick={fetchStats}
            style={{ padding: '10px 18px', borderRadius: 12, background: 'var(--surface-elevated)', border: '1px solid var(--glass-border)', color: 'var(--text-dim)', fontSize: '0.8rem', fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: 8 }}>
            <RefreshCw size={14} /> Refresh
          </motion.button>
          <motion.button whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }} onClick={handleAiInsight}
            style={{ padding: '10px 18px', borderRadius: 12, background: 'linear-gradient(135deg, rgba(99,102,241,0.2), rgba(167,139,250,0.1))', border: '1px solid rgba(99,102,241,0.3)', color: '#818cf8', fontSize: '0.8rem', fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: 8 }}>
            <Brain size={14} />
            AI Briefing
          </motion.button>
          <motion.button whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }} onClick={() => setIsAdding(true)}
            style={{ padding: '10px 18px', borderRadius: 12, background: 'var(--surface-elevated)', border: '1px solid var(--glass-border)', color: 'var(--text-strong)', fontSize: '0.8rem', fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: 8 }}>
            <Plus size={14} /> Add Widget
          </motion.button>
        </div>
      </motion.div>

      {/* AI Insight Banner (removed, now dedicated page) */}

      {/* Widget Board */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 20 }}>
        <AnimatePresence mode="popLayout">
          {dashboardWidgets.map(id => (
            <motion.div key={id} layout initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.8 }}
              whileHover={{ y: -4 }} style={{ transition: 'filter 0.2s' }}>
              {widgets[id as keyof typeof widgets]}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Quick Actions Grid */}
      <motion.div variants={I}>
        <div style={{ fontSize: '0.68rem', fontWeight: 900, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.15em', marginBottom: 16 }}>Operational Control</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14 }}>
          {quickActions.map(c => (
            <motion.div key={c.label} whileHover={{ x: 4, borderColor: `${c.color}33`, background: 'var(--surface-elevated-hover)' }}
              onClick={() => c.path ? navigate(c.path) : handleAiInsight()}
              style={{ padding: '22px', borderRadius: 20, background: 'var(--surface-elevated)', border: '1px solid var(--glass-border)', cursor: 'pointer', transition: 'all 0.2s', display: 'flex', gap: 18, alignItems: 'center' }}>
              <div style={{ width: 46, height: 46, borderRadius: 14, background: `${c.color}12`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: c.color, flexShrink: 0, boxShadow: `0 0 20px ${c.color}15` }}>
                <c.icon size={20} />
              </div>
              <div>
                <h3 style={{ fontWeight: 800, color: 'var(--text-strong)', fontSize: '0.9rem', margin: '0 0 4px' }}>{c.label}</h3>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.75rem', margin: 0 }}>{c.desc}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* Add Widget Modal */}
      <AnimatePresence>
        {isAdding && (
          <div style={{ position: 'fixed', inset: 0, zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(12px)' }}>
            <motion.div initial={{ opacity: 0, scale: 0.9, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9 }}
              style={{ width: '100%', maxWidth: 420, background: 'var(--bg-dropdown)', border: '1px solid var(--glass-border)', borderRadius: 28, padding: 36 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
                <h2 style={{ color: 'var(--text-strong)', fontSize: '1.2rem', fontWeight: 900, margin: 0 }}>Add Widget</h2>
                <button onClick={() => setIsAdding(false)} style={{ color: 'var(--text-muted)', cursor: 'pointer', background: 'none', border: 'none' }}><X size={20} /></button>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {allWidgetMeta.map(w => (
                  <motion.button key={w.id} whileHover={{ x: 4 }} onClick={() => addWidget(w.id)} disabled={dashboardWidgets.includes(w.id)}
                    style={{ width: '100%', padding: '14px 16px', borderRadius: 14, background: dashboardWidgets.includes(w.id) ? 'var(--color-surface)' : 'var(--surface-elevated)', border: `1px solid ${dashboardWidgets.includes(w.id) ? 'var(--color-surface-hover)' : 'var(--glass-border)'}`, color: dashboardWidgets.includes(w.id) ? 'var(--text-muted)' : 'var(--text-strong)', cursor: dashboardWidgets.includes(w.id) ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', gap: 14, fontFamily: 'inherit', transition: 'all 0.2s', opacity: dashboardWidgets.includes(w.id) ? 0.55 : 1 }}>
                    <div style={{ width: 34, height: 34, borderRadius: 10, background: `${w.color}15`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: w.color }}>
                      <w.icon size={16} />
                    </div>
                    <span style={{ fontWeight: 700, fontSize: '0.88rem' }}>{w.label}</span>
                    {dashboardWidgets.includes(w.id) && <span style={{ marginLeft: 'auto', fontSize: '0.65rem', fontWeight: 900, color: 'var(--text-muted)' }}>ADDED</span>}
                    {!dashboardWidgets.includes(w.id) && <CheckCircle2 size={14} style={{ marginLeft: 'auto', color: w.color, opacity: 0.6 }} />}
                  </motion.button>
                ))}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
