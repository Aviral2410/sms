import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Send, Sparkles, X, Brain, Activity, 
  Zap, Command, ChevronRight, Fingerprint, Bot, UserCircle2
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const GLASS_BG = "bg-[#020c1b]/95 backdrop-blur-3xl border border-white/10";
const EMERALD_GLOW = "shadow-[0_0_50px_rgba(16,185,129,0.15)]";

type Message = {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  streaming?: boolean;
};

export const AiAssistantPage: React.FC = () => {
  const navigate = useNavigate();
  const [messages, setMessages] = useState<Message[]>([
    { 
      id: 'welcome', 
      role: 'assistant', 
      content: 'Welcome to the AURA Neural Interface. I am your strategic pedagogical assistant. How can I facilitate your learning journey today?' 
    }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
    }
  }, [messages]);

  const handleSend = async (override?: string) => {
    const text = override || input;
    if (!text.trim() || loading) return;

    const userMsg: Message = { id: Date.now().toString(), role: 'user', content: text };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    const assistantId = (Date.now() + 1).toString();
    setMessages(prev => [...prev, { id: assistantId, role: 'assistant', content: '', streaming: true }]);

    try {
      const response = await fetch('https://api.sms.3.109.156.68.sslip.io/api/v1/public/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text, context: { route: '/ai-assistant' } })
      });

      if (!response.body) throw new Error('ReadableStream not supported');
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let fullContent = '';

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value);
        fullContent += chunk;
        setMessages(prev => prev.map(m => m.id === assistantId ? { ...m, content: fullContent } : m));
      }
    } catch (err) {
      setMessages(prev => prev.map(m => m.id === assistantId ? { ...m, content: 'Neural Sync Failed. Error: ' + err, streaming: false } : m));
    } finally {
      setLoading(false);
      setMessages(prev => prev.map(m => m.id === assistantId ? { ...m, streaming: false } : m));
    }
  };

  const SUGGESTIONS = [
    "Compare our subscription plans.",
    "What is included in the Academics module?",
    "Show me the platform vision.",
    "Request a demo for my school."
  ];

  return (
    <div className="fixed inset-0 bg-[#050505] z-[9999] flex items-center justify-center p-4 md:p-10 font-sans">
      {/* Background Neural Grid */}
      <div className="absolute inset-0 pointer-events-none opacity-20">
          <div className="absolute inset-0" style={{ 
              backgroundImage: `radial-gradient(circle at 1px 1px, rgba(16,185,129,0.15) 1px, transparent 0)`,
              backgroundSize: '40px 40px'
          }} />
      </div>

      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className={`${GLASS_BG} w-full max-w-5xl h-[85vh] rounded-[3rem] overflow-hidden flex flex-col shadow-2xl relative z-10`}
      >
        {/* Cinematic Header */}
        <header className="h-20 flex-shrink-0 flex items-center justify-between px-10 border-b border-white/5 bg-white/[0.02] backdrop-blur-md">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-500">
              <Brain size={20} />
            </div>
            <div>
              <div className="text-[10px] font-black uppercase tracking-[0.3em] text-emerald-500/60 leading-none mb-1">Public Neural Node</div>
              <h1 className="text-xl font-black text-white tracking-tight flex items-center gap-2">
                AURA <span className="text-emerald-500 text-sm font-black border border-emerald-500/20 px-2 rounded-full py-0.5 uppercase tracking-widest">v4.2-λ</span>
              </h1>
            </div>
          </div>
          <button onClick={() => navigate('/')} className="p-3 rounded-2xl hover:bg-white/5 text-white/40 transition-colors">
            <X size={20} />
          </button>
        </header>

        {/* Neural Feed */}
        <main ref={scrollRef} className="flex-1 overflow-y-auto p-8 md:p-12 space-y-10 no-scrollbar">
          <AnimatePresence initial={false}>
            {messages.length === 1 && (
                <div className="py-12 space-y-6">
                    <div className="text-[10px] font-black uppercase tracking-[0.2em] text-white/20 px-2">Neural Suggestions</div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {SUGGESTIONS.map((s, idx) => (
                            <motion.button
                                key={s}
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: idx * 0.1 }}
                                onClick={() => handleSend(s)}
                                className="p-5 rounded-2xl bg-white/5 border border-white/10 text-left text-[13px] text-white/60 font-bold hover:bg-emerald-500/10 hover:border-emerald-500/30 transition-all flex items-center gap-4 group"
                            >
                                <div className="w-8 h-8 rounded-xl bg-white/5 flex items-center justify-center flex-shrink-0 group-hover:bg-emerald-500/20 text-emerald-500/40 group-hover:text-emerald-500">
                                    <ChevronRight size={14} className="group-hover:translate-x-1 transition-all" />
                                </div>
                                {s}
                            </motion.button>
                        ))}
                    </div>
                </div>
            )}

            {messages.map((m) => (
              <motion.div
                key={m.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className={`flex gap-6 ${m.role === 'user' ? 'flex-row-reverse' : ''}`}
              >
                <div className={`w-10 h-10 rounded-2xl flex items-center justify-center flex-shrink-0 border ${m.role === 'user' ? 'bg-emerald-500 text-black border-emerald-500' : 'bg-white/5 text-emerald-500 border-white/10'}`}>
                  {m.role === 'user' ? <UserCircle2 size={20} /> : <Bot size={20} />}
                </div>
                <div className={`max-w-[80%] space-y-2 ${m.role === 'user' ? 'text-right' : 'text-left'}`}>
                  <div className={`p-6 rounded-[2rem] text-[15px] leading-relaxed font-bold ${m.role === 'user' ? 'bg-emerald-500/10 text-white border border-emerald-500/20' : 'bg-white/5 text-white/90 border border-white/5'}`}>
                    {m.content}
                    {m.streaming && <span className="inline-block w-1.5 h-4 bg-emerald-500 ml-1 animate-pulse" />}
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </main>

        {/* Composer */}
        <footer className="p-8 md:p-10 border-t border-white/5 bg-white/[0.01]">
          <div className="max-w-4xl mx-auto relative">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
              placeholder="Deploy a neural directive..."
              className="w-full bg-white/5 border border-white/10 rounded-[2.5rem] py-6 px-10 pr-20 text-[15px] text-white placeholder-white/20 focus:outline-none focus:border-emerald-500/40 transition-all font-bold resize-none min-h-[72px]"
              rows={1}
            />
            <button 
              onClick={() => handleSend()}
              className="absolute right-4 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-emerald-500 text-black flex items-center justify-center hover:scale-110 active:scale-95 transition-all shadow-[0_0_20px_rgba(16,185,129,0.4)]"
            >
              <Send size={20} />
            </button>
          </div>
          <div className="mt-6 flex items-center justify-center gap-8 text-[10px] font-black text-white/20 uppercase tracking-[0.4em]">
            <span className="flex items-center gap-2 grayscale brightness-50 hover:grayscale-0 hover:brightness-100 transition-all cursor-help"><Activity size={12} className="text-emerald-500" /> Neural Sync Active</span>
            <span className="flex items-center gap-2 grayscale brightness-50 hover:grayscale-0 hover:brightness-100 transition-all cursor-help"><Zap size={12} className="text-sky-400" /> Low Latency Stream</span>
          </div>
        </footer>
      </motion.div>
    </div>
  );
};

export default AiAssistantPage;
