import React, { useEffect, useMemo, useRef, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Bot, CheckCheck, MessageCircle, Plus, Send,
  Sparkles, Trash2, UserCircle2, X, ChevronRight,
  Mic, Brain, Zap, Activity, FolderPlus, Folder,
  GripVertical, Layout, MoreVertical, Search
} from 'lucide-react';
import { SmartUiRenderer } from "./SmartUiRenderer";
import { useStore } from '../../store/useStore';
import { v4 as uuidv4 } from 'uuid';

// ─── Types ──────────────────────────────────────────────────────────────────

type Workspace = {
    id: string;
    name: string;
    color: string;
};

type ChatMessage = {
  id: string;
  role: 'user' | 'assistant';
  text?: string;
  response?: any;
  ts?: number;
  streaming?: boolean;
  thought?: string;
};

// ─── Constants ───────────────────────────────────────────────────────────────
const THEME_PRIMARY = "#10b981";

// ─── Main Component ──────────────────────────────────────────────────────────

export const AiAssistantChat: React.FC = () => {
  const { session } = useStore();
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [currentThought, setCurrentThought] = useState<string | null>(null);
  
  const [messages, setMessages] = useState<ChatMessage[]>([{
    id: 'a-welcome', role: 'assistant',
    text: 'AURA Workspace online. Deploy neural directives or manage your strategic banks.',
    ts: Date.now(),
  }]);

  const [conversationId, setConversationId] = useState<string | null>(null);
  const [workspaces, setWorkspaces] = useState<Workspace[]>([
      { id: 'ws-1', name: 'Strategic KPI Bank', color: '#10b981' },
      { id: 'ws-2', name: 'Student Learning Models', color: '#06b6d4' }
  ]);
  const [activeWorkspaceId, setActiveWorkspaceId] = useState<string | null>(null);
  const [chats, setChats] = useState<any[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  const scrollRef = useRef<HTMLDivElement | null>(null);

  const loadChats = useCallback(async () => {
    if (!session.token) return;
    setHistoryLoading(true);
    try {
      const res = await fetch('/api/v1/ai-interaction/chats', {
        headers: { 'Authorization': `Bearer ${session.token}` }
      });
      if (res.ok) setChats(await res.json());
    } finally { setHistoryLoading(false); }
  }, [session.token]);

  useEffect(() => { if (open) loadChats(); }, [open, loadChats]);

  const startNewChat = () => {
    setMessages([{ id: 'a-welcome', role: 'assistant', text: 'Neural session initialized.', ts: Date.now() }]);
    setConversationId(null);
  };

  const sendMessage = useCallback(async (overrideInput?: string) => {
    const text = (overrideInput || input).trim();
    if (!text || loading) return;

    const userMessage: ChatMessage = { id: uuidv4(), role: 'user', text: text, ts: Date.now() };
    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setLoading(true);

    try {
      const response = await fetch('/api/v1/ai-interaction/chat/stream', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${session.token}` },
        body: JSON.stringify({ message: text, conversationId, workspaceId: activeWorkspaceId }),
      });

      if (!response.body) throw new Error('No body');
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      
      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value);
        const lines = chunk.split('\n');
        for (const line of lines) {
          if (!line.trim()) continue;
          try {
            const data = JSON.parse(line);
            if (data.event === 'final') {
              const res = data.payload.response;
              setMessages((prev) => [...prev, {
                id: uuidv4(), role: 'assistant', text: res.data?.text, response: res, ts: Date.now()
              }]);
              if (!conversationId) setConversationId(data.payload.conversationId);
            }
          } catch (e) {}
        }
      }
    } finally { setLoading(false); }
  }, [input, loading, conversationId, activeWorkspaceId, session.token]);

  if (!open) {
    return (
      <motion.button
        layoutId="chat-container"
        onClick={() => setOpen(true)}
        className="fixed bottom-10 right-10 w-20 h-20 rounded-[2.5rem] bg-[#10b981] flex items-center justify-center text-black z-[9999] shadow-[0_20px_50px_rgba(16,185,129,0.4)]"
      >
        <Brain size={32} />
      </motion.button>
    );
  }

  return (
    <motion.div
      layoutId="chat-container"
      className="fixed bottom-10 right-10 w-[950px] h-[750px] bg-[#050505]/95 backdrop-blur-3xl border border-white/10 rounded-[3rem] shadow-[0_40px_100px_rgba(0,0,0,0.9)] flex overflow-hidden z-[9999]"
    >
      {/* LEFT SIDEBAR: WORKSPACES & HISTORY */}
      <aside className="w-80 border-r border-white/5 flex flex-col bg-black/40">
        <div className="p-8 border-b border-white/5">
            <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-500">
                    <Layout size={20} />
                </div>
                <div>
                    <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-white/20">Active Node</h3>
                    <h2 className="text-sm font-black text-white">AURA Workspace</h2>
                </div>
            </div>

            <button 
                onClick={startNewChat}
                className="w-full py-3 px-4 rounded-xl bg-emerald-500 text-black text-[12px] font-black uppercase flex items-center justify-center gap-2 hover:scale-[1.02] transition-transform shadow-[0_0_20px_rgba(16,185,129,0.2)]"
            >
                <Plus size={16} /> New Session
            </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-8 custom-scrollbar">
            {/* Workspaces Section */}
            <section>
                <div className="flex items-center justify-between mb-4">
                    <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white/20">Workspaces</span>
                    <button className="text-white/20 hover:text-emerald-500 transition-colors"><FolderPlus size={14} /></button>
                </div>
                <div className="space-y-1">
                    {workspaces.map(ws => (
                        <button 
                            key={ws.id}
                            onClick={() => setActiveWorkspaceId(ws.id)}
                            className={`w-full p-3 rounded-xl flex items-center gap-3 transition-all ${activeWorkspaceId === ws.id ? 'bg-white/5 text-white' : 'text-white/30 hover:bg-white/5'}`}
                        >
                            <Folder size={16} style={{ color: ws.color }} />
                            <span className="text-xs font-bold truncate">{ws.name}</span>
                        </button>
                    ))}
                </div>
            </section>

            {/* Recent History Section */}
            <section>
                <div className="text-[10px] font-black uppercase tracking-[0.2em] text-white/20 mb-4">Recent Registry</div>
                <div className="space-y-2">
                    {chats.map(chat => (
                        <div key={chat.conversationId} className="group flex items-center gap-2 p-3 rounded-xl border border-transparent hover:border-white/5 hover:bg-white/[0.02] transition-all cursor-grab active:cursor-grabbing">
                            <GripVertical size={12} className="text-white/10 group-hover:text-emerald-500/40" />
                            <button 
                                onClick={() => setConversationId(chat.conversationId)}
                                className="flex-1 text-left min-w-0"
                            >
                                <div className="text-[11px] font-bold text-white/60 group-hover:text-white truncate">{chat.title || "Neural Session"}</div>
                                <div className="text-[9px] font-black text-white/10 uppercase mt-0.5">{new Date(chat.updatedAt).toLocaleDateString()}</div>
                            </button>
                            <button className="opacity-0 group-hover:opacity-100 text-white/20 hover:text-red-500 transition-all">
                                <Trash2 size={12} />
                            </button>
                        </div>
                    ))}
                </div>
            </section>
        </div>

        <div className="p-6 border-t border-white/5">
            <div className="flex items-center gap-3 text-white/10 group cursor-help">
                <Search size={14} />
                <span className="text-[10px] font-black uppercase tracking-widest group-hover:text-emerald-500 transition-colors">Search Registry</span>
            </div>
        </div>
      </aside>

      {/* RIGHT CHAT AREA */}
      <main className="flex-1 flex flex-col relative bg-black/20">
        {/* Header Overlay */}
        <div className="absolute top-0 inset-x-0 h-20 px-8 flex items-center justify-between border-b border-white/5 backdrop-blur-md z-20">
            <div className="flex items-center gap-3">
                <Activity size={16} className="text-emerald-500 animate-pulse" />
                <span className="text-[10px] font-black uppercase tracking-[0.4em] text-emerald-500/60">Live Neural Synapse</span>
            </div>
            <div className="flex items-center gap-4">
                <button className="p-2 rounded-lg bg-white/5 text-white/40 hover:text-white transition-all"><MoreVertical size={16} /></button>
                <button onClick={() => setOpen(false)} className="p-2 rounded-lg bg-white/5 text-white/40 hover:text-white transition-all"><X size={16} /></button>
            </div>
        </div>

        {/* Chat Feed */}
        <div ref={scrollRef} className="flex-1 overflow-y-auto p-8 pt-28 space-y-10 custom-scrollbar">
            {messages.map((msg) => (
              <motion.div
                key={msg.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={`flex gap-6 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}
              >
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 border transition-all ${msg.role === 'user' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-500' : 'bg-white/5 border-white/10 text-white/40'}`}>
                  {msg.role === 'user' ? <UserCircle2 size={20} /> : <Zap size={20} />}
                </div>
                <div className={`max-w-[80%] space-y-3 ${msg.role === 'user' ? 'items-end' : ''}`}>
                   {msg.response ? (
                     <SmartUiRenderer response={msg.response} />
                   ) : (
                     <div className={`p-6 rounded-[2rem] text-[15px] leading-relaxed font-medium ${msg.role === 'user' ? 'bg-[#10b981] text-black shadow-[0_10px_30px_rgba(16,185,129,0.2)]' : 'bg-white/[0.03] text-white/80 border border-white/10'}`}>
                       {msg.text}
                     </div>
                   )}
                   <div className="px-2 text-[9px] font-black text-white/10 uppercase tracking-widest">{new Date(msg.ts || 0).toLocaleTimeString()}</div>
                </div>
              </motion.div>
            ))}
        </div>

        {/* Composer */}
        <div className="p-8 border-t border-white/5">
            <div className="relative group">
                <div className="absolute -inset-1 bg-gradient-to-r from-emerald-500/20 to-sky-500/20 rounded-[2rem] blur opacity-20" />
                <div className="relative flex items-center gap-4 p-2 rounded-[2rem] bg-black/40 border border-white/10 group-focus-within:border-emerald-500/40 transition-all">
                    <textarea
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={(e) => { if(e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); } }}
                        placeholder="Neural directive..."
                        className="flex-1 bg-transparent border-none outline-none text-white placeholder-white/20 p-4 resize-none h-[56px] text-base font-bold custom-scrollbar"
                    />
                    <div className="flex items-center gap-2 pr-2">
                        <button className="p-3 rounded-full bg-white/5 text-white/40 hover:bg-white/10 transition-all"><Mic size={18} /></button>
                        <button 
                            onClick={() => sendMessage()}
                            className="w-12 h-12 rounded-2xl bg-[#10b981] text-black flex items-center justify-center hover:scale-110 active:scale-95 transition-all shadow-[0_0_30px_rgba(16,185,129,0.3)]"
                        >
                            <Send size={20} />
                        </button>
                    </div>
                </div>
            </div>
            <div className="mt-4 flex items-center justify-center gap-6">
                <div className="flex items-center gap-2 text-[9px] font-black text-emerald-500/40 uppercase tracking-[0.2em]">
                    <Sparkles size={12} /> Contextual Engine v4.5
                </div>
                <div className="w-1 h-1 rounded-full bg-white/5" />
                <div className="flex items-center gap-2 text-[9px] font-black text-white/10 uppercase tracking-[0.2em]">
                    AURA NEURAL WORKSPACE
                </div>
            </div>
        </div>
      </main>
    </motion.div>
  );
};

export default AiAssistantChat;
