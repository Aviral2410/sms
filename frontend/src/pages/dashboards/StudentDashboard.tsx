import React, { useEffect, useState } from 'react';
import { useStore } from '../../store/useStore';
import { motion } from 'framer-motion';
import { schoolOpsApi, type StudentWorkspaceResponse } from '../../lib/api';
import { GraduationCap, Users, BookOpen, AlertCircle, CheckCircle2, Clock, Loader, Brain } from 'lucide-react';

const CYAN = '#22d3ee'; const DIM = '#8b95a2'; const BORDER = 'rgba(255,255,255,0.07)';
const V = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.07 } } };
const I = { hidden: { opacity: 0, y: 18 }, show: { opacity: 1, y: 0 } };

export default function StudentDashboard() {
  const { session } = useStore();
  const [data, setData] = useState<StudentWorkspaceResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState('');

  useEffect(() => {
    if (!session.token) return;
    schoolOpsApi.getMyStudentWorkspace()
      .then(setData).catch(e => setErr(e.message)).finally(() => setLoading(false));
  }, [session.token]);

  if (loading) return <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height:'60vh', gap: 12, color: DIM }}><Loader size={24} style={{ animation: 'spin 1s linear infinite', color: CYAN }} /><span>Loading...</span><style>{`@keyframes spin{from{transform:rotate(0)}to{transform:rotate(360deg)}}`}</style></div>;
  if (err) return <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height:'60vh', gap: 12, color: '#fb7185' }}><AlertCircle size={22} /><span>{err}</span></div>;

  return (
    <motion.div variants={V} initial="hidden" animate="show" style={{ display: 'flex', flexDirection: 'column', gap: 24, paddingBottom: 48 }}>
      <motion.div variants={I}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '4px 14px', borderRadius: 999, background: 'rgba(34,211,238,0.1)', border: '1px solid rgba(34,211,238,0.25)', color: CYAN, fontSize: '0.7rem', fontWeight: 800, letterSpacing: '0.12em', textTransform: 'uppercase' as const, marginBottom: 12 }}>Learning Portal</div>
        <h1 style={{ fontSize: '2rem', fontWeight: 900, color: '#fff', margin: '0 0 6px', letterSpacing: '-0.03em' }}>Welcome, {session.fullName?.split(' ')[0] || 'Student'}!</h1>
        <p style={{ color: DIM, margin: 0, fontSize: '0.9rem' }}>{data?.scheduleMessage || 'Your academic snapshot.'}</p>
      </motion.div>

      {/* Enrolled class card */}
      {data?.enrolledClass ? (
        <motion.div variants={I} style={{ padding: '28px', borderRadius: 20, background: 'linear-gradient(135deg, rgba(6,182,212,0.08), rgba(2,6,23,0.6))', border: '1px solid rgba(34,211,238,0.2)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <div style={{ width: 52, height: 52, borderRadius: 16, background: 'rgba(34,211,238,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <GraduationCap size={24} color={CYAN} />
            </div>
            <div>
              <div style={{ fontWeight: 800, fontSize: '1.2rem', color: '#fff' }}>{data.enrolledClass.className}</div>
              <div style={{ color: DIM, fontSize: '0.85rem' }}>Section {data.enrolledClass.sectionName} | {data.enrolledClass.academicYear}</div>
            </div>
          </div>
        </motion.div>
      ) : (
        <motion.div variants={I} style={{ padding: '24px', borderRadius: 16, background: 'rgba(251,191,36,0.06)', border: '1px solid rgba(251,191,36,0.2)', display: 'flex', gap: 12, alignItems: 'center' }}>
          <Clock size={20} color="#fbbf24" />
          <div style={{ fontSize: '0.88rem', color: '#fde68a', fontWeight: 600 }}>Not yet enrolled in a class. Contact your school admin.</div>
        </motion.div>
      )}

      {/* Class teacher */}
      {data?.classTeacher && (
        <motion.div variants={I} style={{ padding: '20px 24px', borderRadius: 16, background: 'rgba(255,255,255,0.03)', border: `1px solid ${BORDER}`, display: 'flex', gap: 14, alignItems: 'center' }}>
          <div style={{ width: 40, height: 40, borderRadius: 12, background: 'rgba(167,139,250,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Users size={20} color="#a78bfa" />
          </div>
          <div>
            <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#a78bfa', textTransform: 'uppercase' as const, letterSpacing: '0.08em' }}>Class Teacher</div>
            <div style={{ fontWeight: 700, color: '#e2e8f0' }}>{data.classTeacher.fullName}</div>
            <div style={{ fontSize: '0.78rem', color: DIM }}>{data.classTeacher.email}</div>
          </div>
        </motion.div>
      )}

      {/* Subject teachers */}
      {data?.subjectTeachers && data.subjectTeachers.length > 0 && (
        <motion.div variants={I} style={{ padding: '24px', borderRadius: 20, background: 'rgba(255,255,255,0.03)', border: `1px solid ${BORDER}` }}>
          <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#fff', margin: '0 0 16px', display: 'flex', alignItems: 'center', gap: 8 }}>
            <BookOpen size={16} color={CYAN} /> My Subject Teachers
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {data.subjectTeachers.map((t: any, i: number) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', borderRadius: 12, background: 'rgba(255,255,255,0.03)', border: `1px solid ${BORDER}` }}>
                <div>
                  <div style={{ fontWeight: 700, fontSize: '0.88rem', color: '#e2e8f0' }}>{t.subjectName} <span style={{ color: DIM, fontWeight: 500 }}>({t.subjectCode})</span></div>
                  <div style={{ fontSize: '0.75rem', color: DIM }}>{t.teacherEmail}</div>
                </div>
                <div style={{ fontWeight: 600, fontSize: '0.82rem', color: '#a78bfa' }}>{t.teacherName}</div>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Learning Mode Quick Access */}
      <motion.div 
        variants={I} 
        whileHover={{ scale: 1.01, translateY: -2 }}
        whileTap={{ scale: 0.98 }}
        onClick={() => window.location.href = '/learn'}
        style={{ 
          padding: '24px', 
          borderRadius: 24, 
          background: 'linear-gradient(135deg, rgba(99,102,241,0.15), rgba(168,85,247,0.05))', 
          border: '1px solid rgba(99,102,241,0.3)',
          cursor: 'pointer',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: 20
        }}
      >
        <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
          <div style={{ width: 48, height: 48, borderRadius: 16, background: 'rgba(99,102,241,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Brain size={24} color="#818cf8" />
          </div>
          <div>
            <div style={{ fontWeight: 800, fontSize: '1.1rem', color: '#fff' }}>AI Learning Mode</div>
            <div style={{ color: '#94a3b8', fontSize: '0.8rem' }}>Visualize any concept with interactive step-by-step guides.</div>
          </div>
        </div>
        <div style={{ padding: '8px 16px', borderRadius: 12, background: 'rgba(255,255,255,0.05)', fontSize: '0.75rem', fontWeight: 800, color: '#fff', textTransform: 'uppercase', border: '1px solid rgba(255,255,255,0.1)' }}>Go Learn</div>
      </motion.div>

      {/* Schedule status */}
      <motion.div variants={I} style={{ padding: '18px 22px', borderRadius: 14, background: data?.scheduleStatus === 'COMPLETE' ? 'rgba(52,211,153,0.06)' : 'rgba(251,191,36,0.06)', border: `1px solid ${data?.scheduleStatus === 'COMPLETE' ? 'rgba(52,211,153,0.2)' : 'rgba(251,191,36,0.2)'}`, display: 'flex', gap: 10, alignItems: 'center' }}>
        {data?.scheduleStatus === 'COMPLETE' ? <CheckCircle2 size={18} color="#34d399" /> : <Clock size={18} color="#fbbf24" />}
        <div style={{ fontSize: '0.83rem', color: '#94a3b8' }}>Schedule: <strong style={{ color: '#fff' }}>{data?.scheduleStatus}</strong> - {data?.scheduleMessage}</div>
      </motion.div>
    </motion.div>
  );
}
