import React, { useState, useEffect } from 'react';
import { useRealtime } from '../../components/RealtimeHub';
import { Layers, BookOpen, User, Hash, Filter, Plus, Zap } from 'lucide-react';
import { schoolOpsApi } from '../../lib/api';
import { toast } from 'sonner';

interface ClassManagementPageProps {
  schoolSession: any;
  classes: any[];
  subjects: any[];
  teacherUsers: any[];
  classSubjectTeacherMappings: any[];
  classForm: any;
  setClassForm: (form: any) => void;
  initialClassForm: any;
  classEnrollmentCounts: Record<string, number>;
  createSchoolOp: (path: string, body: any, onSuccess: () => Promise<void>, message: string) => Promise<void>;
  loadSchoolOperations: (session: any) => Promise<void>;
}

const ClassManagementPage: React.FC<ClassManagementPageProps> = ({
  schoolSession,
  classes,
  subjects,
  teacherUsers,
  classSubjectTeacherMappings,
  classForm,
  setClassForm,
  initialClassForm,
  classEnrollmentCounts,
  createSchoolOp,
  loadSchoolOperations
}) => {
  const { messages } = useRealtime();
  const [classFilterText, setClassFilterText] = useState('');
  const [lastUpdateFlash, setLastUpdateFlash] = useState(false);
  const [selectedClassId, setSelectedClassId] = useState<string>('');
  const [isAssigning, setIsAssigning] = useState(false);

  const handleAssignTeacher = async (subjectId: string, teacherUserId: string) => {
    setIsAssigning(true);
    try {
      await schoolOpsApi.assignClassSubjectTeacher({
        schoolId: schoolSession.schoolId,
        classId: selectedClassId,
        subjectId,
        teacherUserId
      } as any);
      toast.success('Assignment updated');
      await loadSchoolOperations(schoolSession);
    } catch (err: any) {
      toast.error(err.message || 'Assignment failed');
    } finally {
      setIsAssigning(false);
    }
  };

  const getAssignedTeacherId = (subjectId: string) => {
    const mapping = classSubjectTeacherMappings.find(
      m => m.classId === selectedClassId && m.subjectId === subjectId
    );
    return mapping?.teacherUserId || '';
  };

  useEffect(() => {
    const lastMsg = messages[messages.length - 1];
    if (lastMsg?.topic?.includes('school/notifications')) {
      if (['CLASS_CREATED'].includes(lastMsg.payload.type)) {
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
          <h1>Class Registry</h1>
          <p>Define and manage academic groups and sections for the current cycle.</p>
        </div>
      </header>

      <div className="dashboard-grid">
        <article className="dashboard-card lg:col-span-1 p-6">
          <span className="eyebrow flex items-center gap-2"><Plus size={14} /> Definition</span>
          <h3>Register Class</h3>
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
                  <span className="flex items-center gap-1">
                    <BookOpen size={12} /> 
                    {classSubjectTeacherMappings.filter(m => m.classId === item.classId).length} Subjects Managed
                  </span>
                  <span className="flex items-center gap-1"><Zap size={12} className="text-violet-400" /> {classEnrollmentCounts[item.classId] ?? 0} Students</span>
                </div>
              </div>
            ))}
            {filteredClasses.length === 0 && (
              <div className="text-center py-12 opacity-20 italic text-xs">No matching nodes found in registry.</div>
            )}
          </div>
        </article>

        <article className="dashboard-card lg:col-span-2 p-6">
          <div className="flex justify-between items-center mb-6">
            <div>
              <span className="eyebrow flex items-center gap-2"><User size={14} className="text-violet-400" /> Curriculum Management</span>
              <h3>Teacher Assignments</h3>
            </div>
            <div className="flex items-center gap-3">
              <select 
                className="glass-card bg-slate-800/40 text-xs py-1.5 px-3 border-white/5 outline-none focus:border-cyan-500/30 transition-all font-mono"
                value={selectedClassId}
                onChange={(e) => setSelectedClassId(e.target.value)}
              >
                <option value="">Select Class / Section</option>
                {classes.map(c => (
                  <option key={c.classId} value={c.classId}>{c.className} - {c.sectionName}</option>
                ))}
              </select>
            </div>
          </div>

          {!selectedClassId ? (
            <div className="h-64 flex flex-col items-center justify-center border border-dashed border-white/10 rounded-2xl bg-white/5 opacity-40 text-center gap-3">
              <BookOpen size={32} className="text-slate-400" />
              <p className="max-w-[200px] text-xs leading-relaxed italic">Select a class node from the dropdown to start subject-wise faculty allocation.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-in">
              {subjects.map(subject => {
                const teacherId = getAssignedTeacherId(subject.subjectId);
                return (
                  <div key={subject.subjectId} className="glass-card p-4 border border-white/5 flex flex-col gap-3 group">
                    <div className="flex justify-between items-start">
                      <div>
                        <strong className="text-white text-sm block">{subject.subjectName}</strong>
                        <span className="text-[10px] text-cyan-400/70 font-mono">{subject.subjectCode}</span>
                      </div>
                      <BookOpen size={14} className="text-slate-600 group-hover:text-cyan-500 transition-colors" />
                    </div>
                    
                    <div className="relative">
                      <select 
                        className={`w-full bg-[#0f172a]/80 border ${teacherId ? 'border-cyan-500/30 text-white' : 'border-white/5 text-slate-500'} rounded-xl py-2 px-3 text-[11px] outline-none transition-all appearance-none pr-8`}
                        value={teacherId}
                        disabled={isAssigning}
                        onChange={(e) => handleAssignTeacher(subject.subjectId, e.target.value)}
                      >
                        <option value="">Unassigned</option>
                        {teacherUsers.map(t => (
                          <option key={t.userId} value={t.userId}>{t.fullName}</option>
                        ))}
                      </select>
                      <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none opacity-40">
                        <User size={12} />
                      </div>
                    </div>
                  </div>
                );
              })}
              {subjects.length === 0 && (
                <div className="col-span-full py-12 text-center opacity-20 italic text-xs border border-dashed border-white/10 rounded-2xl">
                  No subjects defined in school structure. Populate subjects in the Structure page first.
                </div>
              )}
            </div>
          )}
        </article>
      </div>
    </div>
  );
};


export default ClassManagementPage;
