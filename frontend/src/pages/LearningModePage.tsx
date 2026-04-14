import React, { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  BookOpen,
  BrainCircuit,
  GitBranch,
  HelpCircle,
  LayoutTemplate,
  Loader,
  Lock,
  Network,
  Search,
  Send,
  Split,
  X,
  Zap,
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

const VISUALIZATION_STYLES = [
  { id: 'STEP_LIST', label: 'Step-by-Step List', icon: LayoutTemplate, tier: 'BASE' },
  { id: 'SUMMARY', label: 'Concise Summary', icon: BrainCircuit, tier: 'BASE' },
  { id: 'SCIENTIFIC_PLOT', label: 'Scientific Plot', icon: Search, tier: 'BASE' },
  { id: 'MIND_MAP', label: 'Interactive Mind Map', icon: Network, tier: 'PREMIUM' },
  { id: 'FLOWCHART', label: 'Logical Flowchart', icon: GitBranch, tier: 'PREMIUM' },
  { id: 'COMPARISON', label: 'Side-by-Side Analysis', icon: Split, tier: 'PREMIUM' },
] as const;

export default function LearningModePage() {
  const { session } = useStore();
  const premiumEntitled = hasFeature(session.featureCodes, 'AI_VISUALIZATION_PREMIUM');

  const [activeTab, setActiveTab] = useState<(typeof TABS)[number]['id']>('visualize');
  const [question, setQuestion] = useState('');
  const [subject, setSubject] = useState('');
  const [level, setLevel] = useState<'BEGINNER' | 'STANDARD' | 'ADVANCED'>('STANDARD');
  const [vizStyle, setVizStyle] = useState<(typeof VISUALIZATION_STYLES)[number]['id']>('STEP_LIST');

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
      visualizationStyle: vizStyle,
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
        const wantsPremium = VISUALIZATION_STYLES.find((style) => style.id === vizStyle)?.tier === 'PREMIUM';
        const res = await schoolOpsApi.visualize({
          question: question.trim(),
          subject: subject || undefined,
          level,
          visualizationStyle: vizStyle,
          premiumRequest: wantsPremium,
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

        <div className="admin-management-content-grid">
          <aside className="admin-management-sidebar">
            <section className="admin-management-card admin-management-panel">
              <div className="admin-management-panel-heading">
                <div>
                  <div className="admin-management-panel-kicker">Learning Prompt</div>
                  <h2>Ask a concept</h2>
                  <p>Write what you are studying and pick a visualization style.</p>
                </div>
                <div className="admin-management-panel-icon">
                  <BrainCircuit size={18} />
                </div>
              </div>

              <form onSubmit={handleProcess} className="admin-management-form">
                <div className="admin-management-field">
                  <span>Question</span>
                  <div className="admin-management-field-input" style={{ alignItems: 'stretch' }}>
                    <textarea
                      value={question}
                      onChange={(e) => setQuestion(e.target.value)}
                      placeholder="e.g., Explain Newton's Second Law of Motion..."
                      className="learning-mode-textarea"
                    />
                    {question && (
                      <button
                        type="button"
                        onClick={() => setQuestion('')}
                        className="admin-management-icon-button"
                        aria-label="Clear question"
                        style={{ marginTop: 10 }}
                      >
                        <X size={16} />
                      </button>
                    )}
                  </div>
                </div>

                <div className="admin-management-field">
                  <span>Visualization Style</span>
                  <div className="learning-mode-style-grid">
                    {VISUALIZATION_STYLES.map((style) => {
                      const locked = style.tier === 'PREMIUM' && !premiumEntitled;
                      const active = vizStyle === style.id;
                      return (
                        <button
                          key={style.id}
                          type="button"
                          onClick={() => {
                            if (locked) {
                              toast.error('Upgrade required for this visualization style.');
                            }
                            setVizStyle(style.id);
                          }}
                          className={`learning-mode-style ${active ? 'is-active' : ''} ${locked ? 'is-disabled' : ''}`}
                        >
                          <div className="learning-mode-style-main">
                            <style.icon size={16} />
                            <span>{style.label}</span>
                          </div>
                          {locked ? <Lock size={14} /> : null}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="learning-mode-field-stack">
                  <div className="admin-management-field">
                    <span>Subject</span>
                    <div className="admin-management-field-input">
                      <select value={subject} onChange={(e) => setSubject(e.target.value)} className="learning-mode-select">
                        <option value="">Auto-detect</option>
                        <option value="Mathematics">Mathematics</option>
                        <option value="Physics">Physics</option>
                        <option value="Chemistry">Chemistry</option>
                        <option value="Biology">Biology</option>
                        <option value="History">History</option>
                        <option value="English">English Literature</option>
                        <option value="Computer Science">Computer Science</option>
                      </select>
                    </div>
                  </div>

                  <div className="admin-management-field">
                    <span>Level</span>
                    <div className="admin-management-field-input">
                      <select
                        value={level}
                        onChange={(e) => {
                          const next = e.target.value;
                          if (next === 'BEGINNER' || next === 'STANDARD' || next === 'ADVANCED') {
                            setLevel(next);
                          }
                        }}
                        className="learning-mode-select"
                      >
                        <option value="BEGINNER">Beginner</option>
                        <option value="STANDARD">Standard</option>
                        <option value="ADVANCED">Advanced</option>
                      </select>
                    </div>
                  </div>
                </div>

                <div className="admin-management-form-actions">
                  <button disabled={loading} className="admin-management-primary" type="submit">
                    {loading ? (
                      <>
                        <Loader size={18} /> Generating...
                      </>
                    ) : (
                      <>
                        <Send size={18} /> Generate
                      </>
                    )}
                  </button>
                </div>
              </form>
            </section>

            <section className="admin-management-card admin-management-panel">
              <div className="admin-management-panel-heading">
                <div>
                  <div className="admin-management-panel-kicker">How To Use</div>
                  <h2>Quick tips</h2>
                  <p>Small inputs lead to big improvements in output quality.</p>
                </div>
                <div className="admin-management-panel-icon">
                  <HelpCircle size={18} />
                </div>
              </div>
              <div className="admin-management-helper">
                <div>
                  Be specific about the topic you want to learn, mention your level, and switch styles when you want a different perspective.
                </div>
              </div>
            </section>
          </aside>

          <main className="admin-management-main">
            <section className="admin-management-card admin-management-panel">
              <div className="admin-management-panel-heading">
                <div>
                  <div className="admin-management-panel-kicker">Output</div>
                  <h2>{activeTab === 'visualize' ? 'Visualization' : 'Examples'}</h2>
                  <p>Generated content will appear here.</p>
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
                      This visualization style requires premium AI access. You can still use guided mode, or request an upgrade.
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

              <div className="learning-mode-output">
                <AnimatePresence mode="wait">
                  {activeTab === 'visualize' ? (
                    <motion.div key="visualize" initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }}>
                      <LearningVisualizerPanel data={visualizeData} loading={loading} error={error} />
                    </motion.div>
                  ) : (
                    <motion.div key="examples" initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }}>
                      <ExamplesPanel data={examplesData} loading={loading} error={error} />
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </section>
          </main>
        </div>
      </motion.div>
    </div>
  );
}
