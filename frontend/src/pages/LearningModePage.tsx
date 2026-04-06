import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Sparkles, 
  Search, 
  BookOpen, 
  Zap, 
  Layers, 
  X, 
  Send,
  HelpCircle,
  BrainCircuit,
  Settings2,
  Lock,
  LayoutTemplate,
  Network,
  GitBranch,
  Split
} from 'lucide-react';
import { useStore } from '../store/useStore';
import { schoolOpsApi, VisualizeResponse, ExampleResponse } from '../lib/api';
import { LearningVisualizerPanel } from '../components/ai/LearningVisualizerPanel';
import { ExamplesPanel } from '../components/ai/ExamplesPanel';
import { toast } from 'sonner';

const TABS = [
  { id: 'visualize', label: 'Step-by-Step Visualization', icon: BrainCircuit },
  { id: 'examples', label: 'Interactive Examples', icon: BookOpen },
];

const VISUALIZATION_STYLES = [
  { id: 'STEP_LIST', label: 'Step-by-Step List', icon: LayoutTemplate, tier: 'BASE' },
  { id: 'SUMMARY', label: 'Concise Summary', icon: BrainCircuit, tier: 'BASE' },
  { id: 'SCIENTIFIC_PLOT', label: 'Scientific Plot', icon: Search, tier: 'BASE' }, // Wolfram-style
  { id: 'MIND_MAP', label: 'Interactive Mind Map', icon: Network, tier: 'PREMIUM' },
  { id: 'FLOWCHART', label: 'Logical Flowchart', icon: GitBranch, tier: 'PREMIUM' },
  { id: 'COMPARISON', label: 'Side-by-Side Analysis', icon: Split, tier: 'PREMIUM' },
];

