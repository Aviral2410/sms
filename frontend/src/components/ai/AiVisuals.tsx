import React from 'react';
import { motion } from 'framer-motion';
import { 
  Building2, GraduationCap, Calendar, 
  MapPin, Phone, Mail, Clock, 
  CheckCircle2, Circle, AlertTriangle
} from 'lucide-react';

// --- Profile Panel (For Students/Teachers/Staff) ---
export const ProfilePanel: React.FC<{ name: string; meta: any; stats: any[] }> = ({ name, meta, stats }) => (
  <div className="bg-white/5 border border-white/10 rounded-2xl p-6 flex items-start gap-6">
    <div className="w-20 h-20 rounded-2xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-3xl font-black text-emerald-400">
      {name.charAt(0)}
    </div>
    <div className="flex-1">
      <h3 className="text-xl font-black text-white mb-1">{name}</h3>
      <div className="flex flex-wrap gap-x-4 gap-y-1 mb-4 text-[11px] font-bold uppercase tracking-wider text-white/40">
        {meta.class && <span className="flex items-center gap-1"><Building2 size={12}/> {meta.class}</span>}
        {meta.roll && <span className="flex items-center gap-1"><GraduationCap size={12}/> ROLL: {meta.roll}</span>}
        {meta.id && <span className="flex items-center gap-1"><Clock size={12}/> ID: {meta.id}</span>}
      </div>
      <div className="grid grid-cols-2 gap-3">
        {stats.map((stat, i) => (
          <div key={i} className="bg-black/20 rounded-xl p-3 border border-white/5">
            <div className="text-[9px] uppercase font-black text-white/30 mb-1">{stat.label}</div>
            <div className="text-sm font-bold text-emerald-50">{stat.value}</div>
          </div>
        ))}
      </div>
    </div>
  </div>
);

// --- Timeline (For Planning/Academic Cycles) ---
export const Timeline: React.FC<{ items: any[] }> = ({ items }) => (
  <div className="space-y-4 my-6">
    {items.map((item, i) => (
      <div key={i} className="flex gap-4 group">
        <div className="flex flex-col items-center">
          <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
          {i !== items.length - 1 && <div className="w-0.5 flex-1 bg-white/10 group-hover:bg-emerald-500/30 transition-colors my-1" />}
        </div>
        <div className="pb-6">
          <div className="text-[10px] font-black text-emerald-500/70 uppercase tracking-widest mb-1">{item.date}</div>
          <div className="text-xs font-bold text-white mb-1">{item.title}</div>
          <p className="text-[11px] text-white/40 leading-relaxed max-w-sm">{item.description}</p>
        </div>
      </div>
    ))}
  </div>
);

// --- Kanban (For Tasks/Workflows) ---
export const Kanban: React.FC<{ columns: any[] }> = ({ columns }) => (
  <div className="flex gap-4 overflow-x-auto pb-4 custom-scrollbar">
    {columns.map((col, i) => (
      <div key={i} className="min-w-[200px] flex-1">
        <div className="text-[10px] font-black uppercase tracking-widest text-white/30 mb-3 px-1 flex justify-between">
          {col.title}
          <span>{col.items.length}</span>
        </div>
        <div className="space-y-2">
          {col.items.map((item: any, j: number) => (
            <div key={j} className="bg-white/5 border border-white/10 rounded-xl p-3 hover:border-emerald-500/30 transition-colors">
              <div className="text-xs font-bold text-white mb-2">{item.title}</div>
              {item.meta && <div className="text-[9px] font-black text-white/20 uppercase">{item.meta}</div>}
            </div>
          ))}
        </div>
      </div>
    ))}
  </div>
);

// --- CSS Bar Chart (Elite Visualization) ---
export const BarChart: React.FC<{ title: string; labels: string[]; series: number[] }> = ({ title, labels, series }) => {
  const max = Math.max(...series, 1);
  return (
    <div className="bg-black/40 border border-white/10 rounded-2xl p-4 my-4">
      <div className="text-[10px] font-black uppercase tracking-widest text-white/40 mb-6">{title}</div>
      <div className="flex items-end gap-2 h-32">
        {series.map((val, i) => (
          <div key={i} className="flex-1 flex flex-col items-center gap-2 group">
            <div className="relative w-full">
              <motion.div 
                initial={{ height: 0 }}
                animate={{ height: `${(val / max) * 100}%` }}
                className="w-full bg-emerald-500/20 group-hover:bg-emerald-500/40 border-t border-emerald-500/50 rounded-t shadow-[inset_0_1px_0_rgba(255,255,255,0.1)] transition-colors"
                title={`${labels[i]}: ${val}`}
              />
              <div className="absolute -top-6 left-0 right-0 text-[9px] font-black text-emerald-400 text-center opacity-0 group-hover:opacity-100 transition-opacity">
                {val}
              </div>
            </div>
          </div>
        ))}
      </div>
      <div className="flex justify-between mt-3 px-1">
        {labels.map((l, i) => (
          <div key={i} className="text-[8px] font-bold text-white/20 uppercase tracking-tighter truncate w-8 text-center" title={l}>
            {l.substring(0, 3)}
          </div>
        ))}
      </div>
    </div>
  );
};
