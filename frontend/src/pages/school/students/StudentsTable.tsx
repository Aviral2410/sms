import React from 'react';
import { Edit2, Trash2, Bus, GraduationCap, Mail, MoreVertical, LayoutGrid, Check } from 'lucide-react';
import type { StudentRowResponse, TransportRouteFull } from '../../../lib/api';
import { clsx } from 'clsx';

type Props = {
  rows: StudentRowResponse[];
  loading: boolean;
  routes: TransportRouteFull[];
  onView: (row: StudentRowResponse) => void;
  onEdit: (row: StudentRowResponse) => void;
  onDelete: (row: StudentRowResponse) => void;
  onAssignTransport: (row: StudentRowResponse, routeId: string, stopId: string) => void;
  selectedId?: string;
};

export function StudentsTable({ 
  rows, 
  loading, 
  routes,
  onView, 
  onEdit, 
  onDelete, 
  onAssignTransport,
  selectedId 
}: Props) {
  if (loading) {
    return (
      <div className="student-glass-card h-[500px] flex flex-col items-center justify-center gap-6">
        <div className="relative">
          <div className="w-16 h-16 border-4 border-blue-500/10 border-t-blue-500 rounded-full animate-spin shadow-[0_0_20px_rgba(59,111,212,0.2)]" />
          <div className="absolute inset-0 bg-blue-400/5 blur-xl rounded-full" />
        </div>
        <div className="text-center space-y-2">
          <span className="block text-[10px] font-black uppercase tracking-[0.4em] text-blue-400">Synchronizing Data</span>
          <span className="block text-[9px] font-bold text-slate-500 uppercase tracking-widest text-white/40">Accessing Records...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="student-glass-card overflow-hidden">
      <div className="overflow-x-auto custom-scrollbar-student">
        <table className="w-full text-left border-collapse min-w-[1000px]">
          <thead className="bg-[#0A0E1A]/40 border-b border-white/5">
            <tr>
              <th className="py-5 px-6 w-12">
                <div className="w-5 h-5 flex items-center justify-center rounded border border-white/10 bg-white/5">
                    <LayoutGrid size={12} className="text-white/20" />
                </div>
              </th>
              <th className="py-5 px-4 text-[11px] font-bold uppercase tracking-wider text-white/40">Name</th>
              <th className="py-5 px-4 text-[11px] font-bold uppercase tracking-wider text-white/40">Admission No</th>
              <th className="py-5 px-4 text-[11px] font-bold uppercase tracking-wider text-white/40">Class / Section</th>
              <th className="py-5 px-4 text-[11px] font-bold uppercase tracking-wider text-white/40">Roll No</th>
              <th className="py-5 px-4 text-[11px] font-bold uppercase tracking-wider text-white/40">Class Teacher</th>
              <th className="py-5 px-6 text-[11px] font-bold uppercase tracking-wider text-white/40 text-right">
                 <MoreVertical size={14} className="ml-auto opacity-20" />
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/[0.03]">
            {rows.map((row) => (
              <tr 
                key={row.studentUserId}
                onClick={() => onView(row)}
                className={clsx(
                  "group transition-all duration-200 cursor-pointer hover:bg-white/[0.04]",
                  row.studentUserId === selectedId ? "bg-blue-500/10" : "bg-transparent"
                )}
              >
                <td className="py-4 px-6" onClick={(e) => e.stopPropagation()}>
                    <div className={clsx(
                        "w-5 h-5 rounded border flex items-center justify-center transition-all",
                        row.studentUserId === selectedId ? "bg-blue-500 border-blue-500" : "border-white/10 bg-white/5"
                    )}>
                        {row.studentUserId === selectedId && <Check size={12} className="text-white" />}
                    </div>
                </td>
                <td className="py-4 px-4 text-sm font-medium">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-gradient-to-br from-slate-800 to-slate-900 border border-white/10 flex items-center justify-center text-blue-400 font-bold shadow-lg overflow-hidden">
                       <span className="text-xs">{row.fullName.charAt(0)}</span>
                    </div>
                    <div className="flex flex-col">
                        <span className="text-white/90 font-semibold">{row.fullName}</span>
                        <div className="flex items-center gap-1.5 opacity-40 text-[10px]">
                            {row.transportStatus === 'ASSIGNED' ? <Bus size={10} className="text-amber-400" /> : <GraduationCap size={10} />}
                            <span>{row.email}</span>
                        </div>
                    </div>
                  </div>
                </td>
                <td className="py-4 px-4">
                  <span className="text-xs font-mono text-white/60">{row.admissionNo}</span>
                </td>
                <td className="py-4 px-4">
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-white/80">{row.className}</span>
                    <span className="h-1 w-1 rounded-full bg-white/20" />
                    <span className="text-xs text-white/40">{row.sectionName}</span>
                  </div>
                </td>
                <td className="py-4 px-4">
                  <span className="text-xs font-semibold text-blue-400/80">{row.rollNo ? String(row.rollNo).padStart(2, '0') : '--'}</span>
                </td>
                <td className="py-4 px-4">
                  <div className="flex items-center gap-3">
                    <div className="w-7 h-7 rounded-full bg-slate-900/80 border border-white/5 flex items-center justify-center text-[10px] text-purple-400 font-bold overflow-hidden">
                      {row.classTeacherName?.charAt(0) || '?'}
                    </div>
                    <span className="text-[12px] font-medium text-white/60">{row.classTeacherName || 'Unassigned'}</span>
                  </div>
                </td>
                <td className="py-4 px-6 text-right" onClick={(e) => e.stopPropagation()}>
                  <div className="flex items-center justify-end gap-1.5 opacity-0 group-hover:opacity-100 transition-all duration-300">
                    <button 
                      onClick={() => onEdit(row)}
                      className="p-2 rounded-lg bg-white/5 text-white/40 hover:text-white hover:bg-white/10 border border-white/5"
                    >
                      <Edit2 size={14} />
                    </button>
                    <button 
                      onClick={() => onDelete(row)}
                      className="p-2 rounded-lg bg-white/5 text-white/40 hover:text-red-400 hover:bg-red-500/10 border border-white/5"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr>
                <td colSpan={7} className="py-32 text-center">
                   <div className="text-xs font-bold uppercase tracking-widest text-white/20 animate-pulse">No Student Units Detected</div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
