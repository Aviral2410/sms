import React, { useEffect, useMemo, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { AlertCircle, Code, Info, Lightbulb, Sparkles } from 'lucide-react';
import { VisualizeResponse } from '../../lib/api';
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

type UiStep = {
  key: number;
  title: string;
  description: string;
  highlight?: string;
  visual?: string;
};

export const LearningVisualizerPanel: React.FC<LearningVisualizerPanelProps> = ({ data, loading, error }) => {
  const tutor = (data as any)?.tutorResponse;

  const summaryText =
    typeof tutor?.explanation?.summary === 'string' && tutor.explanation.summary.trim()
      ? (tutor.explanation.summary as string)
      : data?.summary ?? '';

  const steps = useMemo<UiStep[]>(() => {
    const tutorSteps = tutor?.visualization?.steps;
    if (Array.isArray(tutorSteps) && tutorSteps.length) {
      return tutorSteps
        .filter((s: any) => s && (typeof s.title === 'string' || typeof s.description === 'string'))
        .map((s: any, idx: number) => ({
          key: typeof s.step === 'number' ? s.step : idx + 1,
          title: typeof s.title === 'string' && s.title.trim() ? (s.title as string) : `Step ${idx + 1}`,
          description: typeof s.description === 'string' ? (s.description as string) : '',
          highlight: typeof s.highlight === 'string' ? (s.highlight as string) : '',
        }));
    }

    const legacySteps = data?.steps ?? [];
    return legacySteps.map((s: any, idx: number) => ({
      key: typeof s.stepNumber === 'number' ? s.stepNumber : idx + 1,
      title: typeof s.heading === 'string' && s.heading.trim() ? (s.heading as string) : `Step ${idx + 1}`,
      description: typeof s.explanation === 'string' ? (s.explanation as string) : '',
      highlight: typeof s.tip === 'string' ? (s.tip as string) : '',
      visual: typeof s.visual === 'string' ? (s.visual as string) : '',
    }));
  }, [data, tutor]);

  const examples = useMemo(() => {
    const fromTutor = tutor?.visualization?.data?.realWorldExamples;
    if (Array.isArray(fromTutor) && fromTutor.length) return fromTutor;
    const fromStructured = (data as any)?.structuredVisualization?.realWorldExamples;
    if (Array.isArray(fromStructured) && fromStructured.length) return fromStructured;
    return [];
  }, [data, tutor]);

  const [activeStep, setActiveStep] = useState(0);
  const stepRefs = useRef<Array<HTMLDivElement | null>>([]);

  useEffect(() => {
    setActiveStep(0);
    stepRefs.current = [];
  }, [data?.title]);

  useEffect(() => {
    const el = stepRefs.current[activeStep];
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }, [activeStep]);

  if (loading) {
    return (
      <div className="admin-management-empty-state" style={{ minHeight: 520 }}>
        <motion.div animate={{ rotate: 360 }} transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}>
          <Sparkles className="w-12 h-12" style={{ color: 'rgba(252, 211, 77, 0.75)' }} />
        </motion.div>
        <h3>Generating</h3>
        <p>Creating a clear explanation and visuals.</p>
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
        <h3>Ask a learning question</h3>
        <p>Enter a question below and the tutor will respond with visuals and examples.</p>
      </div>
    );
  }

  const safeActiveIndex = Math.min(activeStep, Math.max(0, steps.length - 1));
  const active = steps[safeActiveIndex];

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
        <p className="text-slate-400 leading-relaxed text-sm">{summaryText}</p>
        <div className="flex flex-wrap gap-2 pt-2">
          {data.tags?.map((tag) => (
            <span
              key={tag}
              className="px-2.5 py-1 rounded-lg bg-slate-800/50 text-[11px] font-bold text-slate-400 border border-slate-700/50"
            >
              #{tag}
            </span>
          ))}
        </div>
      </header>

      {data.chart && (
        <motion.section
          className="space-y-4"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35 }}
        >
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
                    isAnimationActive
                    animationDuration={750}
                  />
                </RechartsLineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </motion.section>
      )}

      {steps.length > 0 && (
        <section className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-[1.5rem] border border-white/[0.06] bg-white/[0.02] px-4 py-3">
            <div className="flex items-center gap-2 text-slate-200">
              <Sparkles className="h-4 w-4 text-amber-400" />
              <div className="text-xs font-black uppercase tracking-widest text-slate-300">Key steps</div>
              <div className="text-xs text-slate-400">({safeActiveIndex + 1}/{steps.length})</div>
            </div>
            <div className="flex flex-wrap gap-2">
              {steps.map((step, idx) => (
                <button
                  key={`chip-${step.key}`}
                  type="button"
                  onClick={() => setActiveStep(idx)}
                  className={
                    idx === safeActiveIndex
                      ? 'rounded-2xl border border-indigo-400/40 bg-indigo-500/15 px-3 py-2 text-xs font-black text-indigo-100'
                      : 'rounded-2xl border border-white/[0.08] bg-white/[0.03] px-3 py-2 text-xs font-black text-slate-200 hover:bg-white/[0.06]'
                  }
                >
                  {step.title}
                </button>
              ))}
            </div>
          </div>

          {active && (
            <div className="rounded-[2rem] border border-white/[0.06] bg-white/[0.02] p-6">
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Step {active.key}</p>
              <h4 className="mt-2 text-lg font-black text-white">{active.title}</h4>
              <p className="mt-2 text-sm text-slate-300 leading-relaxed">{active.description}</p>

              {active.visual ? (
                <div className="mt-4 p-4 rounded-xl bg-black/40 font-mono text-xs text-amber-200/80 border border-amber-500/10 overflow-x-auto">
                  <pre className="whitespace-pre-wrap">{active.visual}</pre>
                </div>
              ) : null}

              {active.highlight ? (
                <div className="mt-4 flex items-start gap-2 p-3 rounded-xl bg-amber-500/5 border border-amber-500/10">
                  <Info className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                  <p className="text-[12px] text-amber-200/70 italic">{active.highlight}</p>
                </div>
              ) : null}
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {steps.map((step, idx) => (
              <div
                key={`step-${step.key}`}
                ref={(el) => {
                  stepRefs.current[idx] = el;
                }}
                className={
                  idx === safeActiveIndex
                    ? 'rounded-3xl border border-indigo-400/30 bg-indigo-500/10 p-5'
                    : 'rounded-3xl border border-white/[0.06] bg-white/[0.02] p-5'
                }
              >
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Step {step.key}</p>
                <p className="mt-2 text-sm font-black text-slate-100">{step.title}</p>
                <p className="mt-2 text-xs text-slate-400 leading-relaxed">{step.description}</p>
              </div>
            ))}
          </div>
        </section>
      )}

      {examples.length > 0 && (
        <section className="space-y-4 pt-4 border-t border-slate-800/50">
          <div className="flex items-center gap-2 text-slate-300">
            <Sparkles className="w-5 h-5 text-emerald-400" />
            <h3 className="font-black uppercase tracking-widest text-xs">Examples</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {examples.slice(0, 3).map((ex: any, i: number) => (
              <div
                key={`ex-${i}`}
                className="p-5 rounded-3xl bg-emerald-500/5 border border-emerald-500/10 hover:border-emerald-500/30 transition-all"
              >
                <p className="text-sm font-black text-emerald-100">{ex?.title || `Example ${i + 1}`}</p>
                <p className="mt-2 text-xs text-slate-300 leading-relaxed">{ex?.explanation || ''}</p>
              </div>
            ))}
          </div>
        </section>
      )}

      {data.approaches && data.approaches.length > 0 && (
        <section className="space-y-4 pt-4 border-t border-slate-800/50">
          <div className="flex items-center gap-2 text-slate-300">
            <Code className="w-5 h-5 text-indigo-400" />
            <h3 className="font-black uppercase tracking-widest text-xs">Alternative perspectives</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {data.approaches.map((approach, i) => (
              <div
                key={i}
                className="p-4 rounded-2xl bg-indigo-500/5 border border-indigo-500/10 hover:border-indigo-500/30 transition-all cursor-default"
              >
                <p className="text-xs text-indigo-200 font-medium leading-relaxed">{approach}</p>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
};
