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
  // Keep the field for backwards compatibility, but default to AUTO to avoid asking the learner to pick a visualization style.
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
    // Keep the output panel stable when switching tabs.
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
        setError(err.message || 'Upgrade required to access this feature.');
        toast.error(err.message || 'Upgrade required.');
        if (activeTab === 'visualize') {
          setVisualizeData(createLocalVisualization());
        } else {
          setExamplesData(createLocalExamples());
        }
        return;
      }

      setError(null);
      if (activeTab === 'visualize') {
        setVisualizeData(createLocalVisualization());
      } else {
        setExamplesData(createLocalExamples());
      }
      toast.error('AI unavailable right now. Showing guided mode instead.');
    } finally {
      setLoading(false);
    }
  };

  const handleRequestUpgrade = async () => {
    setRequestingUpgrade(true);
    try {
      const plans = await subscriptionApi.listPlans();
      const premiumPlan = plans.find((plan) => plan.planCode === 'PREMIUM');
      if (!premiumPlan) {
        toast.error('Premium plan not available right now.');
        return;
      }
      await subscriptionApi.requestUpgrade({
        requestedPlanId: premiumPlan.planId,
        requestNotes: 'Requesting premium AI visualization access.',
      });
      toast.success('Upgrade request sent to platform admin.');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to send upgrade request.');
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
        <section className="admin-management-card admin-management-hero">
          <div className="admin-management-hero-copy">
            <div className="admin-management-eyebrow">Intelligence</div>
            <h1 className="admin-management-title">AI Visualizer</h1>
            <p className="admin-management-subtitle">
              Step-by-step explanations, diagrams, and worked examples that match your level.
            </p>
          </div>
          <div className="admin-management-hero-actions">
            {!premiumEntitled && (
              <div className="admin-management-highlight">
                <span>Plan</span>
                <strong>Standard</strong>
              </div>
            )}
            {!premiumEntitled && (
              <button className="admin-management-secondary" type="button" onClick={handleRequestUpgrade} disabled={requestingUpgrade}>
                <Zap size={18} /> Upgrade
              </button>
            )}
            <button
              className="admin-management-secondary"
              type="button"
              onClick={() => setQuestion('')}
              disabled={!question}
            >
              <X size={18} /> Clear
            </button>
          </div>
        </section>

        <main className="learning-mode-stage">
          <section className="admin-management-card admin-management-panel learning-mode-stage__panel">
            <div className="learning-mode-stage__header">
              <div>
                <div className="admin-management-panel-kicker">Output</div>
                <h2>{activeTab === 'visualize' ? 'Visualization' : 'Examples'}</h2>
                <p>Ask a question below — the visualization takes the full stage.</p>
              </div>
              <div className="learning-mode-tabs" role="tablist" aria-label="Learning output mode">
                {TABS.map((tab) => {
                  const isActive = activeTab === tab.id;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`learning-mode-tab ${isActive ? 'is-active' : ''}`}
                      type="button"
                      role="tab"
                      aria-selected={isActive}
                    >
                      <tab.icon size={16} />
                      {tab.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {upgradeRequired && (
              <div
                className="admin-management-helper"
                style={{
                  borderColor: 'rgba(251,146,60,0.55)',
                  background: 'rgba(251,146,60,0.10)',
                  color: 'rgba(255,255,255,0.92)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: 14,
                  marginBottom: 16,
                }}
              >
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  <strong style={{ fontSize: 13, letterSpacing: '0.04em', textTransform: 'uppercase' }}>Upgrade Required</strong>
                  <span style={{ fontSize: 13, opacity: 0.92 }}>
                    Premium AI is required for the richest diagrams and animations. Guided mode will still render clean output.
                  </span>
                </div>
                <button
                  className="admin-management-secondary"
                  type="button"
                  onClick={handleRequestUpgrade}
                  disabled={requestingUpgrade}
                  style={{ whiteSpace: 'nowrap' }}
                >
                  <Zap size={18} /> {requestingUpgrade ? 'Requesting...' : 'Request Upgrade'}
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

          <form onSubmit={handleProcess} className="learning-mode-composer" aria-label="Ask AI Visualizer">
            <div className="learning-mode-composer__row">
              <div className="learning-mode-composer__field">
                <textarea
                  value={question}
                  onChange={(e) => setQuestion(e.target.value)}
                  placeholder="Ask a question… (e.g., Explain binary search with an example)"
                  className="learning-mode-composer__input"
                />
                {question ? (
                  <button type="button" className="learning-mode-composer__clear" onClick={() => setQuestion('')} aria-label="Clear question">
                    <X size={16} />
                  </button>
                ) : null}
              </div>

              <div className="learning-mode-composer__controls">
                <select value={subject} onChange={(e) => setSubject(e.target.value)} className="learning-mode-composer__select" aria-label="Subject">
                  <option value="">Auto subject</option>
                  <option value="Mathematics">Mathematics</option>
                  <option value="Physics">Physics</option>
                  <option value="Chemistry">Chemistry</option>
                  <option value="Biology">Biology</option>
                  <option value="History">History</option>
                  <option value="English">English</option>
                  <option value="Computer Science">Computer Science</option>
                </select>
                <button className="learning-mode-composer__send" type="submit" disabled={loading}>
                  {loading ? <Loader size={18} /> : <Send size={18} />}
                </button>
              </div>
            </div>
            <div className="learning-mode-composer__footer">
              <div className="learning-mode-composer__hint">
                <Sparkles size={14} /> Visualization style is auto-selected by AI.
              </div>
              <div className="learning-mode-composer__advanced">
                <button
                  type="button"
                  className="learning-mode-composer__advanced-toggle"
                  onClick={() => setShowAdvanced((s) => !s)}
                  aria-expanded={showAdvanced}
                >
                  {showAdvanced ? 'Hide options' : 'Options'}
                </button>
                {showAdvanced ? (
                  <div className="learning-mode-composer__level" aria-label="Learning level">
                    <span>Level</span>
                    <select
                      value={level}
                      onChange={(e) => {
                        const next = e.target.value;
                        if (next === 'BEGINNER' || next === 'STANDARD' || next === 'ADVANCED') setLevel(next);
                      }}
                      className="learning-mode-composer__select"
                      aria-label="Level"
                    >
                      <option value="BEGINNER">Beginner</option>
                      <option value="STANDARD">Standard</option>
                      <option value="ADVANCED">Advanced</option>
                    </select>
                  </div>
                ) : null}
              </div>
            </div>
          </form>
        </main>
      </motion.div>
    </div>
  );
}
