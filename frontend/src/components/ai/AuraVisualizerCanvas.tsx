import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Play, Pause, RotateCcw, Share2, Download, Maximize2, 
  Activity, BarChart3, Binary, Layout, Video, HelpCircle,
  ChevronRight, FastForward, Info, Layers, Zap, ArrowRight, X
} from 'lucide-react';
import { SmartUiRenderer } from "./SmartUiRenderer";

// ─── Types ──────────────────────────────────────────────────────────────────

interface VisualizerProps {
    response: any;
    status: string;
}

// ─── Visualizer Stage Component ──────────────────────────────────────────────

export const AuraVisualizerCanvas: React.FC<VisualizerProps> = ({ response, status }) => {
  const [activeTab, setActiveTab] = useState<'animation' | 'chart' | 'diagram' | 'video' | 'interactive'>('animation');
  const [isPlaying, setIsPlaying] = useState(true);
  const [speed, setSpeed] = useState(1);

  const tabs = [
    { id: 'animation', icon: <Activity size={14} />, label: 'Animation' },
    { id: 'chart', icon: <BarChart3 size={14} />, label: 'Chart' },
    { id: 'diagram', icon: <Layers size={14} />, label: 'Diagram' },
    { id: 'video', icon: <Video size={14} />, label: 'Video' },
    { id: 'interactive', icon: <Zap size={14} />, label: 'Interactive' }
  ];

  const videoSimulations = [
    { id: 'v1', title: 'Photosynthesis Cycle', category: 'Science', color: 'emerald' },
    { id: 'v2', title: '2008 Market Liquidity', category: 'Finance', color: 'amber' },
    { id: 'v3', title: 'Merge Sort Recursion', category: 'DSA', color: 'sky' },
    { id: 'v4', title: 'Quantum Entanglement', category: 'Physics', color: 'violet' }
  ];

  return (
    <div className="w-full h-full flex flex-col bg-[#050505] rounded-[3rem] border border-white/10 overflow-hidden shadow-[0_0_80px_rgba(16,185,129,0.05)] group/canvas">
      {/* Cinematic Top Navigation */}
      <header className="h-16 px-8 border-b border-white/5 flex items-center justify-between bg-black/40 backdrop-blur-xl">
        <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-[10px] font-black uppercase tracking-[0.4em] text-white/40">Visualizer Engine v5.0</span>
        </div>
        
        <div className="flex items-center gap-1 p-1 rounded-full bg-white/5 border border-white/10">
            {tabs.map(tab => (
                <button 
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as any)}
                    className={`flex items-center gap-2 px-6 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === tab.id ? 'bg-emerald-500 text-black shadow-lg shadow-emerald-500/20' : 'text-white/40 hover:text-white'}`}
                >
                    {tab.icon}
                    {tab.label}
                </button>
            ))}
        </div>

        <div className="flex items-center gap-3">
            <button className="p-2 rounded-xl text-white/20 hover:text-white hover:bg-white/5 transition-all"><Info size={16} /></button>
            <button className="p-2 rounded-xl text-white/20 hover:text-white hover:bg-white/5 transition-all"><Maximize2 size={16} /></button>
        </div>
      </header>

      {/* Main Interaction Stage */}
      <div className="flex-1 relative overflow-hidden flex items-center justify-center p-12">
        {/* Background Grid HUD */}
        <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: 'radial-gradient(#10b981 1px, transparent 1px)', backgroundSize: '40px 40px' }} />
        
        <AnimatePresence mode="wait">
            {activeTab === 'video' ? (
                <motion.div 
                    key="video-hub"
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 1.05 }}
                    className="w-full h-full grid grid-cols-2 gap-6"
                >
                    {videoSimulations.map((v, i) => (
                        <motion.div 
                            key={v.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0, transition: { delay: i * 0.1 } }}
                            className="relative group/video rounded-[2rem] bg-white/[0.02] border border-white/5 p-8 flex flex-col justify-end overflow-hidden hover:border-emerald-500/30 transition-all cursor-pointer"
                        >
                            <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent z-10" />
                            
                            {/* Animated Video Preview Mock */}
                            <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-10 group-hover/video:opacity-30 transition-opacity">
                                <motion.div 
                                    animate={{ rotate: 360, scale: [1, 1.2, 1] }}
                                    transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
                                    className={`w-64 h-64 rounded-full border-[1px] border-emerald-500/40 border-dashed`}
                                />
                            </div>

                            <div className="relative z-20">
                                <div className={`text-[9px] font-black uppercase tracking-[0.3em] text-emerald-500 mb-2`}>{v.category} Neural Explainer</div>
                                <h4 className="text-lg font-black text-white mb-4">{v.title}</h4>
                                <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-emerald-500/60 group-hover/video:text-emerald-500 group-hover/video:translate-x-2 transition-all">
                                    Initiate Playback <ArrowRight size={12} />
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </motion.div>
            ) : (
                <motion.div 
                    key={activeTab + JSON.stringify(response)}
                    initial={{ opacity: 0, scale: 0.98, y: 10 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 1.02, y: -10 }}
                    transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                    className="w-full h-full flex items-center justify-center"
                >
                    {response ? (
                        <div className="w-full h-full relative">
                            <SmartUiRenderer response={response} />
                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center space-y-6 text-center max-w-sm">
                            <div className="w-20 h-20 rounded-[2.5rem] bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-500 mb-4">
                                <Activity size={40} className="animate-pulse" />
                            </div>
                            <h3 className="text-xl font-black text-white uppercase tracking-tighter">Ready for Synthesis</h3>
                            <p className="text-sm text-white/40 font-medium">Deploy a query to initiate a high-fidelity visual explanation orbit.</p>
                        </div>
                    )}
                </motion.div>
            )}
        </AnimatePresence>

        {/* Live Status Overlays */}
        <div className="absolute bottom-12 left-12 flex flex-col gap-2">
            <div className="px-4 py-1.5 rounded-full bg-black/80 backdrop-blur-md border border-emerald-500/30 flex items-center gap-3">
                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-[9px] font-black uppercase tracking-widest text-emerald-500/80">Render: {status}</span>
            </div>
        </div>
      </div>

      {/* Cinematic Control HUD */}
      <footer className="h-24 px-12 border-t border-white/5 bg-black/60 backdrop-blur-3xl flex items-center justify-between group-hover/canvas:translate-y-0 transition-transform">
        <div className="flex items-center gap-6">
            <button 
                onClick={() => setIsPlaying(!isPlaying)}
                className="w-14 h-14 rounded-2xl bg-emerald-500 text-black flex items-center justify-center hover:scale-110 active:scale-95 transition-all shadow-lg shadow-emerald-500/20"
            >
                {isPlaying ? <Pause size={24} /> : <Play size={24} />}
            </button>
            <button className="p-3 rounded-xl text-white/40 hover:text-white hover:bg-white/5 transition-all"><RotateCcw size={20} /></button>
            
            <div className="h-8 w-[1px] bg-white/10 mx-2" />
            
            <div className="flex items-center gap-3">
                <span className="text-[10px] font-black text-white/20 uppercase tracking-widest">Speed</span>
                <div className="flex gap-1 p-1 rounded-xl bg-white/5 border border-white/10">
                    {[1, 1.5, 2].map(s => (
                        <button 
                            key={s}
                            onClick={() => setSpeed(s)}
                            className={`px-3 py-1 rounded-lg text-[10px] font-black transition-all ${speed === s ? 'bg-white/10 text-white' : 'text-white/20 hover:text-white'}`}
                        >
                            x{s}
                        </button>
                    ))}
                </div>
            </div>
        </div>

        <div className="flex items-center gap-4">
            <button className="flex items-center gap-2 px-6 py-3 rounded-2xl bg-white/5 hover:bg-white/10 text-white/60 hover:text-white border border-white/10 transition-all font-black text-[10px] uppercase tracking-widest">
                <Download size={14} /> Export PPT
            </button>
            <button className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 flex items-center justify-center hover:bg-emerald-500 hover:text-black transition-all shadow-lg shadow-emerald-500/10">
                <Share2 size={20} />
            </button>
        </div>
      </footer>
    </div>
  );
};

export default AuraVisualizerCanvas;
