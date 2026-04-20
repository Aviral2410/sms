import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Bot, Layout, Search, Plus, Folder, Clock, 
  Settings, Zap, Database, Activity, Target, 
  ChevronRight, MoreHorizontal, Maximize2, 
  Mic, Paperclip, Send, Sparkles, Brain,
  Trash2, GripVertical, FileText, BarChart3,
  Globe, Code, UserCircle2, RefreshCcw, Command, X, MessageSquare
} from 'lucide-react';
import { SmartUiRenderer } from "../components/ai/SmartUiRenderer";
import { AuraVisualizerCanvas } from "../components/ai/AuraVisualizerCanvas";
import { useStore } from '../store/useStore';
import { v4 as uuidv4 } from 'uuid';

// ─── Types ──────────────────────────────────────────────────────────────────

interface Workspace {
    id: string;
    name: string;
    color: string;
}

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  text?: string;
  response?: any;
  ts: number;
  thought?: string;
}

interface SidebarProps {
    workspaces: Workspace[];
    chats: any[];
    onNewChat: () => void;
    activeWorkspace: string | null;
    onSelectChat: (id: string) => void;
}

// ─── AURA v5.0 Components ───────────────────────────────────────────────────

const NeuralSidebar: React.FC<SidebarProps> = ({ workspaces, chats, onNewChat, activeWorkspace, onSelectChat }) => (
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
                    <button 
                        key={ws.id} 
                        className={`w-full flex items-center gap-3 p-3 rounded-xl hover:bg-white/5 transition-all text-xs font-bold ${activeWorkspace === ws.id ? 'bg-white/5 text-white' : 'text-white/30'}`}
                    >
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
                key={chat.conversationId}
                onClick={() => onSelectChat(chat.conversationId)}
                className="w-full p-4 rounded-2xl border border-transparent hover:border-white/5 hover:bg-white/[0.02] transition-all text-left flex flex-col gap-1 group"
            >
                <div className="text-[12px] font-bold text-white/60 group-hover:text-white truncate">{chat.title || "Neural Session"}</div>
                <div className="text-[10px] text-white/10 font-black uppercase tracking-widest group-hover:text-emerald-500/40 transition-colors">
                    {new Date(chat.updatedAt || chat.createdAt).toLocaleDateString()}
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

const IntelligenceLens: React.FC<{ memory: number; tools: number }> = ({ memory, tools }) => (
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
                    <span className="text-[11px] font-black text-emerald-500">{memory}% Capacity</span>
                </div>
                <div className="h-1 w-full bg-white/5 rounded-full overflow-hidden">
                    <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: `${memory}%` }}
                        className="h-full bg-gradient-to-r from-emerald-500 to-sky-500"
                    />
                </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/5">
                    <div className="text-[10px] font-black text-white/20 uppercase mb-1">Tools</div>
                    <div className="text-lg font-black text-white">{tools} <span className="text-xs text-sky-500 underline underline-offset-4">Active</span></div>
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
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const [showPalette, setShowPalette] = useState(false);
  const [isThinking, setIsThinking] = useState(false);
  const [workspaces] = useState<Workspace[]>([
    { id: '00000000-0000-0000-0000-000000000000', name: 'Elite Operations', color: '#10b981' },
    { id: '11111111-1111-1111-1111-111111111111', name: 'Strategic KPI Bank', color: '#8b5cf6' }
  ]);
  const [chats, setChats] = useState<any[]>([]);

  const scrollRef = useRef<HTMLDivElement>(null);

  const lastAssistantResponse = [...messages].reverse().find(m => m.role === 'assistant')?.response;

  // ─── Neural Shortcuts ───────────────────────────────────────────────────
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
        if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
            e.preventDefault();
            setShowPalette(prev => !prev);
        }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const loadChats = useCallback(async () => {
    if (!session.token) return;
    try {
      const res = await fetch('/api/v1/ai-interaction/chats', {
        headers: { 'Authorization': `Bearer ${session.token}` }
      });
      if (res.ok) setChats(await res.json());
    } catch(e) {}
  }, [session.token]);

  useEffect(() => { loadChats(); }, [loadChats]);

  useEffect(() => {
    if (scrollRef.current) {
        scrollRef.current.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
    }
  }, [messages]);

  const onSend = async () => {
    if (!input.trim() || loading) return;
    const msg: ChatMessage = { id: uuidv4(), role: 'user', text: input, ts: Date.now() };
    setMessages(prev => [...prev, msg]);
    setInput('');
    setLoading(true);
    setIsThinking(true);
    
    // UI Synthesis Logic Simulation
    setTimeout(() => {
        setMessages(prev => [...prev, {
            id: uuidv4(),
            role: 'assistant',
            text: 'Neural synthesis complete. Initializing strategic visualization stage.',
            ts: Date.now(),
            response: {
                type: 'simulation_canvas',
                logic: 'physics_f_ma',
                parameters: { force: 50, mass: 10 }
            }
        }]);
        setLoading(false);
        setIsThinking(false);
    }, 2000);
  };

  return (
    <div className="fixed inset-0 bg-[#050505] text-white flex overflow-hidden font-sans selection:bg-emerald-500/30">
      {/* Background Neural Mesh */}
      <div className="absolute inset-0 z-0 opacity-40 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-emerald-500/10 blur-[120px] rounded-full animate-pulse" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-violet-500/10 blur-[120px] rounded-full" />
      </div>

      <NeuralSidebar workspaces={workspaces} chats={chats} onNewChat={() => setMessages([])} activeWorkspace="00000000-0000-0000-0000-000000000000" onSelectChat={() => {}} />

      {/* Main Synthesis Arena */}
      <main className="flex-1 flex flex-col relative z-10 bg-gradient-to-b from-transparent to-black/20">
        {/* Cinematic Header Overlay */}
        <header className="h-24 flex items-center justify-between px-12 border-b border-white/5 backdrop-blur-md">
            <div className="flex items-center gap-4">
                <Sparkles className="text-emerald-500" size={20} />
                <h2 className="text-xl font-black tracking-tighter">Neural Visualizer Stage <span className="text-white/20">/</span> <span className="text-emerald-500">0x24λ</span></h2>
            </div>
            <div className="flex items-center gap-6">
                <button className="px-6 py-2 rounded-2xl bg-white/5 border border-white/10 text-[10px] font-black uppercase tracking-widest text-white/40 hover:text-white transition-all">Split View Active</button>
                <div className="w-10 h-10 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
                    <UserCircle2 size={24} className="text-emerald-500" />
                </div>
            </div>
        </header>

        {/* Dual Pane Synthesis Grid */}
        <div className="flex-1 flex overflow-hidden">
            {/* LEFT: NEURAL STREAM */}
            <div className="w-[450px] border-r border-white/5 flex flex-col bg-black/20">
                <div ref={scrollRef} className="flex-1 overflow-y-auto p-8 space-y-8 no-scrollbar scroll-smooth">
                    <AnimatePresence initial={false}>
                        {messages.length === 0 && (
                            <div className="h-full flex flex-col items-center justify-center text-center space-y-6">
                                <div className="w-16 h-16 rounded-2xl bg-white/5 flex items-center justify-center text-white/20">
                                    <MessageSquare size={32} />
                                </div>
                                <h3 className="text-sm font-black uppercase tracking-widest text-white/20">Neural Stream Ready</h3>
                            </div>
                        )}
                        {messages.map((m) => (
                            <motion.div 
                                key={m.id} 
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                className={`flex flex-col gap-3 ${m.role === 'user' ? 'items-end' : 'items-start'}`}
                            >
                                <div className={`p-6 rounded-3xl text-sm font-medium leading-relaxed ${m.role === 'user' ? 'bg-white/5 border border-white/10 text-white/90' : 'bg-emerald-500/5 border border-emerald-500/10 text-emerald-400'}`}>
                                    {m.text}
                                </div>
                                <div className="px-2 text-[8px] font-black uppercase tracking-widest text-white/10">{new Date(m.ts).toLocaleTimeString()}</div>
                            </motion.div>
                        ))}
                    </AnimatePresence>
                </div>

                {/* Local Input Node */}
                <div className="p-8 border-t border-white/5">
                    <div className="relative group">
                        <textarea 
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyDown={(e) => { if(e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); onSend(); } }}
                            placeholder="Neural directive..."
                            className="w-full bg-white/5 rounded-2xl border border-white/10 p-4 min-h-[100px] outline-none focus:border-emerald-500/40 text-sm font-bold text-white transition-all"
                        />
                        <button 
                            onClick={onSend}
                            className="absolute bottom-4 right-4 w-10 h-10 rounded-xl bg-emerald-500 text-black flex items-center justify-center hover:scale-110 active:scale-95 transition-all"
                        >
                            <Send size={18} />
                        </button>
                    </div>
                </div>
            </div>

            {/* RIGHT: VISUALIZER STAGE (The Revolution) */}
            <div className="flex-1 p-8 bg-black relative">
                <AuraVisualizerCanvas 
                    response={lastAssistantResponse}
                    status={loading ? "SYNTESIZING" : "IDLE"}
                />

                {/* Siri-style Voice Orb / Thinking Loader */}
                <AnimatePresence>
                    {isThinking && (
                        <motion.div 
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.8 }}
                            className="absolute bottom-16 right-16 flex flex-col items-center gap-4"
                        >
                            <div className="relative">
                                <motion.div 
                                    animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.6, 0.3] }}
                                    transition={{ duration: 2, repeat: Infinity }}
                                    className="absolute -inset-8 bg-emerald-500/20 blur-3xl rounded-full"
                                />
                                <div className="w-16 h-16 rounded-full bg-emerald-500 flex items-center justify-center shadow-[0_0_40px_rgba(16,185,129,0.5)]">
                                    <Sparkles className="text-black" size={24} />
                                </div>
                            </div>
                            <span className="text-[10px] font-black uppercase tracking-[0.3em] text-emerald-500 animate-pulse">Neural Synthesis Active</span>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
      </main>

      {/* Global Command Palette */}
      <AnimatePresence>
        {showPalette && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-12 bg-black/80 backdrop-blur-md">
                <motion.div 
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="w-full max-w-2xl bg-[#0A0A0A] border border-white/10 rounded-[2.5rem] overflow-hidden shadow-2xl"
                >
                    <div className="p-8 border-b border-white/5 flex items-center gap-4">
                        <Search className="text-emerald-500" size={24} />
                        <input 
                            autoFocus
                            placeholder="Type a command or search neural banks..."
                            className="flex-1 bg-transparent border-none outline-none text-2xl font-bold text-white placeholder-white/10"
                        />
                        <button onClick={() => setShowPalette(false)} className="p-2 bg-white/5 rounded-xl text-white/40 hover:text-white"><X size={20} /></button>
                    </div>
                    <div className="p-4 space-y-1">
                        {[
                            { name: 'Switch to Strategic KPI Bank', icon: <Database size={16} /> },
                            { name: 'Launch Physics Simulation (F=ma)', icon: <Zap size={16} /> },
                            { name: 'Deploy School Attendance Insight', icon: <Activity size={16} /> },
                            { name: 'AURA System Settings', icon: <Settings size={16} /> }
                        ].map((cmd, i) => (
                            <button key={i} className="w-full p-4 rounded-2xl flex items-center gap-4 text-white/40 hover:text-white hover:bg-emerald-500/10 transition-all text-sm font-bold">
                                {cmd.icon}
                                {cmd.name}
                            </button>
                        ))}
                    </div>
                    <div className="p-6 bg-emerald-500/5 border-t border-white/5 flex justify-between items-center text-[10px] font-black uppercase tracking-widest text-emerald-500/40">
                        <span>Naviate with arrows</span>
                        <span>Press Enter to deploy</span>
                    </div>
                </motion.div>
            </div>
        )}
      </AnimatePresence>

      <IntelligenceLens memory={84} tools={12} />
    </div>
  );
};

export default AuraNeuralWorkspace;
