import React from 'react';
import { motion } from 'framer-motion';
import { 
  Lightbulb, 
  AlertCircle, 
  Code, 
  Info,
  Sparkles
} from 'lucide-react';
import { VisualizeResponse } from '../../lib/api';
import { MermaidDiagram } from './MermaidDiagram';
import {
  CartesianGrid,
  Line,
  LineChart as RechartsLineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

interface LearningVisualizerPanelProps {
  data: VisualizeResponse | null;
  loading: boolean;
  error: string | null;
}

export const LearningVisualizerPanel: React.FC<LearningVisualizerPanelProps> = ({ 
  data, 
  loading, 
  error 
}) => {
  if (loading) {
    return (
      <div className="admin-management-empty-state" style={{ minHeight: 520 }}>
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
        >
          <Sparkles className="w-12 h-12" style={{ color: 'rgba(252, 211, 77, 0.75)' }} />
        </motion.div>
        <h3>Generating</h3>
        <p>Creating a clear, step-by-step breakdown.</p>
      </div>
    );
  }

  if (error) {
    return (
      <div
        className="admin-management-empty-state"
        style={{
          minHeight: 520,
          border: '1px solid rgba(248, 113, 113, 0.22)',
          borderRadius: 22,
          background: 'rgba(248, 113, 113, 0.06)',
        }}
      >
        <AlertCircle className="w-12 h-12" style={{ color: 'rgba(252, 165, 165, 0.9)' }} />
        <h3>Unable to generate</h3>
        <p>{error}</p>
      </div>
    );
  }

  if (!data) {
    return (
      <div
        className="admin-management-empty-state"
        style={{
          minHeight: 520,
          border: '1px dashed rgba(148, 163, 184, 0.28)',
          borderRadius: 22,
          background: 'rgba(3, 7, 18, 0.18)',
        }}
      >
        <Lightbulb className="w-14 h-14" style={{ color: 'rgba(148, 163, 184, 0.55)' }} />
        <h3>Ready when you are</h3>
        <p>Enter a question on the left to get a step-by-step interactive breakdown.</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <header className="space-y-2">
        <div className="flex items-center gap-3">
          <h2 className="text-2xl font-black text-white tracking-tight">{data.title}</h2>
          {data.generationMode === 'LOCAL' && (
            <span className="px-2 py-0.5 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-[10px] font-black text-cyan-300 uppercase tracking-widest">
              Guided Mode
            </span>
          )}
          {data.llmEnhanced && (
            <span className="px-2 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/20 text-[10px] font-black text-amber-400 uppercase tracking-widest">
              AI Enhanced
            </span>
          )}
        </div>
        <p className="text-slate-400 leading-relaxed text-sm">{data.summary}</p>
        <div className="flex flex-wrap gap-2 pt-2">
          {data.tags.map(tag => (
            <span key={tag} className="px-2.5 py-1 rounded-lg bg-slate-800/50 text-[11px] font-bold text-slate-400 border border-slate-700/50">
              #{tag}
            </span>
          ))}
        </div>
      </header>

      {data.chart && (
        <section className="space-y-4">
          <div className="flex items-center gap-2 text-cyan-300">
            <Sparkles className="w-4 h-4" />
            <h3 className="font-black uppercase tracking-widest text-[10px]">Quick Preview</h3>
          </div>
          <div className="rounded-[2rem] border border-white/[0.06] bg-white/[0.02] p-5">
            <div className="mb-4">
              <h4 className="text-sm font-black text-white">{data.chart.title}</h4>
              {data.chart.subtitle ? <p className="mt-1 text-xs text-slate-400">{data.chart.subtitle}</p> : null}
            </div>
            <div style={{ width: '100%', height: 280 }}>
              <ResponsiveContainer>
                <RechartsLineChart data={data.chart.data}>
                  <CartesianGrid stroke="rgba(148,163,184,0.14)" strokeDasharray="3 3" />
                  <XAxis dataKey="label" stroke="#94a3b8" tick={{ fontSize: 12 }} tickLine={false} axisLine={false} />
                  <YAxis stroke="#94a3b8" tick={{ fontSize: 12 }} tickLine={false} axisLine={false} />
                  <Tooltip
                    contentStyle={{
                      background: '#0f172a',
                      border: '1px solid rgba(99,102,241,0.18)',
                      borderRadius: 16,
                      color: '#e2e8f0',
                    }}
                  />
                  <Line
                    type="monotone"
                    dataKey="y"
                    stroke="#38bdf8"
                    strokeWidth={3}
                    dot={{ r: 3, strokeWidth: 0, fill: '#f8fafc' }}
                    activeDot={{ r: 5, strokeWidth: 0, fill: '#fbbf24' }}
                  />
                </RechartsLineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </section>
      )}

      {data.diagramDefinition && (
        <section className="space-y-4">
          <div className="flex items-center gap-2 text-amber-400">
            <Sparkles className="w-4 h-4" />
            <h3 className="font-black uppercase tracking-widest text-[10px]">Visual Concept Map</h3>
          </div>
          <MermaidDiagram definition={data.diagramDefinition} />
        </section>
      )}

      <div className="relative space-y-6">
        <div className="absolute left-6 top-8 bottom-8 w-px bg-gradient-to-b from-amber-500/50 via-amber-500/20 to-transparent" />
        
        {data.steps.map((step, idx) => (
          <motion.div
            key={step.stepNumber}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: idx * 0.1 }}
            className="relative pl-14 group"
          >
            <div className="absolute left-0 w-12 h-12 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-center text-xl shadow-xl group-hover:border-amber-500/50 transition-colors z-10">
              {step.icon || (idx + 1)}
            </div>
            
            <div className="p-6 rounded-3xl bg-white/[0.02] border border-white/[0.05] hover:bg-white/[0.04] transition-colors space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-black text-slate-200 uppercase tracking-wider">
                  Step {step.stepNumber}: {step.heading}
                </h4>
              </div>
              <p className="text-slate-400 text-sm leading-relaxed">
                {step.explanation}
              </p>
              
              {step.visual && (
                <div className="mt-4 p-4 rounded-xl bg-black/40 font-mono text-xs text-amber-200/80 border border-amber-500/10 overflow-x-auto">
                  <pre className="whitespace-pre-wrap">{step.visual}</pre>
                </div>
              )}
              
              {step.tip && (
                <div className="mt-3 flex items-start gap-2 p-3 rounded-xl bg-amber-500/5 border border-amber-500/10">
                  <Info className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                  <p className="text-[12px] text-amber-200/70 italic">Pro Tip: {step.tip}</p>
                </div>
              )}
            </div>
          </motion.div>
        ))}
      </div>

      {data.approaches.length > 0 && (
        <section className="space-y-4 pt-4 border-t border-slate-800/50">
          <div className="flex items-center gap-2 text-slate-300">
            <Code className="w-5 h-5 text-indigo-400" />
            <h3 className="font-black uppercase tracking-widest text-xs">Alternative Approaches</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {data.approaches.map((approach, i) => (
              <div key={i} className="p-4 rounded-2xl bg-indigo-500/5 border border-indigo-500/10 hover:border-indigo-500/30 transition-all cursor-default">
                <p className="text-xs text-indigo-200 font-medium leading-relaxed">{approach}</p>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
};
