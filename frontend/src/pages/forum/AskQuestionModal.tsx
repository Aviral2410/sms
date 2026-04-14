import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  X, HelpCircle, BookOpen, Send, Sparkles, 
  MessageSquare, Brain, SendHorizonal, Plus
} from 'lucide-react';
import { schoolOpsApi } from '../../lib/api';
import { useStore } from '../../store/useStore';
import { toast } from 'sonner';

interface AskQuestionModalProps {
  onClose: () => void;
  onSuccess: () => void;
}

const COLOR = '#6366f1';

export default function AskQuestionModal({ onClose, onSuccess }: AskQuestionModalProps) {
  const { session } = useStore();
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [subject, setSubject] = useState('GENERAL');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !content) return;

    setLoading(true);
    try {
      await schoolOpsApi.askForumQuestion({
        title,
        content,
        subject: subject === 'GENERAL' ? undefined : subject
      });
      toast.success('Question submitted! It will appear in the feed after moderation.');
      onSuccess();
    } catch (err: any) {
      toast.error(err.message || 'Failed to submit question. Ensure it follows our academic guidelines.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(12px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 20 }}>
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        style={{ width: '100%', maxWidth: 700, background: '#0f172a', borderRadius: 32, border: '1px solid rgba(255,255,255,0.08)', overflow: 'hidden', boxShadow: '0 24px 64px rgba(0,0,0,0.4)', display: 'flex', flexDirection: 'column' }}>
        
        {/* Header */}
        <div style={{ padding: '24px 32px', borderBottom: '1px solid rgba(255,255,255,0.05)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 40, height: 40, borderRadius: 12, background: `${COLOR}15`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: COLOR }}>
              <HelpCircle size={20} />
            </div>
            <div>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#fff', margin: 0 }}>Ask a Question</h3>
              <p style={{ fontSize: '0.8rem', color: '#8b95a2', margin: 0 }}>Academic-focused discussions only</p>
            </div>
          </div>
          <button onClick={onClose} style={{ background: 'rgba(255,255,255,0.03)', border: 'none', padding: 10, borderRadius: 12, color: '#475569', cursor: 'pointer' }}><X size={20} /></button>
        </div>

        <form onSubmit={handleSubmit} style={{ padding: 32, display: 'flex', flexDirection: 'column', gap: 24 }}>
          {/* Title */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <label style={{ fontSize: '0.85rem', fontWeight: 800, color: '#fff' }}>Question Title</label>
            <input 
              autoFocus
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="What's your question? Be specific (e.g., 'How to solve quadratic equations using the formula?')"
              style={{ padding: '14px 18px', borderRadius: 14, background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.08)', color: '#fff', fontSize: '0.95rem', outline: 'none', fontFamily: 'inherit' }}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 20 }}>
            {/* Subject */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
               <label style={{ fontSize: '0.85rem', fontWeight: 800, color: '#fff' }}>Subject</label>
               <select 
                 value={subject} 
                 onChange={e => setSubject(e.target.value)}
                 style={{ padding: '14px 18px', borderRadius: 14, background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.08)', color: '#fff', fontSize: '0.95rem', outline: 'none', fontFamily: 'inherit', cursor: 'pointer' }}>
                  <option value="GENERAL">General</option>
                  <option value="MATHS">Mathematics</option>
                  <option value="SCIENCE">Science</option>
                  <option value="ENGLISH">English</option>
                  <option value="HSTORY">History</option>
                  <option value="GEOGRAPHY">Geography</option>
               </select>
            </div>
            {/* AI Warning */}
            <div style={{ padding: 12, borderRadius: 14, background: 'rgba(52,211,153,0.05)', border: '1px solid rgba(52,211,153,0.15)', display: 'flex', gap: 10, alignItems: 'center' }}>
               <Brain size={16} color="#34d399" />
               <p style={{ fontSize: '0.7rem', color: '#34d399', margin: 0, fontWeight: 700 }}>AI Moderation Active</p>
            </div>
          </div>

          {/* Content */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <label style={{ fontSize: '0.85rem', fontWeight: 800, color: '#fff' }}>Describe your question</label>
            <textarea 
              value={content}
              onChange={e => setContent(e.target.value)}
              placeholder="Provide more context, examples, or what you've tried so far..."
              rows={6}
              style={{ padding: '14px 18px', borderRadius: 14, background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.08)', color: '#fff', fontSize: '0.95rem', outline: 'none', fontFamily: 'inherit', resize: 'none' }}
            />
          </div>

          {/* Footer Info */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: 16, borderRadius: 14, background: 'rgba(239,68,68,0.05)', border: '1px solid rgba(239,68,68,0.1)' }}>
            <Sparkles size={16} color="#f87171" style={{ opacity: 0.8 }} />
            <p style={{ fontSize: '0.75rem', color: '#8b95a2', margin: 0, lineHeight: 1.5 }}>
              By posting, you agree to follow the school conduct rules. <strong style={{ color: '#fff' }}>Non-academic or toxic content will be blocked immediately.</strong>
            </p>
          </div>

          {/* Submit */}
          <motion.button 
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            disabled={loading || !title || !content}
            type="submit"
            style={{ padding: '16px', borderRadius: 16, background: loading ? 'rgba(255,255,255,0.05)' : `linear-gradient(135deg, ${COLOR}, #8b5cf6)`, border: 'none', color: '#fff', fontWeight: 900, fontSize: '1rem', cursor: loading ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, transition: 'all 0.2s', marginTop: 10 }}>
            {loading ? (
              <div style={{ width: 20, height: 20, borderRadius: '50%', border: '2px solid rgba(255,255,255,0.1)', borderTopColor: '#fff', animation: 'spin 1s linear infinite' }} />
            ) : (
              <>
                <Send size={18} /> POST QUESTION
              </>
            )}
          </motion.button>
        </form>
      </motion.div>
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}
