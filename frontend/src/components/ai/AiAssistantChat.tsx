import React, { useEffect, useMemo, useRef, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Bot, CheckCheck, Globe, MessageCircle, Plus, Send,
  Sparkles, Trash2, UserCircle2, X, ChevronRight, Cpu,
  Mic, MicOff, Brain, Zap, Activity, Info
} from 'lucide-react';
import { SmartUiRenderer } from "./SmartUiRenderer";
import { useStore } from '../../store/useStore';
import { readSseStream, tryParseJson } from '../../lib/sse';
import { v4 as uuidv4 } from 'uuid';

// ─── Types ──────────────────────────────────────────────────────────────────

type RenderedResponse = {
  type: string;
  data: any;
  meta: any;
  thought?: string;
};

type ChatMessage = {
  id: string;
  role: 'user' | 'assistant';
  text?: string;
  response?: RenderedResponse;
  ts?: number;
  streaming?: boolean;
  thought?: string;
};

// ─── Constants ───────────────────────────────────────────────────────────────
const RECT_STORAGE_KEY = 'aiAssistant:rect:v2';
const MAX_INPUT_CHARS = 2000;

// ─── Components ──────────────────────────────────────────────────────────────

const ThinkingNeural: React.FC<{ thought: string | null }> = ({ thought }) => (
  <motion.div 
    initial={{ opacity: 0, y: 10 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0, scale: 0.95 }}
    className="px-4 py-3 my-2 rounded-2xl bg-emerald-500/5 border border-emerald-500/10 flex items-center gap-3 backdrop-blur-md"
  >
    <div className="flex-shrink-0 relative">
      <motion.div 
        animate={{ scale: [1, 1.3, 1], opacity: [0.5, 1, 0.5] }}
        transition={{ repeat: Infinity, duration: 1.5 }}
        className="w-2 h-2 rounded-full bg-emerald-400"
      />
      <div className="absolute inset-0 bg-emerald-400 blur-sm animate-pulse" />
    </div>
    <div className="flex-1">
      <div className="text-[10px] font-black uppercase tracking-[0.15em] text-emerald-500/60 mb-0.5">Neural Reasoning</div>
      <div className="text-[12px] text-white/50 font-bold italic truncate">
        {thought || "Synthesizing strategic response..."}
      </div>
    </div>
  </motion.div>
);

const Waveform: React.FC = () => (
  <div className="flex items-end gap-0.5 h-4 px-2">
    {[1, 2, 3, 4, 5].map((i) => (
      <motion.div
        key={i}
        animate={{ height: [4, 12, 4, 16, 4] }}
        transition={{ repeat: Infinity, duration: 0.8, delay: i * 0.1 }}
        className="w-0.5 bg-emerald-400 rounded-full"
      />
    ))}
  </div>
);

// ─── Main Component ──────────────────────────────────────────────────────────

