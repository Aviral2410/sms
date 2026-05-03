import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  TrendingUp, TrendingDown, Users, Calendar, 
  AlertCircle, CheckCircle2, ListTodo, Layers,
  BarChart3, PieChart as PieChartIcon, LineChart as LineChartIcon,
  Clock, ArrowRight, UserCircle2, Building2,
  Sparkles, Zap, Brain, ShieldCheck, Activity
} from 'lucide-react';

// --- Premium Glassmorphic Constants ---
const GLASS_BG = "bg-white/[0.03] backdrop-blur-xl border border-white/[0.08]";
const GLASS_HOVER = "hover:bg-white/[0.06] hover:border-white/[0.15] hover:shadow-[0_0_30px_rgba(16,185,129,0.1)] transition-all duration-500";
const NEURAL_GRADIENT = "bg-gradient-to-br from-emerald-500/20 via-sky-500/10 to-transparent";

// --- Loading Skeleton ---
const SkeletonPulse: React.FC = () => (
  <div className="space-y-4 w-full h-full p-6 animate-pulse">
    <div className="h-8 bg-white/5 rounded-full w-1/3" />
    <div className="grid grid-cols-2 gap-4">
      <div className="h-32 bg-white/5 rounded-3xl" />
      <div className="h-32 bg-white/5 rounded-3xl" />
    </div>
    <div className="h-48 bg-white/5 rounded-3xl w-full" />
  </div>
);

const KpiCard: React.FC<{ title: string; value: string; subtitle?: string; color?: string; trend?: 'up' | 'down' | 'neutral' }> = ({ title, value, subtitle, color = 'emerald', trend }) => (
  <motion.div 
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    whileHover={{ y: -5, scale: 1.02 }}
    className={`${GLASS_BG} ${GLASS_HOVER} rounded-[2rem] p-6 flex flex-col justify-between relative overflow-hidden`}
  >
    <div className="absolute top-0 right-0 p-4 opacity-10">
      <Activity size={40} className={`text-${color}-400`} />
    </div>
    
    <div>
        <div className="flex items-center gap-2 mb-2">
            <div className={`w-1.5 h-1.5 rounded-full bg-${color}-500 shadow-[0_0_8px_rgba(16,185,129,0.6)]`} />
            <div className="text-[10px] font-black uppercase tracking-[0.2em] text-white/40">{title}</div>
        </div>
        <div className={`text-3xl font-black text-${color}-400 tracking-tight flex items-baseline gap-2`}>
            {value}
            {trend === 'up' && <TrendingUp size={16} className="text-emerald-400" />}
            {trend === 'down' && <TrendingDown size={16} className="text-rose-400" />}
        </div>
    </div>
    {subtitle && (
      <div className="mt-4 flex items-center gap-2 bg-white/5 w-fit px-3 py-1 rounded-full border border-white/5">
        <span className="text-[10px] font-bold text-white/30 italic">{subtitle}</span>
      </div>
    )}
  </motion.div>
);

