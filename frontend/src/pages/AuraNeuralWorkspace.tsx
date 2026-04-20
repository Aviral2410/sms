import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Bot, Layout, Search, Plus, Folder, Clock, 
  Settings, Zap, Database, Activity, Target, 
  ChevronRight, MoreHorizontal, Maximize2, 
  Mic, Paperclip, Send, Sparkles, Brain,
  Trash2, GripVertical, FileText, BarChart3,
  Globe, Code
} from 'lucide-react';
import { SmartUiRenderer } from "./SmartUiRenderer";
import { useStore } from '../../store/useStore';
import { v4 as uuidv4 } from 'uuid';

// ─── AURA v5.0 Components ───────────────────────────────────────────────────

const NeuralSidebar = ({ workspaces, chats, onNewChat, activeWorkspace, onSelectChat }) => (
  <aside className="w-72 h-full border-r border-white/5 bg-black/40 backdrop-blur-3xl flex flex-col z-30">
    <div className="p-8 pb-4">
      <div className="flex items-center gap-3 mb-8">
        <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-emerald-500 to-sky-500 p-0.5 shadow-[0_0_20px_rgba(16,185,129,0.3)]">
            <div className="w-full h-full bg-black rounded-2xl flex items-center justify-center">
                <Brain className="text-emerald-500" size={20} />
            </div>
        </div>
        <div className="flex flex-col">
            <span className="text-xs font-black uppercase tracking-[0.3em] text-white/20">System</span>
            <span className="text-xl font-black text-white tracking-tighter">AURA <span className="text-emerald-500">v5.0</span></span>
        </div>
      </div>

      <button 
        onClick={onNewChat}
        className="w-full group relative p-[1px] rounded-2xl overflow-hidden mb-8 active:scale-95 transition-all"
      >
        <div className="absolute inset-0 bg-gradient-to-r from-emerald-500 to-sky-500 opacity-60 group-hover:opacity-100 transition-opacity" />
        <div className="relative bg-black rounded-2xl py-3 px-4 flex items-center justify-center gap-2">
            <Plus size={16} className="text-emerald-500" />
            <span className="text-[11px] font-black uppercase tracking-widest text-white">Neural Directive</span>
        </div>
      </button>

      <section className="space-y-6">
        <div>
            <div className="flex items-center justify-between px-2 mb-3">
                <span className="text-[10px] font-black uppercase tracking-widest text-white/20">Workspaces</span>
                <Settings size={12} className="text-white/20 hover:text-white cursor-pointer transition-colors" />
            </div>
            <div className="space-y-1">
                {workspaces.map(ws => (
                    <button key={ws.id} className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-white/5 text-white/30 hover:text-white transition-all text-xs font-bold">
                        <Folder size={14} style={{ color: ws.color }} />
                        {ws.name}
                    </button>
                ))}
            </div>
        </div>
      </section>
    </div>

    <div className="flex-1 overflow-y-auto px-4 space-y-2 custom-scrollbar">
        <div className="px-4 py-2 text-[10px] font-black uppercase tracking-widest text-white/10">Registry Timeline</div>
        {chats.map(chat => (
            <button 
                key={chat.id}
                onClick={() => onSelectChat(chat.id)}
                className="w-full p-4 rounded-2xl border border-transparent hover:border-white/5 hover:bg-white/[0.02] transition-all text-left flex flex-col gap-1 group"
            >
                <div className="text-[12px] font-bold text-white/60 group-hover:text-white truncate">{chat.title || "Neural Session"}</div>
                <div className="text-[10px] text-white/10 font-black uppercase tracking-widest group-hover:text-emerald-500/40 transition-colors">
                    {new Date(chat.ts).toLocaleDateString()}
                </div>
            </button>
        ))}
    </div>

    <div className="p-6 border-t border-white/5">
        <div className="flex items-center gap-3 p-3 rounded-2xl bg-white/5 border border-white/5 cursor-pointer hover:bg-white/10 transition-all group">
            <Search size={14} className="text-white/20 group-hover:text-emerald-500" />
            <span className="text-[10px] font-black uppercase tracking-widest text-white/20">Global Search</span>
        </div>
    </div>
  </aside>
);

