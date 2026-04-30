import React from 'react';
import { motion } from 'framer-motion';
import {
  Atom,
  BookOpen,
  Calculator,
  ChevronRight,
  Orbit,
  Play,
  Sparkles,
  type LucideIcon,
} from 'lucide-react';

export interface LearningExample {
  subject: string;
  title: string;
  desc: string;
  prompt: string;
  icon: LucideIcon;
  badgeClass: string;
  iconWrapClass: string;
  src: string;
  poster: string;
  payload: Record<string, unknown>;
}

export const LEARNING_EXAMPLES: LearningExample[] = [
  {
    subject: 'Physics',
    title: 'Newtonian Mechanics',
    desc: 'Force, mass, and acceleration explained as a replayable motion sequence.',
    prompt: 'Explain Newton’s second law with a step-by-step visualization for a school learner.',
    icon: Orbit,
    badgeClass: 'text-emerald-300',
    iconWrapClass: 'bg-emerald-500/12 text-emerald-300',
    src: 'https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerFun.mp4',
    poster: 'https://images.unsplash.com/photo-1532187863486-abf9dbad1b69?auto=format&fit=crop&w=1200&q=80',
    payload: {
      title: 'Newtonian Mechanics',
      summary: 'A replayable explanation of how force, mass, and acceleration change together.',
      view: 'single_canvas',
      components: [
        {
          type: 'simulation_canvas',
          title: 'Force and Motion',
          logic: 'physics_f_ma',
          parameters: { force: 50, mass: 10 },
        },
      ],
      insights: [
        'More force raises acceleration when mass stays constant.',
        'Higher mass lowers acceleration for the same force input.',
      ],
    },
  },
  {
    subject: 'Chemistry',
    title: 'Atomic Synthesis',
    desc: 'Molecules, bonds, and reactions presented with motion-led visual guidance.',
    prompt: 'Visualize a simple molecular structure and explain how atoms bond together.',
    icon: Atom,
    badgeClass: 'text-cyan-300',
    iconWrapClass: 'bg-cyan-500/12 text-cyan-300',
    src: 'https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyrides.mp4',
    poster: 'https://images.unsplash.com/photo-1530026405186-ed1f139313f8?auto=format&fit=crop&w=1200&q=80',
    payload: {
      title: 'Atomic Synthesis',
      summary: 'A structured molecule preview that links symbols, atoms, and bonding logic.',
      view: 'single_canvas',
      components: [
        {
          type: 'molecule_canvas',
          title: 'Molecular Map',
          molecules: ['H2O', 'C6H12O6', 'NaCl'],
        },
      ],
      insights: [
        'Chemical formulas become easier when the structure is mapped visually.',
      ],
    },
  },
  {
    subject: 'Maths',
    title: 'Geometric Logic',
    desc: 'Theorem explanations turned into paced, step-by-step visual proof.',
    prompt: 'Explain the Pythagorean theorem using a clear step-by-step visual proof.',
    icon: Calculator,
    badgeClass: 'text-sky-300',
    iconWrapClass: 'bg-sky-500/12 text-sky-300',
    src: 'https://storage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
    poster: 'https://images.unsplash.com/photo-1509228468518-180dd4864904?auto=format&fit=crop&w=1200&q=80',
    payload: {
      title: 'Geometric Logic',
      summary: 'A clean theorem ladder that walks from setup to conclusion.',
      view: 'single_canvas',
      components: [
        {
          type: 'step_ladder',
          title: 'Pythagorean Derivation',
          steps: [
            { title: 'Define Sides', desc: 'Mark the perpendicular sides as a and b.' },
            { title: 'Form the Relationship', desc: 'Connect the two sides to the hypotenuse with a² + b² = c².' },
            { title: 'Solve Visually', desc: 'Use the proof structure to derive c from the two known sides.' },
          ],
        },
      ],
      insights: [
        'The proof becomes easier once the triangle labels are fixed clearly.',
      ],
    },
  },
  {
    subject: 'English',
    title: 'Narrative Arc',
    desc: 'Plot progression, tension, and turning points laid out as a readable timeline.',
    prompt: 'Show the narrative arc of a story with exposition, conflict, climax, and resolution.',
    icon: BookOpen,
    badgeClass: 'text-violet-300',
    iconWrapClass: 'bg-violet-500/12 text-violet-300',
    src: 'https://storage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4',
    poster: 'https://images.unsplash.com/photo-1516979187457-637abb4f9353?auto=format&fit=crop&w=1200&q=80',
    payload: {
      title: 'Narrative Arc',
      summary: 'A timeline view that makes literary structure easy to scan.',
      view: 'single_canvas',
      components: [
        {
          type: 'narrative_timeline',
          title: 'Classic Literary Arc',
          events: [
            { title: 'Exposition', impact: 'Baseline' },
            { title: 'Rising Action', impact: 'High' },
            { title: 'Climax', impact: 'Maximum Peak' },
            { title: 'Resolution', impact: 'Closure' },
          ],
        },
      ],
      insights: [
        'Narrative tension is easier to explain once the key beats are ordered visually.',
      ],
    },
  },
];

