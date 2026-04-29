import React from 'react';
import { motion } from 'framer-motion';
import {
  Activity,
  Atom,
  BookOpen,
  Calculator,
  ChevronRight,
  Orbit,
  Play,
} from 'lucide-react';

const SUBJECT_EXAMPLES = [
  {
    subject: 'Physics',
    title: 'Newtonian Mechanics',
    desc: 'Show force, mass, and acceleration as a narrated motion sequence students can replay.',
    icon: Orbit,
    badgeClass: 'text-emerald-300',
    iconWrapClass: 'bg-emerald-500/12 text-emerald-300 group-hover:bg-emerald-400 group-hover:text-slate-950',
    src: 'https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerFun.mp4',
    poster: 'https://images.unsplash.com/photo-1532187863486-abf9dbad1b69?auto=format&fit=crop&w=1200&q=80',
    payload: {
      type: 'simulation_canvas',
      title: 'Newtonian Engine',
      logic: 'physics_f_ma',
      parameters: { force: 50, mass: 10 },
    },
  },
  {
    subject: 'Chemistry',
    title: 'Atomic Synthesis',
    desc: 'Use motion-led explainers for molecules, bonds, and reactions instead of static diagrams.',
    icon: Atom,
    badgeClass: 'text-cyan-300',
    iconWrapClass: 'bg-cyan-500/12 text-cyan-300 group-hover:bg-cyan-400 group-hover:text-slate-950',
    src: 'https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyrides.mp4',
    poster: 'https://images.unsplash.com/photo-1530026405186-ed1f139313f8?auto=format&fit=crop&w=1200&q=80',
    payload: {
      type: 'molecule_canvas',
      title: 'Molecular Map',
      molecules: ['H2O', 'C6H12O6', 'NaCl'],
    },
  },
  {
    subject: 'Maths',
    title: 'Geometric Logic',
    desc: 'Turn theorem explanations into a paced visual proof students can follow step by step.',
    icon: Calculator,
    badgeClass: 'text-sky-300',
    iconWrapClass: 'bg-sky-500/12 text-sky-300 group-hover:bg-sky-400 group-hover:text-slate-950',
    src: 'https://storage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
    poster: 'https://images.unsplash.com/photo-1509228468518-180dd4864904?auto=format&fit=crop&w=1200&q=80',
    payload: {
      type: 'step_ladder',
      title: 'Pythagorean Derivation',
      steps: [
        { title: 'Define Sides', desc: 'For a right-angled triangle, label the shorter sides as a and b.' },
        { title: 'Form Equation', desc: 'Relate the two sides to the hypotenuse with a² + b² = c².' },
        { title: 'Solve Hypotenuse', desc: 'Use the visual proof to derive c = √(a² + b²).' },
      ],
    },
  },
  {
    subject: 'English',
    title: 'Narrative Arc',
    desc: 'Visualize plot progression, character tension, and turning points for literature lessons.',
    icon: BookOpen,
    badgeClass: 'text-violet-300',
    iconWrapClass: 'bg-violet-500/12 text-violet-300 group-hover:bg-violet-400 group-hover:text-slate-950',
    src: 'https://storage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4',
    poster: 'https://images.unsplash.com/photo-1516979187457-637abb4f9353?auto=format&fit=crop&w=1200&q=80',
    payload: {
      type: 'narrative_timeline',
      title: 'Classic Literary Arc',
      events: [
        { title: 'Exposition', impact: 'Baseline' },
        { title: 'Rising Action', impact: 'High' },
        { title: 'Climax', impact: 'Maximum Peak' },
      ],
    },
  },
] as const;

interface ExamplesPanelProps {
  onSelect: (payload: any) => void;
}

export const ExamplesPanel: React.FC<ExamplesPanelProps> = ({ onSelect }) => {
  return (
    <div className="mx-auto max-w-7xl space-y-8 px-1 py-2 sm:space-y-10 sm:px-2">
      <div className="flex flex-col items-center space-y-4 text-center">
        <div className="flex items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-4 py-1">
          <Activity size={14} className="animate-pulse text-emerald-400" />
          <span className="text-[10px] font-black uppercase tracking-[0.3em] text-emerald-300">Example Studio</span>
        </div>
        <h2 className="text-3xl font-black tracking-tight text-white sm:text-4xl">
          Start with a <span className="text-emerald-400">guided visual prompt</span>
        </h2>
        <p className="max-w-2xl text-sm leading-7 text-white/55 sm:text-base">
          These examples use short motion references so the AI visualizer feels more like a real explainer studio than a static demo.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        {SUBJECT_EXAMPLES.map((example, index) => {
          const Icon = example.icon;

          return (
            <motion.button
              key={example.subject}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.08 }}
              onClick={() => onSelect(example.payload)}
              className="group overflow-hidden rounded-[2rem] border border-white/10 bg-[#050816] text-left shadow-[0_24px_80px_rgba(2,6,23,0.4)] transition hover:border-emerald-400/30 hover:bg-[#081020]"
            >
              <div className="relative aspect-video overflow-hidden border-b border-white/10 bg-black">
                <video
                  className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.02]"
                  src={example.src}
                  poster={example.poster}
                  autoPlay
                  muted
                  loop
                  playsInline
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/30 to-transparent" />
                <div className={`absolute right-4 top-4 rounded-full border border-white/10 bg-black/35 px-3 py-1 text-[10px] font-black uppercase tracking-[0.28em] ${example.badgeClass}`}>
                  {example.subject}
                </div>
                <div className="absolute bottom-4 left-4 flex items-center gap-2 rounded-full border border-white/10 bg-black/40 px-3 py-1.5 text-[11px] font-bold text-white/80">
                  <Play size={12} className="text-emerald-300" />
                  Motion reference
                </div>
              </div>

              <div className="space-y-5 p-5 sm:p-6">
                <div className="flex items-start gap-4">
                  <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-white/10 transition ${example.iconWrapClass}`}>
                    <Icon size={22} />
                  </div>
                  <div className="min-w-0">
                    <h4 className="text-xl font-black text-white transition group-hover:text-emerald-300 sm:text-2xl">
                      {example.title}
                    </h4>
                    <p className="mt-2 text-sm leading-7 text-white/55">
                      {example.desc}
                    </p>
                  </div>
                </div>

                <div className="flex items-center justify-between gap-3 border-t border-white/10 pt-4 text-[11px] font-black uppercase tracking-[0.22em] text-emerald-300/80">
                  <span>Launch example</span>
                  <span className="inline-flex items-center gap-2 transition group-hover:translate-x-1">
                    Open in canvas
                    <ChevronRight size={16} />
                  </span>
                </div>
              </div>
            </motion.button>
          );
        })}
      </div>
    </div>
  );
};

export default ExamplesPanel;