const IntelligenceLens = ({ memory, metrics }) => (
  <aside className="w-80 h-full border-l border-white/5 bg-black/40 backdrop-blur-3xl flex flex-col p-8 z-30">
    <div className="mb-10">
        <div className="flex items-center gap-2 mb-6">
            <Activity size={16} className="text-emerald-500" />
            <span className="text-[10px] font-black uppercase tracking-[0.3em] text-white/40">Neural Lens</span>
        </div>
        
        <div className="space-y-6">
            <div className="p-5 rounded-3xl bg-white/[0.02] border border-white/5">
                <div className="flex justify-between items-center mb-3">
                    <span className="text-[11px] font-bold text-white/40">Context Window</span>
                    <span className="text-[11px] font-black text-emerald-500">84% Capacity</span>
                </div>
                <div className="h-1 w-full bg-white/5 rounded-full overflow-hidden">
                    <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: '84%' }}
                        className="h-full bg-gradient-to-r from-emerald-500 to-sky-500"
                    />
                </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/5">
                    <div className="text-[10px] font-black text-white/20 uppercase mb-1">Tools</div>
                    <div className="text-lg font-black text-white">12 <span className="text-xs text-sky-500 underline underline-offset-4">Active</span></div>
                </div>
                <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/5">
                    <div className="text-[10px] font-black text-white/20 uppercase mb-1">Latency</div>
                    <div className="text-lg font-black text-white">42ms</div>
                </div>
            </div>
        </div>
    </div>

    <div>
        <div className="text-[11px] font-black uppercase tracking-[0.2em] text-white/20 mb-6">Strategic Insights</div>
        <div className="space-y-4">
            {[1, 2, 3].map(i => (
                <div key={i} className="flex gap-4 group cursor-pointer hover:translate-x-1 transition-transform">
                    <div className="w-1 bg-emerald-500/20 group-hover:bg-emerald-500 rounded-full transition-colors" />
                    <div>
                        <div className="text-[12px] font-bold text-white/60 mb-1 leading-tight">Identify school attendance growth patterns...</div>
                        <div className="text-[10px] font-black text-emerald-500 uppercase flex items-center gap-1 opacity-40 group-hover:opacity-100">
                            Apply Insight <ChevronRight size={10} />
                        </div>
                    </div>
                </div>
            ))}
        </div>
    </div>
    
    <div className="mt-auto pt-8 border-t border-white/5">
        <div className="flex items-center justify-between">
            <div className="flex flex-col">
                <span className="text-[10px] font-black text-white/20 uppercase">Model Select</span>
                <span className="text-[11px] font-black text-white tracking-widest">AURA V5-λ</span>
            </div>
            <Zap size={16} className="text-amber-500 fill-amber-500/20" />
        </div>
    </div>
  </aside>
);

// ─── Main Component ──────────────────────────────────────────────────────────