interface ExamplesPanelProps {
  selectedTitle?: string;
  onPreview: (example: LearningExample) => void;
  onUse: (example: LearningExample) => void;
}

export const ExamplesPanel: React.FC<ExamplesPanelProps> = ({ selectedTitle, onPreview, onUse }) => {
  return (
    <div className="mx-auto max-w-7xl space-y-6 px-1 py-2 sm:px-2">
      <div className="flex flex-col items-center space-y-3 text-center">
        <div className="flex items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-4 py-1">
          <Sparkles size={14} className="text-emerald-400" />
          <span className="text-[10px] font-black uppercase tracking-[0.3em] text-emerald-300">Visualizer Examples</span>
        </div>
        <h2 className="text-3xl font-black tracking-tight text-white sm:text-4xl">
          Start from a <span className="text-emerald-400">clear visual example</span>
        </h2>
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        {LEARNING_EXAMPLES.map((example, index) => {
          const Icon = example.icon;
          const selected = selectedTitle === example.title;

          return (
            <motion.div
              key={example.subject}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.08 }}
              className={`overflow-hidden rounded-[2rem] border bg-[#050816] text-left shadow-[0_24px_80px_rgba(2,6,23,0.4)] transition ${
                selected ? 'border-emerald-400/35' : 'border-white/10'
              }`}
            >
              <div className="relative aspect-video overflow-hidden border-b border-white/10 bg-black">
                <video
                  className="h-full w-full object-cover"
                  src={example.src}
                  poster={example.poster}
                  autoPlay
                  muted
                  loop
                  playsInline
                  controls
                  preload="metadata"
                />
                <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-slate-950 to-transparent pointer-events-none" />
                <div className={`absolute right-4 top-4 rounded-full border border-white/10 bg-black/35 px-3 py-1 text-[10px] font-black uppercase tracking-[0.28em] ${example.badgeClass}`}>
                  {example.subject}
                </div>
                <div className="absolute bottom-4 left-4 flex items-center gap-2 rounded-full border border-white/10 bg-black/40 px-3 py-1.5 text-[11px] font-bold text-white/80 pointer-events-none">
                  <Play size={12} className="text-emerald-300" />
                  Playable preview
                </div>
              </div>

              <div className="space-y-5 p-5 sm:p-6">
                <div className="flex items-start gap-4">
                  <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-white/10 ${example.iconWrapClass}`}>
                    <Icon size={22} />
                  </div>
                  <div className="min-w-0">
                    <h4 className="text-xl font-black text-white sm:text-2xl">
                      {example.title}
                    </h4>
                    <p className="mt-2 text-sm leading-7 text-white/55">
                      {example.desc}
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-3 border-t border-white/10 pt-4">
                  <button
                    type="button"
                    onClick={() => onPreview(example)}
                    className="inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm font-bold text-white/80 transition hover:border-emerald-300/30 hover:bg-white/[0.08] hover:text-white"
                  >
                    Preview here
                  </button>
                  <button
                    type="button"
                    onClick={() => onUse(example)}
                    className="inline-flex items-center gap-2 rounded-2xl bg-emerald-500 px-4 py-3 text-sm font-black text-slate-950 transition hover:bg-emerald-400"
                  >
                    Load into canvas
                    <ChevronRight size={16} />
                  </button>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
};

export default ExamplesPanel;
