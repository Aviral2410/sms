import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useStore } from '../../store/useStore';
import { schoolOpsApi, type TimetableSlotResponse, type AcademicClassResponse } from '../../lib/api';
import { Clock, Plus, Sparkles, Brain, ChevronLeft, ChevronRight, Zap, Users, BookOpen, X, Loader } from 'lucide-react';

const V = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.04 } } };
const I = { hidden: { opacity: 0, y: 16 }, show: { opacity: 1, y: 0 } };

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const PERIODS = ['08:00–08:45', '08:50–09:35', '09:40–10:25', '10:40–11:25', '11:30–12:15', '12:20–13:05', '14:00–14:45', '14:50–15:35'];
const COLORS = ['#22d3ee', '#a78bfa', '#f472b6', '#34d399', '#fbbf24', '#60a5fa', '#fb923c', '#818cf8'];

type Slot = { subject: string; teacher: string; room: string; color: string; };
type TimetableGrid = Record<string, Record<string, Slot | null>>;

export default function TimetablePage() {
  const { session } = useStore();
  const [grid, setGrid] = useState<TimetableGrid>({});
  const [classes, setClasses] = useState<AcademicClassResponse[]>([]);
  const [selectedClassId, setSelectedClassId] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [aiOptimizing, setAiOptimizing] = useState(false);
  const [showAiModal, setShowAiModal] = useState(false);
  const [aiConfig, setAiConfig] = useState({
    periodLength: 45,
    recessLength: 30,
    startTime: '08:00',
    classesPerTeacher: 25,
    workingDays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday']
  });
  const [suggestedSlots, setSuggestedSlots] = useState<TimetableSlotResponse[]>([]);
  const [subjectMap, setSubjectMap] = useState<Record<string, string>>({});
  const [userMap, setUserMap] = useState<Record<string, string>>({});

  useEffect(() => {
    Promise.all([
      schoolOpsApi.listClasses(session.schoolId!),
      schoolOpsApi.listTimetable(session.schoolId!),
      schoolOpsApi.listSubjects(session.schoolId!),
      schoolOpsApi.listUsers(session.schoolId!)
    ]).then(([classesRes, slotsRes, subjectsRes, usersRes]) => {
      setClasses(classesRes);
      if (classesRes.length > 0 && !selectedClassId) setSelectedClassId(classesRes[0].classId);
      
      const sMap = subjectsRes.reduce((acc, s) => ({ ...acc, [s.subjectId]: s.subjectName }), {} as Record<string, string>);
      const uMap = usersRes.reduce((acc, u) => ({ ...acc, [u.userId]: u.fullName }), {} as Record<string, string>);
      setSubjectMap(sMap);
      setUserMap(uMap);

      // Map slots to grid
      const newGrid: TimetableGrid = {};
      DAYS.forEach(day => {
        newGrid[day] = {};
        PERIODS.forEach(period => {
          newGrid[day][period] = null;
        });
      });

      slotsRes.filter(s => s.classId === selectedClassId).forEach((slot, idx) => {
        if (!newGrid[slot.dayOfWeek]) newGrid[slot.dayOfWeek] = {};
        const periodKey = PERIODS[slot.periodNumber - 1] || `${slot.startTime}–${slot.endTime}`;
        newGrid[slot.dayOfWeek][periodKey] = {
          subject: sMap[slot.subjectId] || slot.subjectId,
          teacher: uMap[slot.teacherUserId] || slot.teacherUserId,
          room: slot.roomNumber || 'Room-TBD',
          color: COLORS[idx % COLORS.length]
        };
      });
      setGrid(newGrid);
    }).finally(() => setLoading(false));
  }, [session.schoolId, selectedClassId]);

  const handleAiOptimize = async () => {
    if (!selectedClassId || !session.schoolId) return;
    setAiOptimizing(true);
    setShowAiModal(false);
    try {
      const res = await schoolOpsApi.optimizeTimetable({
        schoolId: session.schoolId,
        classId: selectedClassId,
        periodLengthMinutes: aiConfig.periodLength,
        recessLengthMinutes: aiConfig.recessLength,
        schoolStartTime: aiConfig.startTime,
        workingDays: aiConfig.workingDays,
        classesPerTeacherPerWeek: aiConfig.classesPerTeacher
      });
      setSuggestedSlots(res.suggestedSlots);
      
      // Update grid with suggestions (temporary preview)
      const previewGrid: TimetableGrid = { ...grid };
      res.suggestedSlots.forEach((slot, idx) => {
        const periodKey = `${slot.startTime}–${slot.endTime}`;
        if (!previewGrid[slot.dayOfWeek]) previewGrid[slot.dayOfWeek] = {};
        previewGrid[slot.dayOfWeek][periodKey] = {
          subject: `${subjectMap[slot.subjectId] || slot.subjectId} (AI)`,
          teacher: userMap[slot.teacherUserId] || slot.teacherUserId,
          room: slot.roomNumber || 'Auto',
          color: COLORS[(idx + 10) % COLORS.length]
        };
      });
      setGrid(previewGrid);
    } catch (err) {
      console.error(err);
    } finally {
      setAiOptimizing(false);
    }
  };

  const saveBulk = async () => {
    if (!selectedClassId || !session.schoolId || suggestedSlots.length === 0) return;
    setLoading(true);
    try {
      await schoolOpsApi.saveBulkTimetable({
        schoolId: session.schoolId,
        classId: selectedClassId,
        slots: suggestedSlots.map(s => ({
          schoolId: s.schoolId,
          classId: s.classId,
          subjectId: s.subjectId,
          teacherUserId: s.teacherUserId,
          dayOfWeek: s.dayOfWeek,
          startTime: s.startTime,
          endTime: s.endTime,
          roomName: s.roomNumber
        }))
      });
      setSuggestedSlots([]);
      window.location.reload();
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return (
    <div className="flex items-center justify-center h-[60vh] text-slate-500 font-bold text-xs uppercase tracking-widest gap-3">
      <Loader className="animate-spin" size={18} /> Synchronizing academic schedule...
    </div>
  );

  return (
    <motion.div variants={V} initial="hidden" animate="show" style={{ display: 'flex', flexDirection: 'column', gap: 24, paddingBottom: 48 }}>
      {/* Header */}
      <motion.div variants={I} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
        <div>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '4px 14px', borderRadius: 999, background: 'rgba(129,140,248,0.1)', border: '1px solid rgba(129,140,248,0.25)', color: '#818cf8', fontSize: '0.7rem', fontWeight: 800, letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 12 }}>
            <Clock size={12} /> Smart Scheduling
          </div>
          <h1 style={{ fontSize: '2.5rem', fontWeight: 900, color: '#fff', margin: '0 0 6px', letterSpacing: '-0.04em' }}>Timetable</h1>
          <p style={{ color: '#8b95a2', margin: 0, fontSize: '0.95rem' }}>AI-optimized scheduling with conflict detection and workload balancing</p>
        </div>
        <div style={{ display: 'flex', gap: 12 }}>
          <select value={selectedClassId} onChange={e => setSelectedClassId(e.target.value)}
            style={{ padding: '12px 20px', borderRadius: 14, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', fontSize: '0.85rem', fontWeight: 700, fontFamily: 'inherit', cursor: 'pointer', outline: 'none' }}>
            {classes.map(c => <option key={c.classId} value={c.classId} style={{ background: '#0b0f14' }}>{c.className} {c.sectionName}</option>)}
          </select>
          {suggestedSlots.length > 0 ? (
            <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={saveBulk}
              style={{ padding: '12px 24px', borderRadius: 14, background: '#34d399', border: 'none', color: '#fff', fontWeight: 800, fontSize: '0.85rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8, fontFamily: 'inherit', boxShadow: '0 0 30px rgba(52,211,153,0.3)' }}>
              <Plus size={16} /> Save AI Schedule
            </motion.button>
          ) : (
            <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={() => setShowAiModal(true)}
              style={{ padding: '12px 24px', borderRadius: 14, background: aiOptimizing ? 'rgba(129,140,248,0.2)' : 'linear-gradient(135deg, #818cf8, #6366f1)', border: 'none', color: '#fff', fontWeight: 800, fontSize: '0.85rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8, fontFamily: 'inherit', boxShadow: '0 0 30px rgba(99,102,241,0.3)' }}>
              {aiOptimizing ? <><motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}><Zap size={16} /></motion.div> Optimizing...</> : <><Brain size={16} /> AI Optimize</>}
            </motion.button>
          )}
        </div>
      </motion.div>

      {/* AI Configuration Modal */}
      <AnimatePresence>
        {showAiModal && (
          <div style={{ position: 'fixed', inset: 0, zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(8px)' }}>
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
              style={{ width: '100%', maxWidth: 450, padding: 32, borderRadius: 28, background: '#0f172a', border: '1px solid rgba(255,255,255,0.1)', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 900, color: '#fff', margin: 0 }}>AI Scheduler Config</h3>
                <button onClick={() => setShowAiModal(false)} style={{ background: 'none', border: 'none', color: '#475569', cursor: 'pointer' }}><X size={20} /></button>
              </div>
              
              <div style={{ display: 'grid', gap: 20 }}>
                {[
                  { label: 'Period Length (min)', key: 'periodLength', type: 'number' },
                  { label: 'Recess Length (min)', key: 'recessLength', type: 'number' },
                  { label: 'Start Time', key: 'startTime', type: 'text' },
                  { label: 'Max Classes / Teacher / Week', key: 'classesPerTeacher', type: 'number' }
                ].map(f => (
                  <div key={f.key}>
                    <label style={{ display: 'block', fontSize: '0.7rem', fontWeight: 800, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8 }}>{f.label}</label>
                    <input type={f.type} value={(aiConfig as any)[f.key]} onChange={e => setAiConfig({ ...aiConfig, [f.key]: f.type === 'number' ? parseInt(e.target.value) : e.target.value })}
                      style={{ width: '100%', padding: '12px 16px', borderRadius: 12, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', fontSize: '0.9rem', outline: 'none' }} />
                  </div>
                ))}
              </div>

              <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={handleAiOptimize}
                style={{ width: '100%', marginTop: 32, padding: 16, borderRadius: 16, background: 'linear-gradient(135deg, #818cf8, #6366f1)', border: 'none', color: '#fff', fontWeight: 800, fontSize: '0.9rem', cursor: 'pointer' }}>
                Generate Optimized Schedule
              </motion.button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* AI Banner during optimization */}
      <AnimatePresence>
        {aiOptimizing && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
            style={{ padding: '20px 24px', borderRadius: 20, background: 'linear-gradient(135deg, rgba(99,102,241,0.1), rgba(129,140,248,0.05))', border: '1px solid rgba(99,102,241,0.3)', display: 'flex', gap: 16, alignItems: 'center' }}>
            <motion.div animate={{ scale: [1, 1.2, 1] }} transition={{ repeat: Infinity, duration: 1.5 }} style={{ padding: 10, borderRadius: 14, background: 'rgba(99,102,241,0.2)' }}>
              <Sparkles size={20} color="#818cf8" />
            </motion.div>
            <div>
              <div style={{ fontWeight: 800, color: '#fff', fontSize: '0.95rem' }}>AI is resolving conflicts and balancing teacher workloads…</div>
              <div style={{ fontSize: '0.8rem', color: '#8b95a2', marginTop: 4 }}>Analyzing 48 constraints across 6 classes • Optimizing for minimum room changes</div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Timetable Grid */}
      <motion.div variants={I} style={{ borderRadius: 24, overflow: 'hidden', border: '1px solid rgba(255,255,255,0.06)', background: 'rgba(255,255,255,0.01)' }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 1000 }}>
            <thead>
              <tr>
                <th style={{ padding: '16px 20px', textAlign: 'left', background: 'rgba(255,255,255,0.03)', fontSize: '0.7rem', fontWeight: 800, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.12em', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>Period</th>
                {DAYS.map(d => (
                  <th key={d} style={{ padding: '16px 12px', textAlign: 'center', background: 'rgba(255,255,255,0.03)', fontSize: '0.7rem', fontWeight: 800, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.1em', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>{d}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {PERIODS.map((period, pi) => (
                <tr key={period}>
                  <td style={{ padding: '10px 20px', borderBottom: '1px solid rgba(255,255,255,0.03)', fontSize: '0.75rem', fontWeight: 700, color: '#8b95a2', whiteSpace: 'nowrap' }}>
                    <div style={{ fontSize: '0.7rem', fontWeight: 800, color: '#475569', marginBottom: 2 }}>P{pi + 1}</div>
                    {period}
                  </td>
                  {DAYS.map(day => {
                    const slot = grid[day]?.[period];
                    return (
                      <td key={day} style={{ padding: '6px', borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                        {slot ? (
                          <motion.div whileHover={{ scale: 1.03, y: -2 }}
                            style={{ padding: '10px 12px', borderRadius: 14, background: `${slot.color}10`, border: `1px solid ${slot.color}20`, cursor: 'pointer', transition: 'all 0.2s', minHeight: 60, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                            <div style={{ fontWeight: 800, fontSize: '0.78rem', color: slot.color, marginBottom: 3 }}>{slot.subject}</div>
                            <div style={{ fontSize: '0.68rem', color: '#8b95a2', display: 'flex', alignItems: 'center', gap: 4 }}><Users size={10} />{slot.teacher}</div>
                            <div style={{ fontSize: '0.62rem', color: '#475569', marginTop: 2 }}>{slot.room}</div>
                          </motion.div>
                        ) : (
                          <div style={{ padding: '10px', borderRadius: 14, border: '1px dashed rgba(255,255,255,0.06)', minHeight: 60, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                            <Plus size={14} color="#334155" />
                          </div>
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </motion.div>

      {/* Legend */}
      <motion.div variants={I} style={{ display: 'flex', gap: 16, flexWrap: 'wrap', padding: '16px 20px', borderRadius: 16, background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)' }}>
        <div style={{ fontSize: '0.7rem', fontWeight: 800, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.1em', display: 'flex', alignItems: 'center', marginRight: 8 }}>Subjects:</div>
        {['Mathematics', 'Physics', 'English', 'Chemistry', 'Biology', 'Computer Science', 'History'].map((s, i) => (
          <div key={s} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.75rem', color: '#8b95a2' }}>
            <div style={{ width: 8, height: 8, borderRadius: 3, background: COLORS[i % COLORS.length] }} />{s}
          </div>
        ))}
      </motion.div>
    </motion.div>
  );
}
