import React from 'react';
import { RotateCcw, Users, ShieldCheck, Bus, CalendarCheck, HelpCircle } from 'lucide-react';
import { clsx } from 'clsx';

type Stats = {
  total: number;
  active: number;
  transport: number;
  attendance: number;
};

type Props = {
  stats: Stats;
  filters: {
    classId: string;
  };
  classes: any[];
  setFilter: (key: string, value: string) => void;
};

export function StudentsSidebar({ stats, filters, classes, setFilter }: Props) {
  const statItems = [
    { label: 'Total Students', value: stats.total || 0, icon: Users, color: 'bg-blue-500', percent: 100 },
    { label: 'Active Status', value: `${stats.active}%`, icon: ShieldCheck, color: 'bg-emerald-500', percent: stats.active },
    { label: 'Transport Usage', value: `${stats.transport}%`, icon: Bus, color: 'bg-amber-500', percent: stats.transport },
    { label: 'Avg. Attendance', value: `${stats.attendance}%`, icon: CalendarCheck, color: 'bg-purple-500', percent: stats.attendance }
  ];

  return (
    <aside className="w-full flex-1 flex flex-col gap-8 p-6 custom-scrollbar-student overflow-y-auto">
      
      {/* 1. Insights / Stats Card */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-white/20">System Insights</h3>
          <HelpCircle size={12} className="text-white/10 cursor-help hover:text-white/30 transition-colors" />
        </div>
        
        <div className="space-y-5">
          {statItems.map((item, idx) => (
            <div key={idx} className="group cursor-default">
              <div className="flex justify-between items-end mb-1.5">
                <div className="flex items-center gap-2">
                  <item.icon size={13} className="text-white/30 group-hover:text-white/60 transition-colors" />
                  <span className="text-[11px] font-medium text-white/40 tracking-tight">{item.label}</span>
                </div>
                <span className="text-xs font-bold text-white group-hover:scale-110 origin-right transition-transform">{item.value}</span>
              </div>
              <div className="h-1 w-full bg-white/5 rounded-full overflow-hidden">
                <div 
                  className={clsx("h-full rounded-full transition-all duration-1000 ease-out", item.color)} 
                  style={{ width: `${item.percent}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </section>

      <div className="h-px w-full bg-gradient-to-r from-transparent via-white/5 to-transparent" />

      {/* 2. Class Filter Quick Action */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
            <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-white/20">Cohort Registry</h3>
            <span className="text-[10px] font-bold text-blue-500/60 uppercase tracking-widest">{classes.length} Total</span>
        </div>

        <div className="grid grid-cols-2 gap-2">
            <button 
                onClick={() => setFilter('classId', 'ALL')}
                className={clsx(
                    "h-10 rounded-xl text-[11px] font-bold transition-all border",
                    filters.classId === 'ALL' 
                    ? "bg-blue-500/10 border-blue-500/40 text-blue-400 shadow-[0_0_15px_rgba(59,111,212,0.1)]" 
                    : "bg-white/5 border-white/5 text-white/40 hover:border-white/10 hover:text-white/60"
                )}
            >
                All
            </button>
            {classes.slice(0, 11).map((c) => (
                <button 
                  key={c.classId} 
                  onClick={() => setFilter('classId', c.classId)}
                  className={clsx(
                    "h-10 rounded-xl text-[11px] font-bold transition-all border truncate px-2",
                    filters.classId === c.classId 
                    ? "bg-blue-500/10 border-blue-500/40 text-blue-400 shadow-[0_0_15px_rgba(59,111,212,0.1)]" 
                    : "bg-white/5 border-white/5 text-white/40 hover:border-white/10 hover:text-white/60"
                  )}
                  title={c.className}
                >
                    {c.className}
                </button>
            ))}
        </div>
      </section>

      {/* 3. Terminal Meta Info */}
      <section className="mt-auto pt-8">
          <div className="p-4 rounded-2xl bg-white/5 border border-white/5 space-y-2">
            <div className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-[10px] font-black uppercase tracking-widest text-white/40">Sync Status</span>
            </div>
            <p className="text-[10px] font-medium text-white/20 leading-relaxed">
                Terminal connected to regional edge. Latency: <span className="text-emerald-500/60">24ms</span>. All systems nominal.
            </p>
          </div>
      </section>

    </aside>
  );
}

function FilterGroup({ label, children, activeCount }: { label: string; children: React.ReactNode; activeCount?: number }) {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between px-1">
        <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-white/30">{label}</h4>
        {activeCount ? <span className="w-1.5 h-1.5 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(59,111,212,0.6)]" /> : null}
      </div>
      {children}
    </div>
  );
}
