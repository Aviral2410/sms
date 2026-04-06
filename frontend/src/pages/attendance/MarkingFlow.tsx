import React, { useEffect, useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ArrowLeft, CheckCircle2, XCircle, Clock, 
  RotateCcw, Sparkles, User, Users,
  ChevronRight, Calendar, Filter, Save, Trash2
} from 'lucide-react';
import { useStore } from '../../store/useStore';
import { toast } from 'sonner';
import { schoolOpsApi, type AcademicClassResponse, type SubjectResponse, type SchoolUser } from '../../lib/api';

type MarkingStatus = 'PRESENT' | 'ABSENT' | 'LATE';

type MarkingStudent = {
  userId: string;
  fullName: string;
  status: MarkingStatus;
  roleName: string;
};

export default function MarkingFlow() {
  const { session } = useStore();
  const navigate = useNavigate();
  const { classId: urlClassId } = useParams<{ classId: string }>();

  // Selection state
  const [isMarkingStarted, setIsMarkingStarted] = useState(false);
  const [selectedClassId, setSelectedClassId] = useState(urlClassId || '');
  const [selectedPeriod, setSelectedPeriod] = useState('1');
  const [selectedSubjectId, setSelectedSubjectId] = useState('');
  const [attendanceDate, setAttendanceDate] = useState(new Date().toISOString().slice(0, 10));
  
  // Data state
  const [classes, setClasses] = useState<AcademicClassResponse[]>([]);
  const [subjects, setSubjects] = useState<SubjectResponse[]>([]);
  const [students, setStudents] = useState<MarkingStudent[]>([]);
  const [teacherUserId, setTeacherUserId] = useState('');
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    async function loadInitial() {
      if (!session.schoolId) return;
      setLoading(true);
      try {
        const [usersRes, classesRes, subjectsRes] = await Promise.all([
          schoolOpsApi.listUsers(session.schoolId),
          schoolOpsApi.listClasses(session.schoolId),
          schoolOpsApi.listSubjects(session.schoolId),
        ]);
        
        setClasses(classesRes);
        setSubjects(subjectsRes);
        
        const teacher = usersRes.find(
          (u) => u.roleName === 'TEACHER' && u.email.toLowerCase() === (session.email || '').toLowerCase()
        );
        if (teacher) setTeacherUserId(teacher.userId);
        
      } catch (err: any) {
        toast.error('Failed to load initial data');
      } finally {
        setLoading(false);
      }
    }
    loadInitial();
  }, [session.schoolId, session.email]);

  const startMarking = async () => {
    if (!selectedClassId) {
      toast.error('Please select a class');
      return;
    }
    
    setLoading(true);
    try {
      const enrollments = await schoolOpsApi.listStudentEnrollments(session.schoolId!);
      const users = await schoolOpsApi.listUsers(session.schoolId!);
      
      const enrolledStudentIds = new Set(
        enrollments.filter(e => e.classId === selectedClassId).map(e => e.studentUserId)
      );
      
      const classStudents = users
        .filter(u => u.roleName === 'STUDENT' && enrolledStudentIds.has(u.userId))
        .map(u => ({
          userId: u.userId,
          fullName: u.fullName,
          status: 'PRESENT' as MarkingStatus,
          roleName: 'STUDENT'
        }))
        .sort((a, b) => a.fullName.localeCompare(b.fullName));
        
      setStudents(classStudents);
      setIsMarkingStarted(true);
      if (classStudents.length === 0) {
        toast.info('No students enrolled in this class');
      }
    } catch (err: any) {
      toast.error('Failed to load students');
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = (userId: string, status: MarkingStatus) => {
    setStudents(prev => prev.map(s => s.userId === userId ? { ...s, status } : s));
  };

  const bulkMark = (status: MarkingStatus) => {
    setStudents(prev => prev.map(s => ({ ...s, status })));
    toast.success(`All students marked ${status.toLowerCase()}`);
  };

  const commitAttendance = async () => {
    if (!session.schoolId) {
      toast.error('School context missing');
      return;
    }
    
    setIsSubmitting(true);
    try {
      await schoolOpsApi.upsertBulkAttendance({
        schoolId: session.schoolId,
        classId: selectedClassId,
        teacherUserId: teacherUserId || session.userId || '',
        subjectId: selectedSubjectId || undefined,
        attendanceMode: 'PERIOD',
        periodNumber: parseInt(selectedPeriod),
        attendanceDate,
        markedBy: session.email || 'SYSTEM',
        entries: students.map(s => ({
          userId: s.userId,
          attendanceStatus: s.status,
          roleName: s.roleName
        }))
      });
      toast.success('Attendance records saved successfully');
      navigate('/attendance');
    } catch (err: any) {
      toast.error(err?.message || 'Failed to save attendance');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading && !isMarkingStarted) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <div className="text-white font-medium flex items-center gap-3">
          <RotateCcw className="animate-spin text-cyan-400" /> Initializing Environment...
        </div>
      </div>
    );
  }

  const currentClass = classes.find(c => c.classId === selectedClassId);

  return (
    <div className="max-w-4xl mx-auto py-8 px-4 relative">
      <AnimatePresence mode="wait">
        {!isMarkingStarted ? (
          <motion.div 
            key="selection"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-8"
          >
            <div className="text-center space-y-2">
              <h1 className="text-4xl font-black text-white tracking-tight">Setup Session</h1>
              <p className="text-slate-400">Configure class and period before marking attendance.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <section className="glass-card p-8 space-y-6">
                <div className="space-y-2">
                  <label className="text-[10px] uppercase font-black text-slate-500 tracking-[0.2em] px-1">Classroom Context</label>
                  <select 
                    value={selectedClassId} 
                    onChange={e => setSelectedClassId(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-white font-bold outline-none focus:border-cyan-500/50 transition-colors"
                  >
                    <option value="">Select a class...</option>
                    {classes.map(c => (
                      <option key={c.classId} value={c.classId}>{c.className} {c.sectionName}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] uppercase font-black text-slate-500 tracking-[0.2em] px-1">Active Subject</label>
                  <select 
                    value={selectedSubjectId} 
                    onChange={e => setSelectedSubjectId(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-white font-bold outline-none focus:border-cyan-500/50 transition-colors"
                  >
                    <option value="">General / Class Wise</option>
                    {subjects.map(s => (
                      <option key={s.subjectId} value={s.subjectId}>{s.subjectName}</option>
                    ))}
                  </select>
                </div>
              </section>

              <section className="glass-card p-8 space-y-6">
                <div className="space-y-2">
                  <label className="text-[10px] uppercase font-black text-slate-500 tracking-[0.2em] px-1">Timeline</label>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 bg-white/5 border border-white/10 rounded-2xl flex items-center gap-3">
                      <Calendar size={18} className="text-cyan-400" />
                      <input 
                        type="date" 
                        value={attendanceDate}
                        onChange={e => setAttendanceDate(e.target.value)}
                        className="bg-transparent border-none text-white text-sm font-bold outline-none w-full"
                      />
                    </div>
                    <select 
                      value={selectedPeriod}
                      onChange={e => setSelectedPeriod(e.target.value)}
                      className="bg-white/5 border border-white/10 rounded-2xl p-4 text-white font-bold outline-none focus:border-cyan-500/50"
                    >
                      {[1,2,3,4,5,6,7,8].map(p => (
                        <option key={p} value={p}>Period {p}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-cyan-400/5 border border-cyan-400/10 flex items-start gap-4">
                  <Sparkles size={20} className="text-cyan-400 mt-1" />
                  <p className="text-xs text-cyan-400/70 leading-relaxed font-medium">Session state will be optimized for rapid logging. Ensure the period number aligns with the official timetable.</p>
                </div>
              </section>
            </div>

            <button 
              onClick={startMarking}
              disabled={!selectedClassId}
              className="w-full py-5 bg-gradient-to-r from-cyan-500 to-indigo-500 text-white font-black uppercase tracking-widest rounded-3xl shadow-xl shadow-cyan-900/20 hover:scale-[1.01] transition-all flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Start Marking <ArrowLeft className="rotate-180" size={20} />
            </button>
          </motion.div>
        ) : (
          <motion.div 
            key="marking"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-8"
          >
            <header className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <button 
                  onClick={() => setIsMarkingStarted(false)}
                  className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-500 hover:text-white transition-colors mb-2"
                >
                  <ArrowLeft size={16} /> Edit Config
                </button>
                <h1 className="text-3xl font-black text-white tracking-tighter">
                  {currentClass?.className} {currentClass?.sectionName}
                </h1>
                <p className="text-slate-400 text-sm">Period {selectedPeriod} • {new Date(attendanceDate).toLocaleDateString()}</p>
              </div>

              <div className="flex items-center gap-3">
                <button 
                  onClick={() => bulkMark('PRESENT')}
                  className="px-4 py-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] font-black uppercase tracking-widest hover:bg-emerald-500/20 transition-all"
                >
                  All Present
                </button>
                <button 
                  onClick={() => bulkMark('ABSENT')}
                  className="px-4 py-2 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-[10px] font-black uppercase tracking-widest hover:bg-rose-500/20 transition-all"
                >
                  All Absent
                </button>
              </div>
            </header>

            <div className="glass-card overflow-hidden">
              <div className="grid grid-cols-1 divide-y divide-white/5">
                {students.map((student) => (
                  <div key={student.userId} className="p-5 flex items-center justify-between hover:bg-white/[0.02] transition-colors group">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-slate-400 font-bold group-hover:border-cyan-500/50 transition-colors">
                        {student.fullName[0]}
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-white">{student.fullName}</h4>
                        <span className="text-[10px] uppercase text-slate-500 font-black tracking-widest">Student</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button 
                        onClick={() => updateStatus(student.userId, 'PRESENT')}
                        className={`p-2.5 rounded-xl border transition-all ${student.status === 'PRESENT' ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-400' : 'bg-transparent border-white/5 text-slate-500'}`}
                      >
                        <CheckCircle2 size={18} />
                      </button>
                      <button 
                        onClick={() => updateStatus(student.userId, 'ABSENT')}
                        className={`p-2.5 rounded-xl border transition-all ${student.status === 'ABSENT' ? 'bg-rose-500/20 border-rose-500/50 text-rose-400' : 'bg-transparent border-white/5 text-slate-500'}`}
                      >
                        <XCircle size={18} />
                      </button>
                      <button 
                        onClick={() => updateStatus(student.userId, 'LATE')}
                        className={`p-2.5 rounded-xl border transition-all ${student.status === 'LATE' ? 'bg-amber-500/20 border-amber-500/50 text-amber-400' : 'bg-transparent border-white/5 text-slate-500'}`}
                      >
                        <Clock size={18} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="sticky bottom-8 max-w-sm mx-auto">
              <button 
                onClick={commitAttendance}
                disabled={isSubmitting || students.length === 0}
                className="w-full py-4 bg-white text-slate-950 font-black uppercase tracking-[0.2em] rounded-3xl shadow-2xl hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-3 disabled:opacity-50 disabled:grayscale"
              >
                {isSubmitting ? (
                  <>Synchronizing...</>
                ) : (
                  <>
                    <Save size={18} /> Commit {students.length} Records
                  </>
                )}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