export const AuraNeuralWorkspace: React.FC = () => {
  const { session } = useStore();
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [workspaces] = useState([
    { id: 'ws1', name: 'Elite Operations', color: '#10b981' },
    { id: 'ws2', name: 'Strategic KPI Bank', color: '#8b5cf6' }
  ]);
  
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
        scrollRef.current.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
    }
  }, [messages]);

  const onSend = async () => {
    if (!input.trim() || loading) return;
    const msg = { id: uuidv4(), role: 'user', text: input, ts: Date.now() };
    setMessages(prev => [...prev, msg]);
    setInput('');
    setLoading(true);
    
    // Synthesis Logic triggered here...
    setTimeout(() => {
        setMessages(prev => [...prev, {
            id: uuidv4(),
            role: 'assistant',
            text: 'Neural synthesis complete. Initializing strategic visualization stage.',
            ts: Date.now(),
            response: {
                type: 'school_dashboard',
                data: { title: "Operations Hub", kpis: [
                    { title: "Revenue", value: "$1.2M", trend: "+12%" },
                    { title: "Attendance", value: "98.4%", trend: "Stable" }
                ]}
            }
        }]);
        setLoading(false);
    }, 1500);
  };

  return (
    <div className="fixed inset-0 bg-[#050505] text-white flex overflow-hidden font-sans selection:bg-emerald-500/30">
      {/* Background Neural Mesh */}
      <div className="absolute inset-0 z-0 opacity-40 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-emerald-500/10 blur-[120px] rounded-full animate-pulse" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-violet-500/10 blur-[120px] rounded-full" />
      </div>

      <NeuralSidebar workspaces={workspaces} chats={[]} onNewChat={() => {}} activeWorkspace="ws1" onSelectChat={() => {}} />

      {/* Main Synthesis Arena */}
      <main className="flex-1 flex flex-col relative z-10 bg-gradient-to-b from-transparent to-black/20">
        {/* Cinematic Header Overlay */}
        <header className="h-24 flex items-center justify-between px-12 border-b border-white/5 backdrop-blur-md">
            <div className="flex items-center gap-4">
                <Sparkles className="text-emerald-500" size={20} />
                <h2 className="text-xl font-black tracking-tighter">Strategic Synthesis <span className="text-white/20">/</span> <span className="text-emerald-500">0x24λ</span></h2>
            </div>
            <div className="flex items-center gap-6">
                <div className="flex items-center gap-1.5 p-1 rounded-full bg-white/5 border border-white/10">
                    <button className="px-4 py-1.5 rounded-full bg-emerald-500 text-black text-[10px] font-black uppercase tracking-widest">Active tab</button>
                    <button className="px-4 py-1.5 rounded-full text-white/40 text-[10px] font-black uppercase tracking-widest hover:text-white transition-colors">Workspace</button>
                </div>
                <div className="w-10 h-10 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
                    <UserCircle2 size={24} className="text-emerald-500" />
                </div>
            </div>
        </header>

        {/* Message Feed */}
        <div ref={scrollRef} className="flex-1 overflow-y-auto p-12 space-y-12 no-scrollbar scroll-smooth">
            <AnimatePresence initial={false}>
                {messages.length === 0 && (
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="h-full flex flex-col items-center justify-center text-center max-w-2xl mx-auto space-y-8">
                        <div className="w-24 h-24 rounded-[2.5rem] bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-500 mb-4 animate-bounce">
                            <Sparkles size={48} />
                        </div>
                        <h1 className="text-5xl font-black tracking-tighter leading-tight">Master your Strategic <br />Intelligence with <span className="text-emerald-500">AURA</span>.</h1>
                        <p className="text-xl text-white/40 font-medium leading-relaxed">Launch a neural directive to synthesize KPIs, learn complex concepts, or manage entire operations with elite AI architecture.</p>
                        <div className="grid grid-cols-2 gap-4 w-full mt-8">
                            {['Summarize Student Growth', 'Run Physics Simulation', 'Draft Fee Policy', 'Analyze Support Backlog'].map(t => (
                                <button key={t} className="p-6 rounded-3xl bg-white/[0.02] border border-white/5 text-left hover:border-emerald-500/30 hover:bg-white/[0.05] transition-all group">
                                    <div className="text-[10px] font-black uppercase tracking-widest text-emerald-500 mb-2">Preset Directive</div>
                                    <div className="text-sm font-bold text-white/70 group-hover:text-white">{t}</div>
                                </button>
                            ))}
                        </div>
                    </motion.div>
                )}

                {messages.map((m, idx) => (
                    <motion.div 
                        key={m.id} 
                        initial={{ opacity: 0, x: m.role === 'user' ? 20 : -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className={`flex gap-6 ${m.role === 'user' ? 'flex-row-reverse' : ''}`}
                    >
                        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0 border transition-all ${m.role === 'user' ? 'bg-emerald-500 text-black shadow-[0_0_20px_rgba(16,185,129,0.3)]' : 'bg-white/5 border-white/10 text-emerald-500'}`}>
                            {m.role === 'user' ? <GripVertical size={20} /> : <Zap size={20} />}
                        </div>
                        <div className={`max-w-[70%] space-y-4 ${m.role === 'user' ? 'items-end' : ''}`}>
                            {m.response ? (
                                <div className="p-1 rounded-[3rem] bg-gradient-to-br from-emerald-500/20 to-sky-500/20 border border-white/10 shadow-2xl">
                                    <div className="p-8 rounded-[2.8rem] bg-[#0A0A0A]">
                                        <SmartUiRenderer response={m.response} />
                                    </div>
                                </div>
                            ) : (
                                <div className={`p-8 rounded-[2.5rem] text-lg font-medium leading-relaxed shadow-xl ${m.role === 'user' ? 'bg-white/5 border border-white/10' : 'bg-[#0A0A0A] text-white/80 border border-white/5'}`}>
                                    {m.text}
                                </div>
                            )}
                            <div className="px-4 text-[10px] font-black text-white/10 uppercase tracking-widest">{new Date(m.ts).toLocaleTimeString()}</div>
                        </div>
                    </motion.div>
                ))}

                {loading && (
                    <div className="flex gap-6">
                        <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center">
                            <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 2, ease: "linear" }}>
                                <RefreshCcw size={20} className="text-emerald-500/40" />
                            </motion.div>
                        </div>
                        <div className="space-y-4 w-1/2">
                            <div className="h-6 bg-white/5 rounded-full animate-pulse w-full" />
                            <div className="h-6 bg-white/5 rounded-full animate-pulse w-3/4" />
                        </div>
                    </div>
                )}
            </AnimatePresence>
        </div>

        {/* Global Input Node */}
        <div className="p-12 pt-0">
            <div className="max-w-4xl mx-auto relative group">
                <div className="absolute -inset-1 bg-gradient-to-r from-emerald-500/20 to-sky-500/20 rounded-[3rem] blur opacity-25 group-focus-within:opacity-100 transition-opacity" />
                <div className="relative p-3 rounded-[3rem] bg-black/60 backdrop-blur-3xl border border-white/10 group-focus-within:border-emerald-500/40 transition-all flex flex-col">
                    <div className="flex items-center gap-4 px-6 pt-3 pb-1">
                        <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10">
                            <Database size={10} className="text-sky-400" />
                            <span className="text-[9px] font-black uppercase text-white/40 tracking-widest">Mem: 42GB</span>
                        </div>
                        <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10">
                            <Target size={10} className="text-emerald-400" />
                            <span className="text-[9px] font-black uppercase text-white/40 tracking-widest">Goal: Strategic</span>
                        </div>
                    </div>

                    <div className="flex items-center gap-4">
                        <textarea 
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyDown={(e) => { if(e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); onSend(); } }}
                            placeholder="Enter a neural command orbit (eg. /predict student growth)"
                            className="flex-1 bg-transparent border-none outline-none text-white placeholder-white/20 p-6 resize-none h-[80px] text-lg font-bold custom-scrollbar"
                        />
                        <div className="flex items-center gap-3 pr-6">
                            <button className="p-4 rounded-2xl bg-white/5 text-white/40 hover:bg-white/10 transition-all"><Paperclip size={20} /></button>
                            <button className="p-4 rounded-2xl bg-white/5 text-white/40 hover:bg-white/10 transition-all"><Mic size={20} /></button>
                            <button 
                                onClick={onSend}
                                className="w-16 h-16 rounded-[1.8rem] bg-emerald-500 text-black flex items-center justify-center hover:scale-110 active:scale-95 transition-all shadow-[0_0_40px_rgba(16,185,129,0.3)]"
                            >
                                <Send size={24} />
                            </button>
                        </div>
                    </div>
                </div>
                
                <div className="mt-4 flex items-center justify-center gap-8">
                    <div className="flex items-center gap-2 text-[10px] font-black text-white/20 uppercase tracking-[0.3em] hover:text-emerald-500 transition-colors cursor-help">
                        <Command size={12} /> Press Command + K for Palette
                    </div>
                    <div className="w-1.5 h-1.5 rounded-full bg-white/5" />
                    <div className="flex items-center gap-2 text-[10px] font-black text-white/20 uppercase tracking-[0.3em] hover:text-sky-500 transition-colors cursor-help">
                        <Maximize2 size={12} /> Focus Synthesis Lane
                    </div>
                </div>
            </div>
        </div>
      </main>

      <IntelligenceLens memory={84} metrics={{}} />
    </div>
  );
};

export default AuraNeuralWorkspace;
