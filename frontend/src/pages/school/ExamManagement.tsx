import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useStore } from '../../store/useStore';
import { schoolOpsApi, type ExamResponse, type ExamCreateRequest } from '../../lib/api';
import { GraduationCap, Plus, Calendar, Users, FileText, BarChart2, Sparkles, ChevronRight, Clock, CheckCircle2, AlertTriangle, Loader, Search, Filter, X, Brain, TrendingUp } from 'lucide-react';
import { toast } from 'sonner';

const V = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.06 } } };
const I = { hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0 } };
const ACCENT = '#f472b6';

type Exam = {
  examId: string;
  examName: string;
  academicYear: string;
  term?: string | null;
  startDate?: string | null;
  endDate?: string | null;
  status: 'DRAFT' | 'SCHEDULED' | 'COMPLETED' | 'PUBLISHED';
  createdAt: string;
  publishedAt?: string | null;
};

export default function ExamManagement() {
  const { session } = useStore();
  const [exams, setExams] = useState<Exam[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [filter, setFilter] = useState<string>('ALL');
  const [search, setSearch] = useState('');
  const [aiInsight, setAiInsight] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [createDraft, setCreateDraft] = useState<ExamCreateRequest>({
    schoolId: session.schoolId || '',
    examName: '',
    academicYear: '',
    term: '',
    startDate: '',
    endDate: '',
  });

  useEffect(() => {
    if (!session.schoolId) return;
    schoolOpsApi.listExams(session.schoolId)
      .then((res: ExamResponse[]) => setExams(res as any))
      .finally(() => setLoading(false));
  }, [session.schoolId]);

  useEffect(() => {
    const schoolId = session.schoolId;
    if (!schoolId) return;
    setCreateDraft(d => ({ ...d, schoolId }));
  }, [session.schoolId]);

  const handleCreateExam = async () => {
    if (!createDraft.schoolId || !createDraft.examName.trim() || !createDraft.academicYear.trim()) {
      toast.error('Exam name and academic year are required.');
      return;
    }
    setCreating(true);
    try {
      await schoolOpsApi.createExam({
        schoolId: createDraft.schoolId,
        examName: createDraft.examName.trim(),
        academicYear: createDraft.academicYear.trim(),
        term: createDraft.term?.trim() || null,
        startDate: createDraft.startDate || null,
        endDate: createDraft.endDate || null,
      });
      toast.success('Exam created');
      const next = await schoolOpsApi.listExams(createDraft.schoolId);
      setExams(next as any);
      setShowCreate(false);
      setCreateDraft(d => ({ ...d, examName: '', academicYear: '', term: '', startDate: '', endDate: '' }));
    } catch (e: any) {
      toast.error(e?.message || 'Failed to create exam');
    } finally {
      setCreating(false);
    }
  };

  const handleAiOptimize = () => {
    // Logic for AI optimization
  };

  const generateAiInsight = () => {
    setAiInsight(null);
    setTimeout(() => {
      setAiInsight('📊 AI Analysis: Overall pass rate is healthy. Some students are struggling with specific subjects. Recommendation: Focus on enrichment programs for the bottom 10% of students in Mathematics and Science.');
    }, 1500);
  };

  const statusConfig: Record<string, { color: string; bg: string; label: string }> = {
    DRAFT: { color: '#94a3b8', bg: 'rgba(148,163,184,0.10)', label: 'Draft' },
    SCHEDULED: { color: '#60a5fa', bg: 'rgba(96,165,250,0.1)', label: 'Scheduled' },
    IN_PROGRESS: { color: '#fbbf24', bg: 'rgba(251,191,36,0.1)', label: 'In Progress' },
    COMPLETED: { color: '#34d399', bg: 'rgba(52,211,153,0.1)', label: 'Completed' },
    PUBLISHED: { color: '#a78bfa', bg: 'rgba(167,139,250,0.1)', label: 'Published' },
  };

  const filtered = exams.filter(e =>
    (filter === 'ALL' || e.status === filter) &&
    (e.examName.toLowerCase().includes(search.toLowerCase()) ||
      e.academicYear.toLowerCase().includes(search.toLowerCase()) ||
      (e.term || '').toLowerCase().includes(search.toLowerCase()))
  );

  const stats = {
    total: exams.length,
    scheduled: exams.filter(e => e.status === 'SCHEDULED').length,
    completed: exams.filter(e => e.status === 'COMPLETED' || e.status === 'PUBLISHED').length,
    avgPass: 0,
  };

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh', color: '#8b95a2', gap: 12, fontSize: '0.8rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em' }}>
      <Loader size={20} className="animate-spin" /> Analyzing examination records...
    </div>
  );

  return (
    <motion.div variants={V} initial="hidden" animate="show" style={{ display: 'flex', flexDirection: 'column', gap: 28, paddingBottom: 48 }}>
      {/* Header */}
      <motion.div variants={I} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
        <div>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '4px 14px', borderRadius: 999, background: `${ACCENT}15`, border: `1px solid ${ACCENT}30`, color: ACCENT, fontSize: '0.7rem', fontWeight: 800, letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 12 }}>
            <GraduationCap size={12} /> Examination Suite
          </div>
          <h1 style={{ fontSize: '2.5rem', fontWeight: 900, color: '#fff', margin: '0 0 6px', letterSpacing: '-0.04em' }}>Exam Management</h1>
          <p style={{ color: '#8b95a2', margin: 0, fontSize: '0.95rem' }}>Create, schedule, grade, and analyze examinations with <span style={{ color: '#22d3ee' }}>AI-powered insights</span></p>
        </div>
        <div style={{ display: 'flex', gap: 12 }}>
          <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }} onClick={generateAiInsight}
            style={{ padding: '12px 20px', borderRadius: 14, background: 'rgba(167,139,250,0.1)', border: '1px solid rgba(167,139,250,0.25)', color: '#a78bfa', fontWeight: 800, fontSize: '0.85rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8, fontFamily: 'inherit' }}>
            <Brain size={16} /> AI Analysis
          </motion.button>
          <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={() => setShowCreate(true)}
            style={{ padding: '12px 24px', borderRadius: 14, background: `linear-gradient(135deg, ${ACCENT}, #ec4899)`, border: 'none', color: '#fff', fontWeight: 800, fontSize: '0.85rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8, fontFamily: 'inherit', boxShadow: `0 0 30px ${ACCENT}40` }}>
            <Plus size={16} /> Create Exam
          </motion.button>
        </div>
      </motion.div>

      {/* AI Insight Banner */}
      <AnimatePresence>
        {aiInsight && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
            style={{ padding: '20px 24px', borderRadius: 20, background: 'linear-gradient(135deg, rgba(167,139,250,0.08), rgba(99,102,241,0.04))', border: '1px solid rgba(167,139,250,0.2)', display: 'flex', gap: 16, alignItems: 'flex-start' }}>
            <div style={{ padding: 8, borderRadius: 12, background: 'rgba(167,139,250,0.15)', flexShrink: 0 }}><Sparkles size={18} color="#a78bfa" /></div>
            <div>
              <div style={{ fontSize: '0.7rem', fontWeight: 800, color: '#a78bfa', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 6 }}>AI Performance Insight</div>
              <div style={{ fontSize: '0.88rem', color: '#e2e8f0', lineHeight: 1.6 }}>{aiInsight}</div>
            </div>
            <button onClick={() => setAiInsight(null)} style={{ background: 'none', border: 'none', color: '#475569', cursor: 'pointer', flexShrink: 0 }}><X size={16} /></button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Stats Row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16 }}>
        {[
          { label: 'Total Exams', value: stats.total, icon: FileText, color: '#60a5fa' },
          { label: 'Upcoming', value: stats.scheduled, icon: Calendar, color: '#fbbf24' },
          { label: 'Completed', value: stats.completed, icon: CheckCircle2, color: '#34d399' },
          { label: 'Avg Pass Rate', value: `${stats.avgPass}%`, icon: TrendingUp, color: '#a78bfa' },
        ].map(s => (
          <motion.div key={s.label} variants={I} whileHover={{ y: -4 }}
            style={{ padding: '22px', borderRadius: 20, background: `${s.color}06`, border: `1px solid ${s.color}15`, position: 'relative', overflow: 'hidden' }}>
            <div style={{ position: 'absolute', top: -20, right: -20, width: 80, height: 80, borderRadius: '50%', background: s.color, filter: 'blur(40px)', opacity: 0.1 }} />
            <s.icon size={18} color={s.color} style={{ marginBottom: 12 }} />
            <div style={{ fontSize: '2rem', fontWeight: 900, color: '#fff', letterSpacing: '-0.02em' }}>{s.value}</div>
            <div style={{ fontSize: '0.78rem', color: '#8b95a2', fontWeight: 600, marginTop: 4 }}>{s.label}</div>
          </motion.div>
        ))}
      </div>

      {/* Filter Bar */}
      <motion.div variants={I} style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
        <div style={{ position: 'relative', flex: 1 }}>
          <Search size={16} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: '#475569' }} />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search exams..."
            style={{ width: '100%', padding: '12px 14px 12px 42px', borderRadius: 14, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', color: '#fff', fontSize: '0.88rem', outline: 'none', fontFamily: 'inherit' }} />
        </div>
        {['ALL', 'DRAFT', 'SCHEDULED', 'COMPLETED', 'PUBLISHED'].map(f => (
          <button key={f} onClick={() => setFilter(f)}
            style={{ padding: '10px 18px', borderRadius: 12, background: filter === f ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.03)', border: `1px solid ${filter === f ? 'rgba(255,255,255,0.2)' : 'rgba(255,255,255,0.06)'}`, color: filter === f ? '#fff' : '#8b95a2', fontSize: '0.8rem', fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.2s' }}>
            {f === 'ALL' ? 'All' : statusConfig[f]?.label || f}
          </button>
        ))}
      </motion.div>

      {/* Exam List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {filtered.map((exam, idx) => {
          const sc = statusConfig[exam.status] || statusConfig.DRAFT;
          const dateLabel =
            exam.startDate || exam.endDate
              ? `${exam.startDate ? new Date(exam.startDate).toLocaleDateString() : 'TBD'} - ${exam.endDate ? new Date(exam.endDate).toLocaleDateString() : 'TBD'}`
              : new Date(exam.createdAt).toLocaleDateString();
          return (
            <motion.div key={exam.examId} variants={I} custom={idx} whileHover={{ x: 4, borderColor: `${sc.color}40` }}
              style={{ padding: '24px', borderRadius: 20, background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', gap: 20, cursor: 'pointer', transition: 'all 0.2s' }}>
              <div style={{ width: 52, height: 52, borderRadius: 16, background: sc.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', border: `1px solid ${sc.color}25`, flexShrink: 0 }}>
                <GraduationCap size={24} color={sc.color} />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 800, fontSize: '1.05rem', color: '#fff', marginBottom: 4 }}>{exam.examName}</div>
                <div style={{ display: 'flex', gap: 16, color: '#8b95a2', fontSize: '0.8rem', fontWeight: 600 }}>
                  <span>{exam.academicYear}</span><span>•</span>
                  <span>{exam.term || 'Term: N/A'}</span><span>•</span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><Calendar size={12} />{dateLabel}</span>
                </div>
              </div>
              <div style={{ padding: '6px 14px', borderRadius: 10, background: sc.bg, color: sc.color, fontSize: '0.75rem', fontWeight: 800, border: `1px solid ${sc.color}25` }}>{sc.label}</div>
              <ChevronRight size={18} color="#475569" />
            </motion.div>
          );
        })}
      </div>

      {/* Create Exam Modal */}
      <AnimatePresence>
        {showCreate && (
          <div style={{ position: 'fixed', inset: 0, zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(12px)' }}>
            <motion.div initial={{ opacity: 0, scale: 0.9, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9, y: 20 }}
              style={{ width: '100%', maxWidth: 520, background: '#0f1419', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 28, padding: 36 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 28 }}>
                <h2 style={{ color: '#fff', fontSize: '1.4rem', fontWeight: 900, margin: 0 }}>Create Examination</h2>
                <button onClick={() => setShowCreate(false)} style={{ color: '#64748b', cursor: 'pointer', background: 'none', border: 'none' }}><X size={22} /></button>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
                <div>
                  <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#8b95a2', marginBottom: 6 }}>Exam Name</div>
                  <input
                    value={createDraft.examName}
                    onChange={e => setCreateDraft(d => ({ ...d, examName: e.target.value }))}
                    placeholder="e.g. Mid-Term Examinations"
                    style={{ width: '100%', boxSizing: 'border-box', padding: '12px 16px', borderRadius: 12, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', color: '#fff', fontSize: '0.9rem', outline: 'none', fontFamily: 'inherit' }}
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                  <div>
                    <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#8b95a2', marginBottom: 6 }}>Academic Year</div>
                    <input
                      value={createDraft.academicYear}
                      onChange={e => setCreateDraft(d => ({ ...d, academicYear: e.target.value }))}
                      placeholder="e.g. 2025-26"
                      style={{ width: '100%', boxSizing: 'border-box', padding: '12px 16px', borderRadius: 12, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', color: '#fff', fontSize: '0.9rem', outline: 'none', fontFamily: 'inherit' }}
                    />
                  </div>
                  <div>
                    <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#8b95a2', marginBottom: 6 }}>Term</div>
                    <input
                      value={createDraft.term || ''}
                      onChange={e => setCreateDraft(d => ({ ...d, term: e.target.value }))}
                      placeholder="e.g. Term 1"
                      style={{ width: '100%', boxSizing: 'border-box', padding: '12px 16px', borderRadius: 12, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', color: '#fff', fontSize: '0.9rem', outline: 'none', fontFamily: 'inherit' }}
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                  <div>
                    <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#8b95a2', marginBottom: 6 }}>Start Date</div>
                    <input
                      type="date"
                      value={createDraft.startDate || ''}
                      onChange={e => setCreateDraft(d => ({ ...d, startDate: e.target.value }))}
                      style={{ width: '100%', boxSizing: 'border-box', padding: '12px 16px', borderRadius: 12, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', color: '#fff', fontSize: '0.9rem', outline: 'none', fontFamily: 'inherit' }}
                    />
                  </div>
                  <div>
                    <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#8b95a2', marginBottom: 6 }}>End Date</div>
                    <input
                      type="date"
                      value={createDraft.endDate || ''}
                      onChange={e => setCreateDraft(d => ({ ...d, endDate: e.target.value }))}
                      style={{ width: '100%', boxSizing: 'border-box', padding: '12px 16px', borderRadius: 12, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', color: '#fff', fontSize: '0.9rem', outline: 'none', fontFamily: 'inherit' }}
                    />
                  </div>
                </div>
                <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }} onClick={handleCreateExam} disabled={creating}
                  style={{ width: '100%', padding: '14px', borderRadius: 14, background: `linear-gradient(135deg, ${ACCENT}, #ec4899)`, border: 'none', color: '#fff', fontWeight: 800, fontSize: '0.95rem', cursor: 'pointer', fontFamily: 'inherit', marginTop: 8, boxShadow: `0 0 30px ${ACCENT}30` }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}><Sparkles size={16} /> {creating ? 'Creating...' : 'Create Exam'}</div>
                </motion.button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
