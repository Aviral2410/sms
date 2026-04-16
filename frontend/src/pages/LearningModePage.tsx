import React, { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  BookOpen,
  BrainCircuit,
  Loader,
  Send,
  X,
  Zap,
  Sparkles,
} from 'lucide-react';
import { toast } from 'sonner';
import { ExamplesPanel } from '../components/ai/ExamplesPanel';
import { LearningVisualizerPanel } from '../components/ai/LearningVisualizerPanel';
import { ApiError, schoolOpsApi, subscriptionApi, type ExampleResponse, type VisualizeResponse } from '../lib/api';
import { hasFeature } from '../lib/features';
import { buildBasicExamples, buildBasicVisualization } from '../lib/learningFallback';
import { useStore } from '../store/useStore';
import '../styles/admin-management.css';
import './learning-mode.css';

const TABS = [
  { id: 'visualize', label: 'Step-by-Step Visualization', icon: BrainCircuit },
  { id: 'examples', label: 'Interactive Examples', icon: BookOpen },
] as const;

export default function LearningModePage() {
  const { session } = useStore();
  const premiumEntitled = hasFeature(session.featureCodes, 'AI_VISUALIZATION_PREMIUM');

  const [activeTab, setActiveTab] = useState<(typeof TABS)[number]['id']>('visualize');
  const [question, setQuestion] = useState('');
  const [subject, setSubject] = useState('');
  const [level, setLevel] = useState<'BEGINNER' | 'STANDARD' | 'ADVANCED'>('STANDARD');
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [vizStyle] = useState<'AUTO'>('AUTO');

  const [visualizeData, setVisualizeData] = useState<VisualizeResponse | null>(null);
  const [examplesData, setExamplesData] = useState<ExampleResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [upgradeRequired, setUpgradeRequired] = useState(false);
  const [requestingUpgrade, setRequestingUpgrade] = useState(false);

  const createLocalVisualization = () =>
    buildBasicVisualization({
      question: question.trim(),
      subject: subject || undefined,
      level,
      visualizationStyle: vizStyle as any,
    });

  const createLocalExamples = () =>
    buildBasicExamples({
      question: question.trim(),
      context: subject || undefined,
      count: premiumEntitled ? 3 : 1,
    });

  useEffect(() => {
    setError(null);
    setUpgradeRequired(false);
    setShowAdvanced(false);
  }, [activeTab]);

  const handleProcess = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!question.trim()) {
      toast.error('Please enter a question or concept to learn about.');
      return;
    }

    setLoading(true);
    setError(null);
    setUpgradeRequired(false);

    try {
      if (activeTab === 'visualize') {
        setExamplesData(null);
        const res = await schoolOpsApi.visualize({
          question: question.trim(),
          subject: subject || undefined,
          level,
          visualizationStyle: vizStyle,
          premiumRequest: premiumEntitled,
        });
        setVisualizeData({ ...res, generationMode: 'AI' });
      } else {
        setVisualizeData(null);
        const premiumRequest = premiumEntitled;
        const res = await schoolOpsApi.generateExamples({
          question: question.trim(),
          context: subject || undefined,
          count: premiumRequest ? 3 : 1,
          premiumRequest,
        });
        setExamplesData({ ...res, generationMode: 'AI' });
      }
    } catch (err: any) {
      console.error('LearningModePage: generation failed', err);
      if (err instanceof ApiError && err.status === 403) {
        setUpgradeRequired(true);
        setError(err.message || 'Upgrade required.');
        if (activeTab === 'visualize') setVisualizeData(createLocalVisualization());
        else setExamplesData(createLocalExamples());
        return;
      }
      if (activeTab === 'visualize') setVisualizeData(createLocalVisualization());
      else setExamplesData(createLocalExamples());
      toast.error('AI unavailable. Showing guided mode.');
    } finally {
      setLoading(false);
    }
  };

  const handleRequestUpgrade = async () => {
    setRequestingUpgrade(true);
    try {
      const plans = await subscriptionApi.listPlans();
      const premiumPlan = plans.find((plan) => plan.planCode === 'PREMIUM');
      if (!premiumPlan) return;
      await subscriptionApi.requestUpgrade({
        requestedPlanId: premiumPlan.planId,
        requestNotes: 'Requesting premium AI visualization access.',
      });
      toast.success('Upgrade request sent.');
    } catch (err) {
      toast.error('Failed to send request.');
    } finally {
      setRequestingUpgrade(false);
    }
  };

  return (
    <div className="admin-management-shell min-h-screen">
      <motion.div
        className="admin-management-page"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.25 }}
      >
        <div className="mb-6">
          <h1 className="text-2xl font-black text-slate-100 tracking-tight">AI Visualizer</h1>
          <p className="text-slate-400 text-sm">Transforming complex concepts into interactive, step-by-step masterclasses.</p>
        </div>

        <main className="learning-mode-stage">
          <section className="admin-management-card admin-management-panel learning-mode-stage__panel">
            <div className="learning-mode-stage__header">
              <div className="flex-1">
                <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">Interactive Session</p>
                <p className="text-[13px] text-slate-400 mt-1">Generate visualizations or examples by asking a question below.</p>
              </div>
              <div className="learning-mode-tabs" role="tablist">
                {TABS.map((tab) => {
                  const isActive = activeTab === tab.id;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`learning-mode-tab ${isActive ? 'is-active' : ''}`}
                      type="button"
                    >
                      <tab.icon size={16} />
                      {tab.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {upgradeRequired && (
              <div className="admin-management-helper mt-4 mb-4 flex items-center justify-between p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20">
                <div>
                  <h4 className="text-xs font-black text-amber-400 uppercase tracking-widest">Premium Feature</h4>
                  <p className="text-xs text-amber-200/70 mt-1">Upgrade to unlock full AI generation and advanced diagrams.</p>
                </div>
                <button className="admin-management-secondary compact" onClick={handleRequestUpgrade} disabled={requestingUpgrade}>
                  <Zap size={14} /> {requestingUpgrade ? 'Requesting...' : 'Upgrade'}
                </button>
              </div>
            )}

            <div className="learning-mode-stage__output">
              <AnimatePresence mode="wait">
                {activeTab === 'visualize' ? (
                  <motion.div key="visualize" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}>
                    <LearningVisualizerPanel data={visualizeData} loading={loading} error={error} />
                  </motion.div>
                ) : (
                  <motion.div key="examples" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}>
                    <ExamplesPanel data={examplesData} loading={loading} error={error} />
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </section>

          <form onSubmit={handleProcess} className="learning-mode-composer">
            <div className="learning-mode-composer__row">
              <div className="learning-mode-composer__field">
                <textarea
                  value={question}
                  onChange={(e) => setQuestion(e.target.value)}
                  placeholder="What would you like to visualize? (e.g. How does photosynthesis work?)"
                  className="learning-mode-composer__input"
                />
                {question && (
                  <button type="button" className="learning-mode-composer__clear" onClick={() => setQuestion('')}>
                    <X size={16} />
                  </button>
                )}
              </div>

              <div className="learning-mode-composer__controls">
                <select value={subject} onChange={(e) => setSubject(e.target.value)} className="learning-mode-composer__select">
                  <option value="">Auto-subject</option>
                  <option value="Mathematics">Mathematics</option>
                  <option value="Physics">Physics</option>
                  <option value="Computer Science">Computer Science</option>
                </select>
                <button className="learning-mode-composer__send" type="submit" disabled={loading}>
                  {loading ? <Loader className="animate-spin" size={18} /> : <Send size={18} />}
                </button>
              </div>
            </div>
            <div className="learning-mode-composer__footer">
              <div className="flex items-center gap-2">
                <Sparkles size={14} className="text-amber-400" />
                <span>AI will automatically tailor the visualization to your query.</span>
              </div>
              <button type="button" className="text-indigo-400 hover:text-indigo-300 transition-colors" onClick={() => setShowAdvanced(!showAdvanced)}>
                {showAdvanced ? 'Simple Mode' : 'Advanced Options'}
              </button>
              {showAdvanced && (
                <div className="flex items-center gap-3">
                  <span className="text-slate-500 uppercase text-[10px] font-black">Complexity</span>
                  <select value={level} onChange={(e) => setLevel(e.target.value as any)} className="bg-slate-800 border-none rounded-lg text-xs px-2 py-1 outline-none text-slate-300">
                    <option value="BEGINNER">Beginner</option>
                    <option value="STANDARD">Standard</option>
                    <option value="ADVANCED">Advanced</option>
                  </select>
                </div>
              )}
            </div>
          </form>
        </main>
      </motion.div>
    </div>
  );
}
