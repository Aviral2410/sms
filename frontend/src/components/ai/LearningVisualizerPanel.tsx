import React from 'react';
import { motion } from 'framer-motion';
import { 
  Lightbulb, 
  ChevronRight, 
  AlertCircle, 
  Code, 
  Info,
  Sparkles
} from 'lucide-react';
import { VisualizeResponse, VisualizationStep } from '../../lib/api';
import { MermaidDiagram } from './MermaidDiagram';

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
      <div className="flex flex-col items-center justify-center h-[500px] space-y-4 text-slate-400">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
        >
          <Sparkles className="w-12 h-12 text-amber-400 opacity-50" />
        </motion.div>
        <p className="text-sm font-medium animate-pulse">Generating your visual breakdown...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-[500px] p-8 text-center bg-red-500/5 rounded-2xl border border-red-500/20">
        <AlertCircle className="w-12 h-12 text-red-400 mb-4" />
        <h3 className="text-lg font-bold text-red-200 mb-2">Something went wrong</h3>
        <p className="text-sm text-red-300/80 max-w-xs">{error}</p>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex flex-col items-center justify-center h-[500px] text-slate-500 border-2 border-dashed border-slate-800 rounded-3xl p-12 text-center">
        <Lightbulb className="w-16 h-16 mb-4 opacity-20" />
        <h3 className="text-xl font-bold text-slate-400 mb-2">Ready to Visualize</h3>
        <p className="text-sm max-w-sm">Enter a question on the left to see a step-by-step interactive breakdown.</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <header className="space-y-2">
        <div className="flex items-center gap-3">
          <h2 className="text-2xl font-black text-white tracking-tight">{data.title}</h2>
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
