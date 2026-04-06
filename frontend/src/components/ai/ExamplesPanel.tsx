import React from 'react';
import { motion } from 'framer-motion';
import { BookOpen, HelpCircle, CheckCircle2, FlaskConical, Target } from 'lucide-react';
import { ExampleResponse, AiExample } from '../../lib/api';

interface ExamplesPanelProps {
  data: ExampleResponse | null;
  loading: boolean;
  error?: string | null;
}

export const ExamplesPanel: React.FC<ExamplesPanelProps> = ({ data, loading, error }) => {
  if (loading) {
    return (
      <div className="space-y-4 animate-pulse">
        {[1, 2, 3].map(i => (
          <div key={i} className="h-48 rounded-3xl bg-slate-800/30 border border-slate-700/30" />
        ))}
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="text-center p-12 bg-indigo-500/5 rounded-3xl border border-indigo-500/10">
        <BookOpen className="w-12 h-12 text-indigo-400 mb-4 opacity-30 mx-auto" />
        <h3 className="text-lg font-bold text-indigo-200">Interactive Examples</h3>
        <p className="text-sm text-indigo-300/60 mt-1 max-w-xs mx-auto">Generate real-world examples and worked solutions to test your understanding.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in zoom-in-95 duration-500">
      {data.examples.map((example, i) => (
        <motion.article 
          key={i}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.1 }}
          className="p-8 rounded-3xl bg-white/[0.02] border border-white/[0.05] hover:border-indigo-500/20 transition-all group relative overflow-hidden"
        >
          <div className="absolute top-0 right-0 p-4 opacity-20 group-hover:opacity-40 transition-opacity">
            <FlaskConical className="w-24 h-24 -mr-8 -mt-8 text-indigo-400" />
          </div>

          <div className="flex items-center gap-3 mb-6">
            <div className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest border ${
              example.difficulty === 'EASY' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' :
              example.difficulty === 'MEDIUM' ? 'bg-amber-500/10 border-amber-500/20 text-amber-400' :
              'bg-rose-500/10 border-rose-500/20 text-rose-400'
            }`}>
              {example.difficulty}
            </div>
            <h4 className="text-xl font-black text-white">{example.title}</h4>
          </div>

          <div className="space-y-6 relative">
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-indigo-400 opacity-60">
                <HelpCircle className="w-3 h-3" />
                Scenario
              </label>
              <p className="text-slate-300 leading-relaxed text-sm bg-slate-900/40 p-4 rounded-2xl border border-white/[0.03]">
                {example.scenario}
              </p>
            </div>

            <div className="space-y-2">
              <label className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-emerald-400 opacity-60">
                <CheckCircle2 className="w-3 h-3" />
                Solution Breakdown
              </label>
              <div className="text-emerald-50/80 leading-relaxed text-sm bg-emerald-500/5 p-5 rounded-2xl border border-emerald-500/10 font-medium whitespace-pre-wrap">
                {example.solution}
              </div>
            </div>
          </div>
        </motion.article>
      ))}

      {data.relatedTopics.length > 0 && (
        <footer className="mt-8 pt-6 border-t border-slate-800/50">
          <label className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-500 mb-4">
            <Target className="w-3 h-3" />
            Explore Further
          </label>
          <div className="flex flex-wrap gap-3">
            {data.relatedTopics.map(topic => (
              <button key={topic} className="px-4 py-2 rounded-xl bg-slate-800/40 hover:bg-slate-700/50 text-xs font-bold text-slate-300 border border-slate-700/50 transition-colors">
                {topic}
              </button>
            ))}
          </div>
        </footer>
      )}
    </div>
  );
};
