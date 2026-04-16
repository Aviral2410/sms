import React, { useEffect, useState } from 'react';
import { useStore } from '../../store/useStore';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { schoolOpsApi, type SchoolDashboard } from '../../lib/api';
import { Users, BookOpen, Calendar, CreditCard, Home, FileText, Clock, ClipboardList, Loader, AlertTriangle, GraduationCap, Bus, Library, MessageSquare, BarChart2, Sparkles, Layers, Search } from 'lucide-react';
import { AiInsightEngine } from '../../components/AiInsightEngine';

const DIM = 'var(--text-dim)'; const BORDER = 'var(--glass-border)';

const containerV = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.07 } } };
const itemV = { hidden: { opacity: 0, y: 18 }, show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 300, damping: 24 } } };

interface MetricConfig { label: string; key: keyof SchoolDashboard; icon: React.ElementType; accent: string; glow: string; }
const metrics: MetricConfig[] = [
  { label: 'Students', key: 'studentCount', icon: Users, accent: '#22d3ee', glow: '#06b6d4' },
  { label: 'Teachers', key: 'teacherCount', icon: BookOpen, accent: '#a78bfa', glow: '#8b5cf6' },
  { label: 'Classes', key: 'classCount', icon: Home, accent: '#fb923c', glow: '#f97316' },
  { label: 'Departments', key: 'departmentCount', icon: ClipboardList, accent: '#34d399', glow: '#10b981' },
  { label: 'Admissions', key: 'admissionsCount', icon: FileText, accent: '#60a5fa', glow: '#3b82f6' },
  { label: 'Attendance Records', key: 'attendanceRecordCount', icon: Calendar, accent: '#f472b6', glow: '#ec4899' },
  { label: 'Fee Records', key: 'feeRecordCount', icon: CreditCard, accent: '#fbbf24', glow: '#f59e0b' },
  { label: 'Timetable Slots', key: 'timetableSlotCount', icon: Clock, accent: '#c084fc', glow: '#a855f7' },
];

