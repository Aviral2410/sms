import React, { useEffect, useMemo, useRef, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Bot, CheckCheck, MessageCircle, Plus, Send,
  Sparkles, Trash2, UserCircle2, X, ChevronRight,
  Mic, Brain, Zap, Activity, FolderPlus, Folder,
  GripVertical, Layout, MoreVertical, Search, Settings, Database, Target, Paperclip, RefreshCcw
} from 'lucide-react';
import { SmartUiRenderer } from "./SmartUiRenderer";
import { useStore } from '../../store/useStore';
import { v4 as uuidv4 } from 'uuid';

// ─── AURA v5.0 Unified Tokens ──────────────────────────────────────────────
const T = {
  glass: "backdrop-blur-3xl bg-black/60 border border-white/10",
  neon: "shadow-[0_0_30px_rgba(16,185,129,0.1)]",
  accent: "text-emerald-500",
  bg: "bg-[#050505]"
};

// ─── Types ──────────────────────────────────────────────────────────────────

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  text?: string;
  response?: any;
  ts: number;
  streaming?: boolean;
  thought?: string;
}

interface Workspace {
    id: string;
    name: string;
    color: string;
}

// ─── Main Component ──────────────────────────────────────────────────────────

export const AiAssistantChat: React.FC = () => {
  const { session } = useStore();
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([{
    id: 'a-welcome', role: 'assistant',
    text: 'Neural Interface online. Deploying v5.0-λ Strategic HUD.',
    ts: Date.now(),
  }]);

  const [conversationId, setConversationId] = useState<string | null>(null);
  const [workspaces] = useState<Workspace[]>([
      { id: 'ws-1', name: 'Elite Operations', color: '#10b981' },
      { id: 'ws-2', name: 'Strategic KPI Bank', color: '#8b5cf6' }
  ]);
  const [chats, setChats] = useState<any[]>([]);
  const scrollRef = useRef<HTMLDivElement | null>(null);

  const loadChats = useCallback(async () => {
    if (!session.token) return;
    try {
      const res = await fetch('/api/v1/ai-interaction/chats', {
        headers: { 'Authorization': `Bearer ${session.token}` }
      });
      if (res.ok) setChats(await res.json());
    } catch(e) {}
  }, [session.token]);

  useEffect(() => { if (open) loadChats(); }, [open, loadChats]);

  useEffect(() => {
    if (scrollRef.current) {
        scrollRef.current.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
    }
  }, [messages]);

  const sendMessage = useCallback(async () => {
    if (!input.trim() || loading) return;
    const msg: ChatMessage = { id: uuidv4(), role: 'user', text: input, ts: Date.now() };
    setMessages(prev => [...prev, msg]);
    setInput('');
    setLoading(true);

    try {
      const response = await fetch('/api/v1/ai-interaction/chat/stream', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${session.token}` },
        body: JSON.stringify({ message: input, conversationId }),
      });

      if (!response.body) throw new Error('Neural disconnection');
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      
      let assistantMsg: ChatMessage = { id: uuidv4(), role: 'assistant', text: '', ts: Date.now(), streaming: true };
      setMessages(prev => [...prev, assistantMsg]);

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value);
        const lines = chunk.split('\n');
        
        for (const line of lines) {
          if (line.startsWith('data:')) {
            try {
              const data = JSON.parse(line.substring(5));
              if (data.type === 'content') {
                  assistantMsg.text += data.content;
              } else if (data.type === 'complete') {
                  assistantMsg.response = data.payload;
                  if (data.conversationId) setConversationId(data.conversationId);
              }
              setMessages(prev => prev.map(m => m.id === assistantMsg.id ? { ...assistantMsg } : m));
            } catch (e) {}
          }
        }
      }
    } finally {
      setLoading(false);
    }
  }, [input, loading, session.token, conversationId]);

  return (
    <>
      {/* Floating Trigger Orb */}
      {!open && (
        <motion.button
          initial={{ scale: 0, rotate: -180 }}
          animate={{ scale: 1, rotate: 0 }}
          onClick={() => setOpen(true)}
          className="fixed bottom-8 right-8 w-16 h-16 rounded-[1.8rem] bg-emerald-500 text-black flex items-center justify-center shadow-[0_0_40px_rgba(16,185,129,0.3)] z-50 hover:scale-110 active:scale-90 transition-all border border-emerald-400/20"
        >
          <Brain size={28} />
          <div className="absolute -top-1 -right-1 w-4 h-4 bg-white rounded-full flex items-center justify-center border-2 border-emerald-500">
              <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-ping" />
          </div>
        </motion.button>
      )}

      {/* Elite Sidebar Assistant */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ x: 450, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: 450, opacity: 0 }}
            className={`fixed top-0 right-0 w-[450px] h-full ${T.glass} shadow-2xl z-[100] flex flex-col`}
          >
            {/* JARVIS HUD Header */}
            <header className="p-8 border-b border-white/5 flex items-center justify-between bg-black/40">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-500">
                        <Zap size={20} />
                    </div>
                    <div>
                        <div className="text-[10px] font-black uppercase tracking-[0.3em] text-white/20 leading-none mb-1">AURA Interface</div>
                        <div className="text-lg font-black text-white tracking-tighter">Neural <span className="text-emerald-500">v5.0-λ</span></div>
                    </div>
                </div>
                <button onClick={() => setOpen(false)} className="p-3 rounded-2xl hover:bg-white/5 text-white/20 hover:text-white transition-all"><X size={20} /></button>
            </header>

            {/* Tactical Intelligence Bar */}
            <div className="px-8 py-3 bg-emerald-500/5 border-b border-white/5 flex items-center gap-6 overflow-x-auto no-scrollbar">
                <div className="flex items-center gap-2 flex-shrink-0">
                    <Database size={12} className="text-emerald-500/40" />
                    <span className="text-[9px] font-black uppercase text-white/40 tracking-widest leading-none">Context: 84%</span>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                    <Target size={12} className="text-sky-500/40" />
                    <span className="text-[9px] font-black uppercase text-white/40 tracking-widest leading-none">Goal: Operations</span>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                    <Activity size={12} className="text-violet-500/40" />
                    <span className="text-[9px] font-black uppercase text-white/40 tracking-widest leading-none">Stream: Active</span>
                </div>
            </div>

            {/* Neural Stream Feed */}
            <div ref={scrollRef} className="flex-1 overflow-y-auto p-8 space-y-8 no-scrollbar scroll-smooth">
                {messages.map((m) => (
                    <motion.div 
                        key={m.id} 
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className={`flex flex-col gap-3 ${m.role === 'user' ? 'items-end' : 'items-start'}`}
                    >
                        <div className={`flex items-center gap-3 mb-1 ${m.role === 'user' ? 'flex-row-reverse' : ''}`}>
                            <div className={`w-6 h-6 rounded-lg flex items-center justify-center text-[10px] font-black ${m.role === 'user' ? 'bg-emerald-500 text-black' : 'bg-white/5 text-emerald-500'}`}>
                                {m.role === 'user' ? 'U' : 'A'}
                            </div>
                            <span className="text-[8px] font-black uppercase tracking-[0.2em] text-white/20">
                                {new Date(m.ts).toLocaleTimeString()}
                            </span>
                        </div>

                        {m.response ? (
                            <div className="w-full p-1 rounded-[2rem] bg-gradient-to-br from-emerald-500/20 to-sky-500/20 border border-white/10 shadow-xl overflow-hidden">
                                <div className="p-6 rounded-[1.9rem] bg-[#0A0A0A]">
                                    <SmartUiRenderer response={m.response} />
                                </div>
                            </div>
                        ) : (
                            <div className={`p-6 rounded-[2rem] text-sm font-medium leading-relaxed max-w-[90%] shadow-lg ${m.role === 'user' ? 'bg-white/5 border border-white/10 text-white/90' : 'bg-[#0A0A0A] border border-white/5 text-white/80'}`}>
                                {m.text}
                            </div>
                        )}
                    </motion.div>
                ))}

                {loading && (
                    <div className="flex flex-col gap-3 items-start animate-pulse">
                        <div className="w-12 h-6 bg-white/5 rounded-full" />
                        <div className="w-48 h-20 bg-white/5 rounded-[2rem]" />
                    </div>
                )}
            </div>

            {/* Neural Command Input */}
            <div className="p-8 border-t border-white/5 bg-black/20">
                <div className="relative group">
                    <div className="absolute -inset-1 bg-gradient-to-r from-emerald-500/10 to-sky-500/10 rounded-3xl blur-md opacity-25 group-focus-within:opacity-100 transition-all" />
                    <div className="relative bg-[#0A0A0A] rounded-[2rem] border border-white/10 p-2 flex flex-col group-focus-within:border-emerald-500/30 transition-all">
                        <textarea
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyDown={(e) => { if(e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); } }}
                            placeholder="Deploy neural directive..."
                            className="w-full bg-transparent border-none outline-none text-white placeholder-white/10 p-4 resize-none h-[100px] text-sm font-bold no-scrollbar"
                        />
                        <div className="flex items-center justify-between px-4 pb-2">
                            <div className="flex items-center gap-2">
                                <button className="p-2 rounded-xl hover:bg-white/5 text-white/20 transition-all"><Paperclip size={16} /></button>
                                <button className="p-2 rounded-xl hover:bg-white/5 text-white/20 transition-all"><Mic size={16} /></button>
                            </div>
                            <button 
                                onClick={sendMessage}
                                className="w-10 h-10 rounded-xl bg-emerald-500 text-black flex items-center justify-center hover:scale-110 active:scale-95 transition-all shadow-[0_0_20px_rgba(16,185,129,0.2)]"
                            >
                                <Send size={18} />
                            </button>
                        </div>
                    </div>
                </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};
