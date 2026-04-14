import React, { useState, useMemo, useEffect } from 'react';
import GlassCard from '../../components/ui/GlassCard';
import { useRealtime } from '../../components/RealtimeHub';
import { CheckCircle, XCircle, Clock, Sparkles, TrendingUp } from 'lucide-react';

interface AttendancePageProps {
  schoolSession: any;
  classes: any[];
  studentUsers: any[];
  attendanceAnalytics: any;
  createSchoolOp: (path: string, body: any, onSuccess: () => Promise<void>, message: string) => Promise<void>;
  loadSchoolOperations: (session: any) => Promise<void>;
}

const AttendancePage = ({
  schoolSession,
  classes,
  studentUsers,
  attendanceAnalytics,
  createSchoolOp,
  loadSchoolOperations
}: AttendancePageProps) => {
  const { messages } = useRealtime();
  const [selectedClassId, setSelectedClassId] = useState('');
  const [attendanceDate, setAttendanceDate] = useState(new Date().toISOString().split('T')[0]);
  const [attendanceMap, setAttendanceMap] = useState<Record<string, string>>({});
  const [aiHighlight, setAiHighlight] = useState<string | null>(null);

  useEffect(() => {
    // Listen for AI hints about specific classes (e.g., low attendance predictions)
    const lastMsg = messages[messages.length - 1];
    if (lastMsg?.topic?.includes('ai/insights')) {
      if (lastMsg.payload.classId) {
        setAiHighlight(lastMsg.payload.classId);
        setTimeout(() => setAiHighlight(null), 5000);
      }
    }
  }, [messages]);

  const classStudents = useMemo(() => {
    if (!selectedClassId) return [];
    return studentUsers;
  }, [selectedClassId, studentUsers]);

  const stats = useMemo(() => {
    const total = classStudents.length;
    const marked = Object.keys(attendanceMap).length;
    const present = Object.values(attendanceMap).filter(v => v === 'PRESENT').length;
    return { total, marked, present, percent: total > 0 ? (present / total) * 100 : 0 };
  }, [classStudents, attendanceMap]);

  const toggleStatus = (studentId: string, status: string) => {
    setAttendanceMap(prev => ({
      ...prev,
      [studentId]: status
    }));
  };

  const handleBulkSubmit = async () => {
    if (!selectedClassId || Object.keys(attendanceMap).length === 0) return;

    const entries = Object.entries(attendanceMap).map(([studentId, status]) => ({
      userId: studentId,
      attendanceStatus: status,
      roleName: 'STUDENT'
    }));

    await createSchoolOp('/api/v1/school-ops/attendance/bulk', { 
      schoolId: schoolSession.schoolId,
      classId: selectedClassId,
      teacherUserId: schoolSession.userId || '',
      attendanceDate,
      attendanceMode: 'DAILY',
      markedBy: schoolSession.email || 'SYSTEM',
      entries 
    }, async () => {
      await loadSchoolOperations(schoolSession);
      setAttendanceMap({});
    }, `Attendance for ${entries.length} students recorded.`);
  };

  return (
    <div className="modular-page attendance-portal animate-in">
      <header className="page-header">
        <div className="header-content">
          <span className="eyebrow">Operational Excellence</span>
          <h1>Daily Attendance</h1>
          <p>Real-time student monitoring and rapid marking interface.</p>
        </div>
        <div className="header-actions">
          {selectedClassId && (
            <div className="attendance-quick-stats glass-card px-4 py-2 flex items-center gap-4">
              <div className="stat">
                <span className="text-[10px] uppercase text-slate-400">Marked</span>
                <strong className="block text-cyan-400">{stats.marked}/{stats.total}</strong>
              </div>
              <div className="divider w-px h-8 bg-slate-800"></div>
              <div className="stat">
                <span className="text-[10px] uppercase text-slate-400">Ratio</span>
                <strong className="block text-violet-400">{Math.round(stats.percent)}%</strong>
              </div>
            </div>
          )}
        </div>
      </header>

      <div className="dashboard-grid">
        <article className="dashboard-card wide-card flex flex-wrap gap-6 items-end p-6">
          <label className="flex-1 min-w-[200px]">
            <span className="eyebrow mb-1 block">Active Class</span>
            <select 
              value={selectedClassId} 
              onChange={(e) => setSelectedClassId(e.target.value)}
              className={aiHighlight === selectedClassId ? 'ai-highlight-border' : ''}
            >
              <option value="">Select a class...</option>
              {classes.map(c => (
                <option key={c.classId} value={c.classId}>
                  {c.className} {c.sectionName} {aiHighlight === c.classId ? '✨' : ''}
                </option>
              ))}
            </select>
          </label>
          <label className="flex-1 min-w-[200px]">
            <span className="eyebrow mb-1 block">Track Date</span>
            <input type="date" value={attendanceDate} onChange={(e) => setAttendanceDate(e.target.value)} />
          </label>
          <button 
            className="primary-button neon-button min-w-[180px]" 
            disabled={!selectedClassId || stats.marked === 0}
            onClick={handleBulkSubmit}
          >
            Save Records ({stats.marked})
          </button>
        </article>

        {selectedClassId ? (
          <article className="dashboard-card wide-card p-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {classStudents.map(student => (
                <div 
                  key={student.userId} 
                  className={`attendance-item glass-card p-4 transition-all hover:scale-[1.02] ${attendanceMap[student.userId] ? 'active-ring-' + attendanceMap[student.userId].toLowerCase() : ''}`}
                >
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center font-bold text-cyan-400 border border-slate-700">
                      {student.fullName[0]}
                    </div>
                    <div>
                      <h4 className="font-bold text-sm leading-tight text-white">{student.fullName}</h4>
                      <p className="text-[10px] text-slate-500 uppercase tracking-tighter">Student</p>
                    </div>
                  </div>
                  
                  <div className="flex gap-1">
                    <button 
                      onClick={() => toggleStatus(student.userId, 'PRESENT')}
                      className={`attend-btn p-2 rounded flex-1 flex justify-center items-center transition-all ${attendanceMap[student.userId] === 'PRESENT' ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/50' : 'bg-slate-900/50 text-slate-400 border-slate-800'} border`}
                    >
                      <CheckCircle size={16} />
                    </button>
                    <button 
                      onClick={() => toggleStatus(student.userId, 'ABSENT')}
                      className={`attend-btn p-2 rounded flex-1 flex justify-center items-center transition-all ${attendanceMap[student.userId] === 'ABSENT' ? 'bg-rose-500/20 text-rose-400 border-rose-500/50' : 'bg-slate-900/50 text-slate-400 border-slate-800'} border`}
                    >
                      <XCircle size={16} />
                    </button>
                    <button 
                      onClick={() => toggleStatus(student.userId, 'LATE')}
                      className={`attend-btn p-2 rounded flex-1 flex justify-center items-center transition-all ${attendanceMap[student.userId] === 'LATE' ? 'bg-amber-500/20 text-amber-400 border-amber-500/50' : 'bg-slate-900/50 text-slate-400 border-slate-800'} border`}
                    >
                      <Clock size={16} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </article>
        ) : (
          <article className="dashboard-card wide-card p-12 text-center opacity-50">
            <Sparkles size={48} className="mx-auto mb-4 text-slate-700" />
            <h3>No Class Selected</h3>
            <p>Choose a classroom above to begin synchronized attendance tracking.</p>
          </article>
        )}

        {attendanceAnalytics && (
          <>
            <article className="dashboard-card">
              <span className="eyebrow flex items-center gap-2"><TrendingUp size={14} /> Analytics</span>
              <h3>Performance Trend</h3>
              <div className="mt-6 space-y-4">
                {attendanceAnalytics.trend.slice(-4).map((point: any) => (
                  <div key={point.date} className="trend-row">
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-slate-400 font-mono">{point.date}</span>
                      <span className="text-cyan-400">{Math.round((point.present / point.total) * 100)}%</span>
                    </div>
                    <div className="h-1.5 w-full bg-slate-900 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-gradient-to-r from-cyan-500 to-violet-500 transition-all duration-1000" 
                        style={{ width: `${(point.present / point.total) * 100}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </article>

            <article className="dashboard-card status-card">
              <span className="eyebrow">Top Performing Units</span>
              <h3>Classroom Rankings</h3>
              <div className="mt-4 space-y-2">
                {attendanceAnalytics.byClass.slice(0, 4).map((item: any, idx: number) => (
                  <div key={item.classId} className="flex justify-between items-center p-3 rounded bg-slate-900/30 border border-slate-800/50 hover:border-cyan-500/30 transition-colors">
                    <div className="flex items-center gap-3">
                      <span className="text-[10px] font-bold text-slate-600">0{idx + 1}</span>
                      <span className="font-bold text-sm">{item.className} {item.sectionName}</span>
                    </div>
                    <span className="neon-text-cyan text-sm font-mono">{Math.round((item.present / item.total) * 100)}%</span>
                  </div>
                ))}
              </div>
            </article>
          </>
        )}
      </div>
    </div>
  );
};

export default AttendancePage;
