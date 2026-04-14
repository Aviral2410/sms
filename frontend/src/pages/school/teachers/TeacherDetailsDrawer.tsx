import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Calendar, Award, BookOpen, User } from 'lucide-react';
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
};

export function TeacherDetailsDrawer({ teacher, open, onClose, performance }: Props) {
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
        className="fixed top-0 right-0 h-screen w-full max-w-[420px] bg-[#081126]/96 border-l border-white/10 z-[101] overflow-y-auto shadow-[-20px_0_50px_rgba(0,0,0,0.5)]"
      >
        <div className="p-6 space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-white">Teacher Details</h2>
              <p className="text-xs text-slate-400 mt-1">Profile, classes, and performance snapshot</p>
            </div>
            <button 
              onClick={onClose} 
              className="p-2 rounded-xl bg-white/5 border border-white/10 text-slate-400 hover:text-white hover:bg-white/10 transition"
            >
              <X size={18} />
            </button>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
            <div className="flex items-center gap-3">
              <div className="w-14 h-14 rounded-xl border border-white/10 bg-slate-900/70 flex items-center justify-center text-[#7aa2ff] text-xl font-semibold">
                {teacher.fullName.charAt(0)}
              </div>
              <div className="min-w-0">
                <h3 className="text-lg font-semibold text-white truncate">{teacher.fullName}</h3>
                <p className="text-sm text-slate-300 truncate">{teacher.email}</p>
                <div className="mt-1 text-xs text-slate-400">{teacher.roleName}</div>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <h4 className="text-sm font-semibold text-slate-200">Performance</h4>
            <div className="grid grid-cols-2 gap-3">
              <PerfCard label="Attendance" value={`${performance?.attendanceRate?.toFixed(1) || '0'}%`} icon={<Calendar size={13} />} />
              <PerfCard label="Average Grade" value={performance?.averageGrade || 'N/A'} icon={<Award size={13} />} />
              <PerfCard label="Assignments" value={performance?.homeworksPosed || 0} icon={<BookOpen size={13} />} />
              <PerfCard label="Reports Filed" value={performance?.reportsFiled || 0} icon={<User size={13} />} />
            </div>
          </div>

          <div className="space-y-3">
            <h4 className="text-sm font-semibold text-slate-200">Instructor Status</h4>
            <p className="text-xs text-slate-400">Class and subject assignments are now managed within the Class Registry workspace.</p>
          </div>

          <button 
            onClick={onClose}
            className="w-full py-3 rounded-xl border border-white/10 bg-white/5 text-sm text-slate-200 hover:bg-white/10 transition"
          >
            Close
          </button>
        </div>
      </motion.aside>
    </>
  );
}

function PerfCard({ label, value, icon }: { label: string; value: string | number; icon: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/5 p-3.5 space-y-2">
      <div className="flex items-center gap-2 text-xs text-slate-300">
        {icon}
        <span>{label}</span>
      </div>
      <p className="text-lg font-semibold text-white">{value}</p>
    </div>
  );
}
