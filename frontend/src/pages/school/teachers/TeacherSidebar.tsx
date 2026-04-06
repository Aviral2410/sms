import React from 'react';
import { UserPlus, Sparkles, ChevronRight, Zap, Users } from 'lucide-react';

type Props = {
  teacherCount: number;
  activeLoad: string;
  onboardingForm: {
    fullName: string;
    email: string;
    accessKey: string;
  };
  setForm: (form: any) => void;
  onSubmit: (e: React.FormEvent) => void;
  filterText: string;
  setFilterText: (text: string) => void;
};

export function TeacherSidebar({ 
  teacherCount, 
  activeLoad, 
  onboardingForm, 
  setForm, 
  onSubmit,
  filterText,
  setFilterText
}: Props) {
  return (
    <aside className="h-[calc(100vh-120px)] min-w-[280px] flex flex-col gap-4 sticky top-8 animate-in slide-in-from-left duration-700">
      
      {/* Overview Module */}
      <div className="space-glass p-1 rounded-[24px] border-white/10 shadow-2xl shrink-0">
        <div className="bg-slate-900/40 p-4 rounded-[23px]">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-[9px] font-black uppercase tracking-[0.2em] text-white/50 group-hover:text-violet-400 transition-colors">Faculty Hub</h3>
            <div className="w-1.5 h-1.5 rounded-full bg-violet-400 animate-pulse shadow-[0_0_8px_rgba(167,139,250,0.8)]" />
          </div>
          
          <div className="grid grid-cols-1 gap-2">
            <StatRow label="Total Faculty" value={teacherCount} />
            <StatRow label="Active Load" value={activeLoad} />
            <StatRow label="Research %" value="45%" />
            <StatRow label="Retention" value="98%" />
          </div>
        </div>
      </div>

      {/* Onboarding Terminal */}
      <div className="space-glass flex-1 flex flex-col p-4 rounded-[24px] border-white/10 overflow-hidden relative group">
        <div className="absolute inset-0 bg-gradient-to-br from-violet-500/5 to-transparent opacity-50 transition-opacity group-hover:opacity-100" />
        
        <div className="relative space-y-6 flex flex-col h-full">
          <div className="flex items-center gap-3">
             <div className="p-2 rounded-xl bg-violet-500/10 text-violet-400">
                <UserPlus size={14} />
             </div>
             <div>
                <h3 className="text-[9px] font-black uppercase tracking-[0.2em] text-white">Onboarding</h3>
                <span className="text-[8px] font-black text-slate-600 uppercase tracking-widest leading-tight block">Initialize Faculty</span>
             </div>
          </div>
          
          <form onSubmit={onSubmit} className="flex-1 space-y-4 overflow-y-auto pr-1 custom-scrollbar-space">
             <div className="space-y-3">
               <InputGroup 
                 label="Identification" 
                 value={onboardingForm.fullName} 
                 onChange={(v) => setForm({ ...onboardingForm, fullName: v })}
                 placeholder="Academic Name..."
               />
               <InputGroup 
                 label="Neural Link" 
                 type="email"
                 value={onboardingForm.email} 
                 onChange={(v) => setForm({ ...onboardingForm, email: v })}
                 placeholder="name@edu.nebula"
               />
               <div className="p-3 rounded-xl bg-white/[0.02] border border-white/5 space-y-1">
                  <div className="flex items-center gap-2 text-[8px] font-black text-slate-500 uppercase tracking-widest">
                    <Sparkles size={8} className="text-amber-500" />
                    Auto-Config
                  </div>
                  <p className="text-[8px] text-slate-600 leading-tight italic">
                    Authentication protocols dispatched upon registry confirmation.
                  </p>
               </div>
             </div>

             <button 
               type="submit"
               className="w-full py-3 rounded-xl bg-violet-600 text-white text-[9px] font-black uppercase tracking-[0.3em] shadow-[0_0_20px_rgba(139,92,246,0.15)] hover:bg-violet-500 hover:-translate-y-0.5 active:translate-y-0 transition-all flex items-center justify-center gap-2 group/btn"
             >
                Register
                <ChevronRight size={12} className="group-hover/btn:translate-x-1 transition-transform" />
             </button>
          </form>

          <div className="pt-4 border-t border-white/5 flex items-center gap-3 text-slate-700">
             <Zap size={12} />
             <span className="text-[8px] font-black uppercase tracking-[0.2em]">Protocol Secured</span>
          </div>
        </div>
      </div>
    </aside>
  );
}

function StatRow({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="flex items-center justify-between py-1 border-b border-white/[0.03] last:border-0">
      <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">{label}</span>
      <span className="text-[9px] font-black text-white italic">{value}</span>
    </div>
  );
}

function InputGroup({ label, value, onChange, placeholder, type = 'text' }: { label: string; value: string; onChange: (v: string) => void; placeholder: string, type?: string }) {
  return (
    <div className="space-y-1.5">
      <label className="text-[8px] font-black text-slate-600 uppercase tracking-widest pl-1">{label}</label>
      <input 
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full bg-slate-900/40 border border-white/5 rounded-xl px-4 py-3 text-[10px] text-white placeholder:text-slate-800 outline-none focus:border-violet-500/50 focus:ring-1 focus:ring-violet-500/10 transition-all font-bold"
      />
    </div>
  );
}
