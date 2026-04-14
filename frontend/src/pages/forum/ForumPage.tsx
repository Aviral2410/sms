import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  MessageSquare, Search, Plus, Filter, TrendingUp, 
  Award, MessageCircle, ThumbsUp, Flag, Clock,
  ChevronRight, Brain, AlertCircle
} from 'lucide-react';
import { schoolOpsApi, ForumQuestionResponse } from '../../lib/api';
import { useStore } from '../../store/useStore';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import AskQuestionModal from './AskQuestionModal';
import LeaderboardWidget from './LeaderboardWidget';

const V = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.05 } } };
const I = { hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0 } };
const COLOR = '#6366f1'; // Indigo

export default function ForumPage() {
  const { session } = useStore();
  const navigate = useNavigate();
  const [questions, setQuestions] = useState<ForumQuestionResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('ALL');
  const [showAskModal, setShowAskModal] = useState(false);

  const fetchFeed = async () => {
    setLoading(true);
    try {
      const data = await schoolOpsApi.getForumFeed(filter === 'ALL' ? undefined : filter);
      setQuestions(data);
    } catch (err: any) {
      toast.error('Failed to load forum feed');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFeed();
  }, [filter]);

  const filteredQuestions = questions.filter(q => 
    q.title.toLowerCase().includes(search.toLowerCase()) ||
    q.content.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <motion.div variants={V} initial="hidden" animate="show" style={{ display: 'flex', flexDirection: 'column', gap: 24, paddingBottom: 64 }}>
      {/* Header */}
      <motion.div variants={I} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
        <div>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '4px 14px', borderRadius: 999, background: `${COLOR}15`, border: `1px solid ${COLOR}30`, color: COLOR, fontSize: '0.7rem', fontWeight: 800, letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 12 }}>
            <MessageSquare size={12} /> Academic Forum
          </div>
          <h1 style={{ fontSize: '2.5rem', fontWeight: 900, color: '#fff', margin: '0 0 6px', letterSpacing: '-0.04em' }}>Student Discussions</h1>
          <p style={{ color: '#8b95a2', margin: 0, fontSize: '0.95rem' }}>Ask questions, share knowledge, and earn points for being helpful.</p>
        </div>
        <motion.button 
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setShowAskModal(true)}
          style={{ padding: '12px 24px', borderRadius: 14, background: `linear-gradient(135deg, ${COLOR}, #8b5cf6)`, border: 'none', color: '#fff', fontWeight: 800, fontSize: '0.85rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8, fontFamily: 'inherit', boxShadow: `0 10px 20px ${COLOR}30` }}>
          <Plus size={18} /> Ask Question
        </motion.button>
      </motion.div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: 24, alignItems: 'flex-start' }}>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          {/* Search + Quick Filters */}
          <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
            <div style={{ position: 'relative', flex: 1 }}>
              <Search size={16} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: '#475569' }} />
              <input 
                value={search} 
                onChange={e => setSearch(e.target.value)} 
                placeholder="Search discussions..." 
                style={{ width: '100%', boxSizing: 'border-box', padding: '12px 14px 12px 42px', borderRadius: 14, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', color: '#fff', fontSize: '0.88rem', outline: 'none', fontFamily: 'inherit transition: border 0.2s' }} 
              />
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              {['ALL', 'MATHS', 'SCIENCE', 'ENGLISH'].map(f => (
                <button 
                  key={f} 
                  onClick={() => setFilter(f)} 
                  style={{ padding: '10px 18px', borderRadius: 12, background: filter === f ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.03)', border: `1px solid ${filter === f ? 'rgba(255,255,255,0.2)' : 'rgba(255,255,255,0.06)'}`, color: filter === f ? '#fff' : '#8b95a2', fontSize: '0.75rem', fontWeight: 700, cursor: 'pointer', transition: 'all 0.2s' }}>
                  {f}
                </button>
              ))}
            </div>
          </div>

          {/* Feed */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {loading ? (
              [1, 2, 3].map(n => (
                <div key={n} style={{ height: 160, borderRadius: 24, background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', animation: 'pulse 1.5s infinite' }} />
              ))
            ) : filteredQuestions.map(q => (
              <motion.div 
                key={q.questionId} 
                variants={I} 
                whileHover={{ y: -4, borderColor: `${COLOR}40`, background: 'rgba(255,255,255,0.04)' }}
                onClick={() => navigate(`/forum/${q.questionId}`)}
                style={{ padding: '24px', borderRadius: 24, background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', cursor: 'pointer', display: 'flex', gap: 20 }}>
                
                {/* Vote Column */}
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, minWidth: 48 }}>
                  <button style={{ background: 'none', border: 'none', color: '#475569', cursor: 'pointer' }}><TrendingUp size={20} /></button>
                  <span style={{ fontSize: '1rem', fontWeight: 900, color: COLOR }}>{q.upvotes}</span>
                  <div style={{ fontSize: '0.6rem', fontWeight: 800, color: '#475569', textTransform: 'uppercase' }}>Votes</div>
                </div>

                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                    <div style={{ padding: '4px 10px', borderRadius: 8, background: `${COLOR}10`, color: COLOR, fontSize: '0.65rem', fontWeight: 800 }}>{q.subject || 'GENERAL'}</div>
                    <span style={{ fontSize: '0.75rem', color: '#475569' }}>• Posted by <strong>{q.authorName}</strong> • {new Date(q.createdAt).toLocaleDateString()}</span>
                  </div>
                  <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#fff', margin: '0 0 10px', lineHeight: 1.3 }}>{q.title}</h3>
                  <p style={{ fontSize: '0.9rem', color: '#8b95a2', margin: '0 0 20px', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{q.content}</p>
                  
                  <div style={{ display: 'flex', gap: 16 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#475569', fontSize: '0.8rem', fontWeight: 700 }}>
                      <MessageCircle size={16} /> {q.answerCount} Answers
                    </div>
                    {q.status === 'FLAGGED' && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#f87171', fontSize: '0.8rem', fontWeight: 700 }}>
                        <AlertCircle size={16} /> Flagged for Review
                      </div>
                    )}
                  </div>
                </div>
                
                <div style={{ alignSelf: 'center', color: '#475569' }}>
                  <ChevronRight size={24} />
                </div>
              </motion.div>
            ))}

            {!loading && filteredQuestions.length === 0 && (
              <div style={{ padding: '80px 0', textAlign: 'center', background: 'rgba(255,255,255,0.01)', borderRadius: 32, border: '1px dashed rgba(255,255,255,0.05)' }}>
                <MessageSquare size={48} style={{ color: '#475569', opacity: 0.2, marginBottom: 16 }} />
                <h3 style={{ color: '#fff', margin: '0 0 8px' }}>No questions found</h3>
                <p style={{ color: '#475569', margin: 0 }}>Be the first to ask an academic question!</p>
              </div>
            )}
          </div>
        </div>

        {/* Sidebar */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          <LeaderboardWidget />
          
          <div style={{ padding: 24, borderRadius: 28, background: 'rgba(167,139,250,0.05)', border: '1px solid rgba(167,139,250,0.15)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
              <Brain size={18} color="#a78bfa" />
              <h3 style={{ fontSize: '0.95rem', fontWeight: 800, color: '#fff', margin: 0 }}>Rules for Success</h3>
            </div>
            <ul style={{ margin: 0, padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 10 }}>
              {[
                'Post academic questions only',
                'No abusive language',
                'No criticism of teachers/staff',
                'Earn up to 20 points for correct answers'
              ].map((rule, i) => (
                <li key={i} style={{ fontSize: '0.8rem', color: '#8b95a2', display: 'flex', gap: 10 }}>
                  <div style={{ minWidth: 4, height: 4, borderRadius: 99, background: '#a78bfa', marginTop: 8 }} />
                  {rule}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {showAskModal && (
          <AskQuestionModal 
            onClose={() => setShowAskModal(false)} 
            onSuccess={() => { setShowAskModal(false); fetchFeed(); }}
          />
        )}
      </AnimatePresence>
    </motion.div>
  );
}
