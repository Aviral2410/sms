import React, { useState, useEffect } from 'react';
import { 
  Users, 
  Search, 
  Sparkles,
  Zap,
  ArrowUpAZ,
  ArrowDownAZ,
  ChevronRight
} from 'lucide-react';
import { schoolOpsApi, type SchoolUser } from '../../lib/api';
import { toast } from 'sonner';
import { TeacherSidebar } from './teachers/TeacherSidebar';
import { TeacherTable } from './teachers/TeacherTable';
import { TeacherDetailsDrawer } from './teachers/TeacherDetailsDrawer';

interface TeacherManagementPageProps {
  schoolSession: any;
  teacherUsers: SchoolUser[];
  subjects: any[];
  classes: any[];
  schoolClassIdsByTeacher: Map<string, string[]>;
  createSchoolOp: (path: string, body: any, onSuccess: () => Promise<void>, message: string) => Promise<void>;
  loadSchoolOperations: (session: any) => Promise<void>;
  displayUserName: (user: any) => string;
}

const TeacherManagementPage = ({
  schoolSession,
  teacherUsers,
  subjects,
  classes,
  schoolClassIdsByTeacher,
  createSchoolOp,
  loadSchoolOperations
}: TeacherManagementPageProps) => {
  const [userForm, setUserForm] = useState({ fullName: '', email: '', roleName: 'TEACHER', accessKey: '' });
  const [teacherFilterText, setTeacherFilterText] = useState('');
  const [selectedTeacher, setSelectedTeacher] = useState<SchoolUser | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [performance, setPerformance] = useState<any>(null);
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');

  const filteredTeachers = teacherUsers.filter(t => 
    t.fullName.toLowerCase().includes(teacherFilterText.toLowerCase()) ||
    t.email.toLowerCase().includes(teacherFilterText.toLowerCase())
  ).sort((a, b) => sortDir === 'asc' ? a.fullName.localeCompare(b.fullName) : b.fullName.localeCompare(a.fullName));

  const handleCreateTeacher = async (e: React.FormEvent) => {
    e.preventDefault();
    await createSchoolOp('/api/v1/school-ops/users', {
      tenantId: schoolSession.tenantId,
      schoolId: schoolSession.schoolId,
      schoolCode: schoolSession.schoolCode,
      schoolName: schoolSession.schoolName,
      ...userForm,
    }, async () => {
      await loadSchoolOperations(schoolSession);
      setUserForm({ fullName: '', email: '', roleName: 'TEACHER', accessKey: '' });
    }, 'Faculty member registered.');
  };

  const handleUpdateTeacher = async (teacher: SchoolUser) => {
     // For now, reuse the prompt logic or later add a modal
     const newName = prompt('New Full Name:', teacher.fullName);
     if (newName) {
        try {
          await schoolOpsApi.updateUser(teacher.userId, { fullName: newName, email: teacher.email });
          toast.success('Profile updated');
          await loadSchoolOperations(schoolSession);
        } catch (err: any) {
          toast.error(err.message);
        }
     }
  };

  const handleDeleteTeacher = async (userId: string) => {
    if (!confirm('Deactivate this faculty member?')) return;
    try {
      await schoolOpsApi.deleteUser(userId);
      toast.success('Faculty deactivated');
      await loadSchoolOperations(schoolSession);
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const handleView = async (teacher: SchoolUser) => {
    setSelectedTeacher(teacher);
    setDrawerOpen(true);
    try {
      const perf = await schoolOpsApi.getTeacherPerformance(schoolSession.schoolId, teacher.userId);
      setPerformance(perf);
    } catch (e) {
      setPerformance(null);
    }
  };

  return (
    <div className="relative min-h-screen bg-transparent overflow-x-hidden">
      {/* Structural 3-Column Grid */}
      <div className="relative z-10 grid grid-cols-1 lg:grid-cols-[300px_1fr] gap-8 py-8 px-6 max-w-[1700px] mx-auto animate-in fade-in duration-1000">
        
        {/* Left Terminal: Faculty Onboarding & Stats */}
        <aside className="space-y-6">
          <TeacherSidebar 
             teacherCount={teacherUsers.length}
             activeLoad="98%"
             onboardingForm={userForm}
             setForm={setUserForm}
             onSubmit={handleCreateTeacher}
             filterText={teacherFilterText}
             setFilterText={setTeacherFilterText}
          />
        </aside>

        {/* Right Terminal: Faculty Directory & Operations */}
        <main className="space-y-8">
          
          {/* Operations Header */}
          <div className="flex flex-col xl:flex-row xl:items-end justify-between gap-8 pb-4 border-b border-white/5">
             <div className="space-y-1">
                <div className="flex items-center gap-3 text-[10px] font-black uppercase tracking-[0.4em] text-violet-400 mb-2">
                  <div className="h-1.5 w-1.5 rounded-full bg-violet-400 animate-pulse shadow-[0_0_10px_rgba(167,139,250,0.8)]" />
                  Educational Architecture
                </div>
                <h1 className="text-5xl font-black text-white tracking-tighter uppercase leading-none">
                  Faculty
                </h1>
                <p className="text-xs font-bold text-slate-500 tracking-wide mt-2">
                  Managing <span className="text-white">{teacherUsers.length}</span> lead academic entities across the campus.
                </p>
             </div>
          </div>

          {/* Search & Intelligence Bar */}
          <div className="space-glass p-2 flex flex-col md:flex-row items-center gap-4 border-white/10 ring-1 ring-white/5">
             <div className="flex-1 relative group w-full">
                <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-600 group-focus-within:text-violet-400 transition-colors" size={20} />
                <input 
                  value={teacherFilterText}
                  onChange={(e) => setTeacherFilterText(e.target.value)}
                  placeholder="Search by faculty name, academic email, or ID..."
                  className="w-full bg-transparent border-none text-sm font-bold text-white placeholder:text-slate-700 focus:ring-0 pl-16 pr-4 py-5"
                />
             </div>
             
             <div className="hidden md:block h-10 w-[1px] bg-white/10" />
             
             <div className="flex items-center gap-3 px-4 w-full md:w-auto overflow-x-auto pb-2 md:pb-0 custom-scrollbar-space">
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-600 mr-2 whitespace-nowrap">Order Matrix:</span>
                <button 
                  onClick={() => setSortDir(s => s === 'asc' ? 'desc' : 'asc')}
                  className="px-6 py-2.5 rounded-xl bg-white/5 text-slate-500 hover:text-violet-400 hover:bg-white/10 transition-all border border-white/5 flex items-center gap-3"
                >
                   <span className="text-[10px] font-black uppercase tracking-widest">A-Z Name</span>
                   {sortDir === 'asc' ? <ArrowUpAZ size={16} /> : <ArrowDownAZ size={16} />}
                </button>
             </div>
          </div>

          {/* Directory Grid Terminal */}
          <div className="relative">
             <div className="absolute -inset-1 bg-gradient-to-r from-violet-500/10 to-blue-500/10 blur-2xl opacity-50" />
             <div className="relative">
                <TeacherTable 
                  teachers={filteredTeachers}
                  schoolClassIdsByTeacher={schoolClassIdsByTeacher}
                  onView={handleView}
                  onEdit={(teacher) => handleUpdateTeacher(teacher)}
                  onDelete={(teacher) => handleDeleteTeacher(teacher.userId)}
                  selectedId={selectedTeacher?.userId}
                />
             </div>
          </div>

          {/* Structural Mapping Command Center */}
          <div className="space-glass p-8 rounded-[40px] border border-white/10 flex items-center justify-between group cursor-pointer hover:border-amber-500/30 transition-all shadow-2xl">
             <div className="flex items-center gap-6">
                <div className="p-5 rounded-2xl bg-amber-500/10 text-amber-500 group-hover:scale-110 group-hover:shadow-[0_0_20px_rgba(245,158,11,0.2)] transition-all">
                   <Sparkles size={28} />
                </div>
                <div>
                   <h3 className="text-xl font-black text-white uppercase tracking-tight">Structural Mapping</h3>
                   <p className="text-[10px] font-bold text-slate-600 uppercase tracking-widest mt-1">Authorize subject links and class coverage</p>
                </div>
             </div>
             <ChevronRight className="text-slate-700 group-hover:text-amber-500 group-hover:translate-x-2 transition-all" />
          </div>

        </main>
      </div>

      <TeacherDetailsDrawer 
        teacher={selectedTeacher}
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        performance={performance}
        classes={classes}
        classIds={schoolClassIdsByTeacher.get(selectedTeacher?.userId || '') || []}
      />
    </div>
  );
};

export default TeacherManagementPage;
