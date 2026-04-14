import React, { useState } from 'react';
import GlassCard from '../ui/GlassCard';
import InputField from '../ui/InputField';
import { mcpApi } from '../../lib/mcp';
// api import removed - component uses local state only

interface AICopilotPanelProps {
  role: string;
  schoolId?: string;
  email?: string;
}

const AICopilotPanel = ({ role, schoolId, email }: AICopilotPanelProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [question, setQuestion] = useState('');
  const [chat, setChat] = useState<{ q: string, a: string }[]>([]);
  const [isTyping, setIsTyping] = useState(false);

  const handleAsk = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!question.trim()) return;

    const currentQ = question;
    setQuestion('');
    setChat(prev => [...prev, { q: currentQ, a: '...' }]);
    setIsTyping(true);

    try {
      // Mapping "PLATFORM_ADMIN" in UI to "platform_admin" in MCP
      const normalizedRole = role.toLowerCase();
      const result = await mcpApi.callTool('ask_school_data', { role: normalizedRole, question: currentQ, schoolId, email });
      setChat(prev => {
        const last = [...prev];
        const raw = result?.content?.[0]?.text || '';
        let parsed: any = {};
        try {
          parsed = raw ? JSON.parse(raw) : {};
        } catch {
          parsed = {};
        }
        last[last.length - 1].a = parsed?.answer || "I'm sorry, I couldn't process that request.";
        return last;
      });
    } catch (e) {
      setChat(prev => {
        const last = [...prev];
        last[last.length - 1].a = "Connection to AI Copilot failed. Please try again.";
        return last;
      });
    } finally {
      setIsTyping(false);
    }
  };

  if (!isOpen) {
    return (
      <button 
        onClick={() => setIsOpen(true)}
        className="fixed bottom-8 right-8 w-16 h-16 rounded-full bg-accent text-white shadow-2xl flex items-center justify-center text-2xl hover:scale-110 transition-transform z-50 feedback-glow"
      >
        ✨
      </button>
    );
  }

  return (
    <GlassCard className="fixed bottom-8 right-8 w-96 h-[500px] flex flex-col z-50 animate-in border-accent">
      <header className="p-4 border-b border-white/10 flex justify-between items-center bg-accent/10">
        <div className="flex items-center gap-2">
          <span className="text-xl">✨</span>
          <h3 className="font-bold">AI School Copilot</h3>
        </div>
        <button onClick={() => setIsOpen(false)} className="opacity-60 hover:opacity-100">✕</button>
      </header>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {chat.length === 0 && (
          <div className="text-center py-8">
            <p className="text-muted text-sm">Ask me about institutional stats, teacher performance, or retention analytics.</p>
          </div>
        )}
        {chat.map((m, i) => (
          <div key={i} className="space-y-2">
            <div className="flex justify-end">
              <span className="bg-white/10 p-2 rounded-lg text-sm max-w-[80%]">{m.q}</span>
            </div>
            <div className="flex justify-start">
              <span className="bg-accent/20 p-2 rounded-lg text-sm max-w-[80%] border border-accent/30">{m.a}</span>
            </div>
          </div>
        ))}
        {isTyping && <div className="text-xs text-accent animate-pulse">Copilot is thinking...</div>}
      </div>

      <form onSubmit={handleAsk} className="p-4 border-t border-white/10">
        <InputField
          label=""
          placeholder="Ask anything..."
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          className="mb-0"
        />
      </form>
    </GlassCard>
  );
};

export default AICopilotPanel;
