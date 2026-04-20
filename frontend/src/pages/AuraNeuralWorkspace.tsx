import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Plus, Search, MessageSquare, Mic, Paperclip, Send, 
  Settings, UserCircle2, X, Command, Sparkles, Brain, Clock,
  MoreHorizontal, Terminal, Zap, ChevronRight
} from 'lucide-react';
import { SmartUiRenderer } from "../components/ai/SmartUiRenderer";
import { AuraVisualizerCanvas } from "../components/ai/AuraVisualizerCanvas";
import { useStore } from '../store/useStore';
import { v4 as uuidv4 } from 'uuid';

// ─── Types ──────────────────────────────────────────────────────────────────

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  text?: string;
  response?: any;
  ts: number;
}

// ─── Main Component ──────────────────────────────────────────────────────────

export const AuraNeuralWorkspace: React.FC = () => {
  const { session } = useStore();
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const [chats, setChats] = useState<any[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);

  const lastAssistantResponse = [...messages].reverse().find(m => m.role === 'assistant')?.response;

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
    
    // UI Synthesis Logic Simulation
    setTimeout(() => {
        setMessages(prev => [...prev, {
            id: uuidv4(),
            role: 'assistant',
            text: 'I have analyzed your request. Here is the visual projection of the neural data.',
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
    <div className="fixed inset-0 bg-[#0A0A0A] text-white flex overflow-hidden font-sans">
      {/* Sidebar - ChatGPT Style */}
      <aside className="w-64 h-full bg-[#050505] border-r border-white/5 flex flex-col p-4 z-30">
        <button 
            onClick={() => setMessages([])}
            className="w-full flex items-center justify-between p-3 rounded-xl hover:bg-white/5 transition-all mb-8 group"
        >
            <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center group-hover:bg-emerald-500/10 group-hover:text-emerald-500 transition-all">
                    <Plus size={18} />
                </div>
                <span className="text-sm font-bold">New chat</span>
            </div>
            <MessageSquare size={14} className="text-white/20" />
        </button>

        <div className="flex-1 overflow-y-auto space-y-1 no-scrollbar">
            <div className="flex items-center gap-2 p-3 text-[10px] font-black uppercase tracking-widest text-white/20 mb-2">
                <Clock size={12} /> Recent Sessions
            </div>
            {chats.map(chat => (
                <button 
                    key={chat.conversationId}
                    className="w-full p-3 rounded-lg text-left text-xs text-white/40 hover:text-white hover:bg-white/5 truncate font-medium transition-all"
                >
                    {chat.title || "Neural Session"}
                </button>
            ))}
        </div>

        <div className="pt-4 border-t border-white/5 space-y-1">
            <button className="w-full p-3 rounded-lg flex items-center gap-3 text-xs font-bold text-white/40 hover:text-white hover:bg-white/5">
                <Terminal size={14} /> Codex Mode
            </button>
            <button className="w-full p-3 rounded-lg flex items-center justify-between group">
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-500">
                        <UserCircle2 size={18} />
                    </div>
                    <span className="text-xs font-bold text-white/60 group-hover:text-white">Aviral Singh</span>
                </div>
                <MoreHorizontal size={14} className="text-white/20" />
            </button>
        </div>
      </aside>

      {/* Main Workspace Stage */}
      <main className="flex-1 flex flex-col relative bg-gradient-to-b from-[#0A0A0A] to-[#0D0D0D]">
        {/* Header HUD */}
        <header className="h-14 flex items-center justify-between px-8 border-b border-white/5 bg-black/20 backdrop-blur-md">
            <div className="flex items-center gap-2">
                <span className="text-xs font-black text-white/40 tracking-widest uppercase">AURA <span className="text-emerald-500">v5.0-λ</span></span>
            </div>
            <div className="flex items-center gap-4">
                <button className="p-2 text-white/20 hover:text-white transition-all"><Search size={16} /></button>
                <button className="p-2 text-white/20 hover:text-white transition-all"><Settings size={16} /></button>
            </div>
        </header>

        {/* Synthesis Arena */}
        <div className="flex-1 overflow-hidden flex">
            {messages.length === 0 ? (
                /* Empty State - Central Command Input */
                <div className="flex-1 flex flex-col items-center justify-center p-12 relative overflow-hidden">
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-emerald-500/5 blur-[120px] rounded-full pointer-events-none" />
                    
                    <motion.div 
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="w-full max-w-2xl space-y-12 relative z-10 text-center"
                    >
                        <h1 className="text-4xl font-black tracking-tighter text-white">How can I assist <span className="text-emerald-500">your strategy</span>?</h1>
                        
                        <div className="relative group">
                            <div className="absolute -inset-1 bg-gradient-to-r from-emerald-500/10 to-sky-500/10 rounded-3xl blur opacity-25 group-focus-within:opacity-100 transition-all" />
                            <div className="relative flex items-center bg-[#111] border border-white/10 rounded-3xl p-4 shadow-2xl">
                                <button className="p-3 text-white/20 hover:text-white"><Plus size={20} /></button>
                                <textarea 
                                    value={input}
                                    onChange={(e) => setInput(e.target.value)}
                                    onKeyDown={(e) => { if(e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); onSend(); } }}
                                    placeholder="Message AURA..."
                                    className="flex-1 bg-transparent border-none outline-none text-lg p-3 resize-none h-[60px] text-white placeholder-white/10 font-medium"
                                />
                                <div className="flex items-center gap-2 pr-2">
                                    <button className="p-3 text-white/20 hover:text-white"><Mic size={20} /></button>
                                    <button 
                                        onClick={onSend}
                                        className="w-10 h-10 rounded-full bg-white text-black flex items-center justify-center hover:scale-110 active:scale-95 transition-all"
                                    >
                                        <Send size={18} />
                                    </button>
                                </div>
                            </div>
                        </div>

                        <div className="flex flex-wrap justify-center gap-2 pt-4">
                            {['Summarize Schools', 'New Physics Demo', 'Run Sorting Algo', 'Analyze Fees'].map(t => (
                                <button key={t} className="px-4 py-2 rounded-full border border-white/5 bg-white/[0.02] text-[11px] font-bold text-white/40 hover:bg-white/5 hover:text-white hover:border-emerald-500/20 transition-all">
                                    {t}
                                </button>
                            ))}
                        </div>
                    </motion.div>
                </div>
            ) : (
                    {/* LEFT Panel: Chat List - Fixed Width to prevent distortion */}
                    <div className="w-[500px] flex flex-col border-r border-white/5 bg-[#050505]/40 backdrop-blur-3xl shadow-2xl relative z-20">
                        <div ref={scrollRef} className="flex-1 overflow-y-auto p-10 space-y-10 no-scrollbar scroll-smooth">
                            {messages.map((m) => (
                                <motion.div 
                                    key={m.id} 
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className={`flex gap-6 ${m.role === 'user' ? 'flex-row-reverse' : ''}`}
                                >
                                    <div className={`w-10 h-10 rounded-2xl flex items-center justify-center flex-shrink-0 border transition-all ${m.role === 'user' ? 'bg-[#222] text-white border-white/10' : 'bg-emerald-500 text-black shadow-[0_0_30px_rgba(16,185,129,0.3)]'}`}>
                                        {m.role === 'user' ? <UserCircle2 size={20} /> : <Brain size={20} />}
                                    </div>
                                    <div className={`space-y-2 max-w-[80%] ${m.role === 'user' ? 'items-end' : 'items-start'}`}>
                                        <div className={`p-6 rounded-[2.5rem] text-[15px] font-medium leading-relaxed ${m.role === 'user' ? 'bg-white/5 border border-white/10 text-white/90' : 'text-white/80'}`}>
                                            {m.text}
                                        </div>
                                        <div className="px-4 text-[9px] font-black uppercase tracking-widest text-white/10">{new Date(m.ts).toLocaleTimeString()}</div>
                                    </div>
                                </motion.div>
                            ))}
                            {loading && (
                                <div className="flex gap-6 animate-pulse">
                                    <div className="w-10 h-10 rounded-2xl bg-white/5" />
                                    <div className="h-20 w-3/4 bg-white/5 rounded-[2.5rem]" />
                                </div>
                            )}
                        </div>
                        {/* Input Area (Bottom in active mode) */}
                        <div className="p-10 border-t border-white/5 bg-black/40">
                            <div className="relative group">
                                <div className="absolute -inset-1 bg-emerald-500/10 rounded-[2.5rem] blur opacity-0 group-focus-within:opacity-100 transition-opacity" />
                                <div className="relative flex items-center bg-[#111] border border-white/10 rounded-[2.5rem] p-3 group-focus-within:border-emerald-500/30 transition-all">
                                    <button className="p-4 text-white/20 hover:text-white transition-all"><Plus size={20} /></button>
                                    <textarea 
                                        value={input}
                                        onChange={(e) => setInput(e.target.value)}
                                        onKeyDown={(e) => { if(e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); onSend(); } }}
                                        placeholder="Message AURA..."
                                        className="flex-1 bg-transparent border-none outline-none text-sm p-2 resize-none h-[50px] text-white no-scrollbar font-bold"
                                    />
                                    <button 
                                        onClick={onSend}
                                        className="w-12 h-12 rounded-2xl bg-white text-black flex items-center justify-center hover:scale-110 active:scale-95 transition-all shadow-[0_0_40px_rgba(255,255,255,0.1)]"
                                    >
                                        <Send size={20} />
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Right Panel: The Visualizer Canvas */}
                    <div className="flex-1 p-10 bg-black relative z-10">
                        <AuraVisualizerCanvas 
                            response={lastAssistantResponse}
                            status={loading ? "SYNTHESIZING" : "IDLE"}
                        />
                    </div>
                </div>
            )}
        </div>
      </main>
    </div>
  );
};

export default AuraNeuralWorkspace;
