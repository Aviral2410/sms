import React from 'react';
import { motion } from 'framer-motion';
import { Bot, Sparkles } from 'lucide-react';
import { Link } from 'react-router-dom';

export function PublicAiAssistantChat() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, ease: 'easeOut' }}
      className="fixed bottom-5 right-5 z-50"
    >
      <div className="absolute inset-0 rounded-[1.75rem] bg-emerald-400/30 blur-xl animate-pulse" aria-hidden="true" />
      <Link
        to="/assistant"
        className="relative inline-flex items-center gap-3 rounded-[1.35rem] border border-emerald-300/30 bg-slate-950/90 px-4 py-3 text-sm font-semibold text-white shadow-[0_22px_60px_rgba(2,6,23,0.45)] backdrop-blur-xl transition hover:-translate-y-0.5 hover:border-emerald-200/45 hover:bg-slate-900"
      >
        <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-emerald-400 text-slate-950 shadow-[0_12px_30px_rgba(52,211,153,0.35)]">
          <Bot size={18} />
        </span>
        <span className="flex flex-col leading-tight">
          <span className="text-[11px] uppercase tracking-[0.22em] text-emerald-200/70">AI Assistant</span>
          <span>Ask Aura</span>
        </span>
        <Sparkles size={16} className="text-emerald-200/80" />
      </Link>
    </motion.div>
  );
}

export default PublicAiAssistantChat;
