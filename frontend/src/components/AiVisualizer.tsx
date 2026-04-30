import React, { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { Activity, Brain, PlayCircle, Sparkles } from 'lucide-react';
import { AssistantResponseView } from './ai/AssistantResponseView';
import { LEARNING_EXAMPLES, type LearningExample } from './ai/ExamplesPanel';
import { useRealtime } from './RealtimeHub';

type RenderedResponse = {
  type: string;
  data: Record<string, unknown> | null;
  meta?: Record<string, unknown> | null;
  thought?: string | null;
};

function normalizePayload(payload: any): RenderedResponse | null {
  if (!payload || typeof payload !== 'object') return null;
  if (typeof payload.type === 'string' && payload.data) {
    return payload as RenderedResponse;
  }
  return {
    type: 'smart_ui',
    data: payload,
  };
}

export const AiVisualizer: React.FC = () => {
  const { messages } = useRealtime();
  const [activeExample, setActiveExample] = useState<LearningExample>(LEARNING_EXAMPLES[0]);
  const [activePayload, setActivePayload] = useState<RenderedResponse | null>(
    normalizePayload(LEARNING_EXAMPLES[0]?.payload),
  );
  const [sourceLabel, setSourceLabel] = useState('Sample loaded');

  useEffect(() => {
    const lastMsg = messages[messages.length - 1];
    if (!lastMsg?.topic?.includes('ai/visualize')) return;

    try {
      const payload = JSON.parse(lastMsg.payload);
      const normalized = normalizePayload(payload);
      if (normalized) {
        setActivePayload(normalized);
        setSourceLabel('Live response');
      }
    } catch (e) {
      console.error('Visualizer payload could not be parsed', e);
    }
  }, [messages]);

  const sampleCards = useMemo(() => LEARNING_EXAMPLES.slice(0, 4), []);

  return (
    <section className="overflow-hidden rounded-[2.25rem] border border-white/10 bg-[linear-gradient(180deg,rgba(3,7,18,0.96),rgba(2,6,23,0.92))] shadow-[0_24px_80px_rgba(2,6,23,0.45)]">
      <div className="border-b border-white/10 px-6 py-5">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="text-[0.68rem] font-black uppercase tracking-[0.3em] text-emerald-300/70">AI Visualizer</div>
            <h2 className="mt-2 text-2xl font-black tracking-tight text-white">Response canvas and playable examples</h2>
          </div>
          <div className="inline-flex items-center gap-2 rounded-full border border-emerald-400/20 bg-emerald-500/10 px-4 py-2 text-[0.72rem] font-black uppercase tracking-[0.22em] text-emerald-200/80">
            <Activity size={14} />
            {sourceLabel}
          </div>
        </div>
      </div>

      <div className="grid gap-0 lg:grid-cols-[22rem_minmax(0,1fr)]">
        <aside className="border-b border-white/10 bg-black/15 lg:border-b-0 lg:border-r">
          <div className="space-y-4 p-5">
            <div>
              <div className="text-sm font-semibold text-white">Visualizer examples</div>
              <p className="mt-1 text-sm leading-6 text-white/45">Choose a sample to preview its motion and load its canvas structure.</p>
            </div>

            <div className="space-y-3">
              {sampleCards.map((example) => (
                <button
                  key={example.title}
                  type="button"
                  onClick={() => {
                    setActiveExample(example);
                    setActivePayload(normalizePayload(example.payload));
                    setSourceLabel('Sample loaded');
                  }}
                  className={`w-full rounded-[1.4rem] border px-4 py-4 text-left transition ${
                    activeExample.title === example.title
                      ? 'border-emerald-400/30 bg-emerald-500/[0.08] text-white'
                      : 'border-white/10 bg-white/[0.03] text-white/75 hover:bg-white/[0.06] hover:text-white'
                  }`}
                >
                  <div className="text-[0.68rem] font-black uppercase tracking-[0.2em] text-emerald-200/70">{example.subject}</div>
                  <div className="mt-2 text-sm font-semibold">{example.title}</div>
                  <div className="mt-1 text-sm leading-6 text-white/45">{example.desc}</div>
                </button>
              ))}
            </div>
          </div>
        </aside>

        <div className="grid gap-0 xl:grid-cols-[minmax(0,1.2fr)_minmax(20rem,24rem)]">
          <div className="min-h-[34rem] p-5">
            <div className="mb-4 flex items-center gap-2 text-sm font-semibold text-white">
              <Brain size={16} className="text-emerald-300" />
              Response canvas
            </div>
            <div className="rounded-[1.8rem] border border-white/10 bg-white/[0.03] p-4">
              {activePayload ? (
                <AssistantResponseView response={activePayload} />
              ) : (
                <div className="flex min-h-[20rem] flex-col items-center justify-center text-center text-white/45">
                  <Sparkles size={34} className="text-emerald-300/70" />
                  <div className="mt-4 text-lg font-semibold text-white/75">No visual response yet</div>
                  <div className="mt-2 max-w-md text-sm leading-6">Load a sample or wait for the next live AI visualization event.</div>
                </div>
              )}
            </div>
          </div>

          <aside className="border-t border-white/10 bg-black/10 p-5 xl:border-l xl:border-t-0">
            <div className="mb-4 flex items-center gap-2 text-sm font-semibold text-white">
              <PlayCircle size={16} className="text-emerald-300" />
              Playable preview
            </div>
            <motion.div
              key={activeExample.title}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="overflow-hidden rounded-[1.8rem] border border-white/10 bg-white/[0.03]"
            >
              <video
                className="aspect-video w-full object-cover"
                src={activeExample.src}
                poster={activeExample.poster}
                autoPlay
                muted
                loop
                playsInline
                controls
                preload="metadata"
              />
              <div className="p-4">
                <div className="text-[0.68rem] font-black uppercase tracking-[0.2em] text-emerald-200/70">{activeExample.subject}</div>
                <div className="mt-2 text-base font-semibold text-white">{activeExample.title}</div>
                <div className="mt-2 text-sm leading-6 text-white/50">{activeExample.prompt}</div>
              </div>
            </motion.div>
          </aside>
        </div>
      </div>
    </section>
  );
};

export default AiVisualizer;
