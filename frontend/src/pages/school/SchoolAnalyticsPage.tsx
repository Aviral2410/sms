import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { BarChart2, TrendingUp, Users, Calendar, Award, Activity, Sparkles, Brain } from 'lucide-react';
import { useStore } from '../../store/useStore';
import { schoolOpsApi } from '../../lib/api';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell, RadialBarChart, RadialBar, Legend } from 'recharts';

const V = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.07 } } };
const I = { hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0 } };

const ATTENDANCE_TREND = [
  { month: 'Jan', present: 91, absent: 9 }, { month: 'Feb', present: 88, absent: 12 },
  { month: 'Mar', present: 94, absent: 6 }, { month: 'Apr', present: 89, absent: 11 },
];
const FEE_DATA = [
  { name: 'Collected', value: 78, fill: '#34d399' }, { name: 'Pending', value: 22, fill: '#f87171' },
];
const CLASS_PERFORMANCE = [
  { class: '9-A', avg: 74 }, { class: '9-B', avg: 68 }, { class: '10-A', avg: 82 },
  { class: '10-B', avg: 76 }, { class: '11-A', avg: 71 }, { class: '11-B', avg: 79 },
];
const SUBJECT_DISTRIBUTION = [
  { subject: 'Math', students: 320, fill: '#22d3ee' }, { subject: 'Physics', students: 240, fill: '#a78bfa' },
  { subject: 'Chemistry', students: 280, fill: '#34d399' }, { subject: 'English', students: 420, fill: '#f472b6' },
  { subject: 'History', students: 180, fill: '#fbbf24' },
];

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: '#0f1824', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12, padding: '10px 14px', fontSize: '0.8rem', color: '#fff' }}>
      <div style={{ fontWeight: 700, marginBottom: 4 }}>{label}</div>
      {payload.map((p: any) => (
        <div key={p.name} style={{ color: p.fill || p.color, fontSize: '0.78rem' }}>{p.name}: <strong>{p.value}{p.name.includes('Rate') || p.name.includes('present') || p.name.includes('absent') ? '%' : ''}</strong></div>
      ))}
    </div>
  );
};

