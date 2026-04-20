import React from 'react';
import { motion } from 'framer-motion';
import { 
  Atom, BookOpen, Calculator, 
  Orbit, ChevronRight, Zap, Target,
  Play, Activity
} from 'lucide-react';

const AnimatedSubjectPreview = ({ subject, color }: { subject: string, color: string }) => {
  const isPhysics = subject === "Physics";
  const isChemistry = subject === "Chemistry";
  const isMaths = subject === "Maths";

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {/* Cinematic Deep Background */}
      <div className={`absolute inset-0 bg-gradient-to-br from-${color}-500/5 to-transparent`} />
      
      {/* Subject-Specific 'Video' Logic */}
      {isPhysics && (
        <motion.div 
            animate={{ rotate: [30, -30, 30] }}
            transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
            className="absolute top-10 left-1/2 -translate-x-1/2 flex flex-col items-center"
        >
            <div className="w-1 h-32 bg-white/10 rounded-full" />
            <div className={`w-8 h-8 rounded-full bg-${color}-500 shadow-[0_0_30px_rgba(16,185,129,0.5)]`} />
        </motion.div>
      )}

      {isChemistry && (
        <div className="absolute inset-0 flex items-center justify-center">
            <motion.div 
                animate={{ rotate: 360 }}
                transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
                className="relative w-40 h-40 border border-white/5 rounded-full"
            >
                <motion.div 
                    animate={{ scale: [1, 1.2, 1] }} 
                    transition={{ duration: 2, repeat: Infinity }}
                    className={`absolute top-0 left-1/2 -translate-x-1/2 w-4 h-4 rounded-full bg-${color}-400 shadow-[0_0_20px_#22d3ee]`}
                />
            </motion.div>
            <div className="absolute w-8 h-8 rounded-full bg-white/10 blur-xl" />
        </div>
      )}

      {isMaths && (
        <div className="absolute inset-0 flex items-center justify-center gap-1">
            {[...Array(12)].map((_, i) => (
                <motion.div 
                    key={i}
                    animate={{ height: [20, 60, 20] }}
                    transition={{ duration: 1.5, repeat: Infinity, delay: i * 0.1 }}
                    className={`w-1 rounded-full bg-${color}-500/30`}
                />
            ))}
        </div>
      )}

      {!isPhysics && !isChemistry && !isMaths && (
        <motion.div 
            animate={{ x: [-100, 100] }}
            transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
            className={`absolute top-1/2 w-full h-[2px] bg-gradient-to-r from-transparent via-${color}-500/50 to-transparent`}
        />
      )}

      {/* Gloss Overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-white/5 opacity-20" />
    </div>
  );
};

const SUBJECT_EXAMPLES = [
  {
    subject: "Physics",
    title: "Newtonian Mechanics",
    desc: "Real-time physics simulation of Force, Mass, and Acceleration (F = ma).",
    icon: <Orbit className="w-8 h-8 text-emerald-400" />,
    color: "emerald",
    animation: "pendulum",
    payload: {
      type: "simulation_canvas",
      title: "Newtonian Engine",
      logic: "physics_f_ma",
      parameters: { force: 50, mass: 10 }
    }
  },
  {
    subject: "Chemistry",
    title: "Atomic Synthesis",
    desc: "3D Visualizations of molecular structures and bonding patterns.",
    icon: <Atom className="w-8 h-8 text-cyan-400" />,
    color: "cyan",
    animation: "electron_cloud",
    payload: {
      type: "molecule_canvas",
      title: "Molecular Map",
      molecules: ["H2O", "C6H12O6", "NaCl"]
    }
  },
  {
    subject: "Maths",
    title: "Geometric Logic",
    desc: "Step-by-step visual proofs and derivations of fundamental theorems.",
    icon: <Calculator className="w-8 h-8 text-sky-400" />,
    color: "sky",
    animation: "fractal_pulse",
    payload: {
      type: "step_ladder",
      title: "Pythagorean Derivation",
      steps: [
        { title: "Define Sides", desc: "For a right-angled triangle, sides are a and b." },
        { title: "Form Equation", desc: "a² + b² = c²" },
        { title: "Solve Hypotenuse", desc: "c = √(a² + b²)" }
      ]
    }
  },
  {
    subject: "English",
    title: "Narrative Arc",
    desc: "Interactive mapping of literary structures and narrative timelines.",
    icon: <BookOpen className="w-8 h-8 text-violet-400" />,
    color: "violet",
    animation: "pulse_line",
    payload: {
      type: "narrative_timeline",
      title: "Classic Literary Arc",
      events: [
        { title: "Exposition", impact: "Baseline" },
        { title: "Rising Action", impact: "High" },
        { title: "Climax", impact: "Maximum Peak" }
      ]
    }
  }
];

interface ExamplesPanelProps {
  onSelect: (payload: any) => void;
}

export const ExamplesPanel: React.FC<ExamplesPanelProps> = ({ onSelect }) => {
  return (
    <div className="space-y-12 p-8 max-w-7xl mx-auto">
      <div className="flex flex-col items-center text-center space-y-4">
        <div className="px-4 py-1 bg-emerald-500/10 border border-emerald-500/20 rounded-full flex items-center gap-2">
            <Activity size={14} className="text-emerald-500 animate-pulse" />
            <span className="text-[10px] font-black uppercase tracking-[0.3em] text-emerald-500">Neural Gallery Mode</span>
        </div>
        <h2 className="text-4xl font-black text-white tracking-tighter">Choose Your <span className="text-emerald-500 underline decoration-emerald-500/30 underline-offset-8">Simulation</span>.</h2>
        <p className="text-white/40 text-lg max-w-2xl">High-fidelity pedagogical synthesis projecting complex concepts into interactable neural models.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {SUBJECT_EXAMPLES.map((ex, idx) => (
          <motion.button
            key={ex.subject}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: idx * 0.15 }}
            onClick={() => onSelect(ex.payload)}
            className="group relative h-80 rounded-[3rem] bg-[#0A0A0A] border border-white/5 hover:border-emerald-500/40 transition-all text-left overflow-hidden shadow-2xl"
          >
            {/* SUBJECT ANIMATION PREVIEW (Video-like) */}
            <AnimatedSubjectPreview subject={ex.subject} color={ex.color} />
            
            <div className={`absolute top-0 right-0 p-8 text-[12px] font-black uppercase tracking-[0.4em] text-${ex.color}-400/40 group-hover:text-emerald-400 transition-colors`}>
                {ex.subject}
            </div>

            <div className="absolute inset-0 p-10 flex flex-col justify-end bg-gradient-to-t from-black via-black/40 to-transparent">
                <div className="flex items-center gap-6 mb-6">
                    <div className="w-16 h-16 rounded-[1.5rem] bg-white/5 border border-white/10 flex items-center justify-center group-hover:scale-110 group-hover:bg-emerald-500 group-hover:text-black transition-all duration-500">
                        {ex.icon}
                    </div>
                    <div>
                        <h4 className="text-2xl font-black text-white mb-1 group-hover:text-emerald-400 transition-colors">{ex.title}</h4>
                        <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-white/30">
                            <Play size={10} /> Previewing Live Engine
                        </div>
                    </div>
                </div>
                
                <p className="text-white/40 text-sm font-medium leading-relaxed mb-8 max-w-sm group-hover:text-white/60 transition-colors">
                    {ex.desc}
                </p>

                <div className="flex items-center justify-between">
                    <div className="h-[1px] flex-1 bg-white/5 group-hover:bg-emerald-500/20 transition-all" />
                    <div className="pl-6 flex items-center gap-3 text-[11px] font-black uppercase tracking-[0.2em] text-emerald-500 opacity-60 group-hover:opacity-100 group-hover:translate-x-2 transition-all">
                        Launch Neural Stream <ChevronRight size={16} />
                    </div>
                </div>
            </div>
          </motion.button>
        ))}
      </div>
    </div>
  );
};

export default ExamplesPanel;
