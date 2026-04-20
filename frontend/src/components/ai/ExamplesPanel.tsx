import React from 'react';
import { motion } from 'framer-motion';
import { 
  Atom, BookOpen, Calculator, 
  Orbit, ChevronRight, Zap, Target
} from 'lucide-react';

const SUBJECT_EXAMPLES = [
  {
    subject: "Physics",
    title: "Newtonian Mechanics",
    desc: "Real-time physics simulation of Force, Mass, and Acceleration (F = ma).",
    icon: <Orbit className="w-6 h-6 text-emerald-400" />,
    color: "emerald",
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
    icon: <Atom className="w-6 h-6 text-cyan-400" />,
    color: "cyan",
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
    icon: <Calculator className="w-6 h-6 text-sky-400" />,
    color: "sky",
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
    icon: <BookOpen className="w-6 h-6 text-violet-400" />,
    color: "violet",
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
    <div className="space-y-8 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-[11px] font-black uppercase tracking-[0.3em] text-white/20 mb-1">Pedagogical Discovery</h3>
          <h2 className="text-2xl font-black text-white tracking-tight">Interactive <span className="text-emerald-500">Subject Vault</span></h2>
        </div>
        <div className="flex items-center gap-2 px-3 py-1 bg-emerald-500/10 border border-emerald-500/20 rounded-full">
            <Zap size={12} className="text-emerald-500" />
            <span className="text-[10px] font-black uppercase text-emerald-500 tracking-widest">AURA Synthesis Active</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {SUBJECT_EXAMPLES.map((ex, idx) => (
          <motion.button
            key={ex.subject}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.1 }}
            onClick={() => onSelect(ex.payload)}
            className="group relative p-6 rounded-[2rem] bg-white/[0.03] border border-white/10 hover:border-emerald-500/30 transition-all text-left overflow-hidden"
          >
            {/* Background Glow */}
            <div className={`absolute top-0 right-0 w-32 h-32 bg-${ex.color}-500/5 blur-[50px] group-hover:bg-emerald-500/10 transition-all`} />
            
            <div className="relative z-10 flex flex-col h-full justify-between gap-4">
              <div className="flex items-start justify-between">
                <div className="p-3 rounded-2xl bg-white/5 border border-white/5 group-hover:border-emerald-500/20 transition-all">
                  {ex.icon}
                </div>
                <div className={`text-[10px] font-black uppercase tracking-widest text-${ex.color}-400/60`}>{ex.subject}</div>
              </div>
              
              <div>
                <h4 className="text-lg font-black text-white mb-2 group-hover:text-emerald-400 transition-colors">{ex.title}</h4>
                <p className="text-[13px] text-white/40 font-medium leading-relaxed mb-4">{ex.desc}</p>
                <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-emerald-500 opacity-60 group-hover:opacity-100 transition-all">
                  Launch Neural Model <ChevronRight size={14} className="group-hover:translate-x-1 transition-all" />
                </div>
              </div>
            </div>
          </motion.button>
        ))}
      </div>

      <div className="pt-8 flex items-center justify-center gap-8 border-t border-white/5 opacity-30 grayscale hover:grayscale-0 hover:opacity-100 transition-all cursor-help">
          <div className="flex items-center gap-2">
              <Target size={14} className="text-emerald-500" />
              <span className="text-[10px] font-black uppercase tracking-widest text-white">Curriculum Aligned</span>
          </div>
          <div className="flex items-center gap-2">
              <Zap size={14} className="text-sky-400" />
              <span className="text-[10px] font-black uppercase tracking-widest text-white">Live Synthesis</span>
          </div>
      </div>
    </div>
  );
};

export default ExamplesPanel;