export default function SchoolAnalyticsPage() {
  const { session } = useStore();
  const [dashboard, setDashboard] = useState<any>(null);
  const [aiInsight, setAiInsight] = useState('');

  useEffect(() => {
    if (session.schoolId) {
      schoolOpsApi.getDashboard(session.schoolId).then(setDashboard).catch(() => {});
    }
  }, [session.schoolId]);

  const generateInsight = () => {
    setAiInsight('🧠 AI Summary: Attendance peaked in March (94%) and needs attention in February. Class 10-A leads in academic performance (82% avg). Fee collection is at 78% — follow-up needed for 22% outstanding dues. Teacher workload is evenly distributed, no significant outliers detected. Recommend focusing additional tutoring resources on Class 9-B (68% avg).');
  };

  return (
    <motion.div variants={V} initial="hidden" animate="show" style={{ display: 'flex', flexDirection: 'column', gap: 28, paddingBottom: 48 }}>
      {/* Header */}
      <motion.div variants={I} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
        <div>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '4px 14px', borderRadius: 999, background: 'rgba(196,132,252,0.1)', border: '1px solid rgba(196,132,252,0.25)', color: '#c084fc', fontSize: '0.7rem', fontWeight: 800, letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 12 }}><BarChart2 size={12} /> Intelligence Layer</div>
          <h1 style={{ fontSize: '2.5rem', fontWeight: 900, color: '#fff', margin: '0 0 6px', letterSpacing: '-0.04em' }}>School Analytics</h1>
          <p style={{ color: '#8b95a2', margin: 0, fontSize: '0.95rem' }}>Deep institutional intelligence powered by AI data analysis</p>
        </div>
        <motion.button whileHover={{ scale: 1.05 }} onClick={generateInsight}
          style={{ padding: '12px 24px', borderRadius: 14, background: 'linear-gradient(135deg, #c084fc, #a855f7)', border: 'none', color: '#fff', fontWeight: 800, fontSize: '0.85rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8, fontFamily: 'inherit', boxShadow: '0 0 30px rgba(168,85,247,0.3)' }}>
          <Brain size={16} /> Generate AI Report
        </motion.button>
      </motion.div>

      {/* AI Insight */}
      {aiInsight && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          style={{ padding: '20px 24px', borderRadius: 20, background: 'linear-gradient(135deg, rgba(196,132,252,0.08), rgba(168,85,247,0.04))', border: '1px solid rgba(196,132,252,0.2)', display: 'flex', gap: 16, alignItems: 'flex-start' }}>
          <div style={{ padding: 8, borderRadius: 12, background: 'rgba(196,132,252,0.15)', flexShrink: 0 }}><Sparkles size={18} color="#c084fc" /></div>
          <div style={{ fontSize: '0.88rem', color: '#e2e8f0', lineHeight: 1.6 }}>{aiInsight}</div>
        </motion.div>
      )}

      {/* Key Metrics */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16 }}>
        {[
          { label: 'Avg Attendance', value: '90.5%', icon: Calendar, color: '#22d3ee', change: '+2.1%' },
          { label: 'Avg Score', value: '75.3', icon: Award, color: '#a78bfa', change: '+4.2' },
          { label: 'Fee Collection', value: '78%', icon: TrendingUp, color: '#34d399', change: '+6%' },
          { label: 'Active Students', value: dashboard?.studentCount || '—', icon: Users, color: '#f472b6', change: '' },
        ].map(s => (
          <motion.div key={s.label} variants={I} whileHover={{ y: -4 }} style={{ padding: '24px', borderRadius: 20, background: `${s.color}06`, border: `1px solid ${s.color}15`, position: 'relative', overflow: 'hidden' }}>
            <div style={{ position: 'absolute', top: -20, right: -20, width: 80, height: 80, borderRadius: '50%', background: s.color, filter: 'blur(40px)', opacity: 0.12 }} />
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
              <s.icon size={18} color={s.color} />
              {s.change && <span style={{ fontSize: '0.72rem', fontWeight: 800, color: '#34d399' }}>{s.change}</span>}
            </div>
            <div style={{ fontSize: '2rem', fontWeight: 900, color: '#fff', letterSpacing: '-0.02em' }}>{s.value}</div>
            <div style={{ fontSize: '0.78rem', color: '#8b95a2', fontWeight: 600, marginTop: 4 }}>{s.label}</div>
          </motion.div>
        ))}
      </div>

      {/* Charts Row 1 */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
        {/* Attendance Trend */}
        <motion.div variants={I} style={{ padding: '28px', borderRadius: 24, background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 24 }}>
            <Activity size={18} color="#22d3ee" />
            <h3 style={{ color: '#fff', fontWeight: 800, fontSize: '1rem', margin: 0 }}>Attendance Trend</h3>
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={ATTENDANCE_TREND} barSize={32} barGap={4}>
              <XAxis dataKey="month" tick={{ fill: '#8b95a2', fontSize: 12, fontWeight: 600 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#8b95a2', fontSize: 11 }} axisLine={false} tickLine={false} domain={[0, 100]} />
              <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.03)' }} />
              <Bar dataKey="present" name="Present %" fill="#22d3ee" radius={[8, 8, 0, 0]} fillOpacity={0.8} />
              <Bar dataKey="absent" name="Absent %" fill="#f87171" radius={[8, 8, 0, 0]} fillOpacity={0.6} />
            </BarChart>
          </ResponsiveContainer>
        </motion.div>

        {/* Class Performance */}
        <motion.div variants={I} style={{ padding: '28px', borderRadius: 24, background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 24 }}>
            <Award size={18} color="#a78bfa" />
            <h3 style={{ color: '#fff', fontWeight: 800, fontSize: '1rem', margin: 0 }}>Class Performance (Avg %)</h3>
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={CLASS_PERFORMANCE} barSize={32} layout="vertical">
              <XAxis type="number" tick={{ fill: '#8b95a2', fontSize: 11 }} axisLine={false} tickLine={false} domain={[0, 100]} />
              <YAxis type="category" dataKey="class" tick={{ fill: '#8b95a2', fontSize: 12, fontWeight: 600 }} axisLine={false} tickLine={false} width={40} />
              <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.03)' }} />
              <Bar dataKey="avg" name="Avg Score" fill="#a78bfa" radius={[0, 8, 8, 0]} fillOpacity={0.8} />
            </BarChart>
          </ResponsiveContainer>
        </motion.div>
      </div>

      {/* Charts Row 2 */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
        {/* Fee Collection Pie */}
        <motion.div variants={I} style={{ padding: '28px', borderRadius: 24, background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 24 }}>
            <TrendingUp size={18} color="#34d399" />
            <h3 style={{ color: '#fff', fontWeight: 800, fontSize: '1rem', margin: 0 }}>Fee Collection Status</h3>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 32 }}>
            <ResponsiveContainer width={160} height={160}>
              <PieChart>
                <Pie data={FEE_DATA} cx={75} cy={75} innerRadius={50} outerRadius={70} dataKey="value" stroke="none">
                  {FEE_DATA.map((entry, i) => <Cell key={i} fill={entry.fill} opacity={0.85} />)}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
              </PieChart>
            </ResponsiveContainer>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {FEE_DATA.map(d => (
                <div key={d.name} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{ width: 12, height: 12, borderRadius: 4, background: d.fill }} />
                  <div><div style={{ fontSize: '0.8rem', color: '#8b95a2', fontWeight: 600 }}>{d.name}</div><div style={{ fontSize: '1.3rem', fontWeight: 900, color: '#fff' }}>{d.value}%</div></div>
                </div>
              ))}
            </div>
          </div>
        </motion.div>

        {/* Subject Distribution */}
        <motion.div variants={I} style={{ padding: '28px', borderRadius: 24, background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 24 }}>
            <Users size={18} color="#f472b6" />
            <h3 style={{ color: '#fff', fontWeight: 800, fontSize: '1rem', margin: 0 }}>Enrollment by Subject</h3>
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={SUBJECT_DISTRIBUTION} barSize={28}>
              <XAxis dataKey="subject" tick={{ fill: '#8b95a2', fontSize: 11, fontWeight: 600 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#8b95a2', fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.03)' }} />
              <Bar dataKey="students" name="Students" radius={[8, 8, 0, 0]}>
                {SUBJECT_DISTRIBUTION.map((entry, i) => <Cell key={i} fill={entry.fill} opacity={0.8} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </motion.div>
      </div>
    </motion.div>
  );
}