export const AiAssistantChat: React.FC = () => {
  const { session } = useStore();
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [currentThought, setCurrentThought] = useState<string | null>(null);
  const [isListening, setIsListening] = useState(false);
  
  const [messages, setMessages] = useState<ChatMessage[]>([{
    id: 'a-welcome', role: 'assistant',
    text: 'Neural Command Center online. Deploy strategic queries or voice commands.',
    ts: Date.now(),
  }]);

  const [conversationId, setConversationId] = useState<string | null>(null);
  const [activeWorkspaceId, setActiveWorkspaceId] = useState<string | null>(null);
  const [chats, setChats] = useState<any[]>([]);
  const [toolsOpen, setToolsOpen] = useState(false);
  const [historyLoading, setHistoryLoading] = useState(false);

  const EXAMPLE_PROMPTS = [
    'Summarize the most important metrics for this workspace.',
    'Show a chart of admissions by month for the last 6 months.',
    'Draft a support update message for parents about transport delays.',
    'List the next 5 onboarding steps to activate a new school.',
  ];

  const scrollRef = useRef<HTMLDivElement | null>(null);

  // --- Chat management ---
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

  const startNewChat = async () => {
    if (!session.token) return;
    setMessages([{ id: 'a-welcome', role: 'assistant', text: 'Neural session initialized.', ts: Date.now() }]);
    setConversationId(null);
    setToolsOpen(false);
  };

  useEffect(() => { if (open) loadChats(); }, [open, loadChats]);

  // --- Voice Setup ---
  const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
  const recognition = useMemo(() => {
    if (!SpeechRecognition) return null;
    const r = new SpeechRecognition();
    r.continuous = false;
    r.interimResults = true;
    r.lang = 'en-US';
    return r;
  }, [SpeechRecognition]);

  useEffect(() => {
    if (!recognition) return;
    recognition.onresult = (event: any) => {
      const transcript = Array.from(event.results)
        .map((result: any) => result[0])
        .map((result) => result.transcript)
        .join('');
      setInput(transcript);
    };
    recognition.onend = () => setIsListening(false);
  }, [recognition]);

  const toggleVoice = () => {
    if (!recognition) return alert("Speech recognition not supported in this browser.");
    if (isListening) {
      recognition.stop();
    } else {
      setIsListening(true);
      recognition.start();
    }
  };

  const scrollToBottom = useCallback(() => {
    if (scrollRef.current) {
        scrollRef.current.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
    }
  }, []);

  useEffect(() => { scrollToBottom(); }, [messages, currentThought, scrollToBottom]);

  const sendMessage = useCallback(async (overrideInput?: string) => {
    const text = (overrideInput || input).trim();
    if (!text || loading) return;

    const userMessage: ChatMessage = {
      id: uuidv4(),
      role: 'user',
      text: text,
      ts: Date.now(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setLoading(true);
    setCurrentThought("Initializing strategic analysis...");

    try {
      const response = await fetch('/api/v1/ai-interaction/chat/stream', {
        method: 'POST',
        headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session.token}`
        },
        body: JSON.stringify({ message: text, conversationId, workspaceId: activeWorkspaceId }),
      });

      if (!response.body) throw new Error('No response body');
      
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
            if (data.event === 'thought') {
              setCurrentThought(data.payload.text);
            } else if (data.event === 'final') {
              const res = data.payload.response;
              const assistantMessage: ChatMessage = {
                id: uuidv4(),
                role: 'assistant',
                text: res.data?.text,
                response: res,
                ts: Date.now(),
                thought: res.thought
              };
              setMessages((prev) => [...prev, assistantMessage]);
              if (!conversationId) setConversationId(data.payload.conversationId);
            }
          } catch (e) { /* ignore chunk fragments */ }
        }
      }
    } catch (error) {
      console.error('AI error:', error);
    } finally {
      setLoading(false);
      setCurrentThought(null);
    }
  }, [input, loading, conversationId, activeWorkspaceId, session.token]);

  if (!open) {
    return (
      <motion.button
        layoutId="chat-fab"
        onClick={() => setOpen(true)}
        className="fixed bottom-6 right-6 w-16 h-16 rounded-[2rem] bg-emerald-500 shadow-[0_20px_50px_rgba(16,185,129,0.4)] flex items-center justify-center text-black z-[9999] hover:scale-110 transition-transform active:scale-90 overflow-hidden group"
      >
        <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent pointer-events-none" />
        <Bot size={28} className="relative z-10" />
        <motion.div 
            animate={{ scale: [1, 1.5, 1], opacity: [0.5, 0, 0.5] }}
            transition={{ repeat: Infinity, duration: 2 }}
            className="absolute inset-0 bg-white/40 rounded-full"
        />
      </motion.button>
    );
  }

  return (
    <motion.div
      layoutId="chat-fab"
      className="fixed bottom-6 right-6 w-[450px] h-[700px] bg-[#020c1b]/95 backdrop-blur-2xl border border-white/10 rounded-[3rem] shadow-[0_30px_100px_rgba(0,0,0,0.8)] flex flex-col overflow-hidden z-[9999]"
    >
      {/* Header */}
      <div className="p-6 border-b border-white/5 flex items-center justify-between bg-white/[0.02]">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
            <Sparkles size={20} />
          </div>
          <div>
            <div className="text-[11px] font-black uppercase tracking-[0.2em] text-emerald-500/60 mb-0.5 ml-0.5">Neural Interface</div>
            <div className="text-lg font-black text-white tracking-tight">AURA <span className="text-white/40 font-medium text-xs ml-1 tracking-widest uppercase">v4.0</span></div>
          </div>
        </div>
        <button onClick={() => setOpen(false)} className="p-2 rounded-xl hover:bg-white/5 text-white/40 transition-colors">
          <X size={20} />
        </button>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar - History */}
        <AnimatePresence>
          {toolsOpen && (
            <motion.div
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: 280, opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
              className="border-r border-white/5 bg-black/20 backdrop-blur-3xl overflow-hidden flex flex-col"
            >
              <div className="p-6">
                <div className="text-[10px] font-black uppercase tracking-[0.2em] text-emerald-500/60 mb-6">Neural Registry</div>
                <button 
                  onClick={startNewChat}
                  className="w-full py-3 px-4 rounded-xl bg-white/5 border border-white/10 text-white/80 text-[12px] font-bold flex items-center justify-center gap-2 hover:bg-white/10 transition-all mb-6"
                >
                  <Plus size={14} /> New Session
                </button>
                <div className="space-y-2">
                  {chats.map(chat => (
                    <button 
                      key={chat.conversationId}
                      onClick={() => { setConversationId(chat.conversationId); setToolsOpen(false); }}
                      className="w-full p-4 rounded-xl hover:bg-white/5 text-left transition-all border border-transparent hover:border-white/5 group"
                    >
                      <div className="text-[12px] text-white/60 font-bold truncate group-hover:text-white/90">{chat.title || "Neural Session"}</div>
                      <div className="text-[9px] text-white/20 font-black uppercase mt-1">{new Date(chat.updatedAt || chat.createdAt).toLocaleDateString()}</div>
                    </button>
                  ))}
                  {historyLoading && <div className="text-[10px] text-emerald-500/40 animate-pulse font-black p-4 uppercase tracking-widest text-center">Syncing Banks...</div>}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Main Feed */}
        <div ref={scrollRef} className="flex-1 overflow-y-auto p-6 space-y-8 scroll-smooth no-scrollbar">
          <AnimatePresence initial={false}>
            {messages.length <= 1 && (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="py-8 space-y-4"
              >
                <div className="text-[10px] font-black uppercase tracking-[0.2em] text-white/20 mb-4 px-2">Recommended Directives</div>
                {EXAMPLE_PROMPTS.map((prompt, idx) => (
                  <motion.button
                    key={prompt}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.1 }}
                    onClick={() => sendMessage(prompt)}
                    className="w-full p-4 rounded-2xl bg-white/[0.02] border border-white/5 text-left text-[13px] text-white/50 font-bold hover:bg-emerald-500/5 hover:border-emerald-500/20 hover:text-emerald-100 transition-all flex items-center gap-3 group"
                  >
                    <ChevronRight size={14} className="text-emerald-500/40 group-hover:text-emerald-400 group-hover:translate-x-1 transition-all" />
                    {prompt}
                  </motion.button>
                ))}
              </motion.div>
            )}
            
            {messages.map((msg) => (
              <motion.div
                key={msg.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className={`flex gap-4 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}
              >
                <div className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 ${msg.role === 'user' ? 'bg-emerald-500 text-black' : 'bg-white/5 text-emerald-400 border border-white/10'}`}>
                  {msg.role === 'user' ? <UserCircle2 size={16} /> : <Bot size={16} />}
                </div>
                <div className={`max-w-[85%] space-y-2 ${msg.role === 'user' ? 'items-end' : ''}`}>
                   {msg.response ? (
                     <SmartUiRenderer response={msg.response} />
                   ) : (
                     <div className={`p-4 rounded-[1.5rem] text-[14px] leading-relaxed font-bold ${msg.role === 'user' ? 'bg-emerald-500/10 text-emerald-100 border border-emerald-500/20' : 'bg-white/5 text-white/80 border border-white/5'}`}>
                       {msg.text}
                     </div>
                   )}
                   <div className="text-[10px] font-black text-white/20 uppercase tracking-widest">{new Date(msg.ts || 0).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                </div>
              </motion.div>
            ))}
            {loading && <ThinkingNeural thought={currentThought} />}
          </AnimatePresence>
        </div>
      </div>

      {/* Composer */}
      <div className="p-8 border-t border-white/5 bg-white/[0.01]">
        <div className="relative group">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); } }}
            placeholder="Type a neural directive..."
            className="w-full bg-white/[0.03] border border-white/10 rounded-[2rem] py-5 px-8 pr-32 text-[14px] text-white placeholder-white/20 focus:outline-none focus:border-emerald-500/40 transition-all font-bold resize-none min-h-[64px]"
            rows={1}
          />
          <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-2">
            <button 
                onClick={toggleVoice}
                className={`p-3 rounded-full transition-all ${isListening ? 'bg-emerald-500 text-black shadow-[0_0_20px_rgba(16,185,129,0.5)]' : 'bg-white/5 text-white/40 hover:bg-white/10'}`}
            >
              {isListening ? <Waveform /> : <Mic size={18} />}
            </button>
            <button 
                onClick={() => sendMessage()}
                className="p-3 bg-emerald-500 rounded-full text-black hover:scale-110 active:scale-95 transition-all shadow-lg group-hover:shadow-emerald-500/20"
            >
              <Send size={18} />
            </button>
          </div>
        </div>
        <div className="mt-4 flex items-center justify-between px-2">
            <div className="flex items-center gap-4">
                <div className="flex items-center gap-1.5 grayscale opacity-30 hover:grayscale-0 hover:opacity-100 transition-all cursor-help">
                    <Zap size={12} className="text-emerald-400" />
                    <span className="text-[10px] font-black text-white/40 uppercase tracking-widest">Neural Mode</span>
                </div>
                <div className="flex items-center gap-1.5 grayscale opacity-30 hover:grayscale-0 hover:opacity-100 transition-all cursor-help">
                    <Activity size={12} className="text-sky-400" />
                    <span className="text-[10px] font-black text-white/40 uppercase tracking-widest">Live Sync</span>
                </div>
            </div>
            <div className="text-[10px] font-black text-white/20 uppercase tracking-widest">v4.0 UNICORN CORE</div>
        </div>
      </div>
    </motion.div>
  );
};
