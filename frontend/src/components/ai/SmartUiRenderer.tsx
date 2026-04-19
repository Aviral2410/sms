import React from 'react';
import { motion } from 'framer-motion';
import { 
  TrendingUp, TrendingDown, Users, Calendar, 
  AlertCircle, CheckCircle2, ListTodo, Layers,
  BarChart3, PieChart as PieChartIcon, LineChart as LineChartIcon,
  Clock, ArrowRight, UserCircle2, Building2
} from 'lucide-react';

// --- Sub-Components ---

const KpiCard: React.FC<{ title: string; value: string; subtitle?: string; color?: string }> = ({ title, value, subtitle, color = 'emerald' }) => (
  <motion.div 
    initial={{ opacity: 0, scale: 0.95 }}
    animate={{ opacity: 1, scale: 1 }}
    className="bg-white/5 border border-white/10 rounded-2xl p-4 flex flex-col justify-between"
  >
    <div className="text-[10px] font-bold uppercase tracking-widest text-white/40 mb-2">{title}</div>
    <div className={`text-2xl font-black text-${color}-400 mb-1`}>{value}</div>
    {subtitle && <div className="text-[11px] font-medium text-white/30">{subtitle}</div>}
  </motion.div>
);

const SmartTable: React.FC<{ title: string; columns: string[]; rows: any[] }> = ({ title, columns, rows }) => (
  <div className="bg-black/40 border border-white/10 rounded-2xl overflow-hidden my-4">
    <div className="px-4 py-3 border-b border-white/5 bg-white/5 flex items-center justify-between">
      <h4 className="text-[11px] font-black uppercase tracking-widest text-white/60">{title}</h4>
      <span className="text-[8px] px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 font-bold">{rows.length} Records</span>
    </div>
    <div className="overflow-x-auto">
      <table className="w-full text-left text-xs">
        <thead className="bg-white/[0.02] text-white/30 font-bold uppercase tracking-wider text-[10px]">
          <tr>
            {columns.map(col => <th key={col} className="px-4 py-2 border-r border-white/5 last:border-0">{col}</th>)}
          </tr>
        </thead>
        <tbody className="divide-y divide-white/5">
          {rows.map((row, i) => (
            <tr key={i} className="hover:bg-white/[0.02] transition-colors">
              {columns.map(col => (
                <td key={col} className="px-4 py-2 text-white/70">
                  {typeof row[col] === 'object' ? JSON.stringify(row[col]) : (row[col]?.toString() || '—')}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  </div>
);

const Checklist: React.FC<{ title: string; items: any[] }> = ({ title, items }) => (
  <div className="space-y-2 my-4">
    <div className="text-[10px] font-bold uppercase tracking-widest text-white/30 px-1">{title}</div>
    <div className="bg-white/5 border border-white/10 rounded-2xl p-3 space-y-2">
      {items.map((item, i) => (
        <div key={i} className="flex items-start gap-2 group">
          <div className="mt-0.5 flex-shrink-0">
            {typeof item === 'string' || item.checked ? (
               <CheckCircle2 size={14} className="text-emerald-500" />
            ) : (
               <div className="w-3.5 h-3.5 rounded border border-white/20" />
            )}
          </div>
          <span className="text-xs text-white/70 font-medium">{typeof item === 'string' ? item : item.label}</span>
        </div>
      ))}
    </div>
  </div>
);

const AlertBanner: React.FC<{ message: string; severity: string }> = ({ message, severity }) => (
  <div className={`p-4 rounded-xl border flex items-start gap-3 my-4 ${
    severity === 'high' ? 'bg-rose-500/10 border-rose-500/30 text-rose-200' :
    severity === 'medium' ? 'bg-amber-500/10 border-amber-500/30 text-amber-200' :
    'bg-sky-500/10 border-sky-500/30 text-sky-200'
  }`}>
    <AlertCircle size={18} className="mt-0.5 flex-shrink-0" />
    <div className="text-xs font-semibold leading-relaxed">{message}</div>
  </div>
);

import { ProfessionalBarChart, ProfessionalAreaChart, ProfessionalPieChart } from './ProfessionalCharts';
import { FormReview } from './FormReview';
import { ProfilePanel, Timeline, Kanban, Heatmap } from './AiVisuals';
// Duplicate ArrowRight import removed

// --- Components Registry ---

const ComponentRegistry: Record<string, React.FC<any>> = {
  kpi_card: KpiCard,
  table: SmartTable,
  checklist: Checklist,
  alert_banner: AlertBanner,
  profile_panel: ProfilePanel,
  timeline: Timeline,
  kanban: Kanban,
  chart_bar: ProfessionalBarChart,
  chart_line: ProfessionalAreaChart,
  chart_pie: ProfessionalPieChart,
  heatmap: Heatmap,
  form_prefill: FormReview
};

export const SmartUiRenderer: React.FC<{ response: any }> = ({ response }) => {
  if (!response) return null;

  const { title, view, components, insights, actions, summary } = response;

  // Progressive rendering logic for streaming feel
  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.15,
        delayChildren: 0.2
      }
    }
  };

  const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 300, damping: 24 } }
  };

  return (
    <motion.div 
      variants={container}
      initial="hidden"
      animate="show"
      className="space-y-4"
    >
      {/* Header & Summary */}
      <motion.div variants={item} className="mb-6 border-b border-white/5 pb-4">
        {title && <h3 className="text-xl font-black tracking-tight text-white mb-2">{title}</h3>}
        {summary && <p className="text-sm text-emerald-50/60 font-medium leading-relaxed">{summary}</p>}
      </motion.div>

      {/* Grid for Components */}
      <div className={`grid gap-4 ${view === 'mixed_dashboard' ? 'grid-cols-2' : 'grid-cols-1'}`}>
        {components?.map((comp: any, i: number) => {
          const Comp = ComponentRegistry[comp.type];
          if (!Comp) return <div key={i} className="text-[10px] text-white/20">Knowledge Layer Syncing...</div>;
          
          return (
            <motion.div 
              key={i} 
              variants={item}
              className={comp.type === 'table' || comp.type === 'chart_bar' || comp.type === 'chart_line' || comp.type === 'form_prefill' || comp.type === 'profile_panel' ? 'col-span-2' : ''}
            >
              <Comp {...comp} />
            </motion.div>
          );
        })}
      </div>

      {/* Insights */}
      {insights && insights.length > 0 && (
        <motion.div variants={item} className="mt-6 pt-4 border-t border-white/5">
          <div className="text-[10px] font-black uppercase tracking-widest text-emerald-400/60 mb-3">Expert Insights</div>
          <div className="space-y-3">
            {insights.map((insight: string, i: number) => (
              <div key={i} className="flex gap-3 text-xs text-white/70 font-medium">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-1.5 flex-shrink-0 shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
                {insight}
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Suggested Actions */}
      {actions && actions.length > 0 && (
        <motion.div variants={item} className="mt-8 flex flex-wrap gap-2">
          {actions.map((btn: any, j: number) => (
            <button 
              key={j}
              className="px-4 py-2.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[11px] font-black uppercase tracking-wider hover:bg-emerald-500/20 transition-all flex items-center gap-2 group"
            >
              {btn.label}
              <ArrowRight size={12} className="group-hover:translate-x-1 transition-transform" />
            </button>
          ))}
        </motion.div>
      )}
    </motion.div>
  );
};
