import React, { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  BookOpen,
  BrainCircuit,
  Loader,
  Send,
  Zap,
  Sparkles,
} from 'lucide-react';
import { toast } from 'sonner';
import { ExamplesPanel, LEARNING_EXAMPLES, type LearningExample } from '../components/ai/ExamplesPanel';
import { LearningVisualizerPanel } from '../components/ai/LearningVisualizerPanel';
import { SmartUiRenderer } from '../components/ai/SmartUiRenderer';
import { ApiError, schoolOpsApi, subscriptionApi, type VisualizeResponse } from '../lib/api';
import { hasFeature } from '../lib/features';
import { buildBasicVisualization } from '../lib/learningFallback';
import { readSseStream, tryParseJson } from '../lib/sse';
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
  const [previewPayload, setPreviewPayload] = useState<Record<string, unknown> | null>(LEARNING_EXAMPLES[0]?.payload ?? null);
  const [selectedExample, setSelectedExample] = useState<LearningExample>(LEARNING_EXAMPLES[0]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [streamStatus, setStreamStatus] = useState<string | null>(null);
  const [upgradeRequired, setUpgradeRequired] = useState(false);
  const [requestingUpgrade, setRequestingUpgrade] = useState(false);

  const createLocalVisualization = () =>
    buildBasicVisualization({
      question: question.trim(),
      subject: subject || undefined,
      level,
      visualizationStyle: vizStyle as any,
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
    setStreamStatus(null);
    setUpgradeRequired(false);

    try {
      setActiveTab('visualize');
      setPreviewPayload(null);
      const payload = {
        question: question.trim(),
        subject: subject || undefined,
        level,
        visualizationStyle: vizStyle,
        premiumRequest: premiumEntitled,
      };

      const streamRes = await fetch('/api/v1/school-ops/ai/visualize/stream', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(session.token ? { Authorization: `Bearer ${session.token}` } : {}),
        },
        body: JSON.stringify(payload),
      });

      if (!streamRes.ok || !streamRes.body) {
        const res = await schoolOpsApi.visualize(payload);
        setVisualizeData({ ...res, generationMode: 'AI' });
      } else {
        let final: VisualizeResponse | null = null;
        await readSseStream(streamRes.body, {
          onEvent: ({ event, data }) => {
            if (data === '[DONE]') return;
            if (event === 'status') {
              const parsed = tryParseJson<any>(data);
              const text = parsed.ok && typeof parsed.value?.text === 'string' ? (parsed.value.text as string) : '';
              if (text) setStreamStatus(text);
              return;
            }
            if (event === 'token') {
              const parsed = tryParseJson<any>(data);
              const chars = parsed.ok && typeof parsed.value?.chars === 'number' ? (parsed.value.chars as number) : null;
              if (chars != null) {
                setStreamStatus(`Drafting visualization... (${chars.toLocaleString()} chars)`);
              }
              return;
            }
            if (event === 'final') {
              const parsed = tryParseJson<VisualizeResponse>(data);
              if (parsed.ok) final = parsed.value;
              return;
            }
            if (event === 'error') {
              const parsed = tryParseJson<any>(data);
              const text = parsed.ok && typeof parsed.value?.text === 'string' ? (parsed.value.text as string) : 'Stream failed.';
              setError(text);
              setStreamStatus(null);
            }
          },
        });

        if (!final) {
          throw new Error('Visualization stream ended before returning a result.');
        }

        const full = { ...(final as any), generationMode: 'AI' as const } as VisualizeResponse;
        const steps = Array.isArray(full.steps) ? full.steps : [];
        setStreamStatus(null);

        if (steps.length <= 1) {
          setVisualizeData(full);
        } else {
          setVisualizeData({ ...full, steps: [steps[0]] });
          let idx = 1;
          const id = window.setInterval(() => {
            setVisualizeData((current) => {
              if (!current) return current;
              return { ...current, steps: steps.slice(0, idx + 1) };
            });
            idx += 1;
            if (idx >= steps.length) window.clearInterval(id);
          }, 650);
        }
      }
    } catch (err: any) {
      console.error('LearningModePage: generation failed', err);
      if (err instanceof ApiError && err.status === 403) {
        setUpgradeRequired(true);
        setError(err.message || 'Upgrade required.');
        setStreamStatus(null);
        setVisualizeData(createLocalVisualization());
        return;
      }
      setVisualizeData(createLocalVisualization());
      setStreamStatus(null);
      toast.error('AI unavailable. Showing guided mode.');
    } finally {
      setLoading(false);
      setStreamStatus(null);
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
        <div className="mb-8 px-2 sm:mb-10 sm:px-4">
          <div className="flex items-center gap-4 mb-2">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-500 shadow-[0_0_30px_rgba(16,185,129,0.15)]">
              <BrainCircuit size={28} />
            </div>
            <div>
              <h1 className="text-[10px] font-black uppercase tracking-[0.4em] text-emerald-500/60 leading-none mb-2">Interactive Visual Learning Studio</h1>
              <h2 className="text-2xl font-black tracking-tighter text-white sm:text-3xl">LUMINA <span className="text-emerald-500">Studio</span></h2>
            </div>
          </div>
          <p className="ml-0 max-w-2xl text-sm font-medium leading-relaxed text-white/30 sm:ml-16">
            Generating high-fidelity visualizations and interactive simulations for complex pedagogical concepts.
          </p>
        </div>

        <main className="learning-mode-stage">
          <section className="admin-management-card admin-management-panel learning-mode-stage__panel">
            <div className="learning-mode-stage__header">
              <div className="flex-1">
                <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">Interactive Session</p>
                <p className="text-[13px] text-slate-400 mt-1">Ask a question for a generated explanation, or browse prepared visual examples.</p>
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
                    {streamStatus ? (
                      <div
                        className="admin-management-helper"
                        style={{
                          marginBottom: 14,
                          borderColor: 'rgba(56,189,248,0.35)',
                          background: 'rgba(56,189,248,0.08)',
                          color: 'rgba(255,255,255,0.92)',
                        }}
                      >
                        {streamStatus}
                      </div>
                    ) : null}
                    <div className="min-h-[320px] sm:min-h-[420px] lg:min-h-[500px]">
                      {visualizeData ? (
                        <LearningVisualizerPanel data={visualizeData} loading={loading} error={error} />
                      ) : previewPayload ? (
                        <div className="space-y-4 rounded-[2rem] border border-white/[0.08] bg-white/[0.02] p-5">
                          <div>
                            <div className="text-[10px] font-black uppercase tracking-[0.3em] text-emerald-400/70">Sample Canvas</div>
                            <h3 className="mt-2 text-xl font-black text-white">{selectedExample.title}</h3>
                            <p className="mt-2 text-sm leading-7 text-white/50">This preview stays inside the canvas. Use the prepared prompt below if you want a fresh generated explanation.</p>
                          </div>
                          <SmartUiRenderer response={previewPayload} />
                        </div>
                      ) : (
                        <LearningVisualizerPanel data={null} loading={loading} error={error} />
                      )}
                    </div>
                  </motion.div>
                ) : (
                  <motion.div key="examples" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}>
                    <div className="space-y-6">
                      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_24rem]">
                        <div className="rounded-[2rem] border border-white/[0.08] bg-white/[0.02] p-5">
                          <div className="text-[10px] font-black uppercase tracking-[0.3em] text-emerald-400/70">Current preview</div>
                          <h3 className="mt-2 text-xl font-black text-white">{selectedExample.title}</h3>
                          <p className="mt-2 text-sm leading-7 text-white/50">{selectedExample.desc}</p>
                          <div className="mt-4 overflow-hidden rounded-[1.4rem] border border-white/10 bg-black">
                            <video
                              className="aspect-video w-full object-cover"
                              src={selectedExample.src}
                              poster={selectedExample.poster}
                              autoPlay
                              muted
                              loop
                              playsInline
                              controls
                              preload="metadata"
                            />
                          </div>
                          <div className="mt-4 flex flex-wrap gap-3">
                            <button
                              type="button"
                              onClick={() => {
                                setQuestion(selectedExample.prompt);
                                setPreviewPayload(selectedExample.payload);
                                setVisualizeData(null);
                                setActiveTab('visualize');
                                setStreamStatus('Sample visual loaded into the canvas. Edit the prompt or send it as-is.');
                              }}
                              className="inline-flex items-center gap-2 rounded-2xl bg-emerald-500 px-4 py-3 text-sm font-black text-slate-950 transition hover:bg-emerald-400"
                            >
                              Load into canvas
                            </button>
                            <button
                              type="button"
                              onClick={() => setQuestion(selectedExample.prompt)}
                              className="inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm font-semibold text-white/80 transition hover:bg-white/[0.08] hover:text-white"
                            >
                              Use prompt in composer
                            </button>
                          </div>
                        </div>

                        <div className="rounded-[2rem] border border-white/[0.08] bg-white/[0.02] p-5">
                          <div className="text-[10px] font-black uppercase tracking-[0.3em] text-emerald-400/70">Canvas structure</div>
                          <div className="mt-4">
                            <SmartUiRenderer response={selectedExample.payload} />
                          </div>
                        </div>
                      </div>

                      <ExamplesPanel
                        selectedTitle={selectedExample.title}
                        onPreview={(example) => {
                          setSelectedExample(example);
                        }}
                        onUse={(example) => {
                          setSelectedExample(example);
                          setQuestion(example.prompt);
                          setPreviewPayload(example.payload);
                          setVisualizeData(null);
                          setActiveTab('visualize');
                          setStreamStatus('Sample visual loaded into the canvas. Edit the prompt or send it as-is.');
                        }}
                      />
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </section>

          <form onSubmit={handleProcess} className="learning-mode-composer mx-auto mt-6 w-full max-w-4xl sm:mt-10">
            <div className="relative group">
                {/* Visual Depth Glow */}
                <div className="absolute -inset-1 bg-gradient-to-r from-emerald-500/20 to-sky-500/20 rounded-3xl blur opacity-25 group-hover:opacity-50 transition duration-1000 group-hover:duration-200"></div>
                
                <div className="relative flex items-end gap-3 rounded-3xl border border-white/10 bg-black/40 p-2 backdrop-blur-2xl transition-all group-focus-within:border-emerald-500/30 max-sm:flex-col max-sm:items-stretch">
                    <textarea
                        value={question}
                        onChange={(e) => setQuestion(e.target.value)}
                        onKeyDown={(e) => {
                            if(e.key === 'Enter' && !e.shiftKey) {
                                e.preventDefault();
                                handleProcess();
                            }
                        }}
                        placeholder="What would you like to visualize? (e.g. How does Newtonian physics work?)"
                        className="custom-scrollbar min-h-[56px] flex-1 resize-none bg-transparent p-4 text-base font-medium text-white outline-none placeholder:text-white/20 sm:min-h-[64px] sm:text-lg"
                    />
                    
                    <button 
                        className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-500 text-black shadow-[0_0_30px_rgba(16,185,129,0.3)] transition-all hover:scale-110 active:scale-95 disabled:grayscale disabled:opacity-50 max-sm:w-full" 
                        type="submit" 
                        disabled={loading}
                    >
                        {loading ? <Loader className="animate-spin" size={20} /> : <Send size={20} />}
                    </button>
                </div>
            </div>
            
            <div className="mt-4 flex flex-wrap items-center justify-center gap-3 sm:gap-6">
                <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-emerald-500/40">
                    <Zap size={12} /> Streaming AI available
                </div>
                <div className="w-1 h-1 rounded-full bg-white/10" />
                <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-white/20">
                    <Sparkles size={12} /> Guided fallback ready
                </div>
            </div>
          </form>
        </main>
      </motion.div>
    </div>
  );
}