export default function LearningModePage() {
  const { session } = useStore();
  const [activeTab, setActiveTab] = useState('visualize');
  const [question, setQuestion] = useState('');
  const [subject, setSubject] = useState('');
  const [level, setLevel] = useState('STANDARD');
  const [vizStyle, setVizStyle] = useState('STEP_LIST');
  
  const [visualizeData, setVisualizeData] = useState<VisualizeResponse | null>(null);
  const [examplesData, setExamplesData] = useState<ExampleResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleProcess = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!question.trim()) {
      toast.error('Please enter a question or concept to learn about.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      if (activeTab === 'visualize') {
        const res = await schoolOpsApi.visualize({
          question: question.trim(),
          subject: subject || undefined,
          level: level,
          visualizationStyle: vizStyle,
          premiumRequest: !!session.isPremium
        });
        setVisualizeData(res);
      } else {
        const res = await schoolOpsApi.generateExamples({
          question: question.trim(),
          context: subject || undefined,
          count: session.isPremium ? 3 : 1,
          premiumRequest: !!session.isPremium
        });
        setExamplesData(res);
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred while generating content.');
      toast.error('AI Generation Failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen pt-2 pb-20 px-6 space-y-8 max-w-[1600px] mx-auto animate-in fade-in duration-1000">
      {/* ── Header ── */}
      <header className="flex flex-col md:flex-row items-center justify-between gap-6 p-10 rounded-[3rem] bg-gradient-to-br from-indigo-600/20 via-slate-900 to-slate-900 border border-white/[0.05] relative overflow-hidden group">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_-20%,rgba(99,102,241,0.15),transparent_70%)] pointer-events-none" />
        <div className="absolute -top-24 -right-24 w-64 h-64 bg-amber-500/10 blur-[100px] rounded-full pointer-events-none group-hover:bg-amber-500/20 transition-all duration-1000" />
        
        <div className="space-y-3 z-10 text-center md:text-left">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-[10px] font-black text-indigo-400 uppercase tracking-[0.2em]">
            <Sparkles className="w-3 h-3" />
            Empowered Learning
          </div>
          <h1 className="text-4xl md:text-5xl font-black text-white tracking-tight leading-none">
            Learning <span className="text-indigo-400">Mode</span>
          </h1>
          <p className="text-slate-400 text-lg max-w-xl font-medium">
            AI-powered visual explanations, step-by-step breakdowns, and worked examples to master any concept.
          </p>
        </div>

        {!session.isPremium && (
          <div className="shrink-0 p-6 rounded-3xl bg-amber-500/5 border border-amber-500/10 backdrop-blur-md z-10 max-w-xs text-center md:text-left">
             <div className="flex items-center gap-2 text-amber-500 font-black text-xs uppercase tracking-widest mb-2 justify-center md:justify-start">
               <Zap className="w-4 h-4 fill-amber-500" />
               Premium Power
             </div>
             <p className="text-[11px] text-amber-200/60 leading-relaxed mb-4 font-medium">
               Upgrade to unlock deep-dive LLM visualizations, multiple approaches, and advanced interactive examples.
             </p>
             <button className="w-full py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-black text-xs font-black transition-all shadow-[0_0_20px_rgba(245,158,11,0.2)]">
               Upgrade Plan
             </button>
          </div>
        )}
      </header>

      {/* ── Main Layout ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* ── Left Side: Controls ── */}
        <div className="lg:col-span-4 space-y-6 lg:sticky lg:top-24">
          <form 
            onSubmit={handleProcess}
            className="p-8 rounded-[2.5rem] bg-slate-900/50 border border-white/[0.05] backdrop-blur-xl space-y-6 shadow-2xl relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 p-6 opacity-5">
              <BrainCircuit className="w-24 h-24 text-white" />
            </div>

            <div className="space-y-4">
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 block">
                What are you studying?
              </label>
              <div className="relative group">
                <textarea
                  value={question}
                  onChange={(e) => setQuestion(e.target.value)}
                  placeholder="e.g., Explain Newton's Second Law of Motion..."
                  className="w-full h-32 p-6 rounded-3xl bg-slate-950 border border-white/10 text-white placeholder-slate-600 focus:border-indigo-500/50 focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all resize-none shadow-inner"
                />
                <div className="absolute bottom-4 right-4 flex items-center gap-2">
                   {question && (
                     <button 
                       type="button" 
                       onClick={() => setQuestion('')}
                       className="p-2 rounded-xl bg-slate-800 text-slate-400 hover:text-white transition-colors"
                     >
                       <X className="w-4 h-4" />
                     </button>
                   )}
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 block">Visualization Style</label>
              <div className="grid grid-cols-1 gap-2">
                 {VISUALIZATION_STYLES.map(style => (
                    <button
                      key={style.id}
                      type="button"
                      disabled={style.tier === 'PREMIUM' && !session.isPremium}
                      onClick={() => setVizStyle(style.id)}
                      className={`flex items-center justify-between p-3 rounded-xl border transition-all text-left ${
                        vizStyle === style.id 
                          ? 'bg-indigo-500/10 border-indigo-500/40 text-indigo-200' 
                          : 'bg-slate-950/40 border-white/5 text-slate-400 hover:border-white/10'
                      } ${style.tier === 'PREMIUM' && !session.isPremium ? 'opacity-50 grayscale cursor-not-allowed' : ''}`}
                    >
                      <div className="flex items-center gap-3">
                        <style.icon className={`w-4 h-4 ${vizStyle === style.id ? 'text-indigo-400' : 'text-slate-500'}`} />
                        <span className="text-xs font-bold">{style.label}</span>
                      </div>
                      {style.tier === 'PREMIUM' && !session.isPremium && <Lock className="w-3 h-3 text-slate-600" />}
                    </button>
                 ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 block">Subject</label>
                <select 
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  className="w-full p-4 rounded-2xl bg-slate-950 border border-white/10 text-slate-300 text-sm focus:border-indigo-500/50 outline-none transition-all appearance-none cursor-pointer"
                >
                  <option value="">Auto-Detect</option>
                  <option value="Mathematics">Mathematics</option>
                  <option value="Physics">Physics</option>
                  <option value="Chemistry">Chemistry</option>
                  <option value="Biology">Biology</option>
                  <option value="History">History</option>
                  <option value="English">English Literature</option>
                  <option value="Computer Science">Computer Science</option>
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 block">Level</label>
                <select 
                  value={level}
                  onChange={(e) => setLevel(e.target.value)}
                  className="w-full p-4 rounded-2xl bg-slate-950 border border-white/10 text-slate-300 text-sm focus:border-indigo-500/50 outline-none transition-all appearance-none cursor-pointer"
                >
                  <option value="BEGINNER">Beginner</option>
                  <option value="STANDARD">Standard</option>
                  <option value="ADVANCED">Advanced</option>
                </select>
              </div>
            </div>

            <button
              disabled={loading}
              className="w-full py-5 rounded-2xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed group relative overflow-hidden transition-all shadow-[0_20px_40px_-15px_rgba(79,70,229,0.3)]"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
              <div className="flex items-center justify-center gap-3">
                {loading ? (
                  <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    <span className="text-white font-black uppercase tracking-[0.1em] text-sm">Visualize Concept</span>
                    <Send className="w-4 h-4 text-white group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                  </>
                )}
              </div>
            </button>
          </form>

          {/* ── Quick Tips ── */}
          <div className="p-8 rounded-[2.5rem] bg-indigo-500/5 border border-indigo-500/10 space-y-4">
            <div className="flex items-center gap-2 text-indigo-400">
               <HelpCircle className="w-4 h-4" />
               <span className="text-[10px] font-black uppercase tracking-widest">How to use</span>
            </div>
            <ul className="space-y-3">
              {[
                "Be specific about the topic or rule you want to learn.",
                "Mention your current level for a tailored explanation.",
                "Use Premium for deep AI analysis and multiple approaches."
              ].map((tip, i) => (
                <li key={i} className="flex gap-2 text-[11px] text-slate-400 leading-relaxed font-medium">
                  <div className="w-1 h-1 rounded-full bg-indigo-500 mt-1.5 shrink-0" />
                  {tip}
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* ── Right Side: Output ── */}
        <div className="lg:col-span-8 flex flex-col gap-6">
          <div className="flex p-1.5 bg-slate-900/80 rounded-2xl border border-white/[0.05] backdrop-blur-xl w-fit">
            {TABS.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-6 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${
                  activeTab === tab.id 
                    ? 'bg-white/10 text-white shadow-xl border border-white/5' 
                    : 'text-slate-500 hover:text-slate-300'
                }`}
              >
                <tab.icon className="w-4 h-4" />
                {tab.label}
              </button>
            ))}
          </div>

          <div className="p-10 rounded-[3rem] bg-slate-900/30 border border-white/[0.05] backdrop-blur-sm min-h-[600px] shadow-2xl">
             <AnimatePresence mode="wait">
               {activeTab === 'visualize' ? (
                 <motion.div 
                    key="visualize" 
                    initial={{ opacity: 0, x: 10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -10 }}
                    className="h-full"
                 >
                   <LearningVisualizerPanel data={visualizeData} loading={loading} error={error} />
                 </motion.div>
               ) : (
                 <motion.div 
                    key="examples"
                    initial={{ opacity: 0, x: 10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -10 }}
                    className="h-full"
                 >
                   <ExamplesPanel data={examplesData} loading={loading} error={error} />
                 </motion.div>
               )}
             </AnimatePresence>
          </div>
        </div>

      </div>
    </div>
  );
}
