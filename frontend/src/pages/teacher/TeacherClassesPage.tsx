import React, { useEffect, useState } from 'react';
import { useStore } from '../../store/useStore';
import { motion } from 'framer-motion';
import { schoolOpsApi, type AcademicClassResponse, type SubjectResponse } from '../../lib/api';
import { BookOpen, Users, GraduationCap, ChevronRight, Search, Filter, Loader, AlertTriangle, Book } from 'lucide-react';

const DIM = '#8b95a2'; const BORDER = 'rgba(255,255,255,0.07)';

export default function TeacherClassesPage() {
  const { session, accentColor } = useStore();
  const [classes, setClasses] = useState<AcademicClassResponse[]>([]);
  const [subjects, setSubjects] = useState<SubjectResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState('');
  const [search, setSearch] = useState('');

  const VIOLET = accentColor; const DIM = '#8b95a2'; const BORDER = 'rgba(255,255,255,0.07)';

  useEffect(() => {
    if (!session.schoolId) return;
    Promise.all([
      schoolOpsApi.listClasses(session.schoolId),
      schoolOpsApi.listSubjects(session.schoolId)
    ]).then(([cls, sbj]) => {
      setClasses(cls);
      setSubjects(sbj);
    }).catch(e => setErr(e.message)).finally(() => setLoading(false));
  }, [session.schoolId]);

  const filteredClasses = classes.filter(c => 
    c.className.toLowerCase().includes(search.toLowerCase()) || 
    c.sectionName.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) return (
    <div className="flex items-center justify-center h-[60vh] gap-3 text-slate-400">
      <Loader size={24} className="animate-spin text-violet-400" />
      <span>Loading your academic roadmap...</span>
    </div>
  );

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col gap-8 pb-20">
      <header className="flex flex-col gap-2">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-violet-500/10 border border-violet-500/20 text-violet-400 text-[10px] font-black uppercase tracking-widest mb-2 w-fit">
          <BookOpen size={12} /> Academic Management
        </div>
        <h1 className="text-3xl font-black text-white tracking-tight">My Classes & Subjects</h1>
        <p className="text-slate-400 text-sm">Manage your teaching schedule and student groups.</p>
      </header>

      <div className="flex items-center gap-4">
        <div className="flex-1 relative">
          <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" />
          <input 
            type="text" 
            placeholder="Search classes or subjects..." 
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full bg-white/5 border border-white/10 rounded-2xl py-3 pl-12 pr-4 text-white text-sm outline-none focus:border-violet-500/50 transition-all"
          />
        </div>
        <button className="p-3 rounded-2xl bg-white/5 border border-white/10 text-slate-400 hover:text-white transition-all">
          <Filter size={20} />
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredClasses.map((cls, idx) => (
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: idx * 0.05 }}
            key={cls.classId}
            className="group relative p-6 rounded-3xl bg-white/5 border border-white/10 hover:bg-white/[0.08] hover:border-violet-500/30 transition-all overflow-hidden cursor-pointer"
          >
            <div className="absolute top-0 right-0 w-32 h-32 bg-violet-500/10 blur-[60px] group-hover:bg-violet-500/20 transition-all rounded-full -mr-16 -mt-16" />
            
            <div className="flex items-start justify-between mb-6">
              <div className="p-3 rounded-2xl bg-violet-500/10 text-violet-400 group-hover:scale-110 transition-transform">
                <GraduationCap size={24} />
              </div>
              <ChevronRight size={20} className="text-slate-600 group-hover:text-violet-400 group-hover:translate-x-1 transition-all" />
            </div>

            <div>
              <h3 className="text-xl font-bold text-white mb-1">{cls.className}</h3>
              <p className="text-slate-500 text-sm font-semibold">Section {cls.sectionName} · {cls.academicYear}</p>
            </div>

            <div className="mt-6 pt-6 border-t border-white/5 flex items-center justify-between">
              <div className="flex items-center gap-2 text-slate-400 text-xs font-bold">
                <Users size={14} className="text-violet-400" /> 32 Students
              </div>
              <div className="flex items-center gap-2 text-slate-400 text-xs font-bold">
                <Book size={14} className="text-blue-400" /> 4 Subjects
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      <section className="mt-12">
        <h2 className="text-xl font-black text-white mb-6 flex items-center gap-2">
          <Book size={20} className="text-blue-400" /> Subjects Inventory
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {subjects.map(s => (
            <div key={s.subjectId} className="p-4 rounded-2xl bg-white/5 border border-white/10 hover:border-blue-500/30 transition-all group">
              <div className="text-[10px] font-black text-blue-400 uppercase tracking-widest mb-1">{s.subjectCode}</div>
              <div className="text-sm font-bold text-white group-hover:text-blue-300 transition-colors">{s.subjectName}</div>
            </div>
          ))}
        </div>
      </section>
    </motion.div>
  );
}
