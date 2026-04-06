import React, { useState, useEffect, useRef } from 'react';
import { useStore } from '../../store/useStore';
import { mcpApi } from '../../lib/mcp';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Sparkles, Send, X, Bot, 
  MessageSquare, Lightbulb, AlertCircle, 
  ChevronRight, ArrowRight, Zap, Target
} from 'lucide-react';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  type?: 'text' | 'suggestion' | 'insight' | 'action';
  actionLabel?: string;
  onAction?: () => void;
}

export const TeacherAICopilot: React.FC = () => {
  const { copilotOpen, toggleCopilot, session } = useStore();
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content: `Hello ${session.fullName || 'Teacher'}, I'm your AI Copilot. How can I help you today?`,
      type: 'text'
    },
    {
      role: 'assistant',
      content: "Student Rahul from 10-A hasn't submitted his last 2 Math assignments. Should I draft a reminder?",
      type: 'suggestion',
      actionLabel: 'Draft Reminder',
      onAction: () => console.log('Drafting reminder...')
    }
  ]);
  const [input, setInput] = useState('');
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim()) return;
    const userMsg: Message = { role: 'user', content: input };
    setMessages(prev => [...prev, userMsg]);
    setInput('');

    try {
      // Logic to pick tool based on keywords (rudimentary)
      let response;
      if (input.toLowerCase().includes('quiz')) {
        response = await mcpApi.callTool('generate_ai_quiz', { subjectId: session.schoolId, difficulty: 'MEDIUM', count: 5 });
      } else if (input.toLowerCase().includes('retention') || input.toLowerCase().includes('risk')) {
        response = await mcpApi.callTool('analyze_student_retention', { schoolId: session.schoolId });
      } else {
        response = await mcpApi.callTool('ask_school_data', { 
          role: 'teacher', 
          question: input, 
          schoolId: session.schoolId, 
          email: session.email 
        });
      }

      let assistantText = "I've processed your request.";
      try {
        const parsed = JSON.parse(response.content[0].text);
        assistantText = parsed.answer || parsed.insight || parsed.result || assistantText;
      } catch (e) {
        assistantText = response.content[0].text;
      }

      const assistantMsg: Message = {
        role: 'assistant',
        content: assistantText,
        type: 'text'
      };
      setMessages(prev => [...prev, assistantMsg]);
    } catch (error) {
      setMessages(prev => [...prev, { role: 'assistant', content: 'Connection to ElevateAI failed. Please try again.' }]);
    }
  };

  return (
    <AnimatePresence>
      {copilotOpen && (
        <motion.div
          initial={{ x: 400, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: 400, opacity: 0 }}
          transition={{ type: 'spring', damping: 25, stiffness: 200 }}
          style={{
            position: 'fixed',
            right: 0,
            top: 64,
            bottom: 0,
            width: 380,
            background: 'rgba(16, 22, 30, 0.98)',
            backdropFilter: 'blur(16px)',
            borderLeft: '1px solid rgba(255, 255, 255, 0.08)',
            zIndex: 100,
            display: 'flex',
            flexDirection: 'column',
            boxShadow: '-10px 0 30px rgba(0,0,0,0.5)'
          }}
        >
          {/* Header */}
          <div style={{ padding: '20px 24px', borderBottom: '1px solid rgba(255, 255, 255, 0.05)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ padding: 8, background: 'linear-gradient(135deg, #ffb663, #ff8c00)', borderRadius: 10, color: '#0b0f14' }}>
                <Sparkles size={18} />
              </div>
              <div>
                <div style={{ fontWeight: 800, fontSize: '0.95rem', color: '#f5efdf' }}>Teacher Copilot</div>
                <div style={{ fontSize: '0.7rem', color: '#8b95a2', fontWeight: 600 }}>Powered by ElevateAI</div>
              </div>
            </div>
            <button 
              onClick={toggleCopilot}
              style={{ background: 'transparent', border: 'none', color: '#8b95a2', cursor: 'pointer', padding: 4 }}
            >
              <X size={20} />
            </button>
          </div>

          {/* Messages */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '24px', display: 'flex', flexDirection: 'column', gap: 16 }}>
            {messages.map((msg, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                style={{
                  alignSelf: msg.role === 'user' ? 'flex-end' : 'flex-start',
                  maxWidth: '90%',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 8
                }}
              >
                <div style={{
                  padding: '12px 16px',
                  borderRadius: 16,
                  background: msg.role === 'user' ? '#ffb663' : 'rgba(255, 255, 255, 0.05)',
                  color: msg.role === 'user' ? '#0b0f14' : '#f5efdf',
                  fontSize: '0.875rem',
                  fontWeight: msg.role === 'user' ? 600 : 400,
                  boxShadow: msg.role === 'user' ? '0 4px 15px rgba(255, 182, 99, 0.2)' : 'none',
                  border: msg.role === 'user' ? 'none' : '1px solid rgba(255, 255, 255, 0.05)'
                }}>
                  {msg.content}
                </div>

                {msg.type === 'suggestion' && (
                  <button
                    onClick={msg.onAction}
                    style={{
                      padding: '8px 12px',
                      borderRadius: 12,
                      background: 'rgba(255, 182, 99, 0.1)',
                      border: '1px solid rgba(255, 182, 99, 0.3)',
                      color: '#ffb663',
                      fontSize: '0.75rem',
                      fontWeight: 700,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 6,
                      width: 'fit-content'
                    }}
                  >
                    <Zap size={14} />
                    {msg.actionLabel}
                  </button>
                )}
              </motion.div>
            ))}
            <div ref={chatEndRef} />
          </div>

          {/* Quick Actions */}
          <div style={{ padding: '0 24px 12px', display: 'flex', gap: 8, overflowX: 'auto', scrollbarWidth: 'none' }}>
            {['Lesson Plan', 'Attendance', 'Risk Report'].map(item => (
              <button 
                key={item}
                style={{ flexShrink: 0, padding: '6px 12px', borderRadius: 20, background: 'rgba(255, 255, 255, 0.05)', border: '1px solid rgba(255, 255, 255, 0.08)', color: '#8b95a2', fontSize: '0.7rem', fontWeight: 600, cursor: 'pointer' }}
              >
                {item}
              </button>
            ))}
          </div>

          {/* Input */}
          <div style={{ padding: '0 24px 24px' }}>
            <div style={{ position: 'relative' }}>
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                placeholder="Ask me anything..."
                style={{
                  width: '100%',
                  background: 'rgba(255, 255, 255, 0.04)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  borderRadius: 14,
                  padding: '14px 44px 14px 16px',
                  color: '#f5efdf',
                  fontSize: '0.875rem',
                  outline: 'none'
                }}
              />
              <button 
                onClick={handleSend}
                style={{ position: 'absolute', right: 8, top: 8, padding: 6, background: '#ffb663', border: 'none', borderRadius: 10, color: '#0b0f14', cursor: 'pointer' }}
              >
                <Send size={16} />
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
