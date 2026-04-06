import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Brain, Send, X, Bot, Sparkles, User, BookOpen } from 'lucide-react';
import { schoolOpsApi } from '../../lib/api';
import { toast } from 'sonner';

interface StudyAssistantWidgetProps {
  schoolId: string;
  userId: string;
  contextResource?: { title: string; description?: string; subject?: string };
  onClose: () => void;
}

export default function StudyAssistantWidget({ schoolId, userId, contextResource, onClose }: StudyAssistantWidgetProps) {
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState<{ role: 'ai' | 'user'; text: string }[]>([
    { role: 'ai', text: contextResource 
      ? `Hi! I'm your Study Assistant. I see you're looking at "${contextResource.title}" (${contextResource.subject}). How can I help you understand this better?`
      : "Hi! I'm your AI Study Assistant. Ask me anything about your library resources, subjects, or study tips!" 
    }
  ]);

  const handleSend = async () => {
    if (!query.trim() || loading) return;

    const userMsg = query;
    setMessages(prev => [...prev, { role: 'user', text: userMsg }]);
    setQuery('');
    setLoading(true);

    try {
      // For now, we reuse the lesson-plan or visualize API as a generic AI proxy 
      // until a dedicated study-assistant endpoint is implemented in AIService.
      // But for this demo, I will simulate the AI response based on the "visualize" endpoint potential.
      
      const response = await schoolOpsApi.visualize({
        question: contextResource 
          ? `Regarding the resource "${contextResource.title}": ${userMsg}` 
          : userMsg,
        subject: contextResource?.subject,
        level: 'Student',
        visualizationStyle: 'Detailed Explanation',
        premiumRequest: true
      });

      setMessages(prev => [...prev, { role: 'ai', text: response.summary || "I've analyzed your question. Here's what I found..." }]);
    } catch (err: any) {
      setMessages(prev => [...prev, { role: 'ai', text: "I'm sorry, I encountered an issue while processing your request. Please try again later." }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.95, y: 20 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95, y: 20 }}
      style={{ 
        position: 'fixed', 
        bottom: 24, 
        right: 24, 
        width: 400, 
        height: 550, 
        background: '#121820', 
        borderRadius: 28, 
        border: '1px solid rgba(167,139,250,0.3)', 
        boxShadow: '0 24px 48px rgba(0,0,0,0.5), 0 0 20px rgba(167,139,250,0.1)',
        display: 'flex', 
        flexDirection: 'column', 
        zIndex: 2000, 
        overflow: 'hidden' 
      }}
    >
      {/* Header */}
      <div style={{ padding: '20px 24px', background: 'linear-gradient(135deg, rgba(167,139,250,0.15), transparent)', borderBottom: '1px solid rgba(255,255,255,0.05)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ padding: 8, borderRadius: 12, background: 'rgba(167,139,250,0.2)', border: '1px solid rgba(167,139,250,0.3)' }}>
            <Brain size={18} color="#a78bfa" />
          </div>
          <div>
            <div style={{ fontSize: '0.9rem', fontWeight: 800, color: '#fff' }}>Study Assistant</div>
            <div style={{ fontSize: '0.65rem', fontWeight: 700, color: '#a78bfa', textTransform: 'uppercase', letterSpacing: '0.05em' }}>AI Powered Reasoning</div>
          </div>
        </div>
        <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#475569', cursor: 'pointer' }}>
          <X size={18} />
        </button>
      </div>

      {/* Chat Area */}
      <div style={{ flex: 1, overflowY: 'auto', padding: 20, display: 'flex', flexDirection: 'column', gap: 16 }}>
        {messages.map((m, idx) => (
          <div key={idx} style={{ alignSelf: m.role === 'user' ? 'flex-end' : 'flex-start', maxWidth: '85%' }}>
            <div style={{ 
              padding: '12px 16px', 
              borderRadius: m.role === 'user' ? '20px 20px 4px 20px' : '20px 20px 20px 4px', 
              background: m.role === 'user' ? '#6366f1' : 'rgba(255,255,255,0.05)',
              border: m.role === 'user' ? 'none' : '1px solid rgba(255,255,255,0.08)',
              color: m.role === 'user' ? '#fff' : '#e2e8f0',
              fontSize: '0.85rem',
              lineHeight: 1.5
            }}>
              {m.text}
            </div>
            <div style={{ marginTop: 4, display: 'flex', gap: 6, alignItems: 'center', opacity: 0.5 }}>
              {m.role === 'ai' ? <Bot size={10} /> : <User size={10} />}
              <span style={{ fontSize: '0.65rem', fontWeight: 600 }}>{m.role === 'ai' ? 'Assistant' : 'You'}</span>
            </div>
          </div>
        ))}
        {loading && (
          <div style={{ alignSelf: 'flex-start', padding: '12px 16px', borderRadius: '20px 20px 20px 4px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}>
            <div style={{ display: 'flex', gap: 4 }}>
              {[0, 1, 2].map(i => (
                <motion.div 
                  key={i}
                  animate={{ scale: [1, 1.5, 1], opacity: [0.5, 1, 0.5] }}
                  transition={{ duration: 0.8, repeat: Infinity, delay: i * 0.2 }}
                  style={{ width: 4, height: 4, borderRadius: '50%', background: '#a78bfa' }}
                />
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Input Area */}
      <div style={{ padding: 20, borderTop: '1px solid rgba(255,255,255,0.05)', background: 'rgba(255,255,255,0.02)' }}>
        <div style={{ position: 'relative' }}>
          <input 
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyPress={e => e.key === 'Enter' && handleSend()}
            placeholder="Ask a question..."
            style={{ 
              width: '100%', 
              boxSizing: 'border-box', 
              padding: '14px 48px 14px 20px', 
              borderRadius: 16, 
              background: 'rgba(255,255,255,0.05)', 
              border: '1px solid rgba(255,255,255,0.1)', 
              color: '#fff', 
              fontSize: '0.85rem', 
              outline: 'none',
              fontFamily: 'inherit'
            }}
          />
          <button 
            onClick={handleSend}
            disabled={loading || !query.trim()}
            style={{ 
              position: 'absolute', 
              right: 8, 
              top: '50%', 
              transform: 'translateY(-50%)', 
              padding: 8, 
              borderRadius: 12, 
              background: query.trim() ? '#6366f1' : 'transparent', 
              border: 'none', 
              color: query.trim() ? '#fff' : '#475569', 
              cursor: 'pointer',
              transition: 'all 0.2s'
            }}
          >
            <Send size={16} />
          </button>
        </div>
        <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
          {['Summary', 'Key Points', 'Quiz Me'].map(chip => (
            <button 
              key={chip} 
              onClick={() => setQuery(curr => curr + ` Give me a ${chip.toLowerCase()} of this resource.`)}
              style={{ padding: '6px 12px', borderRadius: 99, background: 'rgba(167,139,250,0.1)', border: '1px solid rgba(167,139,250,0.2)', color: '#a78bfa', fontSize: '0.65rem', fontWeight: 700, cursor: 'pointer' }}
            >
              {chip}
            </button>
          ))}
        </div>
      </div>
    </motion.div>
  );
}
