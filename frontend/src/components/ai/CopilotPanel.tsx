import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bot, X, Send, Sparkles, AlertCircle, Cpu } from 'lucide-react';

export function CopilotPanel({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const [messages, setMessages] = useState([
    { role: 'assistant', text: 'Initialize sequence... I am Elevate AI Core. Accessing tenant metrics and predicting workflows. How can I assist you today?' }
  ]);
  const [input, setInput] = useState('');

  const handleSend = () => {
    if (!input.trim()) return;

    const userMessage = input.trim();
    setMessages(prev => [...prev, { role: 'user', text: userMessage }]);
    setInput('');

    // Mock AI response
    setTimeout(() => {
      setMessages(prev => [...prev, { role: 'assistant', text: `Analyzing telemetry data... I've isolated the anomaly in Class 10-A attendance. Generating a draft communication to the affected parents. Would you like to review it?` }]);
    }, 1500);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-40 bg-slate-950/60 backdrop-blur-md"
          />
          <motion.div 
            initial={{ x: '100%', opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: '100%', opacity: 0 }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            className="fixed inset-y-4 right-4 w-[400px] bg-slate-900/80 border border-indigo-500/20 rounded-3xl z-50 flex flex-col shadow-[0_0_50px_rgba(99,102,241,0.2)] backdrop-blur-2xl overflow-hidden"
          >
            {/* Header */}
            <div className="p-5 border-b border-white/5 flex items-center justify-between bg-white/5 relative">
              <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-indigo-500/50 to-transparent" />
              <div className="flex items-center gap-3 relative z-10">
                <div className="w-10 h-10 rounded-xl bg-indigo-500/20 flex items-center justify-center text-indigo-400 border border-indigo-500/30">
                  <Cpu className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-display font-bold text-sm text-white flex items-center gap-2">
                    Elevate AI Core <Sparkles className="w-4 h-4 text-indigo-400 animate-pulse" />
                  </h3>
                  <p className="text-[10px] text-slate-400 uppercase tracking-widest font-bold">Online & Active</p>
                </div>
              </div>
              <button 
                onClick={onClose}
                className="p-2 hover:bg-white/10 rounded-xl text-slate-400 transition-colors z-10"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Suggestions Box */}
            <div className="p-5 border-b border-white/5 bg-indigo-500/5">
              <div className="flex items-start gap-2 text-indigo-400 text-xs font-bold uppercase tracking-wider mb-3">
                <AlertCircle className="w-4 h-4" />
                <span>Predictive Insights</span>
              </div>
              <div className="space-y-2">
                <button className="w-full text-left px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-xs text-slate-300 hover:border-indigo-500/50 hover:bg-indigo-500/10 hover:text-indigo-300 transition-all">
                  "Graph fee collection trends vs last quarter"
                </button>
                <button className="w-full text-left px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-xs text-slate-300 hover:border-indigo-500/50 hover:bg-indigo-500/10 hover:text-indigo-300 transition-all">
                  "Identify teachers with low biometrics compliance"
                </button>
              </div>
            </div>

            {/* Chat Area */}
            <div className="flex-1 overflow-y-auto p-5 space-y-6 custom-scrollbar bg-gradient-to-b from-transparent to-indigo-950/20">
              {messages.map((ms, idx) => (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  key={idx} 
                  className={`flex ${ms.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div className={`max-w-[85%] px-5 py-4 text-sm shadow-lg leading-relaxed ${
                    ms.role === 'user' 
                      ? 'bg-indigo-500 text-white font-medium rounded-3xl rounded-br-sm shadow-indigo-500/20' 
                      : 'bg-white/5 border border-white/10 text-slate-300 rounded-3xl rounded-tl-sm backdrop-blur-md'
                  }`}>
                    {ms.text}
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Input Area */}
            <div className="p-5 border-t border-white/5 bg-slate-900/50">
              <div className="relative flex items-center">
                <input 
                  type="text" 
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                  placeholder="Initiate command..." 
                  className="w-full bg-white/5 border border-white/10 rouned-xl rounded-2xl py-4 pl-5 pr-14 text-sm text-white focus:outline-none focus:border-indigo-500 focus:bg-white/10 transition-all shadow-inner placeholder:text-slate-500 font-medium"
                />
                <button 
                  onClick={handleSend}
                  disabled={!input.trim()}
                  className="absolute right-2 p-2.5 rounded-xl bg-indigo-500 text-white hover:bg-indigo-400 disabled:opacity-50 transition-all shadow-[0_0_15px_rgba(99,102,241,0.4)] disabled:shadow-none"
                >
                  <Send className="w-5 h-5" />
                </button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