/* Animated number counter */
function AnimatedNum({ value }: { value: number }) {
  const [display, setDisplay] = useState(0);
  useEffect(() => {
    let frame: number; let start = 0; const dur = 900;
    const t0 = performance.now();
    const tick = (now: number) => { const p = Math.min((now - t0) / dur, 1); setDisplay(Math.round(p * value)); if (p < 1) frame = requestAnimationFrame(tick); };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [value]);
  return <>{display.toLocaleString()}</>;
}

export default function SchoolAdminDashboard() {
  const { session, accentColor, setSearchOpen, setPaletteAiMode } = useStore();
  const navigate = useNavigate();
  const [data, setData] = useState<SchoolDashboard | null>(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState('');

  const AMBER = accentColor; const DIM = 'var(--text-dim)'; const BORDER = 'var(--glass-border)';

  useEffect(() => {
    if (!session.schoolId) return;
    setLoading(true);
    schoolOpsApi.getDashboard(session.schoolId)
      .then(setData)
      .catch(e => setErr(e.message || 'Failed to load dashboard'))
      .finally(() => setLoading(false));
  }, [session.schoolId]);

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh', gap: 12, color: DIM }}>
      <Loader size={24} style={{ animation: 'spin 1s linear infinite', color: AMBER }} />
      <span>Loading dashboard…</span>
      <style>{`@keyframes spin{from{transform:rotate(0)}to{transform:rotate(360deg)}}`}</style>
    </div>
  );

  if (err) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh', gap: 12, color: '#fb7185' }}>
      <AlertTriangle size={22} /><span>{err}</span>
    </div>
  );

  const quickActions = [
    { label: 'Classes & Structure', icon: Layers, color: '#22d3ee', path: '/school/structure' },
    { label: 'View Admissions', icon: FileText, color: '#a78bfa', path: '/admissions' },
    { label: 'Manage Students', icon: Users, color: '#34d399', path: '/students' },
    { label: 'Billing & Fees', icon: CreditCard, color: AMBER, path: '/billing' },
  ];

  const extraModules = [
    { label: 'Exam Management', icon: GraduationCap, color: '#f472b6', path: '/exams', desc: 'Create exams, enter marks, publish results' },
    { label: 'Academic Structure', icon: Layers, color: '#818cf8', path: '/school/structure', desc: 'Manage departments, subjects, and instructional nodes' },
    { label: 'Timetable', icon: Clock, color: '#818cf8', path: '/timetable', desc: 'AI-optimized scheduling & slot management' },
    { label: 'Transport', icon: Bus, color: '#fb923c', path: '/transport', desc: 'Routes, vehicles, and tracking' },
    { label: 'Library', icon: Library, color: '#34d399', path: '/library', desc: 'Digital resource catalogue & lending' },
    { label: 'Communication', icon: MessageSquare, color: '#22d3ee', path: '/communication', desc: 'Announcements, messaging & notifications' },
    { label: 'Analytics', icon: BarChart2, color: '#c084fc', path: '/school/analytics', desc: 'Deep insights into school performance' },
  ];

  return (
    <motion.div variants={containerV} initial="hidden" animate="show" style={{ display: 'flex', flexDirection: 'column', gap: 28, paddingBottom: 48 }}>
      {/* Header */}
      <motion.div variants={itemV} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
        <div>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '4px 14px', borderRadius: 999, background: 'rgba(255,182,99,0.1)', border: '1px solid rgba(255,182,99,0.25)', color: AMBER, fontSize: '0.7rem', fontWeight: 800, letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 12 }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: AMBER, display: 'inline-block' }} />
            School Administration
          </div>
          <h1 style={{ fontSize: '2.5rem', fontWeight: 900, letterSpacing: '-0.04em', color: 'var(--text-strong)', margin: '0 0 6px' }}>Operations Overview</h1>
          <p style={{ color: DIM, margin: 0, fontSize: '0.95rem' }}>Live metrics for your institution · Powered by <span style={{ color: '#22d3ee' }}>AI Intelligence</span></p>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <motion.button whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }} 
            onClick={() => {
              setPaletteAiMode(false);
              setSearchOpen(true);
            }}
            style={{ padding: '10px 18px', borderRadius: 12, background: 'var(--surface-elevated)', border: '1px solid var(--glass-border)', color: 'var(--text-strong)', fontSize: '0.8rem', fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: 8 }}>
            <Search size={14} /> Search
          </motion.button>
          <motion.button whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }} 
            onClick={() => {
              setPaletteAiMode(true);
              setSearchOpen(true);
            }}
            style={{ padding: '10px 18px', borderRadius: 12, background: 'linear-gradient(135deg, rgba(34,211,238,0.2), rgba(99,102,241,0.1))', border: '1px solid rgba(34,211,238,0.3)', color: '#22d3ee', fontSize: '0.8rem', fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: 8 }}>
            <Sparkles size={14} /> Ask Insights
          </motion.button>
        </div>
      </motion.div>

      {/* Metrics grid 4-col with animated counters */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16 }}>
        {metrics.map(m => (
          <motion.div key={m.key} variants={itemV} whileHover={{ y: -6, borderColor: `${m.accent}55`, boxShadow: `0 20px 40px ${m.glow}20` }}
            style={{ padding: '24px', borderRadius: 20, background: `linear-gradient(135deg, ${m.accent}08, color-mix(in srgb, var(--bg-surface) 92%, transparent))`, border: `1px solid ${BORDER}`, position: 'relative', overflow: 'hidden', transition: 'all 0.3s ease', cursor: 'default' }}>
            <div style={{ position: 'absolute', top: -30, right: -30, width: 100, height: 100, borderRadius: '50%', background: m.glow, filter: 'blur(40px)', opacity: 0.15 }} />
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
              <div style={{ padding: 8, borderRadius: 12, background: `${m.accent}15`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <m.icon size={18} color={m.accent} />
              </div>
              <Sparkles size={12} style={{ color: m.accent, opacity: 0.4 }} />
            </div>
            <div style={{ fontSize: '2.2rem', fontWeight: 900, color: 'var(--text-strong)', letterSpacing: '-0.03em', lineHeight: 1.1 }}>
              {data ? <AnimatedNum value={data[m.key] as number} /> : '—'}
            </div>
            <div style={{ fontSize: '0.78rem', color: DIM, marginTop: 6, fontWeight: 600 }}>{m.label}</div>
          </motion.div>
        ))}
      </div>

      {/* Quick actions - NOW WITH NAVIGATION */}
      <motion.div variants={itemV} style={{ padding: '28px', borderRadius: 24, background: 'var(--surface-elevated)', border: `1px solid ${BORDER}`, backdropFilter: 'blur(10px)' }}>
        <h3 style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--text-strong)', margin: '0 0 20px', display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ width: 4, height: 20, borderRadius: 4, background: AMBER, display: 'inline-block' }} />
          Quick Actions
        </h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
          {quickActions.map(a => (
            <motion.button key={a.label} whileHover={{ y: -4, scale: 1.02 }} whileTap={{ scale: 0.97 }}
              onClick={() => navigate(a.path)}
              style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10, padding: '20px 12px', borderRadius: 16, background: `${a.color}08`, border: `1px solid ${a.color}20`, cursor: 'pointer', color: a.color, fontFamily: 'inherit', fontSize: '0.82rem', fontWeight: 700, transition: 'all 0.2s' }}
            >
              <div style={{ padding: 10, borderRadius: 14, background: `${a.color}15` }}>
                <a.icon size={22} />
              </div>
              {a.label}
            </motion.button>
          ))}
        </div>
      </motion.div>

      {/* Extended Modules */}
      <motion.div variants={itemV}>
        <h3 style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.15em', marginBottom: 16 }}>Extended Modules</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14 }}>
          {extraModules.map(m => (
            <motion.div key={m.label} variants={itemV} whileHover={{ x: 4, borderColor: `${m.color}33`, background: 'var(--surface-elevated-hover)' }}
              onClick={() => navigate(m.path)}
              style={{ padding: '20px', borderRadius: 18, background: 'var(--surface-elevated)', border: `1px solid ${BORDER}`, cursor: 'pointer', transition: 'all 0.2s', display: 'flex', gap: 16, alignItems: 'center' }}
            >
              <div style={{ width: 42, height: 42, borderRadius: 12, background: `${m.color}12`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: m.color, flexShrink: 0 }}>
                <m.icon size={20} />
              </div>
              <div>
                <h4 style={{ fontWeight: 700, color: 'var(--text-strong)', fontSize: '0.9rem', margin: '0 0 3px' }}>{m.label}</h4>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.75rem', margin: 0 }}>{m.desc}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* AI Predictive Analytics */}
      <motion.div variants={itemV}>
        <AiInsightEngine compact />
      </motion.div>
    </motion.div>
  );
}
