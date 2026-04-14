import React, { useEffect, useState } from 'react';
import { useStore } from '../../store/useStore';
import { motion } from 'framer-motion';
import { schoolOpsApi, type TeacherWorkspace } from '../../lib/api';
import { BookOpen, Users, Calendar, CheckCircle2, Clock, Loader, AlertTriangle } from 'lucide-react';

const VIOLET = '#a78bfa'; const DIM = '#8b95a2'; const BORDER = 'rgba(255,255,255,0.07)';
const containerV = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.07 } } };
const itemV = { hidden: { opacity: 0, y: 18 }, show: { opacity: 1, y: 0 } };

export default function TeacherDashboard() {
  const { session } = useStore();
  const [data, setData] = useState<TeacherWorkspace | null>(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState('');

  useEffect(() => {
    if (!session.schoolId || !session.email) return;
    schoolOpsApi.getTeacherWorkspace(session.schoolId, session.email)
      .then(setData).catch(e => setErr(e.message)).finally(() => setLoading(false));
  }, [session.schoolId, session.email]);

  if (loading) return <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh', gap: 12, color: DIM }}><Loader size={24} style={{ animation: 'spin 1s linear infinite', color: VIOLET }} /><span>Loading workspace…</span><style>{`@keyframes spin{from{transform:rotate(0)}to{transform:rotate(360deg)}}`}</style></div>;
  if (err) return <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh', gap: 12, color: '#fb7185' }}><AlertTriangle size={22} /><span>{err}</span></div>;

  return (
    <motion.div variants={containerV} initial="hidden" animate="show" style={{ display: 'flex', flexDirection: 'column', gap: 24, paddingBottom: 48 }}>
      <motion.div variants={itemV}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '4px 14px', borderRadius: 999, background: 'rgba(167,139,250,0.1)', border: '1px solid rgba(167,139,250,0.25)', color: VIOLET, fontSize: '0.7rem', fontWeight: 800, letterSpacing: '0.12em', textTransform: 'uppercase' as const, marginBottom: 12 }}>Teaching Workspace</div>
        <h1 style={{ fontSize: '2rem', fontWeight: 900, color: '#fff', margin: '0 0 6px', letterSpacing: '-0.03em' }}>Good day, {session.fullName?.split(' ')[0] || 'Teacher'}!</h1>
        <p style={{ color: DIM, margin: 0, fontSize: '0.9rem' }}>{data?.scheduleMessage || 'Here is your teaching overview.'}</p>
      </motion.div>

      {/* Metrics row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
        {[
          { label: 'Assigned Subjects', val: data?.assignedSubjects?.length ?? 0, icon: BookOpen, color: VIOLET },
          { label: 'Classes Teaching', val: data?.assignedClasses?.length ?? 0, icon: Users, color: '#22d3ee' },
          { label: 'Class Teacher Of', val: data?.classTeacherOf?.length ?? 0, icon: Calendar, color: '#34d399' },
        ].map(m => (
          <motion.div key={m.label} variants={itemV} style={{ padding: '22px', borderRadius: 18, background: 'rgba(255,255,255,0.04)', border: `1px solid ${BORDER}`, overflow: 'hidden', position: 'relative' }}>
            <m.icon size={18} color={m.color} style={{ marginBottom: 14 }} />
            <div style={{ fontSize: '2.2rem', fontWeight: 900, color: '#fff', letterSpacing: '-0.02em', lineHeight: 1 }}>{m.val}</div>
            <div style={{ fontSize: '0.78rem', color: DIM, marginTop: 4, fontWeight: 600 }}>{m.label}</div>
          </motion.div>
        ))}
      </div>

      {/* Classes grid */}
      {data?.assignedClasses && data.assignedClasses.length > 0 && (
        <motion.div variants={itemV} style={{ padding: '24px', borderRadius: 20, background: 'rgba(255,255,255,0.03)', border: `1px solid ${BORDER}` }}>
          <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#fff', margin: '0 0 16px' }}>My Classes</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 10 }}>
            {data.assignedClasses.map(c => (
              <div key={c.classId} style={{ padding: '14px', borderRadius: 14, background: 'rgba(167,139,250,0.06)', border: '1px solid rgba(167,139,250,0.15)' }}>
                <div style={{ fontWeight: 700, fontSize: '0.9rem', color: '#e2e8f0' }}>{c.className}</div>
                <div style={{ fontSize: '0.75rem', color: DIM }}>{c.sectionName} · {c.academicYear}</div>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Subjects */}
      {data?.assignedSubjects && data.assignedSubjects.length > 0 && (
        <motion.div variants={itemV} style={{ padding: '24px', borderRadius: 20, background: 'rgba(255,255,255,0.03)', border: `1px solid ${BORDER}` }}>
          <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#fff', margin: '0 0 16px' }}>Subjects I Teach</h3>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
            {data.assignedSubjects.map(s => (
              <div key={s.subjectId} style={{ padding: '8px 16px', borderRadius: 999, background: 'rgba(34,211,238,0.08)', border: '1px solid rgba(34,211,238,0.2)', color: '#22d3ee', fontSize: '0.82rem', fontWeight: 700 }}>
                {s.subjectName} <span style={{ opacity: 0.6, fontWeight: 500 }}>({s.subjectCode})</span>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Schedule status */}
      <motion.div variants={itemV} style={{ padding: '20px 24px', borderRadius: 16, background: data?.scheduleStatus === 'COMPLETE' ? 'rgba(52,211,153,0.06)' : 'rgba(251,191,36,0.06)', border: `1px solid ${data?.scheduleStatus === 'COMPLETE' ? 'rgba(52,211,153,0.2)' : 'rgba(251,191,36,0.2)'}`, display: 'flex', alignItems: 'center', gap: 12 }}>
        {data?.scheduleStatus === 'COMPLETE' ? <CheckCircle2 size={20} color="#34d399" /> : <Clock size={20} color="#fbbf24" />}
        <div>
          <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#fff' }}>Schedule Status: {data?.scheduleStatus || 'Unknown'}</div>
          <div style={{ fontSize: '0.78rem', color: DIM }}>{data?.scheduleMessage}</div>
        </div>
      </motion.div>
    </motion.div>
  );
}
