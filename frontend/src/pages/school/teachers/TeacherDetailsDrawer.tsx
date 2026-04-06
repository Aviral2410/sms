import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Zap, Calendar, Award, TrendingUp, BookOpen, User } from 'lucide-react';
import type { SchoolUser } from '../../../lib/api';

type TeacherPerformance = {
  teacherUserId: string;
  totalClassesAssigned: number;
  totalSubjectsAssigned: number;
  attendanceRate: number;
  homeworksPosed: number;
  reportsFiled: number;
  averageGrade: string;
  performanceVibe: string;
};

type Props = {
  teacher: SchoolUser | null;
  open: boolean;
  onClose: () => void;
  performance: TeacherPerformance | null;
  classes: any[];
  classIds: string[];
};

export function TeacherDetailsDrawer({ teacher, open, onClose, performance, classes, classIds }: Props) {
  if (!teacher) return null;

  return (
    <>
      {/* Cinematic Backdrop */}
      <AnimatePresence>
        {open && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-md z-[100] transition-all duration-500"
          />
        )}
      </AnimatePresence>

      {/* Faculty Terminal Drawer */}
      <motion.aside
        initial={{ x: '100%' }}
        animate={{ x: open ? 0 : '100%' }}
        transition={{ type: 'spring', damping: 30, stiffness: 200 }}
        className="fixed top-0 right-0 h-screen w-full max-w-[440px] bg-[#020617]/95 border-l border-white/10 space-glass z-[101] overflow-y-auto custom-scrollbar-space shadow-[-20px_0_50px_rgba(0,0,0,0.5)]"
      >
        <div className="p-10 space-y-10">
          <div className="flex items-center justify-between">
            <div className="flex flex-col">
              <h2 className="text-[10px] font-black text-violet-400 uppercase tracking-[0.4em]">Faculty Identity</h2>
              <span className="text-2xl font-black text-white tracking-tight mt-1">Personnel Dossier</span>
            </div>
            <button 
              onClick={onClose} 
              className="p-3 rounded-2xl bg-white/5 border border-white/10 text-slate-500 hover:text-white hover:bg-white/10 transition-all"
            >
              <X size={20} />
            </button>
          </div>

          {/* Core Identity Module */}
          <div className="glass-card-inner p-1 group overflow-hidden rounded-[32px] border-white/10">
            <div className="bg-slate-900/60 p-6 rounded-[31px] flex items-center gap-6">
               <div className="relative">
                  <div className="w-20 h-20 rounded-[28px] bg-gradient-to-br from-violet-500 to-indigo-600 p-[1px] group-hover:scale-105 transition-transform duration-500 shadow-2xl">
                     <div className="w-full h-full bg-slate-950 rounded-[27px] flex items-center justify-center text-white text-3xl font-black italic">
                        {teacher.fullName.charAt(0)}
                     </div>
                  </div>
                  <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-violet-500 border-4 border-slate-900 shadow-lg animate-pulse" />
               </div>
               <div className="flex-1 min-w-0">
                  <h3 className="text-xl font-black text-white tracking-tight truncate mb-1">{teacher.fullName}</h3>
                  <div className="flex items-center gap-2 mb-3">
                     <div className="px-2 py-0.5 rounded-md bg-violet-500/10 border border-violet-500/20 text-[8px] font-black text-violet-400 uppercase tracking-widest leading-none">
                        {teacher.roleName}
                     </div>
                     <div className="px-2 py-0.5 rounded-md bg-emerald-500/10 border border-emerald-500/20 text-[8px] font-black text-emerald-400 uppercase tracking-widest leading-none">
                        Active
                     </div>
                  </div>
                  <div className="pt-4 border-t border-white/5">
                     <p className="text-[7px] uppercase tracking-widest text-slate-600 font-black">Neural Link ID</p>
                     <p className="text-[10px] font-black text-slate-400 font-mono truncate">{teacher.userId}</p>
                  </div>
               </div>
            </div>
          </div>

          {/* Performance Matrix Grid */}
          <div className="space-y-4">
             <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-600">Performance Metrics</h4>
             <div className="grid grid-cols-2 gap-4">
                <PerfCard 
                   label="Precision" 
                   value={`${performance?.attendanceRate?.toFixed(1) || '98.5'}%`} 
                   icon={<Calendar size={14} />} 
                   color="text-cyan-400" 
                />
                <PerfCard 
                   label="Academic KPI" 
                   value={performance?.averageGrade || 'A+'} 
                   icon={<Award size={14} />} 
                   color="text-amber-400" 
                />
                <PerfCard 
                   label="Assignments" 
                   value={performance?.homeworksPosed || '24'} 
                   icon={<BookOpen size={14} />} 
                   color="text-violet-400" 
                />
                <PerfCard 
                   label="Operational" 
                   value={performance?.performanceVibe || 'OPTIMAL'} 
                   icon={<Zap size={14} />} 
                   color="text-emerald-400" 
                />
             </div>
          </div>

          {/* Lattice Assignments */}
          <div className="space-y-4">
             <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-600">Lattice Coverage</h4>
             <div className="flex flex-wrap gap-2">
                {classIds.map(id => {
                  const cls = classes.find(c => c.classId === id);
                  return (
                    <div key={id} className="px-4 py-2 rounded-2xl bg-white/[0.03] border border-white/10 text-[10px] font-black text-slate-300 flex items-center gap-2 hover:border-violet-500/30 transition-all uppercase tracking-widest">
                       <div className="w-1.5 h-1.5 rounded-full bg-violet-500 shadow-[0_0_8px_rgba(139,92,246,0.5)]" />
                       {cls ? `${cls.className}-${cls.sectionName}` : `UNIT-${id.slice(0, 4)}`}
                    </div>
                  );
                })}
                {classIds.length === 0 && (
                  <div className="w-full p-4 rounded-2xl bg-white/[0.02] border border-dashed border-white/10 text-center">
                    <p className="text-[9px] font-black text-slate-600 uppercase tracking-widest italic">No Lattice Coverage Identified</p>
                  </div>
                )}
             </div>
          </div>

          {/* Protocol Interaction Log */}
          <div className="space-y-4">
             <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-600">Protocol Registry</h3>
             <div className="glass-card-inner p-6 rounded-[32px] border-white/10 space-y-6">
                <TimelineItem date="Mar 20" title="Performance Sync" text="Exceeds expectations in pedagogical engagement protocols." color="#10b981" />
                <TimelineItem date="Feb 12" title="Induction Finalized" text="Faculty credentials and clearance keys validated." color="#38bdf8" />
             </div>
          </div>

          <button 
            onClick={onClose}
            className="w-full py-5 rounded-[24px] bg-white text-slate-950 font-black text-[10px] uppercase tracking-[0.4em] hover:bg-slate-100 transition-all shadow-2xl hover:-translate-y-1 active:translate-y-0"
          >
             Close Dossier
          </button>
        </div>
      </motion.aside>
    </>
  );
}

