import React, { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { Activity, Brain, PlayCircle, Video } from 'lucide-react';
import { AssistantResponseView } from './AssistantResponseView';
import { LEARNING_EXAMPLES, type LearningExample } from './ExamplesPanel';

interface VisualizerProps {
  response: any;
  status: string;
}

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

export const AuraVisualizerCanvas: React.FC<VisualizerProps> = ({ response, status }) => {
  const [tab, setTab] = useState<'canvas' | 'examples'>('canvas');
  const [activeExample, setActiveExample] = useState<LearningExample>(LEARNING_EXAMPLES[0]);

  const activeResponse = useMemo(() => {
    const normalizedIncoming = normalizePayload(response);
    if (normalizedIncoming) {
      return normalizedIncoming;
    }
    return normalizePayload(activeExample.payload);
  }, [activeExample.payload, response]);

  return (
    <div className="flex h-full min-h-[42rem] flex-col overflow-hidden rounded-[2.5rem] border border-white/10 bg-[linear-gradient(180deg,rgba(3,7,18,0.96),rgba(2,6,23,0.92))] shadow-[0_24px_80px_rgba(2,6,23,0.45)]">
      <header className="border-b border-white/10 px-6 py-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="text-[0.68rem] font-black uppercase tracking-[0.3em] text-emerald-300/70">Visualizer Canvas</div>
            <h2 className="mt-2 text-2xl font-black tracking-tight text-white">Playable examples and live answer rendering</h2>
          </div>
          <div className="flex items-center gap-2 rounded-full border border-emerald-400/20 bg-emerald-500/10 px-4 py-2 text-[0.72rem] font-black uppercase tracking-[0.22em] text-emerald-200/80">
            <Activity size={14} />
            {status || 'Ready'}
          </div>
        </div>

        <div className="mt-4 flex gap-2">
          <button
            type="button"
            onClick={() => setTab('canvas')}
            className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
              tab === 'canvas' ? 'bg-emerald-500 text-slate-950' : 'border border-white/10 bg-white/[0.04] text-white/75 hover:bg-white/[0.08] hover:text-white'
            }`}
          >
            Canvas
          </button>
          <button
            type="button"
            onClick={() => setTab('examples')}
            className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
              tab === 'examples' ? 'bg-emerald-500 text-slate-950' : 'border border-white/10 bg-white/[0.04] text-white/75 hover:bg-white/[0.08] hover:text-white'
            }`}
          >
            Examples
          </button>
        </div>
      </header>

      {tab === 'canvas' ? (
        <div className="grid min-h-0 flex-1 gap-0 xl:grid-cols-[minmax(0,1fr)_24rem]">
          <main className="min-h-0 p-5">
            <div className="mb-4 flex items-center gap-2 text-sm font-semibold text-white">
              <Brain size={16} className="text-emerald-300" />
              Rendered response
            </div>
            <div className="h-full overflow-auto rounded-[1.8rem] border border-white/10 bg-white/[0.03] p-4">
              {activeResponse ? (
                <AssistantResponseView response={activeResponse} />
              ) : (
                <div className="flex min-h-[22rem] flex-col items-center justify-center text-center text-white/45">
                  <Brain size={34} className="text-emerald-300/70" />
                  <div className="mt-4 text-lg font-semibold text-white/75">No answer in the canvas yet</div>
                  <div className="mt-2 max-w-md text-sm leading-6">Load an example or wait for the next AI-generated visual response.</div>
                </div>
              )}
            </div>
          </main>

          <aside className="border-t border-white/10 bg-black/10 p-5 xl:border-l xl:border-t-0">
            <div className="mb-4 flex items-center gap-2 text-sm font-semibold text-white">
              <PlayCircle size={16} className="text-emerald-300" />
              Current example
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
                <div className="mt-2 text-sm leading-6 text-white/50">{activeExample.desc}</div>
              </div>
            </motion.div>
          </aside>
        </div>
      ) : (
        <div className="grid min-h-0 flex-1 gap-5 overflow-auto p-5 md:grid-cols-2">
          {LEARNING_EXAMPLES.map((example) => (
            <div key={example.title} className="overflow-hidden rounded-[1.8rem] border border-white/10 bg-white/[0.03]">
              <video
                className="aspect-video w-full object-cover"
                src={example.src}
                poster={example.poster}
                autoPlay
                muted
                loop
                playsInline
                controls
                preload="metadata"
              />
              <div className="space-y-4 p-5">
                <div>
                  <div className="text-[0.68rem] font-black uppercase tracking-[0.2em] text-emerald-200/70">{example.subject}</div>
                  <div className="mt-2 text-lg font-semibold text-white">{example.title}</div>
                  <div className="mt-2 text-sm leading-6 text-white/50">{example.prompt}</div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setActiveExample(example);
                    setTab('canvas');
                  }}
                  className="inline-flex items-center gap-2 rounded-2xl bg-emerald-500 px-4 py-3 text-sm font-black text-slate-950 transition hover:bg-emerald-400"
                >
                  <Video size={16} />
                  Load into canvas
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AuraVisualizerCanvas;
