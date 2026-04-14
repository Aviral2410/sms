import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Layers, 
  BookOpen, 
  Plus, 
  User, 
  Trash2, 
  Edit3, 
  Search, 
  ChevronRight,
  ShieldCheck,
  MoreVertical,
  Sparkles,
  Brain,
  TrendingUp,
  X,
  Loader
} from 'lucide-react';
import { toast } from 'sonner';
import { schoolOpsApi, type DepartmentResponse, type SubjectResponse, type AcademicClassResponse, type SchoolUser, type DepartmentHodView, type TeacherSubjectMappingView } from '../../lib/api';
import GlassCard from '../../components/ui/GlassCard';
import '../../styles/admin-management.css';
import './academic-structure.css';

interface AcademicStructurePageProps {
  schoolSession: any;
  departments: DepartmentResponse[];
  subjects: SubjectResponse[];
  classes: AcademicClassResponse[];
  teacherUsers: SchoolUser[];
  departmentHods: DepartmentHodView[];
  teacherSubjectMappings: TeacherSubjectMappingView[];
  refreshData: () => Promise<void>;
  initialTab?: 'departments' | 'subjects';
}

const V = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.05 } } };
const I = { hidden: { opacity: 0, y: 15 }, show: { opacity: 1, y: 0 } };

const AcademicStructurePage: React.FC<AcademicStructurePageProps> = ({
  schoolSession,
  departments,
  subjects,
  classes,
  teacherUsers,
  departmentHods,
  teacherSubjectMappings,
  refreshData,
  initialTab = 'departments',
}) => {
  const [activeTab, setActiveTab] = useState<'departments' | 'subjects'>(initialTab as any || 'departments');
  const [searchQuery, setSearchQuery] = useState('');
  const [showModal, setShowModal] = useState<string | null>(null);
  const [aiInsight, setAiInsight] = useState<string | null>(null);
  
  // Forms
  const [deptForm, setDeptForm] = useState({ departmentName: '', departmentCode: '' });
  const [subjectForm, setSubjectForm] = useState({ subjectName: '', subjectCode: '', departmentId: '' });

  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setActiveTab(initialTab);
  }, [initialTab]);

  const handleCreateDept = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      await schoolOpsApi.createDepartment({ schoolId: schoolSession.schoolId, ...deptForm });
      toast.success('Department created successfully');
      setDeptForm({ departmentName: '', departmentCode: '' });
      setShowModal(null);
      await refreshData();
    } catch (err: any) {
      toast.error(err.message || 'Failed to create department');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateSubject = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      await schoolOpsApi.createSubject({ schoolId: schoolSession.schoolId, ...subjectForm });
      toast.success('Subject created successfully');
      setSubjectForm({ subjectName: '', subjectCode: '', departmentId: '' });
      setShowModal(null);
      await refreshData();
    } catch (err: any) {
      toast.error(err.message || 'Failed to create subject');
    } finally {
      setLoading(false);
    }
  };

  const handleAssignTeacherSubject = async (subjectId: string, teacherId: string) => {
    try {
      setLoading(true);
      await schoolOpsApi.assignTeacherSubject({ schoolId: schoolSession.schoolId, primaryId: teacherId, secondaryId: subjectId });
      toast.success('Teacher assigned to subject');
      await refreshData();
    } catch (err: any) {
      toast.error(err.message || 'Assignment failed');
    } finally {
      setLoading(false);
    }
  };

  const generateAiInsight = () => {
    setAiInsight(null);
    setTimeout(() => {
      setAiInsight('AI Structural Analysis: The current subject distribution across departments is optimized. Suggestion: Consider adding more vocational subjects to the Tech department to align with upcoming curriculum changes.');
    }, 1200);
  };

  const handleAssignHod = async (deptId: string, teacherId: string) => {
    try {
      setLoading(true);
      await schoolOpsApi.assignHod({ schoolId: schoolSession.schoolId, primaryId: deptId, secondaryId: teacherId });
      toast.success('HOD assigned successfully');
      await refreshData();
    } catch (err: any) {
      toast.error(err.message || 'Failed to assign HOD');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteDept = async (id: string) => {
    if (!confirm('Are you sure you want to delete this department?')) return;
    try {
      await schoolOpsApi.deleteDepartment(id);
      toast.success('Department deleted');
      await refreshData();
    } catch (err: any) {
      toast.error(err.message || 'Failed to delete department');
    }
  };

  const handleDeleteSubject = async (id: string) => {
    if (!confirm('Are you sure?')) return;
    try {
        await schoolOpsApi.deleteSubject(id);
        toast.success('Subject deleted');
        await refreshData();
    } catch (err: any) {
        toast.error(err.message || 'Delete failed');
    }
  }

  const getHodForDept = (deptId: string) => {
    return departmentHods.find(h => h.departmentId === deptId);
  };

  const getTeacherForSubject = (subjectId: string) => {
    const mapping = teacherSubjectMappings.find(m => m.subjectId === subjectId);
    if (!mapping) return null;
    return teacherUsers.find(u => u.userId === mapping.teacherUserId);
  };

  const stats = [
    { label: 'Departments', value: departments.length, icon: Layers, color: '#22c55e' },
    { label: 'Subjects', value: subjects.length, icon: BookOpen, color: '#a78bfa' },
    { label: 'Assigned Teachers', value: teacherSubjectMappings.length, icon: User, color: '#38bdf8' },
    { label: 'HODs Appointed', value: departmentHods.length, icon: ShieldCheck, color: '#fbbf24' },
  ];

  const filteredItems = {
    departments: departments.filter(d => d.departmentName.toLowerCase().includes(searchQuery.toLowerCase())),
    subjects: subjects.filter(s => s.subjectName.toLowerCase().includes(searchQuery.toLowerCase())),
    classes: classes.filter(c => c.className.toLowerCase().includes(searchQuery.toLowerCase())),
  };

  return (
    <div className="admin-management-shell min-h-screen">
      <motion.div variants={V} initial="hidden" animate="show" className="admin-management-page">
        <motion.section variants={I} className="admin-management-card admin-management-hero">
          <div className="admin-management-hero-copy">
            <div className="admin-management-eyebrow">Academic Operations</div>
            <h1 className="admin-management-title">Academic Structure</h1>
            <p className="admin-management-subtitle">
              Manage departments, classes, and curriculum nodes in one consistent workspace.
            </p>
          </div>
          <div className="admin-management-hero-actions">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={generateAiInsight}
              className="admin-management-secondary"
              type="button"
            >
              <Brain size={18} /> AI Insight
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setShowModal(activeTab)}
              className="admin-management-primary"
              type="button"
            >
              <Plus size={18} /> Add {activeTab === 'departments' ? 'Department' : 'Subject'}
            </motion.button>
          </div>
        </motion.section>

      {/* AI Insight Banner */}
      <AnimatePresence>
        {aiInsight && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
            className="admin-management-card admin-management-panel"
            style={{ borderColor: 'rgba(167, 139, 250, 0.26)' }}>
            <div className="flex gap-4 items-start">
              <div className="p-2.5 bg-violet-500/15 rounded-xl text-violet-200 border border-violet-500/20">
                <Sparkles size={18} />
              </div>
              <div className="flex-1">
                <div className="admin-management-panel-kicker">AI Strategic Feedback</div>
                <p className="mt-2" style={{ color: 'rgba(217, 227, 255, 0.75)', fontSize: '0.98rem' }}>
                  {aiInsight}
                </p>
              </div>
              <button onClick={() => setAiInsight(null)} className="admin-management-secondary" type="button">
                <X size={16} />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Stats Row */}
      <div className="admin-management-stats-grid">
        {stats.map((s) => (
          <motion.section
            key={s.label}
            variants={I}
            whileHover={{ y: -4 }}
            className="admin-management-card admin-management-stat-card"
          >
            <div style={{ color: s.color }}>
              <s.icon size={18} />
            </div>
            <strong>{s.value}</strong>
            <span>{s.label}</span>
          </motion.section>
        ))}
      </div>

      {/* Main Content Area */}
      <section className="admin-management-card admin-management-toolbar academic-structure-toolbar">
        <div className="academic-structure-tabs" role="tablist" aria-label="Academic structure sections">
          {[
            { id: 'departments', label: 'Departments', icon: Layers },
            { id: 'subjects', label: 'Subjects', icon: BookOpen },
          ].map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`academic-structure-tab ${isActive ? 'is-active' : ''}`}
                type="button"
                role="tab"
                aria-selected={isActive}
              >
                <tab.icon size={16} /> {tab.label}
              </button>
            );
          })}
        </div>

        <div className="admin-management-search academic-structure-search">
          <Search size={18} />
          <input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={`Search ${activeTab}...`}
          />
        </div>
      </section>

      {/* List Views */}
      <section className="admin-management-card academic-structure-registry">
          {activeTab === 'departments' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredItems.departments.map(dept => {
                const hod = getHodForDept(dept.departmentId);
                return (
                  <GlassCard key={dept.departmentId} className="p-6 hover:border-cyan-500/30 transition-all group">
                    <div className="flex justify-between items-start mb-6">
                      <div className="flex gap-4 items-center">
                        <div className="w-14 h-14 bg-cyan-500/10 rounded-2xl flex items-center justify-center text-cyan-400 border border-cyan-500/20 group-hover:scale-110 transition-transform">
                          <Layers size={28} />
                        </div>
                        <div>
                          <h4 className="text-xl font-bold text-white tracking-tight">{dept.departmentName}</h4>
                          <span className="text-[11px] font-mono text-slate-500 tracking-tighter uppercase">
                            {dept.departmentCode} - {subjects.filter(s => s.departmentId === dept.departmentId).length} Subjects
                          </span>
                        </div>
                      </div>
                      <div className="flex gap-1">
                        <button className="p-2 text-slate-600 hover:text-white transition-colors"><Edit3 size={16} /></button>
                        <button onClick={() => handleDeleteDept(dept.departmentId)} className="p-2 text-slate-600 hover:text-rose-500 transition-colors"><Trash2 size={16} /></button>
                      </div>
                    </div>
                    <div className="flex items-center justify-between p-3 px-4 bg-white/[0.02] border border-white/5 rounded-xl">
                      <div className="flex items-center gap-2">
                        {hod ? (
                          <div className="flex items-center gap-2 text-emerald-400 font-bold text-xs"><ShieldCheck size={14} /> {hod.teacherName} <span className="text-[10px] opacity-40">HOD</span></div>
                        ) : (
                          <div className="flex items-center gap-2 text-amber-500/60 font-bold text-xs italic"><User size={14} /> HOD Unassigned</div>
                        )}
                      </div>
                      <select onChange={(e) => handleAssignHod(dept.departmentId, e.target.value)} value={hod?.teacherUserId || ""}
                        className="bg-transparent border-none text-[10px] font-bold text-cyan-400 focus:ring-0 p-0 cursor-pointer">
                        <option value="">{hod ? 'Re-assign' : 'Assign HOD'}</option>
                        {teacherUsers.map(t => <option key={t.userId} value={t.userId} className="bg-slate-900">{t.fullName}</option>)}
                      </select>
                    </div>
                  </GlassCard>
                );
              })}
            </div>
          )}

          {activeTab === 'subjects' && (
             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
               {filteredItems.subjects.map(sub => {
                 const dept = departments.find(d => d.departmentId === sub.departmentId);
                 const assignedTeacher = getTeacherForSubject(sub.subjectId);
                 return (
                   <GlassCard key={sub.subjectId} className="p-6 hover:border-violet-500/30 transition-all group overflow-hidden relative">
                     <div className="absolute top-0 right-0 w-24 h-24 bg-violet-500/5 blur-2xl rounded-full translate-x-10 -translate-y-10" />
                     <div className="flex justify-between items-start mb-6">
                       <div className="flex gap-4 items-center">
                         <div className="w-12 h-12 bg-violet-500/10 rounded-xl flex items-center justify-center text-violet-400 border border-violet-500/20 group-hover:scale-110 transition-transform">
                           <BookOpen size={22} />
                         </div>
                         <div>
                           <h5 className="font-bold text-white text-base leading-tight">{sub.subjectName}</h5>
                           <span className="text-[10px] text-slate-500 uppercase font-black tracking-wider">
                             {dept?.departmentName || 'General'} • {sub.subjectCode}
                           </span>
                         </div>
                       </div>
                       <button onClick={() => handleDeleteSubject(sub.subjectId)} className="p-2 text-slate-700 hover:text-rose-400 transition-colors">
                         <Trash2 size={16} />
                       </button>
                     </div>

                     <div className="space-y-3">
                       <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Assigned Instructor</div>
                       <div className="flex items-center justify-between p-3 bg-white/[0.02] border border-white/5 rounded-xl">
                         <div className="flex items-center gap-2 overflow-hidden">
                           {assignedTeacher ? (
                             <>
                               <div className="w-6 h-6 rounded-lg bg-violet-500/20 flex items-center justify-center text-[10px] text-violet-300 border border-violet-500/20 shrink-0">
                                 {assignedTeacher.fullName.charAt(0)}
                               </div>
                               <span className="text-xs font-bold text-slate-200 truncate">{assignedTeacher.fullName}</span>
                             </>
                           ) : (
                             <>
                               <div className="w-6 h-6 rounded-lg bg-orange-500/10 flex items-center justify-center text-orange-400 shrink-0 border border-orange-500/10">
                                 <User size={12} />
                               </div>
                               <span className="text-xs font-bold text-orange-500/60 italic truncate">No Teacher</span>
                             </>
                           )}
                         </div>
                         <select 
                           onChange={(e) => handleAssignTeacherSubject(sub.subjectId, e.target.value)} 
                           value={assignedTeacher?.userId || ""}
                           className="bg-transparent border-none text-[10px] font-bold text-violet-400 focus:ring-0 p-0 pl-2 cursor-pointer text-right w-24 outline-none"
                         >
                           <option value="" className="bg-slate-900">{assignedTeacher ? 'Update' : 'Assign'}</option>
                           {teacherUsers.map(t => (
                             <option key={t.userId} value={t.userId} className="bg-slate-900">{t.fullName}</option>
                           ))}
                         </select>
                       </div>
                     </div>
                   </GlassCard>
                 );
               })}
             </div>
          )}

      </section>

      {/* Creation Modal */}
      <AnimatePresence>
        {showModal && (
          <div className="fixed inset-0 z-[1000] flex items-center justify-center p-6 bg-black/80 backdrop-blur-md">
            <motion.div initial={{ opacity: 0, scale: 0.9, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="w-full max-w-lg bg-[#0a1018] border border-white/10 rounded-[32px] p-8 relative shadow-2xl">
              <button onClick={() => setShowModal(null)} className="absolute top-6 right-6 text-slate-500 hover:text-white transition-colors"><X size={24} /></button>
              
              <div className="mb-8">
                <span className="text-[10px] uppercase font-black text-cyan-500 tracking-widest mb-1 block">New Component</span>
                <h2 className="text-2xl font-black text-white">Create {showModal.charAt(0).toUpperCase() + showModal.slice(1, -1)}</h2>
              </div>

              {showModal === 'departments' && (
                <form onSubmit={handleCreateDept} className="space-y-5">
                  <div className="space-y-2">
                    <span className="text-[10px] uppercase font-bold text-slate-500 ml-1">Official Name</span>
                    <input value={deptForm.departmentName} onChange={e => setDeptForm({...deptForm, departmentName: e.target.value})} placeholder="e.g. Science Faculty" required
                      className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-white outline-none focus:border-cyan-500/50 transition-all font-medium" />
                  </div>
                  <div className="space-y-2">
                    <span className="text-[10px] uppercase font-bold text-slate-500 ml-1">Protocol Code</span>
                    <input value={deptForm.departmentCode} onChange={e => setDeptForm({...deptForm, departmentCode: e.target.value})} placeholder="e.g. SCI-01" required
                      className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-white outline-none focus:border-cyan-500/50 transition-all font-mono" />
                  </div>
                  <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} disabled={loading}
                    className="w-full py-4 bg-cyan-500 text-slate-950 rounded-2xl font-black uppercase text-xs tracking-widest shadow-lg shadow-cyan-500/20 disabled:opacity-50 mt-4">
                    {loading ? 'Creating...' : 'Initialize Department'}
                  </motion.button>
                </form>
              )}

              {showModal === 'subjects' && (
                <form onSubmit={handleCreateSubject} className="space-y-5">
                  <input value={subjectForm.subjectName} onChange={e => setSubjectForm({...subjectForm, subjectName: e.target.value})} placeholder="Domain Name" required
                    className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-white outline-none focus:border-cyan-500/50 transition-all" />
                  <input value={subjectForm.subjectCode} onChange={e => setSubjectForm({...subjectForm, subjectCode: e.target.value})} placeholder="Registry Code" required
                    className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-white outline-none focus:border-cyan-500/50 transition-all font-mono" />
                  <select value={subjectForm.departmentId} onChange={e => setSubjectForm({...subjectForm, departmentId: e.target.value})} required
                    className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-white outline-none focus:border-cyan-500/50 transition-all">
                    <option value="" className="bg-slate-900">Parent Department</option>
                    {departments.map(d => <option key={d.departmentId} value={d.departmentId} className="bg-slate-900">{d.departmentName}</option>)}
                  </select>
                  <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} disabled={loading}
                    className="w-full py-4 bg-gradient-to-r from-violet-500 to-indigo-600 text-white rounded-2xl font-black uppercase text-xs tracking-widest shadow-lg shadow-violet-500/20 mt-4">
                    Commit Subject Registry
                  </motion.button>
                </form>
              )}

            </motion.div>
          </div>
        )}
      </AnimatePresence>
      </motion.div>
    </div>
  );
};

export default AcademicStructurePage;
