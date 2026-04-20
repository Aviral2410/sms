import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Sparkles, Zap, Brain, Activity, 
  Expand, Shrink, Target, Info,
  Command, Layers, Fingerprint
} from 'lucide-react';
import { SmartUiRenderer } from './ai/SmartUiRenderer';
import { useRealtime } from './RealtimeHub';

const GLASS_BG = "bg-white/[0.03] backdrop-blur-3xl border border-white/[0.08]";

export const AiVisualizer: React.FC = () => {
  const { messages } = useRealtime();
  const [activePayload, setActivePayload] = useState<any>(null);
  const [isLensActive, setIsLensActive] = useState(false);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  useEffect(() => {
    // Listen for AI visualization events (same as original logic but higher fidelity)
    const lastMsg = messages[messages.length - 1];
    if (lastMsg?.topic?.includes('ai/visualize')) {
      try {
        const payload = JSON.parse(lastMsg.payload);
        setActivePayload(payload);
      } catch (e) {
        console.error('LUMINA Error: Invalid neural payload', e);
      }
    }
  }, [messages]);

  const handleMouseMove = (e: React.MouseEvent) => {
    setMousePos({ x: e.clientX, y: e.clientY });
  };

  return (
    <div 
        onMouseMove={handleMouseMove}
        className="relative min-h-screen w-full bg-[#050505] overflow-hidden flex flex-col font-sans selection:bg-emerald-500/30"
    >
      {/* --- LUMINA NEURAL MESH BACKGROUND --- */}
      <div className="absolute inset-0 pointer-events-none opacity-20">
          <div className="absolute inset-0" 
               style={{ 
                   backgroundImage: `radial-gradient(circle at 2px 2px, rgba(16,185,129,0.15) 1px, transparent 0)`,
                   backgroundSize: '40px 40px'
               }} 
          />
          <motion.div 
            animate={{ 
                background: `radial-gradient(600px circle at ${mousePos.x}px ${mousePos.y}px, rgba(16,185,129,0.06), transparent 80%)` 
            }}
            className="absolute inset-0" 
          />
      </div>

      {/* --- HEADER NAVIGATION --- */}
      <header className="h-20 flex-shrink-0 flex items-center justify-between px-10 border-b border-white/5 relative z-20 backdrop-blur-md bg-black/40">
        <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-emerald-500 flex items-center justify-center shadow-[0_0_30px_rgba(16,185,129,0.4)]">
                <Brain size={20} className="text-black" />
            </div>
            <div>
                <h1 className="text-[10px] font-black uppercase tracking-[0.4em] text-emerald-500/60 leading-none mb-1">Visual Intelligence Platform</h1>
                <h2 className="text-xl font-black text-white tracking-tight">LUMINA <span className="text-emerald-500">Neural Canvas</span></h2>
            </div>
        </div>

        <div className="flex items-center gap-6">
            <div className="hidden md:flex items-center gap-8 text-[11px] font-black uppercase tracking-widest text-white/30">
                <span className="flex items-center gap-2 hover:text-emerald-400 transition-colors cursor-pointer"><Target size={14} /> Quantum Analysis</span>
                <span className="flex items-center gap-2 hover:text-emerald-400 transition-colors cursor-pointer"><Layers size={14} /> Neural Layers</span>
            </div>
            <div className="h-8 w-[1px] bg-white/10" />
            <button 
                onClick={() => setIsLensActive(!isLensActive)}
                className={`p-3 rounded-2xl transition-all border ${isLensActive ? 'bg-emerald-500 text-black border-emerald-500' : 'bg-white/5 text-white/40 border-white/10 hover:bg-white/10'}`}
            >
                <Fingerprint size={18} />
            </button>
        </div>
      </header>

      {/* --- MAIN CONTENT AREA --- */}
      <main className="flex-1 relative z-10 p-10 overflow-y-auto custom-scrollbar flex flex-col items-center">
        {!activePayload ? (
            <motion.div 
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="max-w-2xl text-center py-40 space-y-8"
            >
                <div className="w-24 h-24 rounded-[2rem] bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mx-auto mb-8 animate-pulse">
                    <Command size={40} className="text-emerald-400" />
                </div>
                <h1 className="text-5xl font-black text-white tracking-tighter">Ready for <span className="text-emerald-500">Stimulation</span>.</h1>
                <p className="text-xl text-white/30 font-medium leading-relaxed">
                    AURA is standing by. Give a directive in the assistant to project neural simulations, 
                    physics models, and high-fidelity data onto the LUMINA canvas.
                </p>
                <div className="flex justify-center gap-4 text-[10px] uppercase font-black tracking-widest text-emerald-500/40">
                    <span className="flex items-center gap-2"><Zap size={12} /> Low Latency Stream</span>
                    <span className="flex items-center gap-2"><Activity size={12} /> Neural Mesh v2.1</span>
                </div>
            </motion.div>
        ) : (
            <div className="w-full max-w-6xl">
                <SmartUiRenderer response={activePayload} />
            </div>
        )}

        {/* --- DYNAMIC NEURAL LENS OVERLAY --- */}
        <AnimatePresence>
            {isLensActive && (
                <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 pointer-events-none z-50 overflow-hidden"
                >
                    <div className="absolute top-0 right-0 p-10 flex flex-col items-end gap-2">
                        <div className="bg-emerald-500 text-black px-3 py-1 rounded-full text-[10px] font-black uppercase">Lens Active</div>
                    </div>
                    {/* Hover Meta Data following mouse */}
                    <motion.div 
                        animate={{ x: mousePos.x + 20, y: mousePos.y + 20 }}
                        className={`p-4 rounded-2xl ${GLASS_BG} backdrop-blur-md shadow-2xl border-emerald-500/20 min-w-[200px] pointer-events-none`}
                    >
                        <div className="flex items-center gap-2 mb-2">
                            <Info size={12} className="text-emerald-400" />
                            <span className="text-[9px] font-black uppercase text-emerald-400 tracking-widest">Neural Metadata</span>
                        </div>
                        <div className="space-y-1">
                            <div className="text-[11px] text-white/90 font-bold">Latency: 12ms</div>
                            <div className="text-[11px] text-white/50 font-medium">Confidence: 0.9982</div>
                            <div className="text-[11px] text-white/50 font-medium">Model: Gemini 2.0-F</div>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
      </main>

      {/* --- FOOTER STATUS --- */}
      <footer className="h-12 flex-shrink-0 px-10 flex items-center justify-between border-t border-white/5 relative z-20 bg-black/40 text-[9px] font-black uppercase tracking-[0.2em] text-white/20">
          <div className="flex items-center gap-6">
              <span className="flex items-center gap-2"><Activity size={10} className="text-emerald-500" /> System: Stable</span>
              <span className="flex items-center gap-2"><Layers size={10} className="text-sky-400" /> Buffer: Empty</span>
          </div>
          <div className="flex items-center gap-4">
              <span className="text-emerald-500/40">LUMINA NEURAL CANVAS v1.1.0-λ</span>
          </div>
      </footer>
    </div>
  );
};