const SmartTable: React.FC<{ title: string; columns: string[]; rows: any[] }> = ({ title, columns, rows }) => (
  <div className={`${GLASS_BG} rounded-[2rem] overflow-hidden my-6 group`}>
    <div className="px-6 py-5 border-b border-white/5 bg-white/[0.02] flex items-center justify-between">
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <Layers size={14} />
        </div>
        <h4 className="text-[12px] font-black uppercase tracking-[0.2em] text-white/70">{title}</h4>
      </div>
      <span className="text-[10px] px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 font-black border border-emerald-500/20">
        {rows.length} NEURAL RECORDS
      </span>
    </div>
    <div className="overflow-x-auto">
      <table className="w-full text-left text-xs border-collapse">
        <thead className="bg-white/[0.01] text-white/30 font-black uppercase tracking-widest text-[9px]">
          <tr>
            {columns.map(col => <th key={col} className="px-6 py-4 border-r border-white/5 last:border-0">{col}</th>)}
          </tr>
        </thead>
        <tbody className="divide-y divide-white/5">
          {rows.map((row, i) => (
            <tr key={i} className="hover:bg-white/[0.03] transition-all duration-300">
              {columns.map(col => (
                <td key={col} className="px-6 py-4">
                  <div className="text-white/80 font-medium truncate max-w-[200px]">
                    {typeof row[col] === 'object' ? JSON.stringify(row[col]) : (row[col]?.toString() || '—')}
                  </div>
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  </div>
);

import { ProfessionalBarChart, ProfessionalAreaChart, ProfessionalPieChart } from './ProfessionalCharts';
import { FormReview } from './FormReview';
import { ProfilePanel, Timeline, Kanban, Heatmap } from './AiVisuals';
import { SimulationCanvas } from './visualizers/SimulationCanvas';
import { StepLadder } from './visualizers/StepLadder';
import { FormulaCard } from './visualizers/FormulaCard';

const ComponentRegistry: Record<string, React.FC<any>> = {
  simulation_canvas: SimulationCanvas,
  step_ladder: StepLadder,
  formula_card: FormulaCard,
  kpi_card: KpiCard,
  school_dashboard: (props: { title: string; kpis: any[] }) => (
    <div className="space-y-6">
        <div className="text-[10px] font-black uppercase tracking-[0.3em] text-emerald-500/60 mb-2">{props.title || "Operations Analytics"}</div>
        <div className="grid grid-cols-2 gap-4">
            {props.kpis?.map((kpi, i) => (
                <KpiCard key={i} title={kpi.title} value={kpi.value} trend={kpi.trend?.includes('+') ? 'up' : 'down'} />
            ))}
        </div>
    </div>
  ),
  table: SmartTable,
  molecule_canvas: (props: { molecules: string[], title: string }) => (
    <div className={`${GLASS_BG} rounded-[2rem] p-8 my-4 text-center`}>
        <div className="text-[10px] font-black uppercase tracking-[0.3em] text-cyan-400/60 mb-6">{props.title}</div>
        <div className="flex justify-center gap-6">
            {props.molecules?.map((m, i) => (
                <div key={i} className="w-20 h-20 rounded-full border-2 border-cyan-500/20 flex items-center justify-center text-xl font-bold bg-cyan-500/10 text-cyan-400 shadow-[0_0_30px_rgba(34,211,238,0.2)]">
                    {m}
                </div>
            ))}
        </div>
        <div className="mt-8 h-2 bg-white/5 rounded-full overflow-hidden">
            <motion.div initial={{ width: 0 }} animate={{ width: '100%' }} className="h-full bg-cyan-500 shadow-[0_0_15px_rgba(34,211,238,1)]" />
        </div>
    </div>
  ),
  narrative_timeline: (props: { events: Array<{title: string, impact: string}> }) => (
    <div className={`${GLASS_BG} rounded-[2rem] p-8 my-4`}>
        <div className="text-[10px] font-black uppercase tracking-[0.3em] text-violet-400/60 mb-8">Story Arc Synthesis</div>
        <div className="flex justify-between relative">
             <div className="absolute top-1/2 left-0 right-0 h-[2px] bg-white/10 -translate-y-1/2" />
             {props.events?.map((e, i) => (
                 <div key={i} className="relative z-10 flex flex-col items-center gap-4">
                     <div className="w-4 h-4 rounded-full bg-violet-500 shadow-[0_0_15px_rgba(139,92,246,1)]" />
                     <div className="text-center group">
                         <div className="text-[10px] font-black text-white group-hover:text-violet-400 transition-colors uppercase tracking-tighter">{e.title}</div>
                         <div className="text-[9px] text-white/30 italic max-w-[80px]">{e.impact}</div>
                     </div>
                 </div>
             ))}
        </div>
    </div>
  ),
  checklist: (props) => (
    <div className={`${GLASS_BG} rounded-[2rem] p-6 my-4`}>
        <div className="text-[10px] font-black uppercase tracking-widest text-emerald-500/60 mb-5 pl-1">{props.title || "Action Items"}</div>
        <div className="space-y-3">
            {props.items?.map((item: any, i: number) => (
                <motion.div 
                   key={i} 
                   whileHover={{ x: 5 }}
                   className="flex items-center gap-4 bg-white/5 p-3 rounded-2xl border border-white/5 transition-colors hover:border-emerald-500/20"
                >
                    <div className="w-5 h-5 rounded-lg bg-emerald-500/20 flex items-center justify-center border border-emerald-500/30">
                        {item.checked ? <CheckCircle2 size={12} className="text-emerald-400" /> : <Clock size={12} className="text-white/20" />}
                    </div>
                    <span className="text-xs text-white/80 font-bold">{typeof item === 'string' ? item : item.label}</span>
                </motion.div>
            ))}
        </div>
    </div>
  ),
  alert_banner: (props) => (
    <motion.div 
      initial={{ scale: 0.9, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      className={`p-5 rounded-[2rem] border flex items-center gap-4 my-6 shadow-xl ${
      props.severity === 'high' ? 'bg-rose-500/10 border-rose-500/30 text-rose-200' :
      props.severity === 'medium' ? 'bg-amber-500/10 border-amber-500/30 text-amber-200' :
      'bg-emerald-500/10 border-emerald-500/30 text-emerald-200'
    }`}>
      <div className={`p-3 rounded-2xl ${props.severity === 'high' ? 'bg-rose-500/20' : 'bg-emerald-500/20'}`}>
        <ShieldCheck size={24} />
      </div>
      <div>
        <div className="text-[10px] font-black uppercase tracking-widest opacity-50 mb-1">System Intelligence Alert</div>
        <div className="text-sm font-black leading-tight tracking-tight">{props.message}</div>
      </div>
    </motion.div>
  ),
  profile_panel: ProfilePanel,
  timeline: Timeline,
  kanban: Kanban,
  chart_bar: ProfessionalBarChart,
  chart_line: ProfessionalAreaChart,
  chart_pie: ProfessionalPieChart,
  heatmap: Heatmap,
  form_prefill: FormReview,
  quiz: (props: { quiz: Array<{q: string, options: string[], correct: number}> }) => (
    <div className="space-y-6">
      {props.quiz.map((q, i) => (
        <motion.div 
          key={i}
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className={`${GLASS_BG} rounded-[2rem] p-8 border-emerald-500/20`}
        >
          <div className="text-[10px] font-black uppercase tracking-[0.3em] text-emerald-500/60 mb-4">Neural Checkpoint</div>
          <h4 className="text-xl font-black text-white mb-6 leading-tight">{q.q}</h4>
          <div className="grid gap-3">
            {q.options.map((opt, idx) => (
               <button 
                key={idx}
                onClick={() => alert(idx === q.correct ? 'Correct! Neural Sync Optimized.' : 'Incorrect. Recalibrating...')}
                className="w-full p-4 rounded-2xl bg-white/5 border border-white/10 text-left text-sm text-white/60 font-bold hover:bg-emerald-500/10 hover:border-emerald-500/30 hover:text-white transition-all flex items-center justify-between group"
               >
                 {opt}
                 <ArrowRight size={14} className="opacity-0 group-hover:opacity-100 transition-opacity" />
               </button>
            ))}
          </div>
        </motion.div>
      ))}
    </div>
  )
};

export const SmartUiRenderer: React.FC<{ response: any; isLoading?: boolean; variant?: 'default' | 'aura' }> = ({ response, isLoading, variant = 'default' }) => {
  if (isLoading) return <SkeletonPulse />;
  if (!response) return null;

  const { title, view, components, insights, actions, summary } = response;
  const isAura = variant === 'aura';
  
  const container = { 
    hidden: { opacity: 0 }, 
    show: { opacity: 1, transition: { staggerChildren: 0.1, delayChildren: 0.1 } } 
  };
  const item = { 
    hidden: { opacity: 0, y: 30, filter: 'blur(10px)' }, 
    show: { opacity: 1, y: 0, filter: 'blur(0px)', transition: { type: 'spring', stiffness: 200, damping: 20 } } 
  };

  return (
    <motion.div variants={container} initial="hidden" animate="show" className={`space-y-6 relative ${isAura ? 'aura-smart-ui' : ''}`}>
      {!isAura ? <div className={`absolute -top-20 -left-20 w-96 h-96 rounded-full ${NEURAL_GRADIENT} blur-[100px] pointer-events-none opacity-50`} /> : null}
      
      <motion.div variants={item} className={`mb-8 pb-6 relative z-10 ${isAura ? 'border-b border-white/8' : 'border-b border-white/10'}`}>
        <div className="flex items-center gap-3 mb-3">
            <div className={isAura ? 'aura-smart-ui__icon' : 'p-2 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'}>
                <Brain size={18} />
            </div>
            {title && <h3 className={isAura ? 'aura-smart-ui__title' : 'text-3xl font-black tracking-tight text-white'}>{title}</h3>}
        </div>
        {summary && (
          <div className={isAura ? 'aura-smart-ui__summary' : 'relative pl-6 border-l-2 border-emerald-500/40'}>
             <p className={isAura ? 'aura-smart-ui__summary-copy' : 'text-[15px] text-white/60 font-bold leading-relaxed'}>{summary}</p>
          </div>
        )}
      </motion.div>

      <div className={`grid gap-6 ${view === 'mixed_dashboard' ? 'grid-cols-2' : 'grid-cols-1'}`}>
        {components?.map((comp: any, i: number) => {
          const Comp = ComponentRegistry[comp.type];
          if (!Comp) return null;
          return (
            <motion.div 
              key={i} 
              variants={item} 
              className={['table','chart_bar','chart_line','chart_pie','form_prefill','profile_panel','heatmap','timeline','simulation_canvas','step_ladder','formula_card','molecule_canvas','narrative_timeline','school_dashboard'].includes(comp.type) ? 'col-span-2' : ''}
            >
              <Comp {...comp} />
            </motion.div>
          );
        })}
      </div>

      {insights && insights.length > 0 && (
        <motion.div variants={item} className={isAura ? 'aura-smart-ui__insights' : `mt-10 p-8 rounded-[2.5rem] ${GLASS_BG} relative overflow-hidden group`}>
          {!isAura ? (
            <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity">
              <Sparkles size={120} />
            </div>
          ) : null}
          
          <div className="flex items-center gap-3 mb-6">
            <Zap className={isAura ? 'text-white/55' : 'text-emerald-400 fill-emerald-400'} size={16} />
            <div className={isAura ? 'aura-smart-ui__eyebrow' : 'text-[11px] font-black uppercase tracking-[0.3em] text-emerald-400 shadow-emerald-500/50'}>Strategic Intelligence</div>
          </div>
          
          <div className="grid gap-4">
            {insights.map((insight: string, i: number) => (
              <motion.div 
                key={i} 
                whileHover={{ x: isAura ? 4 : 10 }}
                className={isAura ? 'aura-smart-ui__insight' : 'flex gap-4 text-sm text-white/70 font-bold leading-relaxed group/insight p-2 rounded-2xl transition-colors hover:bg-white/5'}
              >
                <div className={isAura ? 'aura-smart-ui__insight-dot' : 'w-1.5 h-1.5 rounded-full bg-emerald-500 mt-2 flex-shrink-0 shadow-[0_0_12px_rgba(16,185,129,1)] group-hover/insight:scale-150 transition-transform'} />
                {insight}
              </motion.div>
            ))}
          </div>
        </motion.div>
      )}

      {actions && actions.length > 0 && (
        <motion.div variants={item} className={isAura ? 'aura-smart-ui__actions' : 'mt-10 flex flex-wrap gap-4'}>
          {actions.map((btn: any, j: number) => (
            <button key={j} className={isAura ? 'aura-smart-ui__action' : 'px-8 py-4 rounded-full bg-emerald-500 text-black text-[13px] font-black uppercase tracking-widest hover:bg-emerald-400 hover:scale-105 active:scale-95 transition-all flex items-center gap-3 shadow-[0_20px_50px_rgba(16,185,129,0.3)] group'}>
              {btn.label}
              <ArrowRight size={16} className="group-hover:translate-x-2 transition-transform" />
            </button>
          ))}
        </motion.div>
      )}
    </motion.div>
  );
};