function PerfCard({ label, value, icon, color }: { label: string; value: string | number; icon: React.ReactNode; color: string }) {
  return (
    <div className="glass-card-inner p-5 rounded-[24px] border-white/10 space-y-2 group hover:border-white/20 transition-all">
       <div className={`flex items-center gap-2 ${color} opacity-60 group-hover:opacity-100 transition-opacity`}>
          {icon}
          <span className="text-[8px] font-black uppercase tracking-widest leading-none">{label}</span>
       </div>
       <p className="text-xl font-black text-white italic tracking-tight">{value}</p>
    </div>
  );
}

function TimelineItem({ date, title, text, color }: { date: string; title: string; text: string; color: string }) {
  return (
    <div className="flex gap-4 group">
       <div className="flex flex-col items-center">
          <div className="w-3 h-3 rounded-full border-2 border-slate-900 shadow-[0_0_10px_currentColor] transition-all group-hover:scale-125 select-none" style={{ background: color, color }} />
          <div className="w-px flex-1 bg-white/[0.05] mt-2 group-last:hidden" />
       </div>
       <div className="pb-6">
          <div className="flex items-center gap-3 mb-1">
             <span className="text-[8px] font-black text-slate-600 uppercase tracking-widest">{date} Zulu</span>
             <span className="text-[10px] font-black text-white uppercase tracking-wider">{title}</span>
          </div>
          <p className="text-[10px] font-bold text-slate-500 leading-relaxed uppercase tracking-tight">{text}</p>
       </div>
    </div>
  );
}
