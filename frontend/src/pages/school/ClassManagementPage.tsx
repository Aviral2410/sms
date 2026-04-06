import React, { useState, useEffect } from 'react';
import GlassCard from '../../components/ui/GlassCard';
import { useRealtime } from '../../components/RealtimeHub';
import { Layers, Calendar, Clock, BookOpen, User, Hash, Filter, Plus, Zap } from 'lucide-react';

interface ClassManagementPageProps {
  schoolSession: any;
  classes: any[];
  subjects: any[];
  teacherUsers: any[];
  classForm: any;
  setClassForm: (form: any) => void;
  initialClassForm: any;
  timetableForm: any;
  setTimetableForm: (form: any) => void;
  initialTimetableForm: any;
  classTeacherByClassId: Map<string, any>;
  classEnrollmentCounts: Record<string, number>;
  createSchoolOp: (path: string, body: any, onSuccess: () => Promise<void>, message: string) => Promise<void>;
  loadSchoolOperations: (session: any) => Promise<void>;
}

const ClassManagementPage: React.FC<ClassManagementPageProps> = ({
  schoolSession,
  classes,
  subjects,
  teacherUsers,
  classForm,
  setClassForm,
  initialClassForm,
  timetableForm,
  setTimetableForm,
  initialTimetableForm,
  classTeacherByClassId,
  classEnrollmentCounts,
  createSchoolOp,
  loadSchoolOperations
}) => {
  const { messages } = useRealtime();
  const [classFilterText, setClassFilterText] = useState('');
  const [activeTab, setActiveTab] = useState<'registry' | 'timetable'>('registry');
  const [lastUpdateFlash, setLastUpdateFlash] = useState(false);

  useEffect(() => {
    const lastMsg = messages[messages.length - 1];
    if (lastMsg?.topic?.includes('school/notifications')) {
      if (['CLASS_CREATED', 'TIMETABLE_UPDATED'].includes(lastMsg.payload.type)) {
        setLastUpdateFlash(true);
        setTimeout(() => setLastUpdateFlash(false), 3000);
      }
    }
  }, [messages]);

  const filteredClasses = classes.filter(c => 
    c.className?.toLowerCase().includes(classFilterText.toLowerCase()) || 
    c.sectionName?.toLowerCase().includes(classFilterText.toLowerCase())
  );

  return (
    <div className="modular-page academic-workspace animate-in">
      <header className="page-header">
        <div className="header-content">
          <span className="eyebrow flex items-center gap-2"><Layers size={14} className="text-cyan-400" /> Organizational Unit</span>
          <h1>Academic Structure</h1>
          <p>Define institutional hierarchy and orchestrate complex learning schedules.</p>
        </div>
        <div className="header-actions">
          <div className="tab-switch glass-card p-1 flex gap-1">
            <button 
              className={`tab-btn ${activeTab === 'registry' ? 'active neon-glow' : ''}`}
              onClick={() => setActiveTab('registry')}
            >
              Registry
            </button>
            <button 
              className={`tab-btn ${activeTab === 'timetable' ? 'active neon-glow' : ''}`}
              onClick={() => setActiveTab('timetable')}
            >
              Timetable
            </button>
          </div>
        </div>
      </header>

      <div className="dashboard-grid">
        {activeTab === 'registry' ? (
          <>
            <article className="dashboard-card lg:col-span-1 p-6">
              <span className="eyebrow flex items-center gap-2"><Plus size={14} /> Definition</span>
              <h3>Enrollment Group</h3>
              <p className="text-slate-500 text-xs mb-6">Create a standardized class/section node within the academic year.</p>
              
              <form className="onboarding-form space-y-4" onSubmit={async (e: any) => {
                e.preventDefault();
                await createSchoolOp('/api/v1/school-ops/classes', { schoolId: schoolSession.schoolId, ...classForm }, async () => {
                  await loadSchoolOperations(schoolSession);
                  setClassForm(initialClassForm);
                }, 'Academic group registered.');
              }}>
                <label>
                  <span className="text-[10px] uppercase text-slate-500 mb-1 block font-mono tracking-wider">Classification</span>
                  <input value={classForm.className} onChange={(e: any) => setClassForm({ ...classForm, className: e.target.value })} placeholder="e.g. Grade 12" required />
                </label>
                <div className="grid grid-cols-2 gap-4">
                  <label>
                    <span className="text-[10px] uppercase text-slate-500 mb-1 block font-mono tracking-wider">Cohort (Section)</span>
                    <input value={classForm.sectionName} onChange={(e: any) => setClassForm({ ...classForm, sectionName: e.target.value })} placeholder="Alpha" required />
                  </label>
                  <label>
                    <span className="text-[10px] uppercase text-slate-500 mb-1 block font-mono tracking-wider">Academic cycle</span>
                    <input value={classForm.academicYear} onChange={(e: any) => setClassForm({ ...classForm, academicYear: e.target.value })} placeholder="2026-2027" required />
                  </label>
                </div>
                <button type="submit" className="primary-button neon-button w-full mt-2 flex items-center justify-center gap-2">
                  <Plus size={16} /> Finalize registration
                </button>
              </form>
            </article>

            <article className="dashboard-card lg:col-span-1 p-6 flex flex-col h-full">
              <div className="flex justify-between items-center mb-6">
                <div>
                  <span className="eyebrow flex items-center gap-2"><Filter size={14} /> Registry</span>
                  <h3>Active Hierarchy</h3>
                </div>
                <div className="stat-pill glass-card bg-slate-800/40">
                  <Hash size={12} className="text-cyan-400" />
                  <span className="font-mono text-xs">{classes.length} Groups</span>
                </div>
              </div>

              <div className="search-box-minimal glass-card px-3 py-2 flex items-center gap-2 mb-4 border border-white/5">
                <Filter size={14} className="text-slate-500" />
                <input 
                  className="bg-transparent border-none text-xs focus:ring-0 p-0 w-full"
                  value={classFilterText} 
                  onChange={(e: any) => setClassFilterText(e.target.value)} 
                  placeholder="Scan classifications..." 
                />
              </div>

              <div className="flex-1 overflow-y-auto space-y-3 pr-2 custom-scrollbar">
                {filteredClasses.map((item) => (
                  <div key={item.classId} className={`class-node glass-card p-4 border border-white/5 hover:border-cyan-500/30 transition-all group ${lastUpdateFlash ? 'flash-subtle' : ''}`}>
                    <div className="flex justify-between items-start mb-2">
                      <strong className="text-white text-sm tracking-tight">{item.className} - {item.sectionName}</strong>
                      <span className="text-[9px] font-mono text-cyan-500/70">{item.academicYear}</span>
                    </div>
                    <div className="flex items-center gap-4 mt-3 pt-3 border-top border-white/5 opacity-60 text-[10px]">
                      <span className="flex items-center gap-1"><User size={12} /> {classTeacherByClassId.get(item.classId)?.fullName || 'Primary unassigned'}</span>
                      <span className="flex items-center gap-1"><Zap size={12} className="text-violet-400" /> {classEnrollmentCounts[item.classId] ?? 0} Students</span>
                    </div>
                  </div>
                ))}
                {filteredClasses.length === 0 && (
                  <div className="text-center py-12 opacity-20 italic text-xs">No matching nodes found in registry.</div>
                )}
              </div>
            </article>
          </>
        ) : (
          <article className="dashboard-card wide-card p-6 grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="md:col-span-1 border-r border-white/5 pr-8">
              <span className="eyebrow flex items-center gap-2"><Clock size={14} /> Scheduler</span>
              <h3>Period Programming</h3>
              <p className="text-slate-500 text-xs mb-8">Strategically allocate subjects and faculty to specific temporal slots.</p>
              
              <form className="onboarding-form space-y-4" onSubmit={async (e: any) => {
                e.preventDefault();
                await createSchoolOp('/api/v1/school-ops/timetable', {
                  schoolId: schoolSession.schoolId,
                  ...timetableForm
                }, async () => {
                  await loadSchoolOperations(schoolSession);
                  setTimetableForm(initialTimetableForm);
                }, 'Timeline period synchronized.');
              }}>
                <label>
                  <span className="text-[10px] uppercase text-slate-500 mb-1 block">Contextual node</span>
                  <select value={timetableForm.classId} onChange={(e: any) => setTimetableForm({ ...timetableForm, classId: e.target.value })} required>
                    <option value="">Target Academic Group</option>
                    {classes.map((item) => <option key={item.classId} value={item.classId}>{item.className} - {item.sectionName}</option>)}
                  </select>
                </label>
                <label>
                  <span className="text-[10px] uppercase text-slate-500 mb-1 block">Academic domain</span>
                  <select value={timetableForm.subjectId} onChange={(e: any) => setTimetableForm({ ...timetableForm, subjectId: e.target.value })} required>
                    <option value="">Subject Cluster</option>
                    {subjects.map((item) => <option key={item.subjectId} value={item.subjectId}>{item.subjectName}</option>)}
                  </select>
                </label>
                <label>
                  <span className="text-[10px] uppercase text-slate-500 mb-1 block">Instructional lead</span>
                  <select value={timetableForm.teacherUserId} onChange={(e: any) => setTimetableForm({ ...timetableForm, teacherUserId: e.target.value })} required>
                    <option value="">Faculty Member</option>
                    {teacherUsers.map((user) => <option key={user.userId} value={user.userId}>{user.fullName}</option>)}
                  </select>
                </label>
                <div className="grid grid-cols-1 gap-4">
                  <label>
                    <span className="text-[10px] uppercase text-slate-500 mb-1 block">Cycle day</span>
                    <select value={timetableForm.dayOfWeek} onChange={(e: any) => setTimetableForm({ ...timetableForm, dayOfWeek: e.target.value })}>
                      {['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY'].map((day) => <option key={day} value={day}>{day}</option>)}
                    </select>
                  </label>
                  <div className="grid grid-cols-2 gap-4">
                    <label>
                      <span className="text-[10px] uppercase text-slate-500 mb-1 block">UTC Start</span>
                      <input type="time" value={timetableForm.startTime} onChange={(e: any) => setTimetableForm({ ...timetableForm, startTime: e.target.value })} />
                    </label>
                    <label>
                      <span className="text-[10px] uppercase text-slate-500 mb-1 block">UTC End</span>
                      <input type="time" value={timetableForm.endTime} onChange={(e: any) => setTimetableForm({ ...timetableForm, endTime: e.target.value })} />
                    </label>
                  </div>
                </div>
                <button type="submit" className="secondary-button w-full mt-4 flex items-center justify-center gap-2">
                  <Zap size={14} className="text-cyan-400" /> Commencing loop
                </button>
              </form>
            </div>

            <div className="md:col-span-2 space-y-6">
              <div className="ai-insight-strip glass-card bg-violet-950/20 p-4 border border-violet-500/20 flex gap-4 items-center animate-pulse">
                <div className="p-2 bg-violet-500/20 rounded-lg"><Zap size={20} className="text-violet-400" /></div>
                <div>
                  <h4 className="text-xs font-bold text-violet-300">AI Schedule Optimizer</h4>
                  <p className="text-[10px] text-violet-300/60">Predictive analysis suggests reducing Math load on Monday mornings to optimize retention.</p>
                </div>
              </div>

              <div className="scheduler-visual h-[450px] overflow-y-auto pr-4 custom-scrollbar">
                {['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY'].map(day => (
                  <div key={day} className="day-slot mb-6">
                    <h5 className="text-[10px] font-mono uppercase tracking-widest text-slate-500 mb-3 border-b border-white/5 pb-1">{day}</h5>
                    <div className="grid grid-cols-1 gap-2">
                       <div className="empty-slot glass-card p-3 border-dashed border-white/10 text-[10px] text-slate-600 text-center">
                          Awaiting structural data for {day}...
                       </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </article>
        )}
      </div>
    </div>
  );
};

export default ClassManagementPage;
