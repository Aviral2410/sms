import React from 'react';
import { Edit2, Trash2, TrendingUp, FileText, ChevronRight, BookOpen } from 'lucide-react';
import type { SchoolUser } from '../../../lib/api';

type Props = {
  teachers: SchoolUser[];
  schoolClassIdsByTeacher: Map<string, string[]>;
  onView: (teacher: SchoolUser) => void;
  onEdit: (teacher: SchoolUser) => void;
  onDelete: (teacher: SchoolUser) => void;
  selectedId?: string;
};

export function TeacherTable({ 
  teachers, 
  schoolClassIdsByTeacher, 
  onView, 
  onEdit, 
  onDelete, 
  selectedId 
}: Props) {
  return (
    <div className="space-glass rounded-[40px] overflow-hidden border-white/10 shadow-2xl animate-in fade-in zoom-in-95 duration-700 ring-1 ring-white/5">
      <div className="overflow-x-auto custom-scrollbar-space">
        <table className="w-full text-left border-collapse min-w-[900px]">
          <thead className="bg-[#020617]/60 border-b border-white/10">
            <tr>
              <th className="py-6 px-8 text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">Faculty Identity</th>
              <th className="py-6 px-4 text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">Academic Load</th>
              <th className="py-6 px-4 text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">Induction Registry</th>
              <th className="py-6 px-8 text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 text-right">Operations</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/[0.05]">
            {teachers.map((teacher) => (
              <tr 
                key={teacher.userId}
                onClick={() => onView(teacher)}
                className={`group transition-all duration-300 cursor-pointer hover:bg-white/[0.03] ${
                  teacher.userId === selectedId ? 'bg-violet-500/10 border-l-2 border-l-violet-400 shadow-[inset_10px_0_30px_-10px_rgba(139,92,246,0.1)]' : 'border-l-2 border-l-transparent'
                }`}
              >
                <td className="py-6 px-8">
                  <div className="flex items-center gap-4">
                    <div className="relative group-hover:scale-110 transition-transform duration-500">
                      <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-slate-800 to-slate-900 border border-white/10 flex items-center justify-center font-black text-violet-400 text-xl shadow-xl group-hover:border-violet-500/50">
                        {teacher.fullName.charAt(0)}
                      </div>
                      <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-[#020617] border border-white/10 flex items-center justify-center p-1">
                         <div className="w-full h-full rounded-full bg-violet-500 animate-pulse" />
                      </div>
                    </div>
                    <div className="space-y-1">
                      <div className="text-sm font-black text-white tracking-tight uppercase">
                        {teacher.fullName}
                      </div>
                      <div className="flex items-center gap-2 text-[10px] font-bold text-slate-500 tracking-wide uppercase">
                        <span className="text-slate-600">USR-ID:</span>
                        {teacher.userId.split('-')[0]}
                      </div>
                    </div>
                  </div>
                </td>
                <td className="py-6 px-4">
                  <div className="flex items-center gap-8">
                     <div className="flex flex-col gap-1">
                        <span className="text-lg font-black text-blue-400 leading-none tracking-tighter">
                           {(schoolClassIdsByTeacher.get(teacher.userId) || []).length}
                        </span>
                        <span className="text-[8px] uppercase tracking-[0.2em] text-slate-600 font-black">Designated Classes</span>
                     </div>
                     <div className="flex flex-col gap-1">
                        <span className="text-lg font-black text-emerald-400 leading-none tracking-tighter">
                           03
                        </span>
                        <span className="text-[8px] uppercase tracking-[0.2em] text-slate-600 font-black">Core Subjects</span>
                     </div>
                  </div>
                </td>
                <td className="py-6 px-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 rounded-xl bg-white/5 border border-white/5">
                       <BookOpen size={16} className="text-slate-500 group-hover:text-violet-400 transition-colors" />
                    </div>
                    <div className="flex flex-col">
                       <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Commissioned</span>
                       <span className="text-[11px] font-bold text-white opacity-60 italic">{new Date(teacher.createdAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                </td>
                <td className="py-6 px-8 text-right" onClick={(e) => e.stopPropagation()}>
                  <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-all duration-300 translate-x-4 group-hover:translate-x-0">
                    <button 
                      onClick={() => onView(teacher)}
                      className="p-3 rounded-2xl bg-white/5 text-slate-400 hover:text-violet-400 hover:bg-violet-500/10 transition-all border border-transparent hover:border-violet-500/30"
                      title="Performance Analytics"
                    >
                      <TrendingUp size={18} />
                    </button>
                    <button 
                      onClick={() => onEdit(teacher)}
                      className="p-3 rounded-2xl bg-white/5 text-slate-400 hover:text-cyan-400 hover:bg-cyan-500/10 transition-all border border-transparent hover:border-cyan-500/30"
                      title="Edit Identity"
                    >
                      <Edit2 size={18} />
                    </button>
                    <button 
                      onClick={() => onDelete(teacher)}
                      className="p-3 rounded-2xl bg-white/5 text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-all border border-transparent hover:border-red-500/30"
                      title="Terminate Link"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {teachers.length === 0 && (
              <tr>
                <td colSpan={4} className="py-32 text-center">
                  <div className="relative inline-block">
                    <div className="text-[10px] font-black uppercase tracking-[0.6em] text-slate-700 animate-pulse">Void Detected: No Faculty Radar Matches</div>
                    <div className="absolute -inset-4 border border-white/5 rounded-full opacity-20" />
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function ActionBtn({ icon, onClick, label }: { icon: React.ReactNode; onClick: () => void; label: string }) {
  return (
    <button 
      onClick={onClick}
      title={label}
      className="p-2.5 rounded-xl bg-white/5 text-slate-500 hover:text-white transition-all border border-transparent hover:border-white/10"
    >
      {icon}
    </button>
  );
}
